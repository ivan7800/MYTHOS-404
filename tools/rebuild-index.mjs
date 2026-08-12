import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

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
const cultureStats={};
for(const c of core.cultures||[]){const ch=chunks[c.id]||{entities:[],myths:[]};const usedSources=new Set([...(ch.entities||[]).flatMap(e=>e.sourceRefs||[]),...(ch.myths||[]).flatMap(m=>m.sourceRefs||[])]);cultureStats[c.id]={entities:ch.entities.length,myths:ch.myths.length,sources:usedSources.size,reviewed:ch.entities.filter(e=>e.reviewStatus!=='discovery').length,discovery:ch.entities.filter(e=>e.reviewStatus==='discovery').length};}
const reviewed=entities.filter(e=>e.reviewStatus!=='discovery').length,discovery=entities.length-reviewed;
core.sourceUsage=sourceUsage;core.variantIndex=variantIndex;core.cultureStats=cultureStats;
core.meta.totalEntities=entities.length;core.meta.totalMyths=myths.length;core.meta.reviewedEntities=reviewed;core.meta.discoveryEntities=discovery;

const entityFields=['id','name','type','era','domain','culture','greek','symbols','places','reviewStatus','aliases'];
const row=e=>[e.id,e.name,e.type,e.era,e.domain,e.culture,e.greek||'',(e.symbols||[]).slice(0,2),(e.places||[]).slice(0,2),e.reviewStatus==='discovery'?'discovery':'reviewed',(e.alternatives||e.aliases||[]).slice(0,8)];
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
const index={version,entityFields,mythFields,locatorFields,entities:reviewedIndex,myths:mythIndex,locators,chunks:cultureFiles,shards,shardOrder:shardKeys,counts:{entities:entities.length,myths:myths.length,cultures:(core.cultures||[]).length,sources:(core.academic?.sourceCatalog||[]).length,reviewed,discovery,indexedAtBoot:reviewed}};
fs.writeFileSync(path.join(root,'js','core.js'),`window.MYTHOS_CORE = ${JSON.stringify(core)};\n`);
fs.writeFileSync(path.join(root,'js','index.js'),`window.MYTHOS_INDEX = ${JSON.stringify(index)};\n`);
console.log(`Índices v${version} reconstruidos: ${entities.length} entidades (${reviewed} revisadas + ${discovery} descubrimiento) · ${myths.length} relatos · ${files.length} chunks culturales · ${shardKeys.length} shards de búsqueda.`);
