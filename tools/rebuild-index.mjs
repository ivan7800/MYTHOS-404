import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const DOCUMENTED_SOURCE_REFS=new Set(['discovery-deitydb-mit']);
function knowledgeStatus(entity={}){if(entity.reviewStatus!=='discovery')return'reviewed';const refs=Array.isArray(entity.sourceRefs)?entity.sourceRefs:[],confidence=String(entity.provenance?.evidenceConfidence||'').toUpperCase();return refs.some(ref=>DOCUMENTED_SOURCE_REFS.has(ref))&&entity.provenance?.upstreamReviewStatus&&['A','B'].includes(confidence)?'documented':'discovery';}
const hasText=(v,min=3)=>typeof v==='string'&&v.trim().length>=min,hasList=v=>Array.isArray(v)&&v.length>0,generic=/^Entrada de descubrimiento\b/i;
function completeness(e={}){const status=knowledgeStatus(e);let score=0;if(hasText(e.name))score+=4;if(hasText(e.type))score+=3;if(hasText(e.culture))score+=3;if(hasText(e.tradition)||hasText(e.era))score+=4;if(hasText(e.region))score+=3;if(hasText(e.period)||hasText(e.era))score+=3;if(hasText(e.summary,40)&&!generic.test(e.summary))score+=15;if(hasText(e.domain,12)&&!generic.test(e.domain))score+=10;if(hasList(e.relations))score+=10;if(hasList(e.symbols))score+=5;if(hasList(e.places))score+=5;const refs=e.sourceRefs||[];score+=status==='reviewed'?Math.min(15,8+Math.max(0,refs.length-1)*2):status==='documented'?8:refs.length?3:0;if(status==='documented'){if(hasText(e.provenance?.entityType))score+=4;if(hasText(e.provenance?.category))score+=3;}if(hasList(e.passages))score+=8;if(hasList(e.variants))score+=7;if(hasList(e.myths)||hasList(e.motifs))score+=5;return Math.max(0,Math.min(100,score));}
function completenessBand(score){return score>=80?'Amplia':score>=60?'Desarrollada':score>=40?'En desarrollo':'Básica';}

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const culturesDir=path.join(root,'data','cultures');
const shardsDir=path.join(root,'data','index');
fs.mkdirSync(shardsDir,{recursive:true});
for(const f of fs.readdirSync(shardsDir).filter(f=>f.endsWith('.js')))fs.unlinkSync(path.join(shardsDir,f));

const context={window:{MYTHOS_CULTURE_CHUNKS:{}}};vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'js','core.js'),'utf8'),context,{filename:'core.js'});
const core=context.window.MYTHOS_CORE;if(!core)throw new Error('MYTHOS_CORE ausente');
const files=fs.readdirSync(culturesDir).filter(f=>f.endsWith('.js')).sort();
for(const file of files)vm.runInContext(fs.readFileSync(path.join(culturesDir,file),'utf8'),context,{filename:file});
const chunks=context.window.MYTHOS_CULTURE_CHUNKS;
const entities=Object.values(chunks).flatMap(x=>x.entities||[]),myths=Object.values(chunks).flatMap(x=>x.myths||[]);
const cultureFiles={};
for(const file of files){const payload=Object.values(chunks).find(p=>p&&p.culture&&file===`${p.culture}.js`);if(payload)cultureFiles[payload.culture]=`./data/cultures/${file}`;}
if(Object.keys(cultureFiles).length!==files.length)throw new Error('Cada archivo cultural debe registrar un payload cuyo culture coincida con el nombre del archivo');

