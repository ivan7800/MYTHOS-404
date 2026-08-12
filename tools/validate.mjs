import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const errors=[],warnings=[];
const ok=m=>console.log(`✓ ${m}`),fail=m=>errors.push(m),warn=m=>warnings.push(m);
const exists=r=>fs.existsSync(path.join(root,r));
const read=r=>fs.readFileSync(path.join(root,r),'utf8');
const size=r=>exists(r)?fs.statSync(path.join(root,r)).size:0;
const dup=a=>a.filter((x,i)=>a.indexOf(x)!==i);
const required=['index.html','css/styles.css','js/core.js','js/index.js','js/store.js','js/app.js','manifest.webmanifest','sw.js','README.md','ARCHITECTURE.md','COVERAGE_AND_ETHICS.md','THIRD_PARTY_DATA.md','QA_REPORT.md','AUDIT_REPORT.md'];
for(const f of required)exists(f)||fail(`Falta ${f}`);if(!errors.length)ok('Estructura Global Research v8 completa');

let core,index,chunks={},shards={};
const ctx={window:{MYTHOS_CULTURE_CHUNKS:{},MYTHOS_INDEX_SHARDS:{}}};vm.createContext(ctx);
try{
  vm.runInContext(read('js/core.js'),ctx,{filename:'core.js'});core=ctx.window.MYTHOS_CORE;
  vm.runInContext(read('js/index.js'),ctx,{filename:'index.js'});index=ctx.window.MYTHOS_INDEX;
  for(const f of fs.readdirSync(path.join(root,'data/cultures')).filter(f=>f.endsWith('.js')))vm.runInContext(read(`data/cultures/${f}`),ctx,{filename:f});
  for(const f of fs.readdirSync(path.join(root,'data/index')).filter(f=>f.endsWith('.js')))vm.runInContext(read(`data/index/${f}`),ctx,{filename:f});
  chunks=ctx.window.MYTHOS_CULTURE_CHUNKS;shards=ctx.window.MYTHOS_INDEX_SHARDS;ok('Core, índice raíz, chunks y shards parseados');
}catch(e){fail(`Datos JS inválidos: ${e.message}`)}

