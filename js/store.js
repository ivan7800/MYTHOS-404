(() => {
  'use strict';

  const core = window.MYTHOS_CORE;
  const index = window.MYTHOS_INDEX;
  if (!core || !index) return;

  window.MYTHOS_CULTURE_CHUNKS = window.MYTHOS_CULTURE_CHUNKS || {};
  window.MYTHOS_INDEX_SHARDS = window.MYTHOS_INDEX_SHARDS || {};

  const inflateRows = (rows, fields) => (rows || []).map(row => {
    if (!Array.isArray(row)) return { ...row };
    const out = {}; fields.forEach((field, i) => { out[field] = row[i]; }); return out;
  });
  const cultureMeta = new Map((core.cultures || []).map(c => [c.id, c]));
  const hydrateStub = item => {
    const c = cultureMeta.get(item.culture);
    item.tradition = item.tradition || c?.name || '';
    item.region = item.region || c?.region || '';
    item.aliases = Array.isArray(item.aliases) ? item.aliases : [];
    item.reviewStatus = item.reviewStatus || 'reviewed';
    item.academicStatus = item.academicStatus || { label: item.reviewStatus === 'discovery' ? 'Descubrimiento · pendiente de revisión' : 'Corpus revisado' };
    if (item._loaded !== true) item._loaded = false;
    return item;
  };

  // v8 boots only the reviewed corpus. Discovery metadata is loaded from search shards on demand.
  const entities = inflateRows(index.entities, index.entityFields || []).map(hydrateStub);
  const myths = inflateRows(index.myths, index.mythFields || []).map(item => ({ ...item, _loaded:false }));
  const locators = inflateRows(index.locators, index.locatorFields || []);
  const entityMap = new Map(entities.map(item => [item.id, item]));
  const mythMap = new Map(myths.map(item => [item.id, item]));
  const locatorMap = new Map(locators.map(item => [item.id, item.culture]));
  const loadedCultures = new Set();
  const pendingCultures = new Map();
  const loadedShards = new Set();
  const pendingShards = new Map();
  let nextShardIndex = 0;

  const data = Object.assign({}, core, { entities, myths, counts:index.counts });
  window.MYTHOS_DATA = data;

  function addOrMergeStub(raw) {
    let current = entityMap.get(raw.id);
    if (current) {
      if (!current._loaded) Object.assign(current, hydrateStub({ ...raw, _loaded:false }));
      return current;
    }
    current = hydrateStub({ ...raw, _loaded:false });
    entities.push(current); entityMap.set(current.id,current); return current;
  }

  function mergeCulture(id, payload) {
    if (!payload || payload.culture !== id) throw new Error(`Paquete cultural inválido: ${id}`);
    for (const full of payload.entities || []) {
      let stub = entityMap.get(full.id);
      if (!stub) { stub=hydrateStub({ ...full, _loaded:true }); entities.push(stub); entityMap.set(stub.id,stub); }
      else Object.assign(stub, full, { _loaded:true });
    }
    for (const full of payload.myths || []) {
      let stub=mythMap.get(full.id);
      if (!stub){ stub={...full,_loaded:true}; myths.push(stub); mythMap.set(stub.id,stub); }
      else Object.assign(stub,full,{_loaded:true});
    }
    loadedCultures.add(id);
    window.dispatchEvent(new CustomEvent('mythos:culture-loaded', { detail: { id } }));
    return { id, entities:(payload.entities||[]).length, myths:(payload.myths||[]).length };
  }

  function scriptURL(path){ return location.protocol==='file:' ? path : `${path}?v=${encodeURIComponent(index.version)}`; }

  function loadCulture(id) {
    if (!index.chunks[id]) return Promise.reject(new Error(`Tradición/corpus desconocido: ${id}`));
    if (loadedCultures.has(id)) return Promise.resolve({ id, cached:true });
    if (pendingCultures.has(id)) return pendingCultures.get(id);
    const promise = new Promise((resolve,reject)=>{
      const ready=window.MYTHOS_CULTURE_CHUNKS[id];
      if(ready){ try{resolve(mergeCulture(id,ready));}catch(error){reject(error);} return; }
      const script=document.createElement('script');script.src=scriptURL(index.chunks[id]);script.async=true;script.dataset.mythosCulture=id;
      script.onload=()=>{try{const payload=window.MYTHOS_CULTURE_CHUNKS[id];if(!payload)throw new Error(`El paquete ${id} no registró datos`);resolve(mergeCulture(id,payload));}catch(error){reject(error);}finally{script.remove();}};
      script.onerror=()=>{script.remove();reject(new Error(`No se pudo cargar la tradición/corpus ${id}`));};
      document.head.appendChild(script);
    }).finally(()=>pendingCultures.delete(id));
    pendingCultures.set(id,promise);return promise;
  }

  function mergeShard(key,payload){
    if(!payload||!Array.isArray(payload.rows))throw new Error(`Shard inválido: ${key}`);
    for(const row of inflateRows(payload.rows,payload.fields||index.entityFields||[]))addOrMergeStub(row);
    loadedShards.add(key);
    window.dispatchEvent(new CustomEvent('mythos:index-shard-loaded',{detail:{key,count:payload.rows.length}}));
    return {key,count:payload.rows.length};
  }

  function loadShard(key){
    const meta=index.shards?.[key];if(!meta)return Promise.reject(new Error(`Shard desconocido: ${key}`));
    if(loadedShards.has(key))return Promise.resolve({key,cached:true});
    if(pendingShards.has(key))return pendingShards.get(key);
    const promise=new Promise((resolve,reject)=>{
      const ready=window.MYTHOS_INDEX_SHARDS[key];if(ready){try{resolve(mergeShard(key,ready));}catch(error){reject(error);}return;}
      const script=document.createElement('script');script.src=scriptURL(meta.path);script.async=true;script.dataset.mythosShard=key;
      script.onload=()=>{try{const payload=window.MYTHOS_INDEX_SHARDS[key];if(!payload)throw new Error(`El shard ${key} no registró datos`);resolve(mergeShard(key,payload));}catch(error){reject(error);}finally{script.remove();}};
      script.onerror=()=>{script.remove();reject(new Error(`No se pudo cargar el índice ${key}`));};document.head.appendChild(script);
    }).finally(()=>pendingShards.delete(key));
    pendingShards.set(key,promise);return promise;
  }

  function normalizedFirst(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'')[0]||'';}
  function shardForQuery(value){const c=normalizedFirst(value);if('abc'.includes(c))return'abc';if('def'.includes(c))return'def';if('ghi'.includes(c))return'ghi';if('jkl'.includes(c))return'jkl';if('mnop'.includes(c))return'mnop';if('qrs'.includes(c))return'qrs';if('tuv'.includes(c))return'tuv';return'wxyz';}
  async function ensureSearch(query){if(!String(query||'').trim())return;await loadShard(shardForQuery(query));}
  async function loadNextShard(){const order=index.shardOrder||Object.keys(index.shards||{});while(nextShardIndex<order.length&&loadedShards.has(order[nextShardIndex]))nextShardIndex++;if(nextShardIndex>=order.length)return null;return loadShard(order[nextShardIndex++]);}
  async function ensureCatalog({culture='all',review='all',query=''}={}){if(culture&&culture!=='all'){await loadCulture(culture);return;}if(String(query).trim()){await ensureSearch(query);return;}if(review==='discovery'&&loadedShards.size===0)await loadNextShard();}
  async function loadAllShards(){for(const key of index.shardOrder||Object.keys(index.shards||{}))await loadShard(key);return {shards:loadedShards.size,entities:entities.length};}

  async function loadEntity(id){let entity=entityMap.get(id);if(entity?._loaded)return entity;const culture=entity?.culture||locatorMap.get(id);if(!culture)return null;await loadCulture(culture);return entityMap.get(id)||null;}
  async function loadMyth(id){const myth=mythMap.get(id);if(!myth)return null;if(!myth._loaded)await loadCulture(myth.culture);return mythMap.get(id)||null;}
  function prefetchCulture(id){if(!index.chunks[id]||loadedCultures.has(id)||pendingCultures.has(id))return;const start=()=>loadCulture(id).catch(()=>{});if('requestIdleCallback'in window)requestIdleCallback(start,{timeout:1800});else setTimeout(start,250);}
  async function loadCultures(ids=[]){return Promise.all([...new Set(ids)].filter(Boolean).map(loadCulture));}
  async function loadAll({concurrency=4}={}){const ids=Object.keys(index.chunks).filter(id=>!loadedCultures.has(id)),queue=[...ids];const workers=Array.from({length:Math.max(1,Math.min(concurrency,8))},async()=>{while(queue.length)await loadCulture(queue.shift());});await Promise.all(workers);return {cultures:loadedCultures.size,entities:entityMap.size,myths:mythMap.size};}
  function cultureForEntity(id){return entityMap.get(id)?.culture||locatorMap.get(id)||null;}
  function cultureForMyth(id){return mythMap.get(id)?.culture||null;}
  function isCultureLoaded(id){return loadedCultures.has(id);}
  function hasEntity(id){return entityMap.has(id)||locatorMap.has(id);}

  window.MYTHOS_STORE=Object.freeze({
    version:index.version,loadCulture,loadCultures,loadEntity,loadMyth,loadAll,prefetchCulture,cultureForEntity,cultureForMyth,isCultureLoaded,
    ensureSearch,ensureCatalog,loadShard,loadNextShard,loadAllShards,shardForQuery,hasEntity,
    loadedCultures:()=>[...loadedCultures],loadedShards:()=>[...loadedShards],indexedCount:()=>entityMap.size,
    entityMap,mythMap,locatorMap,counts:index.counts
  });
})();