const sourceUsage={};for(const s of core.academic?.sourceCatalog||[])sourceUsage[s.id]={entities:0,myths:0,total:0};
for(const e of entities)for(const id of e.sourceRefs||[])if(sourceUsage[id]){sourceUsage[id].entities++;sourceUsage[id].total++;}
for(const m of myths)for(const id of m.sourceRefs||[])if(sourceUsage[id]){sourceUsage[id].myths++;sourceUsage[id].total++;}
const variantIndex=[];for(const e of entities)for(const v of e.variants||[])variantIndex.push({entityId:e.id,variant:v});
const statusCounts={reviewed:0,documented:0,discovery:0};
const bands={Amplia:0,Desarrollada:0,'En desarrollo':0,Básica:0};
for(const e of entities){const s=knowledgeStatus(e);statusCounts[s]++;bands[completenessBand(completeness(e))]++;}
const cultureStats={};
for(const c of core.cultures||[]){
  const ch=chunks[c.id]||{entities:[],myths:[]};
  const usedSources=new Set([...(ch.entities||[]).flatMap(e=>e.sourceRefs||[]),...(ch.myths||[]).flatMap(m=>m.sourceRefs||[])]);
  const ks={reviewed:0,documented:0,discovery:0};let sum=0;
  for(const e of ch.entities||[]){ks[knowledgeStatus(e)]++;sum+=completeness(e);}
  cultureStats[c.id]={entities:ch.entities.length,myths:ch.myths.length,sources:usedSources.size,reviewed:ks.reviewed,documented:ks.documented,discovery:ks.discovery,averageCompleteness:ch.entities.length?Math.round(sum/ch.entities.length):0};
}
const reviewed=statusCounts.reviewed,documented=statusCounts.documented,discovery=statusCounts.discovery,externalDiscovery=documented+discovery;
core.sourceUsage=sourceUsage;core.variantIndex=variantIndex;core.cultureStats=cultureStats;
core.knowledgeStats={counts:{...statusCounts,total:entities.length},bands,averageCompleteness:Math.round(entities.reduce((n,e)=>n+completeness(e),0)/entities.length)};
const queueMissing=e=>{const m=[];if(!hasText(e.summary,40)||generic.test(e.summary))m.push('resumen editorial');if(!hasList(e.passages))m.push('locus primario');if(!hasList(e.variants))m.push('variantes/cautelas');if(!hasList(e.relations))m.push('relaciones');if(!hasList(e.symbols))m.push('símbolos');return m;};
const queuePool=entities.filter(e=>knowledgeStatus(e)==='discovery' && hasText(e.name) && !String(e.culture||'').startsWith('discovery-') && !/^\s*\[.*\]\s*$/.test(e.name)).map(e=>({e,score:completeness(e)+(e.provenance?.upstreamReviewStatus?6:0)+Math.min(6,(e.sourceRefs||[]).length*2)})).sort((a,b)=>b.score-a.score||a.e.name.localeCompare(b.e.name,'es'));
const cultureCaps=new Map(),editorialQueue=[];
for(const {e,score} of queuePool){const n=cultureCaps.get(e.culture)||0;if(n>=2)continue;cultureCaps.set(e.culture,n+1);editorialQueue.push({id:e.id,name:e.name,culture:e.culture,tradition:e.tradition||'',completeness:completeness(e),priority:score,missing:queueMissing(e).slice(0,4),sourceRefs:(e.sourceRefs||[]).slice(0,3)});if(editorialQueue.length>=24)break;}
core.editorialQueue=editorialQueue;
core.knowledgeStats.lastReviewBatch={date:'2026-08-13',promoted:entities.filter(e=>e.provenance?.mythosReview==='promoted-2026-08-13').length,enriched:entities.filter(e=>e.provenance?.reviewEnrichment==='2026-08-13').length,consolidated:Object.keys(core.entityRedirects||{}).length,label:'Knowledge Expansion I'};
core.meta.totalEntities=entities.length;core.meta.totalMyths=myths.length;core.meta.reviewedEntities=reviewed;core.meta.documentedEntities=documented;core.meta.discoveryEntities=discovery;core.meta.externalDiscoveryEntities=externalDiscovery;

const entityFields=['id','name','type','era','domain','culture','greek','symbols','places','reviewStatus','aliases','knowledgeStatus','completeness','externalType','externalCategory'];
const row=e=>[e.id,e.name,e.type,e.era,e.domain,e.culture,e.greek||'',(e.symbols||[]).slice(0,2),(e.places||[]).slice(0,2),e.reviewStatus==='discovery'?'discovery':'reviewed',(e.alternatives||e.aliases||[]).slice(0,8),knowledgeStatus(e),completeness(e),knowledgeStatus(e)==='documented'?(e.provenance?.entityType||''):'',knowledgeStatus(e)==='documented'?(e.provenance?.category||''):''];
const reviewedIndex=entities.filter(e=>e.reviewStatus!=='discovery').map(row);
const locatorFields=['id','culture'];
const locators=entities.map(e=>[e.id,e.culture]);
const mythFields=['id','title','era','glyph','summary','culture','region','characters','places'];
const mythIndex=myths.map(m=>[m.id,m.title,m.era,m.glyph,m.summary,m.culture,m.region,m.characters||[],m.places||[]]);