const inflate=(rows,fields)=>(rows||[]).map(r=>Array.isArray(r)?Object.fromEntries(fields.map((f,i)=>[f,r[i]])):r);
const indexedReviewed=index?inflate(index.entities,index.entityFields||[]):[];
const indexedMyths=index?inflate(index.myths,index.mythFields||[]):[];
const locators=index?inflate(index.locators,index.locatorFields||[]):[];
let manifest,pkg;try{manifest=JSON.parse(read('manifest.webmanifest'));pkg=JSON.parse(read('package.json'));ok('Manifest/package JSON válidos')}catch(e){fail(`JSON inválido: ${e.message}`)}
const html=read('index.html'),app=read('js/app.js'),store=read('js/store.js'),sw=read('sw.js'),css=read('css/styles.css');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]),did=[...new Set(dup(ids))];did.length?fail(`IDs HTML duplicados: ${did.join(', ')}`):ok(`${ids.length} IDs HTML únicos`);
const local=[...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(m=>m[1]).filter(v=>v&&!v.startsWith('#')&&!/^(https?:|mailto:|tel:|data:|blob:)/i.test(v));
for(const r of local){const c=r.split('#')[0].split('?')[0];if(c&&!exists(c))fail(`Recurso HTML inexistente: ${r}`)}if(!local.some(v=>v.startsWith('/')))ok('Rutas HTML relativas para GitHub Pages');
for(const [n,t] of [['index.html',html],['css/styles.css',css],['js/app.js',app],['js/store.js',store]])if(/(?:TODO:|FIXME:|lorem ipsum|replace me)/i.test(t))fail(`Placeholder en ${n}`);
const buttonTags=[...html.matchAll(/<button\b[^>]*>/gi)].map(m=>m[0]);const untypedButtons=buttonTags.filter(t=>!/(?:^|\s)type=(["'])button\1/i.test(t)&&!/(?:^|\s)type=(["'])submit\1/i.test(t));untypedButtons.length?fail(`${untypedButtons.length} botones HTML sin type explícito`):ok('Botones HTML con type explícito');
if(!/id="oracleQuestion"[^>]*aria-label=/i.test(html))fail('El textarea del Oráculo necesita nombre accesible');else ok('Formulario del Oráculo accesible');
for(const directive of ["object-src 'none'","base-uri 'none'","form-action 'self'","script-src 'self' file:"])if(!html.includes(directive))fail(`CSP incompleta: ${directive}`);else{};ok('CSP local-first verificada');
if(/(?:src|href)="https?:\/\//i.test(html))fail('Dependencia runtime externa en HTML');else ok('Sin dependencias runtime externas en HTML');
if(!app.includes('data-search-all')||!app.includes('loadAllShards'))fail('Falta búsqueda global ampliada por tema');else ok('Búsqueda global progresiva + ampliación temática');
if(!app.includes("file.size>1024*1024")||!app.includes("obj.app!=='MYTHOS 404'"))fail('Importación JSON sin límites/identidad');else ok('Importación JSON limitada y validada');
for(const marker of ['focus-visible','prefers-reduced-motion','safe-area-inset-bottom','100dvh','forced-colors:active'])if(!css.includes(marker))fail(`CSS accesible/responsive incompleto: ${marker}`);else{};ok('CSS responsive, foco, safe-area y movimiento reducido');

if(core&&index){
  const cultures=core.cultures||[],sources=core.academic?.sourceCatalog||[],fullEntities=Object.values(chunks).flatMap(c=>c.entities||[]),fullMyths=Object.values(chunks).flatMap(c=>c.myths||[]);
  const entityIds=fullEntities.map(e=>e.id),mythIds=fullMyths.map(m=>m.id),entitySet=new Set(entityIds),cultureSet=new Set(cultures.map(c=>c.id)),sourceSet=new Set(sources.map(s=>s.id));
  dup(entityIds).length?fail('IDs de entidad duplicados'):ok(`${fullEntities.length} entidades únicas reconstruidas`);dup(mythIds).length?fail('IDs de relato duplicados'):ok(`${fullMyths.length} relatos únicos reconstruidos`);
  if(fullEntities.length<5000)fail('La v8 debe superar 5.000 entidades');else ok(`Hito v8: ${fullEntities.length} entidades`);
  if(cultures.length!==Object.keys(chunks).length)fail('Número de culturas/corpus y chunks desincronizado');else ok(`${cultures.length} tradiciones/corpus = ${Object.keys(chunks).length} chunks`);
  const emptyCultures=cultures.filter(c=>!chunks[c.id]||((chunks[c.id].entities||[]).length+(chunks[c.id].myths||[]).length===0));emptyCultures.length?fail(`Corpus vacíos visibles: ${emptyCultures.map(c=>c.id).join(', ')}`):ok('62 tradiciones/corpus con contenido');
  for(const c of cultures){const ch=chunks[c.id]||{entities:[],myths:[]},used=new Set([...(ch.entities||[]).flatMap(e=>e.sourceRefs||[]),...(ch.myths||[]).flatMap(m=>m.sourceRefs||[])]),stat=core.cultureStats?.[c.id];if(!stat||stat.sources!==used.size)fail(`Contador de fuentes incorrecto en ${c.id}: ${stat?.sources} != ${used.size}`)};ok('Contadores culturales basados en referencias realmente usadas');
  const unsafeId=/[\s"'<>`=]/u;for(const e of fullEntities)if(unsafeId.test(e.id))fail(`ID de entidad inseguro para atributo HTML: ${e.id}`);for(const m of fullMyths)if(unsafeId.test(m.id))fail(`ID de relato inseguro para atributo HTML: ${m.id}`);
  const mythNames=fullEntities.filter(e=>e.reviewStatus==='discovery'&&(e.sourceRefs||[]).includes('discovery-cc0-mythnames'));const nonNeutral=mythNames.filter(e=>e.domain!=='Entrada de descubrimiento · función y clasificación pendientes de revisión');nonNeutral.length?fail(`${nonNeutral.length} blurbs CC0 externos siguen expuestos como dominio`):ok(`${mythNames.length} entradas CC0 con descripción neutralizada`);
  for(const id of ['discovery-polynesian','discovery-melanesian','discovery-micronesian','discovery-indonesian','discovery-vodou'])if(!(chunks[id]?.entities||[]).length)fail(`Corpus especializado sin reasignación: ${id}`);
  if(new Set(cultures.map(c=>c.id)).size!==cultures.length)fail('IDs culturales duplicados');
  const worldIds=new Set((core.worldMap||[]).map(x=>x.id));for(const c of cultures)if(!worldIds.has(c.id))fail(`Cultura/corpus sin nodo de atlas: ${c.id}`);else{};if(worldIds.size>=cultures.length)ok(`Atlas mundial cubre ${cultures.length} tradiciones/corpus`);
  for(const p of core.worldMap||[])if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>100||p.y<0||p.y>100)fail(`Nodo mundial fuera de rango: ${p.id}`);
  const coordSeen=new Map();for(const p of core.worldMap||[]){const k=`${p.x},${p.y}`;if(coordSeen.has(k))fail(`Nodos mundiales solapados exactamente: ${coordSeen.get(k)} / ${p.id}`);else coordSeen.set(k,p.id)};if(coordSeen.size===(core.worldMap||[]).length)ok('Atlas mundial sin nodos exactamente solapados');

  const reviewed=fullEntities.filter(e=>e.reviewStatus!=='discovery'),discovery=fullEntities.filter(e=>e.reviewStatus==='discovery');
  if(reviewed.length!==index.counts.reviewed||discovery.length!==index.counts.discovery)fail('Conteos editoriales desincronizados');else ok(`${reviewed.length} revisadas + ${discovery.length} descubrimiento`);
  if(indexedReviewed.length!==reviewed.length)fail(`El bootstrap contiene ${indexedReviewed.length} filas; debería contener solo ${reviewed.length} revisadas`);else ok(`Bootstrap editorial: solo ${reviewed.length} fichas revisadas`);
  const reviewedSet=new Set(reviewed.map(e=>e.id)),bootSet=new Set(indexedReviewed.map(e=>e.id));for(const id of reviewedSet)if(!bootSet.has(id))fail(`Revisada ausente del bootstrap: ${id}`);for(const id of bootSet)if(!reviewedSet.has(id))fail(`Descubrimiento filtrado incorrectamente en bootstrap: ${id}`);

  if(locators.length!==fullEntities.length)fail(`Locators ${locators.length} != entidades ${fullEntities.length}`);else ok(`${locators.length} locators permiten deep links sin cargar shards`);
  const locatorMap=new Map();for(const l of locators){if(locatorMap.has(l.id))fail(`Locator duplicado: ${l.id}`);locatorMap.set(l.id,l.culture);if(!entitySet.has(l.id))fail(`Locator desconocido: ${l.id}`);if(!cultureSet.has(l.culture))fail(`Locator con cultura desconocida: ${l.id}`)}
  for(const e of fullEntities)if(locatorMap.get(e.id)!==e.culture)fail(`Locator/cultura desalineado: ${e.id}`);

  const shardKeys=Object.keys(index.shards||{}),shardSeen=new Set();
  if(shardKeys.length!==8)fail(`Se esperaban 8 shards y hay ${shardKeys.length}`);else ok('8 shards progresivos de búsqueda');
  for(const key of shardKeys){const payload=shards[key];if(!payload)fail(`Shard no registrado: ${key}`);else{for(const e of inflate(payload.rows,payload.fields||index.entityFields)){if(!entitySet.has(e.id))fail(`Shard ${key}: entidad desconocida ${e.id}`);if(reviewedSet.has(e.id))fail(`Shard ${key}: contiene ficha revisada ${e.id}`);shardSeen.add(e.id);}}}
  const discoverySet=new Set(discovery.map(e=>e.id));for(const id of discoverySet)if(!shardSeen.has(id))fail(`Descubrimiento sin shard: ${id}`);for(const id of shardSeen)if(!discoverySet.has(id))fail(`Shard contiene ID que no es discovery: ${id}`);if(shardSeen.size===discoverySet.size)ok(`${shardSeen.size} entradas discovery cubiertas por shards`);

  if(fullMyths.length!==indexedMyths.length)fail('Índice de relatos desincronizado');else ok(`${fullMyths.length} relatos indexados`);
  for(const e of fullEntities){if(!cultureSet.has(e.culture))fail(`Cultura inexistente: ${e.id} -> ${e.culture}`);if(!Array.isArray(e.sourceRefs)||!e.sourceRefs.length)fail(`Entidad sin sourceRefs: ${e.id}`);for(const x of e.sourceRefs||[])if(!sourceSet.has(x))fail(`Fuente inexistente ${x} en ${e.id}`);for(const r of e.relations||[])if(!entitySet.has(r))fail(`Relación rota ${e.id} -> ${r}`)}
  for(const m of fullMyths){if(!cultureSet.has(m.culture))fail(`Relato con cultura inexistente: ${m.id}`);for(const r of [...(m.characters||[]),...(m.places||[])])if(!entitySet.has(r))fail(`Relato ${m.id}: referencia rota ${r}`);for(const x of m.sourceRefs||[])if(!sourceSet.has(x))fail(`Relato ${m.id}: fuente inexistente ${x}`)}
  for(const id of ['discovery-cc0-mythnames','discovery-comparative-mythology-isc','discovery-deitydb-mit','discovery-wikipedia-creatures'])if(!sourceSet.has(id))fail(`Falta procedencia externa: ${id}`);else{};ok(`${sources.length} familias de fuentes/procedencias catalogadas`);
  if(core.meta?.version!==pkg?.version||index.version!==pkg?.version)fail('Versiones core/index/package no alineadas');else ok(`Datos alineados en v${pkg.version}`);
  const chunkSizes=Object.entries(index.chunks||{}).map(([id,f])=>[id,size(String(f).replace(/^\.\//,''))]).sort((a,b)=>b[1]-a[1]);if(chunkSizes[0]?.[1]>1024*1024)warn(`Chunk >1 MiB: ${chunkSizes[0][0]} ${(chunkSizes[0][1]/1024).toFixed(1)} KiB`);else ok(`Mayor chunk cultural ${(chunkSizes[0]?.[1]/1024).toFixed(1)} KiB`);
  const shardSizes=Object.entries(index.shards||{}).map(([id,m])=>[id,size(String(m.path).replace(/^\.\//,''))]).sort((a,b)=>b[1]-a[1]);if(shardSizes[0]?.[1]>280*1024)fail(`Shard demasiado grande: ${shardSizes[0][0]}`);else ok(`Mayor shard ${(shardSizes[0]?.[1]/1024).toFixed(1)} KiB`);
}

const routeMatch=app.match(/const routes = \[([^\]]+)\]/),routes=routeMatch?[...routeMatch[1].matchAll(/'([^']+)'/g)].map(m=>m[1]):[],views=[...html.matchAll(/data-view="([^"]+)"/g)].map(m=>m[1]);for(const v of views)if(!routes.includes(v))fail(`Vista sin ruta JS: ${v}`);for(const r of routes)if(!views.includes(r))fail(`Ruta JS sin vista HTML: ${r}`);if(routes.length)ok(`${routes.length} vistas/rutas coherentes`);
for(const marker of ["raw.startsWith('entity/')","raw.startsWith('myth/')","raw.startsWith('culture/')"])app.includes(marker)||fail(`Falta deep link ${marker}`);
for(const marker of ['ensureSearch','ensureCatalog','loadShard','loadNextShard','locatorMap'])store.includes(marker)||fail(`Store v8 incompleto: ${marker}`);if(store.includes('MYTHOS_INDEX_SHARDS'))ok('Store con búsqueda progresiva fragmentada');
if(manifest){if(!String(manifest.start_url||'').startsWith('./'))fail('manifest.start_url debe ser relativo');if(manifest.scope!=='./')fail('manifest.scope debe ser ./');for(const i of manifest.icons||[])if(!exists(i.src))fail(`Icono inexistente ${i.src}`);ok('Manifest e iconos verificados')}
const swVersion=(sw.match(/const VERSION = '([^']+)'/)||[])[1]||'';if(pkg&&swVersion!==pkg.version)fail(`SW ${swVersion} != package ${pkg.version}`);else ok(`Service Worker v${swVersion}`);if(!sw.includes('scopePath')||!sw.includes('cache.match(request)'))fail('Service Worker sin aislamiento explícito de scope/cache actual');else ok('Service Worker aislado por scope y caché de versión');if(/data\/index\/(?:abc|def|ghi|jkl|mnop|qrs|tuv|wxyz)\.js/.test(sw.match(/const CORE = \[[\s\S]*?\];/)?.[0]||''))fail('Los shards no deben precachearse en CORE');else ok('Shards fuera del precache inicial');
const initial=['index.html','css/styles.css','js/core.js','js/index.js','js/store.js','js/app.js'].reduce((n,f)=>n+size(f),0);console.log(`ℹ Payload bootstrap sin imágenes: ${(initial/1024).toFixed(1)} KiB`);if(initial>900*1024)fail('Payload bootstrap supera 900 KiB');else ok('Payload bootstrap dentro del objetivo v8 (<900 KiB)');console.log(`ℹ Índice raíz: ${(size('js/index.js')/1024).toFixed(1)} KiB`);
let fileCount=0,problematic=[];function walk(dir){for(const it of fs.readdirSync(dir,{withFileTypes:true})){if(/[:*?"<>|\\]/.test(it.name))problematic.push(it.name);if(it.isDirectory())walk(path.join(dir,it.name));else fileCount++;}}walk(root);problematic.length?fail(`Nombres problemáticos: ${problematic.join(', ')}`):ok('Nombres compatibles con Git/GitHub/Windows');if(fileCount>=100)warn(`${fileCount} archivos: objetivo preferente <100`);else ok(`${fileCount} archivos totales (<100)`);
for(const stale of ['Research Encyclopedia v7','Research Expansion 7.0','404 · RESEARCH 7.0','44 paquetes culturales','GLOBAL RESEARCH 8.0','Global Research 8.0'])if(html.includes(stale))fail(`Texto obsoleto visible: ${stale}`);

// HTTP smoke of the exact static paths used by GitHub Pages.
try{
  const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png'};
  const server=http.createServer((req,res)=>{try{const raw=(req.url||'/').split('?')[0].split('#')[0],rel=raw==='/'?'index.html':decodeURIComponent(raw.replace(/^\//,''));const full=path.resolve(root,rel);if(!full.startsWith(root+path.sep)&&full!==path.join(root,'index.html')){res.writeHead(403);res.end();return;}if(!fs.existsSync(full)||!fs.statSync(full).isFile()){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':mime[path.extname(full)]||'application/octet-stream'});fs.createReadStream(full).pipe(res);}catch{res.writeHead(500);res.end();}});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});const addr=server.address(),base=`http://127.0.0.1:${addr.port}`;
  for(const r of ['/','/index.html','/css/styles.css','/js/core.js','/js/index.js','/js/store.js','/js/app.js','/manifest.webmanifest','/sw.js','/data/index/abc.js','/data/cultures/greek.js']){const resp=await fetch(base+r);if(resp.status!==200)throw new Error(`${r} -> ${resp.status}`);await resp.arrayBuffer();}
  await new Promise(resolve=>server.close(resolve));ok('HTTP smoke: shell, shard y chunk devuelven 200');
}catch(e){fail(`HTTP smoke falló: ${e.message}`)}

// Store smoke test using preloaded payloads: no browser/network required.
try{
  const smoke={window:{MYTHOS_CULTURE_CHUNKS:{},MYTHOS_INDEX_SHARDS:{},dispatchEvent(){}},location:{protocol:'https:'},CustomEvent:class CustomEvent{constructor(type,init={}){this.type=type;this.detail=init.detail;}},setTimeout,clearTimeout,console};
  smoke.window.window=smoke.window;vm.createContext(smoke);
  for(const f of ['js/core.js','js/index.js','data/cultures/greek.js','data/index/abc.js'])vm.runInContext(read(f),smoke,{filename:f});
  const si=smoke.window.MYTHOS_INDEX,abc=smoke.window.MYTHOS_INDEX_SHARDS.abc,fields=abc.fields||si.entityFields,culturePos=fields.indexOf('culture'),namePos=fields.indexOf('name'),idPos=fields.indexOf('id');
  const row=abc.rows.find(r=>r[culturePos]&&si.chunks[r[culturePos]]);if(!row)throw new Error('Shard abc sin fila discovery utilizable');
  const dc=row[culturePos];vm.runInContext(read(String(si.chunks[dc]).replace(/^\.\//,'')),smoke,{filename:dc+'.js'});vm.runInContext(read('js/store.js'),smoke,{filename:'store.js'});
  const st=smoke.window.MYTHOS_STORE;if(!st||st.indexedCount()!==si.counts.reviewed)throw new Error('Bootstrap Store incorrecto');
  const z=await st.loadEntity('zeus');if(!z?._loaded)throw new Error('No carga chunk greek');await st.ensureSearch(row[namePos]);if(!st.loadedShards().includes('abc'))throw new Error('No carga shard abc');const d=await st.loadEntity(row[idPos]);if(!d?._loaded||d.culture!==dc)throw new Error('No carga ficha discovery');ok(`Store smoke: bootstrap, shard abc y chunks greek/${dc}`);
}catch(e){fail(`Store smoke falló: ${e.message}`)}

warnings.forEach(w=>console.warn(`⚠ ${w}`));if(errors.length){console.error('\nValidación FALLIDA:');errors.slice(0,120).forEach(e=>console.error(`✗ ${e}`));if(errors.length>120)console.error(`… ${errors.length-120} errores adicionales`);process.exit(1)}console.log('\n✓ Quality gate Global Research v8.1 Final completado sin errores.');
