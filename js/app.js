(() => {
  'use strict';
  const D = window.MYTHOS_DATA;
  const Store = window.MYTHOS_STORE;
  if (!D || !Store) return;

  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const escapeHTML = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const normalize = (s='') => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const arrText = a => a && a.length ? a.join(', ') : '—';
  const entityById = Store.entityMap;
  const mythById = new Map(D.myths.map(m => [m.id,m]));
  const sourceById = new Map((D.academic?.sourceCatalog||[]).map(s => [s.id,s]));
  const cultureById = new Map((D.cultures||[]).map(c => [c.id,c]));
  const motifById = new Map((D.motifs||[]).map(m => [m.id,m]));
  const routes = ['home','world','motifs','cosmogonies','underworlds','catalog','myths','atlas','journeys','heracles','troy','museum','genealogy','timeline','constellation','compare','quiz','library','academic','oracle','about'];
  const routeTitles = {
    home:'MYTHOS 404 Global Research Encyclopedia — v8.1', world:'Atlas mundial — MYTHOS 404', motifs:'Motivos comparados — MYTHOS 404', cosmogonies:'Cosmogonías — MYTHOS 404', underworlds:'Inframundos — MYTHOS 404', catalog:'Archivo mundial — MYTHOS 404', myths:'Relatos — MYTHOS 404', atlas:'Atlas griego — MYTHOS 404', journeys:'Rutas griegas — MYTHOS 404', heracles:'Los 12 trabajos — MYTHOS 404', troy:'Guerra de Troya — MYTHOS 404', museum:'Museo griego — MYTHOS 404', genealogy:'Linajes griegos — MYTHOS 404', timeline:'Cronología griega — MYTHOS 404', constellation:'Constelación — MYTHOS 404', compare:'Comparador intercultural — MYTHOS 404', quiz:'Desafío — MYTHOS 404', library:'Mi MYTHOS — MYTHOS 404', academic:'Laboratorio académico mundial — MYTHOS 404', oracle:'Oráculo de Delfos — MYTHOS 404', about:'Fuentes, culturas y método — MYTHOS 404'
  };
  const typeOrder = ['Todos','Divinidad','Héroe','Criatura','Lugar','Objeto','Figura'];
  const achievementIds = new Set(['primer-paso','explorador','cronista','cazador','olimpico','heroe','oraculo','scholar']);
  const asArray = value => Array.isArray(value) ? value : [];
  const clamp = (value,min,max) => Math.min(max,Math.max(min,value));
  const storageAvailable = (()=>{ try { const k='mythos404:__test__'; localStorage.setItem(k,'1'); localStorage.removeItem(k); return true; } catch { return false; } })();
  const storage = {
    available:storageAvailable,
    get(key, fallback){ if(!storageAvailable)return fallback; try { const v=localStorage.getItem('mythos404:'+key); return v==null?fallback:JSON.parse(v); } catch { return fallback; } },
    set(key, value){ if(!storageAvailable)return false; try { localStorage.setItem('mythos404:'+key, JSON.stringify(value)); return true; } catch { return false; } },
    remove(key){ if(!storageAvailable)return false; try { localStorage.removeItem('mythos404:'+key); return true; } catch { return false; } }
  };

  const savedFavorites=asArray(storage.get('favorites',[])).filter(id=>Store.hasEntity(id));
  const savedViewed=asArray(storage.get('viewed',[])).filter(id=>Store.hasEntity(id));
  const savedAchievements=asArray(storage.get('achievements',[])).filter(id=>achievementIds.has(id));
  const savedConstellation=storage.get('constellation','zeus');
  const rawNotes=storage.get('notes',{});
  const savedNotes=rawNotes&&typeof rawNotes==='object'&&!Array.isArray(rawNotes)?Object.fromEntries(Object.entries(rawNotes).filter(([id,v])=>Store.hasEntity(id)&&typeof v==='string').map(([id,v])=>[id,v.slice(0,6000)])):{};
  const state = {
    route:'home', type:'Todos', culture:'all', review:'all', query:'', limit:32,
    theme:storage.get('theme','olympus'),
    favorites:new Set(savedFavorites),
    viewed:new Set(savedViewed),
    achievements:new Set(savedAchievements),
    quizBest:clamp(Number(storage.get('quizBest',0))||0,0,10),
    constellation:entityById.has(savedConstellation)?savedConstellation:'zeus',
    notes:savedNotes,
    academicSource:'all',
    glossaryQuery:'',
    selectedLabour:1,
    quiz:null,
    deepFrom:null
  };

  function showToast(text){
    const el=$('#toast'); if(!el) return; el.textContent=text; el.classList.add('show'); clearTimeout(showToast._t); showToast._t=setTimeout(()=>el.classList.remove('show'),2400);
  }


  function sourceLabel(id){
    const s=sourceById.get(id); return s?`${s.author} · ${s.work}`:id;
  }
  function sourceChips(refs=[]){
    return refs.map(id=>{const s=sourceById.get(id);return s?`<span class="source-chip" title="${escapeHTML(s.kind)} · ${escapeHTML(s.period)}">${escapeHTML(s.author)} · ${escapeHTML(s.work)}</span>`:''}).join('');
  }
  function passageHTML(passages=[]){
    if(!passages.length)return '';
    return `<div class="academic-section"><div class="subheading">Pasajes orientativos</div><div class="passage-list">${passages.map(p=>`<article><div><strong>${escapeHTML(sourceLabel(p.ref))}</strong><span>${escapeHTML(p.loc)}</span><p>${escapeHTML(p.why)}</p></div><button class="citation-btn" type="button" data-copy-ref="${escapeHTML(p.ref)}" data-copy-loc="${escapeHTML(p.loc)}" aria-label="Copiar referencia ${escapeHTML(p.loc)}">Copiar</button></article>`).join('')}</div></div>`;
  }
  function variantsHTML(variants=[]){
    if(!variants.length)return '';
    return `<div class="academic-section"><div class="subheading">Variantes y cautelas</div><div class="variant-stack">${variants.map(v=>`<article class="variant-card"><h3>${escapeHTML(v.title)}</h3><div class="variant-columns"><p><small>Tradición A</small>${escapeHTML(v.a)}</p><p><small>Tradición B</small>${escapeHTML(v.b)}</p></div><div class="source-strip">${sourceChips(v.refs||[])}</div><p class="variant-note">${escapeHTML(v.note)}</p></article>`).join('')}</div></div>`;
  }
  function academicDossier(e){
    const st=e.academicStatus||{level:'Variable',label:'Tradición compuesta',note:''};
    return `<section class="academic-dossier"><div class="academic-dossier-head"><div><p class="eyebrow">Dossier académico</p><h3>${escapeHTML(st.label)}</h3></div><span class="evidence-badge" data-level="${escapeHTML(st.level)}">${escapeHTML(st.level)}</span></div><p>${escapeHTML(st.note)}</p><div class="source-strip">${sourceChips(e.sourceRefs||[])}</div>${passageHTML(e.passages||[])}${variantsHTML(e.variants||[])}</section>`;
  }
  async function copyText(text){
    try{
      if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);}
      else{
        const ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();
      }
      showToast('Referencia copiada');
    }catch{showToast('No se pudo copiar la referencia');}
  }
  function citationText(ref,loc=''){
    const s=sourceById.get(ref);if(!s)return loc||ref;
    return `${s.author}, ${s.work}${loc?`, ${loc}`:''}.`;
  }
  function saveResearchNote(id,value){
    if(!Store.hasEntity(id))return;
    const clean=String(value||'').slice(0,6000);
    if(clean.trim())state.notes[id]=clean;else delete state.notes[id];
    storage.set('notes',state.notes);
    if(Object.keys(state.notes).length>=3&&!state.achievements.has('scholar')){state.achievements.add('scholar');storage.set('achievements',[...state.achievements]);showToast('Logro: Scholar — 3 fichas anotadas');}
    if(state.route==='academic')renderNotebook();
  }
  async function exportEntityMarkdown(id){
    let e;
    try { e=await Store.loadEntity(id); } catch { showToast('No se pudo cargar la ficha completa'); return; }
    if(!e)return;
    const refs=(e.sourceRefs||[]).map(sourceLabel);
    const passagesText=(e.passages||[]).map(p=>`- ${citationText(p.ref,p.loc)} — ${p.why}`).join('\n');
    const variantsText=(e.variants||[]).map(v=>`### ${v.title}\n- A: ${v.a}\n- B: ${v.b}\n- Nota: ${v.note}`).join('\n\n');
    const related=(e.relations||[]).map(r=>entityById.get(r)?.name).filter(Boolean);
    const md=`# ${e.name}${e.greek?` · ${e.greek}`:''}\n\n**Tipo:** ${e.type} · ${e.era}\n\n**Tradición:** ${cultureById.get(e.culture)?.name||e.tradition||'—'} · ${e.region||'—'}\n\n**Dominio / función:** ${e.domain}\n\n${e.summary}\n\n## Fuentes\n${refs.length?refs.map(x=>`- ${x}`).join('\n'):'- '+e.source}\n\n${passagesText?`## Pasajes orientativos\n${passagesText}\n\n`:''}${variantsText?`## Variantes\n${variantsText}\n\n`:''}## Conexiones\n${related.length?related.map(x=>`- ${x}`).join('\n'):'—'}\n\n## Nota personal\n${state.notes[id]||''}\n\n---\nMYTHOS 404 Global Research Encyclopedia 8.1 · ficha de estudio; no sustituye una edición crítica ni el conocimiento de las comunidades portadoras.\n`;
    const blob=new Blob([md],{type:'text/markdown;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`mythos-${e.id}.md`;a.rel='noopener';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast('Ficha Markdown exportada');
  }

  function deepHash(kind,id){ return `#${kind}/${encodeURIComponent(id)}`; }
  function copyPermalink(kind,id){
    const url=new URL(location.href);url.hash=deepHash(kind,id).slice(1);copyText(url.href);
  }
  function showDetailLoading(title='Cargando dossier…'){
    $('#entityContent').innerHTML=`<div class="detail-loading" role="status" aria-live="polite"><span class="loading-orbit" aria-hidden="true">Ω</span><strong>${escapeHTML(title)}</strong><small>Cargando únicamente el paquete cultural necesario…</small></div>`;
    const d=$('#entityDialog');if(!d.open)d.showModal();
  }

  function setRoute(route, push=true){
    if(!routes.includes(route)) route='home';
    state.route=route;
    $$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===route));
    $$('[data-route]').forEach(b=>{
      const active=b.dataset.route===route;
      b.classList.toggle('active',active);
      active?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current');
    });
    const hash='#'+route;
    if(push&&location.hash!==hash){ try{history.pushState({route},'',hash);}catch{location.hash=route;} }
    document.title=routeTitles[route]||routeTitles.home;
    window.scrollTo({top:0,behavior:'auto'});
    closeAllDialogs();
    if(route==='constellation'){setConstellation(state.constellation).then(()=>requestAnimationFrame(resizeConstellation));}
    if(route==='compare') renderCompare();
    if(route==='library') renderLibrary();
    if(route==='academic') renderAcademic();
    $('#main')?.focus({preventScroll:true});
  }
  function routeFromHash(){
    const raw=decodeURIComponent(location.hash.replace(/^#/,'')||'home');
    if(raw.startsWith('entity/')){state.deepFrom=null;setRoute('catalog',false);openEntity(raw.slice(7),{push:false});return;}
    if(raw.startsWith('myth/')){state.deepFrom=null;setRoute('myths',false);openMyth(raw.slice(5),{push:false});return;}
    if(raw.startsWith('culture/')){setRoute('world',false);selectCulture(raw.slice(8),false,false);return;}
    setRoute(raw,false);
  }

  function renderStats(){
    const counts=Store.counts||{};
    $('#heroStats').innerHTML=[
      [counts.entities||D.entities.length,'entidades'],[counts.reviewed||D.entities.length,'revisadas'],[counts.discovery||0,'descubrimiento'],[counts.cultures||D.cultures?.length||1,'tradiciones/corpus'],[counts.myths||D.myths.length,'relatos']
    ].map(([n,l])=>`<div class="stat"><strong>${n}</strong><span>${l}</span></div>`).join('');
    const cultureMetric=$('#architectureCultureCount');if(cultureMetric)cultureMetric.textContent=String(counts.cultures||D.cultures?.length||0);
    const shardMetric=$('#architectureShardCount');if(shardMetric)shardMetric.textContent=String(Object.keys(window.MYTHOS_INDEX?.shards||{}).length);
  }

  function cultureLabel(e){ return cultureById.get(e?.culture)?.name || e?.tradition || 'Tradición no especificada'; }
  function mythCard(m){ if(!m)return''; return `<button class="myth-card" data-myth="${m.id}" data-glyph="${escapeHTML(m.glyph)}"><small>${escapeHTML(cultureById.get(m.culture)?.name||m.era)} · ${escapeHTML(m.era)}</small><strong>${escapeHTML(m.title)}</strong><p>${escapeHTML(m.summary)}</p></button>`; }
  function renderFeaturedMyths(){
    const ids=['cosmogonia','mesopotamian-gilgamesh','norse-ragnarok','maya-hero-twins'];
    $('#featuredMyths').innerHTML=ids.map(id=>mythCard(mythById.get(id))).join('');
  }

  function renderTypeFilters(){ $('#typeFilters').innerHTML=typeOrder.map(t=>`<button type="button" class="chip ${state.type===t?'active':''}" data-type="${escapeHTML(t)}" aria-pressed="${state.type===t}">${escapeHTML(t)}</button>`).join(''); }
  function renderCultureFilter(){
    const sel=$('#cultureFilter'); if(!sel)return;
    const value=state.culture;
    sel.innerHTML='<option value="all">Todas las tradiciones</option>'+[...(D.cultures||[])].sort((a,b)=>a.name.localeCompare(b.name,'es')).map(c=>`<option value="${c.id}">${escapeHTML(c.name)} · ${escapeHTML(c.region)}</option>`).join('');
    sel.value=value;
  }
  function renderReviewFilter(){
    const sel=$('#reviewFilter'); if(!sel)return; sel.value=state.review;
  }
  function filteredEntities(){
    const q=normalize(state.query.trim());
    return D.entities.filter(e=>{
      if(state.type!=='Todos'&&e.type!==state.type)return false;
      if(state.culture!=='all'&&e.culture!==state.culture)return false;
      const editorial=e.reviewStatus==='discovery'?'discovery':'reviewed';
      if(state.review!=='all'&&editorial!==state.review)return false;
      if(!q)return true;
      return normalize([e.name,e.greek,e.type,e.era,e.domain,e.summary,e.tradition,e.region,cultureLabel(e),...(e.symbols||[]),...(e.places||[]),...(e.aliases||[])].join(' ')).includes(q);
    }).sort((a,b)=>{
      if(!q)return a.name.localeCompare(b.name,'es');
      const an=normalize(a.name),bn=normalize(b.name);
      const score=n=>n===q?0:n.startsWith(q)?1:n.includes(q)?2:3;
      return score(an)-score(bn)||a.name.localeCompare(b.name,'es');
    });
  }
  function entityCard(e){
    const tags=[cultureLabel(e),e.era,...(e.symbols||[])].filter(Boolean).slice(0,4);
    const discovery=e.reviewStatus==='discovery';
    const status=discovery?'Descubrimiento · revisar':(e.academicStatus?.label||'Corpus revisado');
    return `<button class="entity-card ${discovery?'discovery-card':''}" data-entity="${e.id}"><div><span class="type">${escapeHTML(e.type)} · ${escapeHTML(cultureLabel(e))}</span><h3>${escapeHTML(e.name)}</h3>${e.greek?`<span class="greek-label">${escapeHTML(e.greek)}</span>`:''}<p>${escapeHTML(e.domain)}</p></div><div class="tags">${tags.map(t=>`<span class="tag">${escapeHTML(t)}</span>`).join('')}<span class="tag academic-tag ${discovery?'discovery-tag':''}">${escapeHTML(status)}</span></div></button>`;
  }
  let catalogRenderToken=0;
  async function renderCatalog(){
    const token=++catalogRenderToken;
    renderTypeFilters();renderCultureFilter();renderReviewFilter();
    try{await Store.ensureCatalog({culture:state.culture,review:state.review,query:state.query});}catch{if(token===catalogRenderToken)showToast('No se pudo cargar el bloque de índice solicitado');}
    if(token!==catalogRenderToken)return;
    const list=filteredEntities(), shown=list.slice(0,state.limit);
    $('#catalogGrid').innerHTML=shown.length?shown.map(entityCard).join(''):'<div class="empty">No hay coincidencias en el bloque cargado. Prueba otro término, tipo o tradición.</div>';
    const moreShards=state.culture==='all'&&state.review==='discovery'&&!state.query.trim()&&Store.loadedShards().length<Object.keys(window.MYTHOS_INDEX?.shards||{}).length;
    $('#loadMore').hidden=state.limit>=list.length&&!moreShards;
    $('#loadMore').textContent=state.limit<list.length?`Mostrar más (${Math.max(0,list.length-state.limit)})`:moreShards?'Cargar siguiente bloque de descubrimiento':'Mostrar más';
    const status=$('#catalogStatus'); const c=state.culture==='all'?'':` · ${cultureById.get(state.culture)?.name||state.culture}`; const r=state.review==='all'?'':` · ${state.review==='reviewed'?'corpus revisado':'descubrimiento'}`;
    if(status)status.textContent=`${list.length} entradas cargadas${state.type!=='Todos'?` · ${state.type}`:''}${c}${r}${state.query.trim()?` · búsqueda: ${state.query.trim()}`:''} · índice mundial: ${Store.counts.entities}.`;
  }

  function renderMyths(){
    $('#mythsList').innerHTML=D.myths.map((m,i)=>`<button type="button" class="myth-row" data-myth="${m.id}"><span class="num">${String(i+1).padStart(2,'0')}</span><span class="myth-row-copy"><strong>${escapeHTML(m.title)}</strong><span>${escapeHTML(m.summary)}</span></span><span class="era">${escapeHTML(cultureById.get(m.culture)?.name||m.era)}</span></button>`).join('');
  }

  async function openEntity(id,{push=true}={}){
    if(!Store.hasEntity(id))return;
    const initial=entityById.get(id);
    if(push){state.deepFrom=state.route;try{history.pushState({deep:'entity',id,from:state.deepFrom},'',deepHash('entity',id));}catch{location.hash=deepHash('entity',id).slice(1);}}
    showDetailLoading(initial?.name||id);
    let e;
    try{e=await Store.loadEntity(id);}catch(error){$('#entityContent').innerHTML=`<div class="empty error-state"><strong>No se pudo cargar ${escapeHTML(initial?.name||id)}</strong><p>${escapeHTML(error.message||'Error de carga del paquete cultural.')}</p><button class="primary" data-entity="${escapeHTML(id)}">Reintentar</button></div>`;return;}
    if(!e)return;
    state.viewed.add(id); storage.set('viewed',[...state.viewed]); checkAchievements();
    const fav=state.favorites.has(id);
    const related=(e.relations||[]).map(r=>entityById.get(r)).filter(Boolean).slice(0,20);
    const relatedMyths=D.myths.filter(m=>(m.characters||[]).includes(id)||(m.places||[]).includes(id)).slice(0,8);
    const note=state.notes[id]||'';
    $('#entityContent').innerHTML=`<article class="entity-detail academic-entity">
      <div class="entity-kicker"><span>${escapeHTML(e.type)}</span><span>·</span><span>${escapeHTML(cultureLabel(e))}</span><span>·</span><span>${escapeHTML(e.region||e.era)}</span>${e.academicStatus?`<span>·</span><span>${escapeHTML(e.academicStatus.label)}</span>`:''}</div>
      <h2>${escapeHTML(e.name)}</h2>${e.greek?`<div class="entity-greek">${escapeHTML(e.greek)}</div>`:''}
      <p class="lead">${escapeHTML(e.summary)}</p>
      ${e.reviewStatus==='discovery'?`<div class="discovery-warning" role="note"><strong>Entrada de descubrimiento — no verificada académicamente</strong><p>Esta ficha procede de una fuente externa de descubrimiento y se conserva como pista de investigación. Antes de citar su función, genealogía o atribución cultural, contrástala con fuentes primarias o estudios especializados.</p>${(e.alternatives||[]).length?`<small>Variantes catalogadas: ${escapeHTML(e.alternatives.join(', '))}</small>`:''}</div>`:''}
      <div class="entity-actions"><button class="secondary" data-favorite="${e.id}">${fav?'★ Guardado':'☆ Guardar'}</button><button class="secondary" data-center-graph="${e.id}">✦ Ver en constelación</button><button class="secondary" data-speak="${e.id}">◉ Escuchar nombre</button><button class="secondary" data-copy-link="entity" data-copy-id="${e.id}">↗ Copiar enlace</button><button class="secondary" data-export-entity="${e.id}">⇩ Exportar ficha .md</button></div>
      <div class="cultural-context"><strong>${escapeHTML(cultureLabel(e))}</strong><span>${escapeHTML(e.culturalStatus||cultureById.get(e.culture)?.status||'')}</span><p>${escapeHTML(cultureById.get(e.culture)?.caution||'Lee la ficha dentro de su contexto cultural y documental.')}</p></div><div class="detail-grid"><div class="detail-box"><small>Dominio / función</small><p>${escapeHTML(e.domain)}</p></div><div class="detail-box"><small>Símbolos</small><p>${escapeHTML(arrText(e.symbols))}</p></div><div class="detail-box"><small>Lugares vinculados</small><p>${escapeHTML(arrText(e.places))}</p></div><div class="detail-box"><small>Conexiones registradas</small><p>${related.length}</p></div></div>
      ${related.length?`<div class="subheading">Conexiones</div><div class="relation-cloud">${related.map(r=>`<button data-entity="${r.id}">${escapeHTML(r.name)} · ${escapeHTML(r.type)}</button>`).join('')}</div>`:''}
      ${relatedMyths.length?`<div class="source-note"><strong>Relatos relacionados</strong><div class="relation-cloud">${relatedMyths.map(m=>`<button data-myth="${m.id}">${escapeHTML(m.title)}</button>`).join('')}</div></div>`:''}
      ${(e.motifs||[]).length?`<div class="source-note motif-note"><strong>Motivos comparativos</strong><div class="relation-cloud">${e.motifs.map(mid=>{const m=motifById.get(mid);return m?`<button type="button" data-route="motifs">${escapeHTML(m.name)}</button>`:''}).join('')}</div><small>Paralelos analíticos; no equivalencias culturales.</small></div>`:''}<div class="source-note"><strong>Orientación documental:</strong> ${escapeHTML((e.sourceRefs||[]).length?sourceLabel(e.sourceRefs[0]):(e.source||'—'))}${e.reviewStatus==='discovery'?'<br><small>Procedencia de catálogo para investigación; no equivale a validación académica.</small>':''}</div>
      ${academicDossier(e)}
      <section class="research-note"><div><p class="eyebrow">Cuaderno local</p><h3>Tu nota de investigación</h3></div><textarea data-research-note="${escapeHTML(e.id)}" maxlength="6000" aria-label="Nota de investigación sobre ${escapeHTML(e.name)}" placeholder="Hipótesis, comparación de fuentes, dudas, referencias que quieras revisar…">${escapeHTML(note)}</textarea><small>Guardado automáticamente solo en este navegador. Se incluye en la copia JSON y en la exportación Markdown.</small></section>
    </article>`;
  }

  async function openMyth(id,{push=true}={}){
    const stub=mythById.get(id); if(!stub)return;
    if(push){state.deepFrom=state.route;try{history.pushState({deep:'myth',id,from:state.deepFrom},'',deepHash('myth',id));}catch{location.hash=deepHash('myth',id).slice(1);}}
    showDetailLoading(stub.title);
    let m;
    try{m=await Store.loadMyth(id);}catch(error){$('#entityContent').innerHTML=`<div class="empty error-state"><strong>No se pudo cargar ${escapeHTML(stub.title)}</strong><p>${escapeHTML(error.message||'Error de carga del paquete cultural.')}</p><button class="primary" data-myth="${escapeHTML(id)}">Reintentar</button></div>`;return;}
    if(!m)return;
    const chars=(m.characters||[]).map(x=>entityById.get(x)).filter(Boolean), places=(m.places||[]).map(x=>entityById.get(x)).filter(Boolean);
    const sourceRefs=m.sourceRefs||[];
    $('#entityContent').innerHTML=`<article class="entity-detail academic-entity"><div class="entity-kicker"><span>Relato</span><span>·</span><span>${escapeHTML(cultureById.get(m.culture)?.name||m.era)}</span><span>·</span><span>${escapeHTML(m.region||m.era)}</span></div><h2>${escapeHTML(m.title)}</h2><p class="lead">${escapeHTML(m.summary)}</p><div class="entity-actions"><button class="secondary" data-copy-link="myth" data-copy-id="${m.id}">↗ Copiar enlace</button></div><div class="relation-cloud">${chars.concat(places).map(e=>`<button data-entity="${e.id}">${escapeHTML(e.name)}</button>`).join('')}</div><div class="myth-detail-steps">${(m.steps||[]).map((step,i)=>`<div class="myth-step"><strong>${String(i+1).padStart(2,'0')}</strong><div>${escapeHTML(step)}</div></div>`).join('')}</div><div class="source-note"><strong>Fuente principal / orientación:</strong> ${escapeHTML(m.source||'—')}<br><br>La síntesis no pretende fijar un canon único: existen variantes entre autores, regiones y épocas.</div><section class="academic-dossier"><div class="academic-dossier-head"><div><p class="eyebrow">Aparato del relato</p><h3>Fuentes normalizadas</h3></div></div><div class="source-strip">${sourceChips(sourceRefs)}</div>${passageHTML(m.passages||[])}${variantsHTML(m.variants||[])}</section></article>`;
  }

  async function toggleFavorite(id){
    state.favorites.has(id)?state.favorites.delete(id):state.favorites.add(id); storage.set('favorites',[...state.favorites]); await openEntity(id,{push:false}); showToast(state.favorites.has(id)?'Añadido a Mi MYTHOS':'Eliminado de favoritos');
  }

  function checkAchievements(){
    const viewed=[...state.viewed].map(id=>entityById.get(id)).filter(Boolean);
    const checks=[
      ['primer-paso',viewed.length>=1,'Logro: Primer paso'],['explorador',viewed.length>=25,'Logro: Explorador — 25 fichas'],['cronista',viewed.length>=75,'Logro: Cronista — 75 fichas'],
      ['cazador',viewed.filter(x=>x.type==='Criatura').length>=15,'Logro: Cazador de monstruos'],['olimpico',viewed.filter(x=>x.type==='Divinidad').length>=20,'Logro: Explorador de panteones'],['heroe',viewed.filter(x=>x.type==='Héroe').length>=20,'Logro: Compañero de héroes']
    ];
    for(const [id,ok,msg] of checks){ if(ok&&!state.achievements.has(id)){state.achievements.add(id);storage.set('achievements',[...state.achievements]);setTimeout(()=>showToast(msg),220);break;} }
  }

  function renderWorld(){
    const nodes=$('#worldMapNodes');
    if(nodes)nodes.innerHTML=(D.worldMap||[]).map(p=>{const c=cultureById.get(p.id);return c?`<button class="world-node" data-culture-map="${c.id}" style="left:${p.x}%;top:${p.y}%" aria-label="Abrir ${escapeHTML(c.name)}"><span>${escapeHTML(c.glyph)}</span><small>${escapeHTML(c.name)}</small></button>`:''}).join('');
    const grid=$('#cultureGrid');
    if(grid)grid.innerHTML=(D.cultures||[]).map(c=>{const stat=D.cultureStats?.[c.id]||{};const count=stat.entities??D.entities.filter(e=>e.culture===c.id).length;const myths=stat.myths??D.myths.filter(m=>m.culture===c.id).length;return `<button class="culture-card" data-culture-card="${c.id}"><div class="culture-glyph">${escapeHTML(c.glyph)}</div><p class="eyebrow">${escapeHTML(c.region)} · ${escapeHTML(c.coverage)}</p><h3>${escapeHTML(c.name)}</h3><p>${escapeHTML(c.desc)}</p><div><span>${count} fichas</span><span>${myths} relatos</span></div></button>`;}).join('');
    const journeys=$('#worldJourneyGrid');
    if(journeys)journeys.innerHTML=(D.worldJourneys||[]).map(j=>`<article class="world-journey-card"><p class="eyebrow">${escapeHTML(j.subtitle)}</p><h3>${escapeHTML(j.title)}</h3><p>${escapeHTML(j.summary)}</p><div class="relation-cloud">${j.stops.map(id=>{const e=entityById.get(id);return e?`<button data-entity="${e.id}">${escapeHTML(e.name)}</button>`:''}).join('')}</div></article>`).join('');
    selectCulture('greek',false,false);
  }
  function selectCulture(id,scroll=true,push=false){
    const c=cultureById.get(id); if(!c)return;
    if(push){try{history.pushState({culture:id},'',deepHash('culture',id));}catch{location.hash=deepHash('culture',id).slice(1);}}
    $$('.world-node').forEach(n=>n.classList.toggle('active',n.dataset.cultureMap===id));
    const stat=D.cultureStats?.[id]||{};const count=stat.entities??D.entities.filter(e=>e.culture===id).length,myths=stat.myths??D.myths.filter(m=>m.culture===id).length,sources=stat.sources??(D.academic?.sourceCatalog||[]).filter(s=>s.tradition===c.name).length;
    const loaded=Store.isCultureLoaded(id);
    const panel=$('#worldCulturePanel');if(panel)panel.innerHTML=`<p class="eyebrow">${escapeHTML(c.region)} · ${escapeHTML(c.period)}</p><div class="culture-panel-title"><span>${escapeHTML(c.glyph)}</span><h2>${escapeHTML(c.name)}</h2></div><p>${escapeHTML(c.desc)}</p><div class="world-panel-stats"><span><strong>${count}</strong> fichas</span><span><strong>${myths}</strong> relatos</span><span><strong>${sources}</strong> fuentes</span></div><div class="module-status ${loaded?'ready':''}"><span>${loaded?'●':'○'}</span><strong>${loaded?'Paquete cargado':'Paquete modular'}</strong><small>${loaded?'Disponible instantáneamente en esta sesión.':'Se carga solo cuando abres una ficha de esta tradición.'}</small></div><div class="cultural-warning"><strong>Contexto</strong><p>${escapeHTML(c.caution)}</p></div><div class="culture-panel-actions"><button class="primary" data-open-culture="${c.id}">Explorar ${escapeHTML(c.name)}</button><button class="secondary" data-load-culture="${c.id}">${loaded?'Paquete cargado':'Cargar paquete'}</button><button class="secondary" data-copy-link="culture" data-copy-id="${c.id}">↗ Copiar enlace</button></div>`;
    if(scroll){Store.prefetchCulture(id);if(matchMedia('(max-width:900px)').matches)panel?.scrollIntoView({behavior:'smooth',block:'start'});}
  }
  function openCultureCatalog(id){Store.prefetchCulture(id);state.culture=id;state.type='Todos';state.review='all';state.query='';state.limit=32;const q=$('#catalogSearch');if(q)q.value='';renderCatalog();setRoute('catalog');}
  function renderMotifs(){
    const holder=$('#motifGrid');if(!holder)return;
    holder.innerHTML=(D.motifs||[]).map(m=>`<article class="motif-card"><div class="motif-index">${String((D.motifs||[]).indexOf(m)+1).padStart(2,'0')}</div><p class="eyebrow">Comparación intercultural</p><h2>${escapeHTML(m.name)}</h2><p>${escapeHTML(m.summary)}</p><div class="relation-cloud">${(m.examples||[]).map(id=>{const e=entityById.get(id);return e?`<button data-entity="${e.id}">${escapeHTML(e.name)} · ${escapeHTML(cultureLabel(e))}</button>`:''}).join('')}</div><div class="cultural-warning"><strong>Cautela</strong><p>${escapeHTML(m.caution)}</p></div></article>`).join('');
  }
  function renderCosmogonies(){
    const holder=$('#cosmogonyGrid');if(!holder)return;
    holder.innerHTML=(D.cosmogonies||[]).map(x=>{const c=cultureById.get(x.culture);return `<article class="cosmogony-card"><div class="cosmogony-symbol">${escapeHTML(c?.glyph||'✦')}</div><p class="eyebrow">${escapeHTML(c?.name||x.culture)} · ${escapeHTML(c?.region||'')}</p><h2>${escapeHTML(x.title)}</h2><p>${escapeHTML(x.summary)}</p><div class="source-strip">${sourceChips(x.sourceRefs||[])}</div><div class="relation-cloud">${(x.entities||[]).map(id=>{const e=entityById.get(id);return e?`<button data-entity="${e.id}">${escapeHTML(e.name)}</button>`:''}).join('')}</div></article>`;}).join('');
  }
  function renderUnderworlds(){
    const holder=$('#underworldGrid');if(!holder)return;
    holder.innerHTML=(D.underworlds||[]).map(x=>{const c=cultureById.get(x.culture);return `<article class="underworld-card"><p class="eyebrow">${escapeHTML(c?.name||x.culture)} · ${escapeHTML(c?.region||'')}</p><h2>${escapeHTML(x.name)}</h2><p>${escapeHTML(x.summary)}</p><div class="relation-cloud">${(x.entities||[]).map(id=>{const e=entityById.get(id);return e?`<button data-entity="${e.id}">${escapeHTML(e.name)}</button>`:''}).join('')}</div><div class="source-strip">${sourceChips(x.sourceRefs||[])}</div></article>`;}).join('');
  }

  function renderAtlas(){
    $('#mapStage').innerHTML=D.mapPlaces.map(p=>{const e=entityById.get(p.id);return e?`<button class="map-node" data-map="${e.id}" style="left:${p.x}%;top:${p.y}%">${escapeHTML(e.name)}</button>`:''}).join('');
  }
  async function selectMap(id){
    const stub=entityById.get(id);if(!stub)return;
    let e=stub;try{e=await Store.loadEntity(id)||stub;}catch{}
    $$('.map-node').forEach(n=>n.classList.toggle('active',n.dataset.map===id));
    const related=(e.relations||[]).map(r=>entityById.get(r)).filter(Boolean).slice(0,10);
    $('#mapPanel').innerHTML=`<p class="eyebrow">${escapeHTML(e.era)}</p><h2>${escapeHTML(e.name)}</h2>${e.greek?`<div class="entity-greek small">${escapeHTML(e.greek)}</div>`:''}<p>${escapeHTML(e.summary||e.domain)}</p><p><strong>${escapeHTML(e.domain)}</strong></p><div class="related">${related.map(r=>`<button data-entity="${r.id}">${escapeHTML(r.name)}</button>`).join('')}</div>${e.source?`<div class="source-note">${escapeHTML(e.source)}</div>`:''}`;
  }

  function renderJourneys(){
    $('#journeyGrid').innerHTML=D.journeys.map((j,i)=>`<article class="journey-card"><span class="journey-index">${String(i+1).padStart(2,'0')}</span><p class="eyebrow">${escapeHTML(j.subtitle)}</p><h2>${escapeHTML(j.title)}</h2><p>${escapeHTML(j.summary)}</p><div class="journey-line">${j.stops.map((id,n)=>{const e=entityById.get(id);return e?`<button data-entity="${id}"><span>${n+1}</span>${escapeHTML(e.name)}</button>`:''}).join('')}</div></article>`).join('');
  }

  function renderLabours(){
    $('#laboursList').innerHTML=D.labours.map(l=>`<button type="button" class="labour-item ${l.n===state.selectedLabour?'active':''}" data-labour="${l.n}" aria-pressed="${l.n===state.selectedLabour}"><span>${String(l.n).padStart(2,'0')}</span><strong>${escapeHTML(l.title)}</strong></button>`).join('');
    selectLabour(state.selectedLabour,false);
  }
  function selectLabour(n,rerender=true){
    const l=D.labours.find(x=>x.n===Number(n));if(!l)return;state.selectedLabour=l.n;if(rerender)$$('.labour-item').forEach(b=>{const active=Number(b.dataset.labour)===l.n;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    const ent=entityById.get(l.entity), place=entityById.get(l.place);
    $('#labourPanel').innerHTML=`<div class="labour-number">${String(l.n).padStart(2,'0')}</div><p class="eyebrow">Trabajo de Heracles</p><h2>${escapeHTML(l.title)}</h2><p>${escapeHTML(l.summary)}</p><div class="labour-links">${ent?`<button class="secondary" data-entity="${ent.id}">Abrir ${escapeHTML(ent.name)}</button>`:''}${place?`<button class="secondary" data-entity="${place.id}">Lugar: ${escapeHTML(place.name)}</button>`:''}</div><div class="progress-ring" style="--progress:${(l.n/12)*360}deg"><span>${l.n}/12</span></div>`;
  }

  function renderTroy(){
    $('#troySides').innerHTML=Object.entries(D.troy.sides).map(([side,ids])=>`<section class="troy-side"><p class="eyebrow">${escapeHTML(side)}</p><div class="troy-people">${ids.map(id=>{const e=entityById.get(id);return e?`<button data-entity="${id}"><strong>${escapeHTML(e.name)}</strong><small>${escapeHTML(e.domain)}</small></button>`:''}).join('')}</div></section>`).join('');
    $('#troyTimeline').innerHTML=D.troy.events.map((ev,i)=>`<article class="troy-event"><span>${String(i+1).padStart(2,'0')}</span><div><small>${escapeHTML(ev.year)}</small><h3>${escapeHTML(ev.title)}</h3><p>${escapeHTML(ev.text)}</p><div class="relation-cloud">${ev.entities.map(id=>{const e=entityById.get(id);return e?`<button data-entity="${id}">${escapeHTML(e.name)}</button>`:''}).join('')}</div></div></article>`).join('');
  }

  function renderMuseum(){
    $('#museumGrid').innerHTML=D.museum.map((m,i)=>`<article class="museum-card"><div class="museum-art" aria-hidden="true"><span>${escapeHTML(m.glyph)}</span><i>${String(i+1).padStart(2,'0')}</i></div><div class="museum-copy"><p class="eyebrow">${escapeHTML(m.period)}</p><h2>${escapeHTML(m.title)}</h2><p>${escapeHTML(m.text)}</p><div class="relation-cloud">${m.entities.map(id=>{const e=entityById.get(id);return e?`<button data-entity="${id}">${escapeHTML(e.name)}</button>`:''}).join('')}</div></div></article>`).join('');
  }

  function renderGenealogy(){
    $('#genealogyTree').innerHTML=`<div class="genealogy-grid">${D.family.map(g=>`<div class="generation-label">${escapeHTML(g.generation)}</div>${g.nodes.map(id=>{const e=entityById.get(id);return e?`<button class="gene-node" data-entity="${e.id}" style="grid-column:span ${Math.max(1,Math.floor(12/g.nodes.length))}"><strong>${escapeHTML(e.name)}</strong><small>${escapeHTML(e.domain)}</small></button>`:''}).join('')}`).join('')}</div>`;
  }
  function renderTimeline(){
    $('#timeline').innerHTML=D.timeline.map(t=>`<article class="timeline-item"><span class="age">Edad ${escapeHTML(t.age)}</span><h3>${escapeHTML(t.title)}</h3><p>${escapeHTML(t.text)}</p><div class="timeline-links">${t.links.map(id=>{const e=entityById.get(id);return e?`<button data-entity="${id}">${escapeHTML(e.name)}</button>`:''}).join('')}</div></article>`).join('');
  }

  function populateSelects(){
    const opts=D.entities.filter(e=>e.reviewStatus!=='discovery').map(e=>`<option value="${e.id}">${escapeHTML(e.name)} · ${escapeHTML(cultureLabel(e))} · ${escapeHTML(e.type)}</option>`).join('');
    $('#constellationSelect').innerHTML=opts; $('#compareA').innerHTML=opts; $('#compareB').innerHTML=opts;
    if(!entityById.has(state.constellation))state.constellation='zeus'; $('#constellationSelect').value=state.constellation;
    $('#compareA').value='ares';$('#compareB').value='athena';
  }
  async function renderCompare(){
    const aid=$('#compareA').value,bid=$('#compareB').value;if(!aid||!bid)return;
    $('#compareResult').innerHTML='<div class="detail-loading compact" role="status"><span class="loading-orbit" aria-hidden="true">Ω</span><strong>Cargando dossiers comparables…</strong></div>';
    let a,b;try{[a,b]=await Promise.all([Store.loadEntity(aid),Store.loadEntity(bid)]);}catch{$('#compareResult').innerHTML='<div class="empty">No se pudieron cargar los paquetes necesarios.</div>';return;}if(!a||!b)return;
    const rows=[['Tradición',cultureLabel(a),cultureLabel(b)],['Región',a.region||'—',b.region||'—'],['Nombre original / grafía',a.greek||'—',b.greek||'—'],['Tipo',a.type,b.type],['Era / ciclo',a.era,b.era],['Dominio',a.domain,b.domain],['Símbolos',arrText(a.symbols),arrText(b.symbols)],['Lugares',arrText(a.places),arrText(b.places)],['Conexiones internas',String((a.relations||[]).length),String((b.relations||[]).length)],['Fuente',a.source,b.source]];
    const warning=a.culture!==b.culture?`<div class="compare-warning"><strong>Comparación intercultural ≠ equivalencia</strong><p>Compartir un dominio, símbolo o motivo no convierte a ${escapeHTML(a.name)} y ${escapeHTML(b.name)} en la misma figura. Compara contexto, fuentes y función antes que etiquetas modernas.</p></div>`:'';
    $('#compareResult').innerHTML=`${warning}<div class="compare-table"><div class="compare-hero"><div><span class="eyebrow">${escapeHTML(cultureLabel(a))} · ${escapeHTML(a.type)}</span><h2>${escapeHTML(a.name)}</h2><p>${escapeHTML(a.summary)}</p></div><div><span class="eyebrow">${escapeHTML(cultureLabel(b))} · ${escapeHTML(b.type)}</span><h2>${escapeHTML(b.name)}</h2><p>${escapeHTML(b.summary)}</p></div></div>${rows.map(r=>`<div class="compare-row"><strong>${escapeHTML(r[0])}</strong><div>${escapeHTML(r[1])}</div><div>${escapeHTML(r[2])}</div></div>`).join('')}</div>`;
  }

  let graph={nodes:[],center:null,dpr:1,pos:[]};
  async function buildGraph(centerId){
    let center=entityById.get(centerId)||entityById.get('zeus');if(!center)return;
    try{center=await Store.loadEntity(center.id)||center;}catch{}
    let neighbors=(center.relations||[]).map(id=>entityById.get(id)).filter(Boolean).slice(0,16);
    if(neighbors.length<9){neighbors=neighbors.concat(D.entities.filter(e=>e.id!==center.id&&e.type===center.type&&!neighbors.some(n=>n.id===e.id)).slice(0,9-neighbors.length));}
    graph.center=center;graph.nodes=[center,...neighbors];
    $('#constellationLegend').innerHTML=`<strong>${escapeHTML(center.name)}</strong><span>${neighbors.length} conexiones visibles</span><div class="constellation-links">${neighbors.map(n=>`<button type="button" data-entity="${n.id}">${escapeHTML(n.name)}</button>`).join('')}</div>`;
  }
  function resizeConstellation(){const c=$('#constellationCanvas');if(!c)return;const r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);c.width=Math.max(1,Math.floor(r.width*d));c.height=Math.max(1,Math.floor(r.height*d));graph.dpr=d;drawConstellation();}
  function graphPositions(w,h){const cx=w/2,cy=h/2,min=Math.min(w,h),rad=Math.max(130,min*.36);return graph.nodes.map((n,i)=>i===0?{x:cx,y:cy,r:38}:{x:cx+Math.cos((i-1)/(graph.nodes.length-1)*Math.PI*2-Math.PI/2)*rad*(.82+(i%3)*.08),y:cy+Math.sin((i-1)/(graph.nodes.length-1)*Math.PI*2-Math.PI/2)*rad*(.65+(i%2)*.12),r:23});}
  function drawConstellation(){
    const c=$('#constellationCanvas'),ctx=c?.getContext('2d');if(!ctx||!graph.center)return;const d=graph.dpr,w=c.width/d,h=c.height/d;ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w,h);
    const css=getComputedStyle(document.documentElement),accent=css.getPropertyValue('--accent').trim(),text=css.getPropertyValue('--text').trim(),muted=css.getPropertyValue('--muted').trim(),panel=css.getPropertyValue('--panel').trim(),line=css.getPropertyValue('--line').trim();const pos=graphPositions(w,h);graph.pos=pos;
    ctx.strokeStyle=accent;ctx.lineWidth=1;ctx.globalAlpha=.22;for(let i=1;i<pos.length;i++){ctx.beginPath();ctx.moveTo(pos[0].x,pos[0].y);ctx.lineTo(pos[i].x,pos[i].y);ctx.stroke();}ctx.globalAlpha=1;
    pos.forEach((p,i)=>{const n=graph.nodes[i];ctx.beginPath();ctx.fillStyle=panel;ctx.strokeStyle=i===0?accent:line;ctx.lineWidth=i===0?2:1;ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=i===0?accent:text;ctx.font=`${i===0?'600 14':'500 11'}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';let label=n.name;if(label.length>17)label=label.slice(0,15)+'…';ctx.fillText(label,p.x,p.y);if(i>0){ctx.fillStyle=muted;ctx.font='9px system-ui';ctx.fillText(n.type,p.x,p.y+p.r+12);}});
  }
  async function setConstellation(id){state.constellation=id;storage.set('constellation',id);$('#constellationSelect').value=id;await buildGraph(id);drawConstellation();}
  function canvasClick(ev){const c=$('#constellationCanvas'),r=c.getBoundingClientRect(),x=ev.clientX-r.left,y=ev.clientY-r.top;for(let i=0;i<graph.pos.length;i++){const p=graph.pos[i],dx=x-p.x,dy=y-p.y;if(dx*dx+dy*dy<(p.r+10)**2){setConstellation(graph.nodes[i].id);return;}}}

  function newQuiz(){
    const pool=[...D.quiz];
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
    state.quiz={questions:pool.slice(0,10),index:0,score:0,answered:false};renderQuiz();
  }
  function renderQuiz(){
    if(!state.quiz){$('#quizShell').innerHTML=`<div class="quiz-start"><div class="quiz-glyph">Ω</div><p class="eyebrow">Mejor marca: ${state.quizBest}/10</p><h2>¿Cuánto recuerdas del mito?</h2><p>Diez preguntas al azar de un banco de veinte. Cada respuesta puede abrir la ficha relacionada.</p><button class="primary" data-quiz-start>Comenzar</button></div>`;return;}
    const q=state.quiz.questions[state.quiz.index];if(!q){const score=state.quiz.score;state.quizBest=Math.max(state.quizBest,score);storage.set('quizBest',state.quizBest);if(score>=8){state.achievements.add('oraculo');storage.set('achievements',[...state.achievements]);}$('#quizShell').innerHTML=`<div class="quiz-start"><div class="quiz-glyph">${score>=8?'✦':'Ω'}</div><p class="eyebrow">Resultado</p><h2>${score}/10</h2><p>${score>=8?'El Oráculo reconoce a un cronista del mito.':score>=5?'Buena base. El archivo aún guarda muchos caminos.':'El mito premia a quien vuelve a preguntar.'}</p><button class="primary" data-quiz-start>Otra ronda</button></div>`;return;}
    $('#quizShell').innerHTML=`<div class="quiz-progress"><span>${state.quiz.index+1}/10</span><i style="width:${(state.quiz.index+1)*10}%"></i></div><article class="quiz-card"><p class="eyebrow">Pregunta ${state.quiz.index+1}</p><h2>${escapeHTML(q.q)}</h2><div class="quiz-options">${q.a.map((a,i)=>`<button data-quiz-answer="${i}">${escapeHTML(a)}</button>`).join('')}</div><div class="quiz-feedback" id="quizFeedback" role="status" aria-live="polite"></div></article>`;
  }
  function answerQuiz(i){
    if(!state.quiz||state.quiz.answered)return;const q=state.quiz.questions[state.quiz.index];state.quiz.answered=true;const ok=Number(i)===q.correct;if(ok)state.quiz.score++;
    $$('.quiz-options button').forEach((b,n)=>{b.disabled=true;b.classList.toggle('correct',n===q.correct);b.classList.toggle('wrong',n===Number(i)&&!ok);});
    const e=entityById.get(q.entity);$('#quizFeedback').innerHTML=`<strong>${ok?'Correcto':'No exactamente'}</strong><span>Respuesta: ${escapeHTML(q.a[q.correct])}</span>${e?`<button class="text-btn" data-entity="${e.id}">Abrir ficha →</button>`:''}<button class="primary" data-quiz-next>Siguiente</button>`;
  }
  function nextQuiz(){if(!state.quiz)return;state.quiz.index++;state.quiz.answered=false;renderQuiz();}

  const achievementNames={
    'primer-paso':'Primer paso','explorador':'Explorador','cronista':'Cronista','cazador':'Cazador de monstruos','olimpico':'Explorador de panteones','heroe':'Compañero de héroes','oraculo':'Voz del Oráculo','scholar':'Scholar'
  };
  function renderLibrary(){
    const favs=[...state.favorites].map(id=>entityById.get(id)).filter(Boolean), viewed=[...state.viewed].map(id=>entityById.get(id)).filter(Boolean);
    const total=Store.counts.entities||1, pct=Math.min(100,Math.round(state.viewed.size/total*100));
    $('#libraryGrid').innerHTML=`<section class="library-card"><p class="eyebrow">Favoritos · ${state.favorites.size}</p><h2>Tu colección</h2><div class="mini-grid">${favs.length?favs.slice(0,24).map(e=>`<button data-entity="${e.id}">${escapeHTML(e.name)}<small>${escapeHTML(e.type)}</small></button>`).join(''):'<p class="muted">Aún no has guardado fichas o sus paquetes todavía no se han cargado.</p>'}</div></section><section class="library-card"><p class="eyebrow">Progreso</p><h2>${state.viewed.size}/${total}</h2><p>Has explorado ${pct}% del archivo mundial.</p><div class="library-meter" role="progressbar" aria-label="Progreso de exploración" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${state.viewed.size}"><i style="width:${pct}%"></i></div><div class="achievement-list">${Object.entries(achievementNames).map(([id,name])=>`<span class="${state.achievements.has(id)?'unlocked':''}">${state.achievements.has(id)?'◆':'◇'} ${escapeHTML(name)}</span>`).join('')}</div></section><section class="library-card library-wide"><p class="eyebrow">Colecciones editoriales</p><h2>Seis recorridos temáticos</h2><div class="collection-grid">${(D.collections||[]).map(c=>`<article><h3>${escapeHTML(c.title)}</h3><p>${escapeHTML(c.desc)}</p><div class="relation-cloud">${c.items.slice(0,12).map(id=>{const e=entityById.get(id);return e?`<button data-entity="${id}">${escapeHTML(e.name)}</button>`:''}).join('')}</div></article>`).join('')}</div></section><section class="library-card"><p class="eyebrow">Copia local</p><h2>Tus datos son tuyos</h2><p>Exporta favoritos, progreso, logros, skin y notas de investigación a un JSON o restaura una copia previa.</p><p class="storage-status">${storage.available?'Guardado local disponible.':'El navegador bloquea el almacenamiento local: el progreso no persistirá al cerrar.'}</p><div class="library-actions"><button class="secondary" data-export>Exportar JSON</button><button class="secondary" data-import>Importar JSON</button><button class="secondary danger" data-reset>Reiniciar progreso</button></div></section>`;
  }

  function exportData(){
    const payload={app:'MYTHOS 404',version:D.meta?.version||'8.1.0',exported:new Date().toISOString(),theme:state.theme,favorites:[...state.favorites],viewed:[...state.viewed],achievements:[...state.achievements],quizBest:state.quizBest,notes:state.notes};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='mythos-404-backup.json';a.rel='noopener';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast('Copia exportada');
  }
  async function importData(file){
    try{
      if(!file||file.size>1024*1024)throw new Error('Archivo demasiado grande');
      const obj=JSON.parse(await file.text());
      if(!obj||typeof obj!=='object'||obj.app!=='MYTHOS 404')throw new Error('Formato no reconocido');
      const importedTheme=typeof obj.theme==='string'&&D.themes.some(t=>t.id===obj.theme)?obj.theme:state.theme;
      state.favorites=new Set(asArray(obj.favorites).filter(id=>typeof id==='string'&&Store.hasEntity(id)));
      state.viewed=new Set(asArray(obj.viewed).filter(id=>typeof id==='string'&&Store.hasEntity(id)));
      state.achievements=new Set(asArray(obj.achievements).filter(id=>achievementIds.has(id)));
      state.quizBest=clamp(Number(obj.quizBest)||0,0,10);
      state.theme=importedTheme;
      const importedNotes=obj.notes&&typeof obj.notes==='object'&&!Array.isArray(obj.notes)?Object.fromEntries(Object.entries(obj.notes).filter(([id,v])=>Store.hasEntity(id)&&typeof v==='string').map(([id,v])=>[id,v.slice(0,6000)])):{};
      state.notes=importedNotes;
      storage.set('favorites',[...state.favorites]);storage.set('viewed',[...state.viewed]);storage.set('achievements',[...state.achievements]);storage.set('quizBest',state.quizBest);storage.set('notes',state.notes);
      applyTheme(importedTheme);renderLibrary();showToast('Copia restaurada');
    }catch{showToast('No se pudo importar el archivo');}
  }
  function resetData(){
    if(!confirm('¿Reiniciar favoritos, progreso, logros, notas y mejor puntuación?'))return;state.favorites.clear();state.viewed.clear();state.achievements.clear();state.quizBest=0;state.notes={};['favorites','viewed','achievements','quizBest','notes'].forEach(k=>storage.remove(k));renderLibrary();if(state.route==='academic')renderAcademic();showToast('Progreso y cuaderno reiniciados');
  }


  function sourceUsage(id){
    return D.sourceUsage?.[id]||{entities:0,myths:0,total:0};
  }
  function renderSourceCorpus(){
    const holder=$('#sourceCorpus');if(!holder)return;
    const filter=state.academicSource;
    const list=(D.academic?.sourceCatalog||[]).filter(s=>filter==='all'||s.tradition===filter||s.kind===filter);
    holder.innerHTML=list.map(s=>{const u=sourceUsage(s.id);return `<article class="source-card"><div class="source-card-top"><div><p class="eyebrow">${escapeHTML(s.tradition)} · ${escapeHTML(s.kind)}</p><h3>${escapeHTML(s.author)}</h3><strong>${escapeHTML(s.work)}</strong></div><span class="source-usage">${u.total}<small>usos</small></span></div><p>${escapeHTML(s.note)}</p><div class="source-meta"><span>${escapeHTML(s.period)}</span><span>${u.entities} fichas · ${u.myths} relatos</span></div><button class="text-btn" type="button" data-copy-ref="${s.id}" data-copy-loc="">Copiar referencia breve →</button></article>`;}).join('')||'<div class="empty">No hay fuentes en este filtro.</div>';
  }
  function renderVariantLab(){
    const holder=$('#variantLab');if(!holder)return;
    const items=(D.variantIndex||[]).map(x=>({entity:entityById.get(x.entityId),variant:x.variant})).filter(x=>x.entity&&x.variant);
    holder.innerHTML=items.map(({entity:e,variant:v},i)=>`<article class="variant-lab-card"><div class="variant-lab-index">${String(i+1).padStart(2,'0')}</div><p class="eyebrow">${escapeHTML(e.name)}</p><h3>${escapeHTML(v.title)}</h3><div class="variant-columns"><p><small>A</small>${escapeHTML(v.a)}</p><p><small>B</small>${escapeHTML(v.b)}</p></div><div class="source-strip">${sourceChips(v.refs||[])}</div><p class="variant-note">${escapeHTML(v.note)}</p><button class="secondary" data-entity="${e.id}">Abrir dossier</button></article>`).join('');
  }
  function renderGlossary(){
    const holder=$('#glossaryGrid');if(!holder)return;
    const q=normalize(state.glossaryQuery);
    const list=(D.academic?.glossary||[]).filter(g=>!q||normalize([g.term,g.greek,g.definition,...g.tags].join(' ')).includes(q));
    holder.innerHTML=list.map(g=>`<article class="glossary-card"><div class="glossary-term"><strong>${escapeHTML(g.term)}</strong><span>${escapeHTML(g.greek)}</span></div><p>${escapeHTML(g.definition)}</p><div class="tags">${g.tags.map(t=>`<span class="tag">${escapeHTML(t)}</span>`).join('')}</div></article>`).join('')||'<div class="empty">No hay conceptos con ese término.</div>';
  }
  function renderNotebook(){
    const holder=$('#notebookGrid');if(!holder)return;
    const notes=Object.entries(state.notes).map(([id,text])=>({e:entityById.get(id),text})).filter(x=>x.e&&x.text.trim()).sort((a,b)=>a.e.name.localeCompare(b.e.name,'es'));
    holder.innerHTML=notes.length?notes.map(({e,text})=>`<article class="notebook-card"><div><p class="eyebrow">${escapeHTML(e.type)} · ${escapeHTML(e.era)}</p><h3>${escapeHTML(e.name)}</h3><p>${escapeHTML(text.length>240?text.slice(0,237)+'…':text)}</p></div><div><button class="secondary" data-entity="${e.id}">Editar nota</button><button class="text-btn" data-export-entity="${e.id}">Exportar .md →</button></div></article>`).join(''):'<div class="notebook-empty"><span>Σ</span><h3>Aún no hay notas</h3><p>Abre cualquier ficha, escribe en “Tu nota de investigación” y volverá a aparecer aquí.</p><button class="secondary" data-route="catalog">Explorar archivo</button></div>';
  }
  function renderAcademic(){
    if(!D.academic)return;
    const stats=$('#academicStats');
    if(stats)stats.innerHTML=[[D.academic.sourceCatalog.length,'familias de fuentes'],[D.cultures?.length||1,'tradiciones'],[D.academic.variantCount,'dossiers de variantes'],[Object.keys(state.notes).length,'fichas anotadas']].map(([n,l])=>`<div><strong>${n}</strong><span>${l}</span></div>`).join('');
    const method=$('#methodGrid');if(method)method.innerHTML=D.academic.methodology.map(m=>`<article><h3>${escapeHTML(m.title)}</h3><p>${escapeHTML(m.text)}</p></article>`).join('');
    const select=$('#academicSourceFilter');
    if(select&&select.options.length===1){
      const groups=[...new Set(D.academic.sourceCatalog.map(s=>s.tradition))];
      select.insertAdjacentHTML('beforeend',groups.map(g=>`<option value="${escapeHTML(g)}">${escapeHTML(g)}</option>`).join(''));
    }
    if(select)select.value=state.academicSource;
    renderSourceCorpus();renderVariantLab();renderGlossary();
    const reading=$('#readingGrid');if(reading)reading.innerHTML=D.academic.secondaryReading.map(r=>`<article><p class="eyebrow">${escapeHTML(r.author)}</p><h3>${escapeHTML(r.title)}</h3><p>${escapeHTML(r.focus)}</p></article>`).join('');
    renderNotebook();
  }

  function renderSources(){
    $('#sourcesGrid').innerHTML=(D.cultures||[]).map(c=>{const n=D.cultureStats?.[c.id]?.sources??(D.academic?.sourceCatalog||[]).filter(s=>s.tradition===c.name).length;return `<article><p class="eyebrow">${escapeHTML(c.region)} · ${escapeHTML(c.status)}</p><h2>${escapeHTML(c.name)}</h2><p><strong>${n} familias de fuentes catalogadas</strong></p><p>${escapeHTML(c.caution)}</p><button class="text-btn" data-open-culture="${c.id}">Abrir archivo →</button></article>`;}).join('');
  }

  function searchAll(q){
    const nq=normalize(q.trim());if(!nq)return[];
    const entities=D.entities.map(e=>{const name=normalize(e.name),discovery=e.reviewStatus==='discovery';return {kind:'entity',id:e.id,title:e.name,meta:`${cultureLabel(e)} · ${e.type} · ${discovery?'Descubrimiento pendiente':'Corpus revisado'}`,score:(name===nq?0:name.startsWith(nq)?2:name.includes(nq)?4:6)+(discovery?1:0),text:normalize([e.name,e.greek,e.domain,e.tradition,e.region,cultureLabel(e),...(e.symbols||[]),...(e.places||[]),...(e.aliases||[])].join(' '))}}).filter(x=>x.text.includes(nq));
    const myths=D.myths.map(m=>({kind:'myth',id:m.id,title:m.title,meta:`Relato · ${cultureById.get(m.culture)?.name||m.era} · ${m.era}`,score:normalize(m.title).startsWith(nq)?0:1,text:normalize(m.title+' '+m.summary)})).filter(x=>x.text.includes(nq));
    return entities.concat(myths).sort((a,b)=>a.score-b.score||a.title.localeCompare(b.title,'es')).slice(0,16);
  }
  let globalSearchToken=0;
  async function renderGlobalSearch({full=false}={}){
    const input=$('#globalSearch'),query=input.value.trim(),token=++globalSearchToken,holder=$('#globalResults');
    if(holder)holder.setAttribute('aria-busy','true');
    if(query){
      try{if(full)await Store.loadAllShards();else await Store.ensureSearch(query);}catch{}
    }
    if(token!==globalSearchToken)return;
    const r=searchAll(query);
    const shardTotal=Object.keys(window.MYTHOS_INDEX?.shards||{}).length,allLoaded=Store.loadedShards().length>=shardTotal;
    const results=r.length?r.map((x,i)=>`<button type="button" class="result-row ${i===0?'active':''}" data-search-kind="${escapeHTML(x.kind)}" data-search-id="${escapeHTML(x.id)}"><span class="result-copy"><strong>${escapeHTML(x.title)}</strong><span>${escapeHTML(x.meta)}</span></span><span class="result-kind">${x.kind==='entity'?'Ficha':'Relato'}</span></button>`).join(''):`<div class="empty">${query?`No hay resultados para “${escapeHTML(query)}” en el bloque de búsqueda cargado.`:`Escribe para buscar entre ${Store.counts.entities} entidades y ${Store.counts.myths} relatos.`}</div>`;
    const expand=query&&!allLoaded?`<div class="search-expand"><p>La búsqueda rápida carga primero el shard más probable por nombre o alias.</p><button type="button" class="secondary" data-search-all>Buscar también por tema en todo el índice</button></div>`:'';
    if(holder){holder.innerHTML=results+expand;holder.setAttribute('aria-busy','false');}
  }
  function openSearch(){const d=$('#searchDialog');if(!d.open)d.showModal();$('#globalSearch').value='';renderGlobalSearch();setTimeout(()=>$('#globalSearch').focus(),10);}
  function openTheme(){const d=$('#themeDialog');if(!d.open)d.showModal();}
  function openMenu(){const d=$('#menuDialog');if(!d.open)d.showModal();}
  function closeAllDialogs(){ $$('dialog[open]').forEach(d=>d.close()); }

  function applyTheme(id){
    if(!D.themes.some(t=>t.id===id))id='olympus';state.theme=id;document.documentElement.dataset.theme=id;storage.set('theme',id);
    const bg=getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();const meta=$('#themeColorMeta');if(meta&&bg)meta.setAttribute('content',bg);
    renderThemes();if(state.route==='constellation')requestAnimationFrame(drawConstellation);
  }
  function renderThemes(){ $('#themeGrid').innerHTML=D.themes.map(t=>`<button type="button" class="theme-card ${t.id===state.theme?'active':''}" data-theme-id="${t.id}" aria-pressed="${t.id===state.theme}"><strong>${escapeHTML(t.name)}</strong><small>${escapeHTML(t.desc)}</small></button>`).join(''); }

  function oracleSubmit(ev){ev.preventDefault();const q=$('#oracleQuestion').value.trim();if(!q)return;let hash=0;for(const c of q)hash=(hash*31+c.charCodeAt(0))>>>0;const quote=D.oracle[(hash+Math.floor(Date.now()/86400000))%D.oracle.length];$('#oracleResponse').innerHTML=`<blockquote>“${escapeHTML(quote)}”</blockquote><small>Respuesta literaria de MYTHOS 404. No es una predicción real.</small>`;$('#oracleResponse').classList.add('show');}

  function speakName(id){
    const e=entityById.get(id);if(!e)return;
    if(!('speechSynthesis' in window)){showToast('La voz del navegador no está disponible');return;}
    speechSynthesis.cancel();const text=e.greek||e.name,u=new SpeechSynthesisUtterance(text);u.rate=.82;
    const voices=speechSynthesis.getVoices();const greek=voices.find(v=>/^el(-|_)/i.test(v.lang));const spanish=voices.find(v=>/^es(-|_)/i.test(v.lang));
    if(e.greek&&greek){u.voice=greek;u.lang=greek.lang;}else if(spanish){u.voice=spanish;u.lang=spanish.lang;}
    speechSynthesis.speak(u);showToast('Voz del navegador: aproximación; no reconstrucción histórica ni pronunciación comunitaria certificada.');
  }

  function surprise(){const pool=D.entities.filter(e=>e.reviewStatus!=='discovery'&&e.type!=='Lugar');if(pool.length)openEntity(pool[Math.floor(Math.random()*pool.length)].id);}
  function portalFilter(type){state.type=type;state.culture='all';state.review='all';state.query='';state.limit=32;$('#catalogSearch').value='';renderCatalog();setRoute('catalog');}

  function initEvents(){
    document.addEventListener('click',ev=>{
      const b=ev.target.closest('button,[data-myth],[data-map],[data-search-kind]');if(!b)return;
      if(b.dataset.route){setRoute(b.dataset.route);return;}
      if(b.dataset.entity){openEntity(b.dataset.entity);return;}
      if(b.dataset.myth){openMyth(b.dataset.myth);return;}
      if(b.dataset.filterType){portalFilter(b.dataset.filterType);return;}
      if(b.dataset.cultureMap){selectCulture(b.dataset.cultureMap,true,true);return;}
      if(b.dataset.cultureCard){selectCulture(b.dataset.cultureCard,true,true);return;}
      if(b.dataset.openCulture){openCultureCatalog(b.dataset.openCulture);return;}
      if(b.dataset.type){state.type=b.dataset.type;state.limit=32;renderCatalog();return;}
      if(b.dataset.favorite){toggleFavorite(b.dataset.favorite);return;}
      if(b.dataset.map){selectMap(b.dataset.map);return;}
      if(b.dataset.labour){selectLabour(b.dataset.labour);return;}
      if(b.dataset.themeId){applyTheme(b.dataset.themeId);return;}
      if(b.dataset.loadCulture){Store.loadCulture(b.dataset.loadCulture).then(()=>{selectCulture(b.dataset.loadCulture,false,false);showToast('Paquete cultural cargado');}).catch(()=>showToast('No se pudo cargar el paquete cultural'));return;}
      if(b.dataset.copyLink&&b.dataset.copyId){copyPermalink(b.dataset.copyLink,b.dataset.copyId);return;}
      if(b.dataset.closeDialog){const dialog=document.getElementById(b.dataset.closeDialog);if(b.dataset.closeDialog==='entityDialog'&&/^#(?:entity|myth)\//.test(location.hash)){if(state.deepFrom){state.deepFrom=null;history.back();}else{const fallback=location.hash.startsWith('#myth/')?'myths':'catalog';history.replaceState({},'',`#${fallback}`);setRoute(fallback,false);dialog?.close();}}else dialog?.close();return;}
      if(b.dataset.centerGraph){$('#entityDialog').close();setConstellation(b.dataset.centerGraph);setRoute('constellation');return;}
      if(b.dataset.speak){speakName(b.dataset.speak);return;}
      if(b.dataset.exportEntity){exportEntityMarkdown(b.dataset.exportEntity);return;}
      if(b.dataset.copyRef!==undefined){copyText(citationText(b.dataset.copyRef,b.dataset.copyLoc||''));return;}
      if(b.hasAttribute('data-search-all')){renderGlobalSearch({full:true});return;}
      if(b.dataset.searchKind){$('#searchDialog').close();b.dataset.searchKind==='entity'?openEntity(b.dataset.searchId):openMyth(b.dataset.searchId);return;}
      if(b.hasAttribute('data-quiz-start')){newQuiz();return;}
      if(b.dataset.quizAnswer!==undefined){answerQuiz(b.dataset.quizAnswer);return;}
      if(b.hasAttribute('data-quiz-next')){nextQuiz();return;}
      if(b.hasAttribute('data-export')){exportData();return;}
      if(b.hasAttribute('data-import')){$('#importData').click();return;}
      if(b.hasAttribute('data-reset')){resetData();return;}
    });
    document.addEventListener('pointerover',ev=>{
      const target=ev.target.closest?.('[data-entity],[data-culture-card],[data-culture-map]');if(!target)return;
      const culture=target.dataset.entity?Store.cultureForEntity(target.dataset.entity):(target.dataset.cultureCard||target.dataset.cultureMap);if(culture)Store.prefetchCulture(culture);
    },{passive:true});
    document.addEventListener('input',ev=>{
      const note=ev.target.closest?.('[data-research-note]');
      if(note){saveResearchNote(note.dataset.researchNote,note.value);return;}
    });
    $('#searchOpen').addEventListener('click',openSearch);$('#themeOpen').addEventListener('click',openTheme);$('#menuOpen').addEventListener('click',openMenu);$('#mobileMore').addEventListener('click',openMenu);$('#surpriseBtn').addEventListener('click',surprise);
    $('#catalogSearch').addEventListener('input',e=>{state.query=e.target.value;state.limit=32;renderCatalog();});$('#cultureFilter')?.addEventListener('change',e=>{state.culture=e.target.value;state.limit=32;renderCatalog();});$('#reviewFilter')?.addEventListener('change',e=>{state.review=e.target.value;state.limit=32;renderCatalog();});$('#loadMore').addEventListener('click',async()=>{if(state.culture==='all'&&state.review==='discovery'&&!state.query.trim()&&state.limit>=filteredEntities().length)await Store.loadNextShard();state.limit+=32;renderCatalog();});$('#globalSearch').addEventListener('input',renderGlobalSearch);$('#oracleForm').addEventListener('submit',oracleSubmit);
    $('#academicSourceFilter')?.addEventListener('change',e=>{state.academicSource=e.target.value;renderSourceCorpus();});$('#glossarySearch')?.addEventListener('input',e=>{state.glossaryQuery=e.target.value;renderGlossary();});
    $('#compareA').addEventListener('change',renderCompare);$('#compareB').addEventListener('change',renderCompare);$('#constellationSelect').addEventListener('change',e=>setConstellation(e.target.value));$('#constellationRandom').addEventListener('click',()=>{const pool=D.entities.filter(e=>e.reviewStatus!=='discovery');if(pool.length)setConstellation(pool[Math.floor(Math.random()*pool.length)].id);});$('#constellationCanvas').addEventListener('click',canvasClick);$('#importData').addEventListener('change',e=>{const f=e.target.files?.[0];if(f)importData(f);e.target.value='';});
    window.addEventListener('resize',()=>{if(state.route==='constellation')resizeConstellation();});window.addEventListener('hashchange',routeFromHash);window.addEventListener('popstate',routeFromHash);
    document.addEventListener('keydown',e=>{
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch();return;}
      if(e.key==='Escape'){closeAllDialogs();return;}
      if($('#searchDialog').open&&['ArrowDown','ArrowUp','Enter'].includes(e.key)){
        const rows=$$('.result-row',$('#globalResults'));if(!rows.length)return;
        let idx=rows.findIndex(x=>x.classList.contains('active'));if(idx<0)idx=0;
        if(e.key==='ArrowDown')idx=(idx+1)%rows.length;
        if(e.key==='ArrowUp')idx=(idx-1+rows.length)%rows.length;
        if(e.key==='Enter'){e.preventDefault();rows[idx].click();return;}
        rows.forEach((r,i)=>r.classList.toggle('active',i===idx));rows[idx].focus({preventScroll:true});e.preventDefault();
      }
    });
    $$('dialog').forEach(d=>d.addEventListener('click',ev=>{if(ev.target===d)d.close();}));
  }

  function initPWA(){
    if(!('serviceWorker'in navigator)||!/^https?:$/.test(location.protocol))return;
    navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(reg=>{
      reg.addEventListener('updatefound',()=>{const worker=reg.installing;if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)showToast('Hay una versión nueva de MYTHOS 404. Cierra y vuelve a abrir la app para activarla.');});});
    }).catch(()=>{});
  }
  function init(){
    applyTheme(state.theme);renderStats();renderFeaturedMyths();renderWorld();renderMotifs();renderCosmogonies();renderUnderworlds();renderCatalog();renderMyths();renderAtlas();renderJourneys();renderLabours();renderTroy();renderMuseum();renderGenealogy();renderTimeline();populateSelects();renderQuiz();renderLibrary();renderAcademic();renderSources();renderThemes();initEvents();routeFromHash();initPWA();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