const shardKeys=['abc','def','ghi','jkl','mnop','qrs','tuv','wxyz'];
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'').trim();
function shardFor(value){const c=normalize(value)[0]||'';if('abc'.includes(c))return'abc';if('def'.includes(c))return'def';if('ghi'.includes(c))return'ghi';if('jkl'.includes(c))return'jkl';if('mnop'.includes(c))return'mnop';if('qrs'.includes(c))return'qrs';if('tuv'.includes(c))return'tuv';return'wxyz';}
const shardMaps=Object.fromEntries(shardKeys.map(k=>[k,new Map()]));
for(const e of entities.filter(e=>e.reviewStatus==='discovery')){
  const keys=new Set([shardFor(e.name),...(e.alternatives||e.aliases||[]).map(shardFor)]);
  for(const key of keys)shardMaps[key].set(e.id,row(e));
}
const shards={};
for(const key of shardKeys){
  const rows=[...shardMaps[key].values()].sort((a,b)=>String(a[1]).localeCompare(String(b[1]),'en'));
  const payload={version:core.meta.version,fields:entityFields,rows};
  fs.writeFileSync(path.join(shardsDir,`${key}.js`),`window.MYTHOS_INDEX_SHARDS=window.MYTHOS_INDEX_SHARDS||{};window.MYTHOS_INDEX_SHARDS[${JSON.stringify(key)}]=${JSON.stringify(payload)};\n`);
  shards[key]={path:`./data/index/${key}.js`,count:rows.length};
}

const version=core.meta.version;
const index={version,entityFields,mythFields,locatorFields,entities:reviewedIndex,myths:mythIndex,locators,chunks:cultureFiles,shards,shardOrder:shardKeys,counts:{entities:entities.length,myths:myths.length,cultures:(core.cultures||[]).length,sources:(core.academic?.sourceCatalog||[]).length,reviewed,documented,discovery,externalDiscovery,indexedAtBoot:reviewed}};
fs.writeFileSync(path.join(root,'js','core.js'),`window.MYTHOS_CORE = ${JSON.stringify(core)};\n`);
fs.writeFileSync(path.join(root,'js','index.js'),`window.MYTHOS_INDEX = ${JSON.stringify(index)};\n`);
const cultureRows=(core.cultures||[]).map(c=>({c,s:cultureStats[c.id]||{}})).sort((a,b)=>b.s.reviewed-a.s.reviewed||b.s.documented-a.s.documented||b.s.entities-a.s.entities||a.c.name.localeCompare(b.c.name,'es'));
const cultureMd=`# Índice de cobertura — MYTHOS 404 Knowledge Edition v${version}

Este informe se regenera con \`npm run build:data\`. **Completitud** significa presencia de campos documentales, no certeza histórica ni autoridad cultural.

## Resumen

- Entidades: **${entities.length}**
- Revisadas por MYTHOS: **${reviewed}**
- Documentadas externamente: **${documented}**
- Descubrimiento: **${discovery}**
- Relatos: **${myths.length}**
- Tradiciones/corpus: **${cultureRows.length}**
- Completitud media: **${core.knowledgeStats.averageCompleteness}%**

## Cobertura por tradición/corpus

| Tradición / corpus | Entidades | Revisadas | Documentadas | Discovery | Relatos | Fuentes | Completitud media |
|---|---:|---:|---:|---:|---:|---:|---:|
${cultureRows.map(({c,s})=>`| ${c.name.replace(/\|/g,'/')} | ${s.entities||0} | ${s.reviewed||0} | ${s.documented||0} | ${s.discovery||0} | ${s.myths||0} | ${s.sources||0} | ${s.averageCompleteness||0}% |`).join('\n')}

## Interpretación

- **Revisada:** integrada en el corpus editorial MYTHOS.
- **Documentada externamente:** registro externo con metadatos de evidencia A/B; pendiente de revisión MYTHOS.
- **Discovery:** pista de investigación; no debe citarse como ficha académica sin contraste adicional.
`;
fs.writeFileSync(path.join(root,'CULTURE_INDEX.md'),cultureMd);
console.log(`Índices v${version} reconstruidos: ${entities.length} entidades (${reviewed} revisadas + ${documented} documentadas externamente + ${discovery} descubrimiento) · ${myths.length} relatos · ${files.length} chunks · ${shardKeys.length} shards.`);
