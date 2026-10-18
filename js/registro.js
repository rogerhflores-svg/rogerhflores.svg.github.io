/* NutriAndes — registro local (IndexedDB), pacientes y recordatorios */
/* ===== INDEXEDDB — Registro local de pacientes y recordatorios 24h ===== */
const IDB_NAME = 'NutriAndesDB';
const IDB_VER = 1;
let regTabActual = 'pacientes';
let _idb = null;

function idbOpen(){
  return new Promise((resolve, reject)=>{
    if(_idb){ resolve(_idb); return; }
    if(!window.indexedDB){ reject(new Error('IndexedDB no disponible en este navegador')); return; }
    const req = indexedDB.open(IDB_NAME, IDB_VER);
    req.onupgradeneeded = (e)=>{
      const db = e.target.result;
      if(!db.objectStoreNames.contains('pacientes')){
        const st = db.createObjectStore('pacientes', { keyPath: 'id', autoIncrement: true });
        st.createIndex('nombre', 'nombre', { unique: false });
        st.createIndex('ts', 'ts', { unique: false });
      }
      if(!db.objectStoreNames.contains('recordatorios')){
        const st2 = db.createObjectStore('recordatorios', { keyPath: 'id', autoIncrement: true });
        st2.createIndex('nombre', 'nombre', { unique: false });
        st2.createIndex('ts', 'ts', { unique: false });
      }
    };
    req.onsuccess = (e)=>{ _idb = e.target.result; resolve(_idb); };
    req.onerror = (e)=> reject(e.target.error);
  });
}

function idbAdd(store, obj){
  return idbOpen().then(db=> new Promise((resolve, reject)=>{
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).add(obj);
    req.onsuccess = ()=> resolve(req.result);
    req.onerror = ()=> reject(req.error);
  }));
}

function idbGetAll(store){
  return idbOpen().then(db=> new Promise((resolve, reject)=>{
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = ()=> resolve(req.result || []);
    req.onerror = ()=> reject(req.error);
  }));
}

function idbDelete(store, id){
  return idbOpen().then(db=> new Promise((resolve, reject)=>{
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(id);
    req.onsuccess = ()=> resolve();
    req.onerror = ()=> reject(req.error);
  }));
}

function idbGet(store, id){
  return idbOpen().then(db=> new Promise((resolve, reject)=>{
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(id);
    req.onsuccess = ()=> resolve(req.result);
    req.onerror = ()=> reject(req.error);
  }));
}

/** Guarda la última evaluación antropométrica. silent=true no muestra alert. */
async function guardarPacienteIDB(silent){
  if(!ultimoReporte){
    if(!silent) alert('No hay evaluación para guardar. Calcule primero el diagnóstico.');
    return;
  }
  /* calcular() ya guarda automáticamente: el botón manual no debe duplicar la misma evaluación */
  const rep = ultimoReporte;
  if(!silent && rep._guardadoId){
    alert('Esta evaluación ya está guardada en el teléfono (registro #' + rep._guardadoId + ').');
    return;
  }
  try{
    const reg = Object.assign({}, rep, {
      tipo: 'antropometria',
      guardado: new Date().toISOString()
    });
    const id = await idbAdd('pacientes', reg);
    rep._guardadoId = id;
    if(!silent) alert('Evaluación guardada en el teléfono (registro #' + id + ').');
  }catch(e){
    console.error(e);
    if(!silent) alert('No se pudo guardar: ' + (e.message || e));
  }
}

/** Guarda el recordatorio 24h actual */
async function r24GuardarIDB(){
  if(!r24Lista || !r24Lista.length){
    alert('Agregue al menos un alimento al recordatorio antes de guardar.');
    return;
  }
  try{
    const t = r24Totales();
    const nombre = (document.getElementById('r24_nombre') && document.getElementById('r24_nombre').value.trim()) || 'Sin nombre';
    const reg = {
      tipo: 'r24',
      ts: Date.now(),
      guardado: new Date().toISOString(),
      nombre: nombre,
      peso: document.getElementById('r24_peso').value,
      talla: document.getElementById('r24_talla').value,
      edad: document.getElementById('r24_edad').value,
      sexo: document.getElementById('r24_sexo').value,
      embarazada: r24EstadoFisio().emb,
      lactancia: r24EstadoFisio().lact,
      trimestre: r24EstadoFisio().emb ? document.getElementById('r24_trimestre').value : '',
      lactPeriodo: r24EstadoFisio().lact ? document.getElementById('r24_lact_per').value : '',
      kcalAdicional: r24KcalExtra().kcal,
      naf: document.getElementById('r24_naf').value,
      injuria: document.getElementById('r24_injuria').value,
      geb: r24Geb,
      get: r24Get,
      edadMeses: (document.getElementById('r24_edad_meses')||{}).value || '',
      muneca: (document.getElementById('r24_muneca')||{}).value || '',
      ajusteGet: (document.getElementById('r24_ajuste_get')||{}).value || '0',
      pctProt: (document.getElementById('r24_pct_prot')||{}).value || '',
      gkgProt: (document.getElementById('r24_gkg_prot')||{}).value || '',
      pctCh: (document.getElementById('r24_pct_ch')||{}).value || '',
      pctFat: (document.getElementById('r24_pct_fat')||{}).value || '',
      alimentos: r24Lista.map(x=>({n:x.n,g:x.g,cant:x.cant,kcal:x.kcal,prot:x.prot,ch:x.ch,fat:x.fat,fib:x.fib,comida:x.comida||'desayuno',per100:x.per100})),
      totales: {kcal:t.kcal,prot:t.prot,ch:t.ch,fat:t.fat,fib:t.fib,ca:t.ca,fe:t.fe,vc:t.vc}
    };
    if(r24EditId != null){
      const previo = await idbGet('recordatorios', r24EditId);
      reg.id = r24EditId; reg.ts = (previo && previo.ts) || reg.ts;
      await idbPut('recordatorios', reg);
      alert('Recordatorio 24h actualizado (registro #' + r24EditId + '). Ya puede analizar a otro paciente.');
      r24SalirEdicion(true);
      return;
    }
    const id = await idbAdd('recordatorios', reg);
    alert('Recordatorio 24h guardado en el teléfono (registro #' + id + ').');
  }catch(e){
    console.error(e);
    alert('No se pudo guardar: ' + (e.message || e));
  }
}

/* ===== EDITAR / CONTINUAR UN RECORDATORIO 24 h DESDE EL REGISTRO ===== */
let r24EditId = null;
const R24_KEYS = ['kcal','prot','ch','fat','ags','agm','agp','agt','col','o3','o6','fib','fibs','fibi','ca','p','fe','na','k','zn','cu','mg','se','ret','b1','b2','b3','fol','b12','vc','vd','ve','vk'];
const R24_DEFAULTS = {};
document.addEventListener('DOMContentLoaded', function(){
  ['r24_nombre','r24_peso','r24_talla','r24_edad','r24_edad_meses','r24_sexo','r24_muneca','r24_naf','r24_injuria','r24_ajuste_get','r24_pct_prot','r24_gkg_prot','r24_pct_ch','r24_pct_fat','r24_trimestre','r24_lact_per'].forEach(function(id){
    const e = document.getElementById(id); if(e) R24_DEFAULTS[id] = e.value;
  });
});
function r24ReconstruirItem(a){
  const cant = Number(a.cant) || 0, f = cant/100;
  let per = a.per100 && typeof a.per100 === 'object' ? a.per100 : null;
  if(!per){
    const src = R24_ALIMENTOS.find(x => x.n === a.n);
    per = {}; R24_KEYS.forEach(k => { per[k] = src ? (src[k]||0) : 0; });
    if(!src && f > 0){ ['kcal','prot','ch','fat','fib'].forEach(k => { per[k] = (Number(a[k])||0)/f; }); }
  }
  const item = {n:a.n, g:a.g, cant:cant, per100:per, comida:a.comida || 'desayuno'};
  R24_KEYS.forEach(k => { item[k] = (per[k]||0)*f; });
  return item;
}
function r24ActualizarBannerEdicion(nombre){
  const b = document.getElementById('r24-edit-banner'), btn = document.getElementById('r24-btn-guardar');
  if(b){
    b.style.display = r24EditId != null ? 'flex' : 'none';
    const n = document.getElementById('r24-edit-name'); if(n) n.textContent = nombre || '';
    const i = document.getElementById('r24-edit-id'); if(i) i.textContent = r24EditId != null ? r24EditId : '';
  }
  if(btn) btn.textContent = r24EditId != null ? '💾 Actualizar registro #' + r24EditId : '💾 Guardar en el teléfono';
}
function r24ResetFormulario(){
  r24Lista = [];
  Object.keys(R24_DEFAULTS).forEach(function(id){ const e = document.getElementById(id); if(e) e.value = R24_DEFAULTS[id]; });
  ['r24_embarazada','r24_lactancia'].forEach(function(id){ const c = document.getElementById(id); if(c) c.checked = false; });
  const b = document.getElementById('r24_buscador'); if(b) b.value = '';
  const sg = document.getElementById('r24_sugerencias'); if(sg) sg.innerHTML = '';
  const sn = document.getElementById('r24_sel_nombre'); if(sn) sn.value = '';
  r24SelFood = null;
  if(typeof r24SyncAjusteGetSlider === 'function') r24SyncAjusteGetSlider();
  r24ActualizarEstadoFisio(); r24CalcGE(); r24RenderLista();
  if(typeof updateR24Progress === 'function') updateR24Progress();
}
function r24SalirEdicion(limpiar){
  r24EditId = null; r24ActualizarBannerEdicion('');
  if(limpiar) r24ResetFormulario();
}
function r24CancelarEdicion(){
  if(!confirm('¿Cancelar la edición? Los cambios no guardados se perderán y el formulario quedará vacío para un nuevo paciente.')) return;
  r24SalirEdicion(true);
}
async function regContinuarR24(id){
  const r = await idbGet('recordatorios', id);
  if(!r){ alert('No se encontró el registro.'); return; }
  if(r24EditId != null && r24EditId !== id && !confirm('Ya está editando otro recordatorio. ¿Descartar sus cambios y abrir este?')) return;
  abrirModulo('r24h');
  r24ResetFormulario();
  const set = (i, v) => { const e = document.getElementById(i); if(e && v != null) e.value = v; };
  set('r24_nombre', r.nombre === 'Sin nombre' ? '' : r.nombre);
  set('r24_peso', r.peso); set('r24_talla', r.talla); set('r24_edad', r.edad); set('r24_edad_meses', r.edadMeses);
  set('r24_sexo', r.sexo || 'M'); set('r24_muneca', r.muneca);
  set('r24_naf', r.naf); set('r24_injuria', r.injuria);
  r24ActualizarEstadoFisio();
  const emb = document.getElementById('r24_embarazada'), lac = document.getElementById('r24_lactancia');
  if(emb) emb.checked = !!r.embarazada; if(lac) lac.checked = !!r.lactancia;
  r24ActualizarEstadoFisio();
  set('r24_trimestre', r.trimestre || R24_DEFAULTS.r24_trimestre); set('r24_lact_per', r.lactPeriodo || R24_DEFAULTS.r24_lact_per);
  if(r.pctProt) set('r24_pct_prot', r.pctProt); if(r.gkgProt) set('r24_gkg_prot', r.gkgProt);
  if(r.pctCh) set('r24_pct_ch', r.pctCh); if(r.pctFat) set('r24_pct_fat', r.pctFat);
  if(r.ajusteGet != null && r.ajusteGet !== ''){ set('r24_ajuste_get', r.ajusteGet); if(typeof r24SyncAjusteGetSlider === 'function') r24SyncAjusteGetSlider(); }
  r24Lista = (r.alimentos || []).map(r24ReconstruirItem);
  r24EditId = id;
  r24ActualizarBannerEdicion(r.nombre);
  r24CalcGE(); r24RenderLista();
  if(typeof updateR24Progress === 'function') updateR24Progress();
  window.scrollTo(0, 0);
}
let regSortCol = 'ts';
let regSortAsc = false;
let regCache = [];

function regCambiarTab(tab){
  regTabActual = tab;
  const tabs = {pacientes:'reg-tab-pac', r24:'reg-tab-r24', historial:'reg-tab-hist'};
  Object.keys(tabs).forEach(k=>{
    const el = document.getElementById(tabs[k]);
    if(el) el.className = (k===tab) ? 'btn' : 'btn btn-clear';
  });
  const det = document.getElementById('reg_detalle');
  const ed = document.getElementById('reg_editor');
  if(det) det.style.display='none';
  if(ed) ed.style.display='none';
  regSortCol = 'ts';
  regSortAsc = false;
  regRender();
}

function regSetSort(col){
  if(regSortCol === col) regSortAsc = !regSortAsc;
  else { regSortCol = col; regSortAsc = (col === 'nombre'); }
  regRender();
}

function regSortInd(col){
  if(regSortCol !== col) return '<span class="sort-ind">↕</span>';
  return '<span class="sort-ind">'+(regSortAsc?'▲':'▼')+'</span>';
}

function regNormName(n){
  return String(n||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}

async function regRender(){
  const cont = document.getElementById('reg_lista');
  const contador = document.getElementById('reg_contador');
  if(!cont) return;
  const q = (document.getElementById('reg_buscador').value || '').trim().toLowerCase();
  try{
    if(regTabActual === 'historial'){
      await regRenderHistorial(q, cont, contador);
      return;
    }
    const store = regTabActual === 'r24' ? 'recordatorios' : 'pacientes';
    let list = await idbGetAll(store);
    regCache = list;
    if(q){
      list = list.filter(r=>{
        const blob = [r.nombre,r.establecimiento,r.grupoTxt,r.integral,r.sexo,r.edadStr,(r.alimentos||[]).map(a=>a.n).join(' ')].join(' ').toLowerCase();
        return blob.includes(q);
      });
    }
    list = list.slice().sort((a,b)=>{
      let va = a[regSortCol], vb = b[regSortCol];
      if(regSortCol==='ts' || regSortCol==='peso' || regSortCol==='talla' || regSortCol==='geb' || regSortCol==='get'){
        va = parseFloat(va)||0; vb = parseFloat(vb)||0;
      } else {
        va = String(va==null?'':va).toLowerCase();
        vb = String(vb==null?'':vb).toLowerCase();
      }
      if(va<vb) return regSortAsc ? -1 : 1;
      if(va>vb) return regSortAsc ? 1 : -1;
      return 0;
    });
    contador.textContent = list.length + (regTabActual==='r24' ? ' recordatorio(s)' : ' evaluación(es)') + ' · clic en columna para ordenar';
    if(!list.length){
      cont.innerHTML = '<div style="padding:18px;color:var(--muted);font-size:14px">No hay registros'+(q?' con ese filtro':'')+'. Use «Guardar en el teléfono» tras calcular.</div>';
      return;
    }
    if(regTabActual==='r24'){
      cont.innerHTML = `<table class="reg-table"><thead><tr>
        <th onclick="regSetSort('nombre')">Nombre ${regSortInd('nombre')}</th>
        <th onclick="regSetSort('ts')">Fecha ${regSortInd('ts')}</th>
        <th onclick="regSetSort('peso')">Peso ${regSortInd('peso')}</th>
        <th onclick="regSetSort('get')">GET ${regSortInd('get')}</th>
        <th>Alimentos</th>
        <th>kcal</th>
        <th>Acciones</th>
      </tr></thead><tbody>
      ${list.map(r=>{
        const fecha = r.guardado ? new Date(r.guardado).toLocaleString('es-BO') : '';
        const nAlim = (r.alimentos||[]).length;
        const kcal = r.totales ? Math.round(r.totales.kcal) : '—';
        return `<tr>
          <td><b>${escHtml(r.nombre||'Sin nombre')}</b></td>
          <td>${escHtml(fecha)}</td>
          <td>${escHtml(String(r.peso||'—'))}</td>
          <td>${r.get?Math.round(r.get):'—'}</td>
          <td>${nAlim}</td>
          <td>${kcal}</td>
          <td class="reg-actions">
            <button type="button" class="btn" onclick="regVerR24(${r.id})">Ver</button>
            <button type="button" class="btn btn-clear" onclick="regContinuarR24(${r.id})">✏️ Editar / agregar alimentos</button>
            <button type="button" class="btn btn-clear" onclick="regBorrar('recordatorios',${r.id})">Borrar</button>
          </td>
        </tr>`;
      }).join('')}
      </tbody></table>`;
    } else {
      cont.innerHTML = `<table class="reg-table"><thead><tr>
        <th onclick="regSetSort('nombre')">Nombre ${regSortInd('nombre')}</th>
        <th onclick="regSetSort('ts')">Fecha ${regSortInd('ts')}</th>
        <th onclick="regSetSort('sexo')">Sexo ${regSortInd('sexo')}</th>
        <th onclick="regSetSort('edadStr')">Edad ${regSortInd('edadStr')}</th>
        <th onclick="regSetSort('grupoTxt')">Grupo ${regSortInd('grupoTxt')}</th>
        <th onclick="regSetSort('peso')">Peso ${regSortInd('peso')}</th>
        <th onclick="regSetSort('talla')">Talla ${regSortInd('talla')}</th>
        <th>Establecimiento</th>
        <th>Acciones</th>
      </tr></thead><tbody>
      ${list.map(r=>{
        const fecha = r.guardado ? new Date(r.guardado).toLocaleString('es-BO') : (r.fecha||'');
        return `<tr>
          <td><b>${escHtml(r.nombre||'Paciente')}</b></td>
          <td>${escHtml(fecha)}</td>
          <td>${escHtml(r.sexo==='M'?'M':r.sexo==='F'?'F':(r.sexo||''))}</td>
          <td>${escHtml(r.edadStr||'')}</td>
          <td>${escHtml(r.grupoTxt||'')}</td>
          <td>${escHtml(String(r.peso??''))}</td>
          <td>${escHtml(String(r.talla??''))}</td>
          <td>${escHtml(r.establecimiento||'')}</td>
          <td class="reg-actions">
            <button type="button" class="btn" onclick="regVerPac(${r.id})">Ver</button>
            <button type="button" class="btn btn-clear" onclick="regEditarPac(${r.id})">Editar</button>
            <button type="button" class="btn btn-clear" onclick="regBorrar('pacientes',${r.id})">Borrar</button>
            <button type="button" class="btn btn-clear" onclick="regVerHistorialNombre('${escHtml(r.nombre||'').replace(/'/g,'')}')">Historial</button>
          </td>
        </tr>`;
      }).join('')}
      </tbody></table>`;
    }
  }catch(e){
    contador.textContent = 'Error al leer el registro local';
    cont.innerHTML = '<div style="padding:18px;color:#c00">'+escHtml(e.message||String(e))+'</div>';
  }
}

async function regRenderHistorial(q, cont, contador){
  let list = await idbGetAll('pacientes');
  if(q) list = list.filter(r => (r.nombre||'').toLowerCase().includes(q) || (r.establecimiento||'').toLowerCase().includes(q));
  const groups = {};
  list.forEach(r=>{
    const k = regNormName(r.nombre) || ('id_'+r.id);
    if(!groups[k]) groups[k] = {nombre: r.nombre||'Sin nombre', rows:[]};
    groups[k].rows.push(r);
  });
  Object.values(groups).forEach(g=> g.rows.sort((a,b)=>(a.ts||0)-(b.ts||0)));
  const keys = Object.keys(groups).sort((a,b)=> groups[b].rows.length - groups[a].rows.length);
  contador.textContent = keys.length + ' paciente(s) con historial · ' + list.length + ' control(es)';
  if(!keys.length){
    cont.innerHTML = '<div style="padding:18px;color:var(--muted);font-size:14px">No hay evaluaciones para agrupar. Guarde controles del mismo paciente con el mismo nombre.</div>';
    return;
  }
  cont.innerHTML = keys.map(k=>{
    const g = groups[k];
    const rows = g.rows.map((r,i)=>{
      const fecha = r.guardado ? new Date(r.guardado).toLocaleDateString('es-BO') : (r.fecha||'');
      const prev = i>0 ? g.rows[i-1] : null;
      let deltaP = '';
      if(prev && !isNaN(parseFloat(r.peso)) && !isNaN(parseFloat(prev.peso))){
        const d = parseFloat(r.peso)-parseFloat(prev.peso);
        deltaP = ` <span class="reg-badge">${d>=0?'+':''}${d.toFixed(2)} kg vs anterior</span>`;
      }
      return `<div class="reg-hist-row">
        <span class="reg-badge">#${i+1}</span>
        <span><b>${escHtml(fecha)}</b></span>
        <span>Peso: <b>${escHtml(String(r.peso))}</b> kg${deltaP}</span>
        <span>Talla: ${escHtml(String(r.talla))} cm</span>
        <span>${escHtml(r.grupoTxt||'')}</span>
        <span style="flex:1;min-width:120px;color:var(--muted)">${escHtml((r.integral||'').slice(0,80))}${(r.integral||'').length>80?'…':''}</span>
        <button type="button" class="btn" style="width:auto;padding:4px 8px;font-size:11px;margin:0" onclick="regVerPac(${r.id})">Ver</button>
      </div>`;
    }).join('');
    return `<div style="padding:12px 14px;border-bottom:2px solid var(--line)">
      <div style="font-weight:700;font-size:15px;margin-bottom:6px">${escHtml(g.nombre)} <span class="reg-badge">${g.rows.length} control(es)</span></div>
      ${rows}
    </div>`;
  }).join('');
}

function regVerHistorialNombre(nombre){
  document.getElementById('reg_buscador').value = nombre || '';
  regCambiarTab('historial');
}

async function regBorrar(store, id){
  if(!confirm('¿Eliminar esta fila del registro local?')) return;
  try{
    await idbDelete(store, id);
    const det = document.getElementById('reg_detalle');
    const ed = document.getElementById('reg_editor');
    if(det) det.style.display='none';
    if(ed) ed.style.display='none';
    regRender();
  }catch(e){ alert('No se pudo eliminar: '+(e.message||e)); }
}

function idbPut(store, obj){
  return idbOpen().then(db=> new Promise((resolve, reject)=>{
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(obj);
    req.onsuccess = ()=> resolve(req.result);
    req.onerror = ()=> reject(req.error);
  }));
}

async function regVerPac(id){
  const r = await idbGet('pacientes', id);
  const box = document.getElementById('reg_detalle');
  if(!r){ box.style.display='none'; return; }
  box.style.display='block';
  document.getElementById('reg_editor').style.display='none';
  box.innerHTML = `<h2>Evaluación — ${escHtml(r.nombre||'')}</h2>
    <div style="font-size:13px;line-height:1.55">
      <b>Fecha:</b> ${escHtml(r.fecha||r.guardado||'')}<br>
      <b>Sexo / Edad / Grupo:</b> ${escHtml(r.sexo==='M'?'Masculino':r.sexo==='F'?'Femenino':'')} · ${escHtml(r.edadStr||'')} · ${escHtml(r.grupoTxt||'')}<br>
      <b>Comorbilidad:</b> ${escHtml(r.comorbilidadTxt||'')}<br>
      <b>Peso / Talla / PC:</b> ${escHtml(String(r.peso))} kg · ${escHtml(String(r.talla))} cm · PC ${escHtml(String(r.pc))}<br>
      <b>Responsable:</b> ${escHtml(r.responsable||'—')} · <b>Establecimiento:</b> ${escHtml(r.establecimiento||'—')}<br>
      <b>Agua (automática por grupo etario):</b> ${escHtml(r.agua||'—')}<br>
      <b>Próximo control:</b> ${escHtml(r.control||'—')}<br>
      <hr style="border:none;border-top:1px solid var(--line);margin:10px 0">
      <b>Diagnóstico integral:</b><br>${escHtml(r.integral||'—')}<br>
      <b>Plan de manejo:</b><br>${escHtml(r.rec||'—')}
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
      <button type="button" class="btn" style="width:auto;padding:8px 14px;margin:0" onclick="regEditarPac(${r.id})">Editar</button>
      <button type="button" class="btn btn-clear" style="width:auto;padding:8px 14px;margin:0" onclick="regVerHistorialNombre('${escHtml(r.nombre||'').replace(/'/g,'')}')">Ver historial</button>
      <button type="button" class="btn btn-clear" style="width:auto;padding:8px 14px;margin:0" onclick="document.getElementById('reg_detalle').style.display='none'">Cerrar</button>
    </div>`;
  box.scrollIntoView({behavior:'smooth', block:'nearest'});
}

async function regVerR24(id){
  const r = await idbGet('recordatorios', id);
  const box = document.getElementById('reg_detalle');
  if(!r){ box.style.display='none'; return; }
  box.style.display='block';
  document.getElementById('reg_editor').style.display='none';
  const alims = (r.alimentos||[]).map((a,i)=>`${i+1}. ${escHtml(a.n)} — ${Math.round(a.cant)} g · ${Math.round(a.kcal)} kcal`).join('<br>');
  const t = r.totales || {};
  box.innerHTML = `<h2>Recordatorio 24h — ${escHtml(r.nombre||'')}</h2>
    <div style="font-size:13px;line-height:1.55">
      <b>Guardado:</b> ${escHtml(r.guardado||'')}<br>
      <b>Datos:</b> Peso ${escHtml(r.peso)} kg · Talla ${escHtml(r.talla)} cm · Edad ${escHtml(r.edad)} · Sexo ${r.sexo==='M'?'M':'F'}${r.embarazada?' · Embarazada'+(r.trimestre?' ('+r.trimestre+'.º trim.)':''):''}${r.lactancia?' · En lactancia':''}${r.kcalAdicional?' · +'+r.kcalAdicional+' kcal añadidas al GET':''}<br>
      <b>GEB / GET:</b> ${r.geb?Math.round(r.geb):'—'} / ${r.get?Math.round(r.get):'—'} kcal<br>
      <hr style="border:none;border-top:1px solid var(--line);margin:10px 0">
      <b>Alimentos:</b><br>${alims||'—'}<br>
      <hr style="border:none;border-top:1px solid var(--line);margin:10px 0">
      <b>Totales:</b> ${t.kcal?Math.round(t.kcal):'—'} kcal · Prot ${t.prot!=null?Number(t.prot).toFixed(1):'—'} g · CH ${t.ch!=null?Number(t.ch).toFixed(1):'—'} g · Grasa ${t.fat!=null?Number(t.fat).toFixed(1):'—'} g · Fibra ${t.fib!=null?Number(t.fib).toFixed(1):'—'} g
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
      <button type="button" class="btn" style="width:auto;padding:8px 14px;margin:0" onclick="regContinuarR24(${r.id})">✏️ Editar / agregar alimentos</button>
      <button type="button" class="btn btn-clear" style="width:auto;padding:8px 14px;margin:0" onclick="document.getElementById('reg_detalle').style.display='none'">Cerrar</button>
    </div>`;
  box.scrollIntoView({behavior:'smooth', block:'nearest'});
}

async function regEditarPac(id){
  const r = await idbGet('pacientes', id);
  const box = document.getElementById('reg_editor');
  if(!r){ box.style.display='none'; return; }
  document.getElementById('reg_detalle').style.display='none';
  box.style.display='block';
  box.innerHTML = `<h2>Editar evaluación #${r.id}</h2>
    <div class="reg-edit-grid">
      <div><label>Nombre</label><input type="text" id="re_nombre" value="${escHtml(r.nombre||'')}"></div>
      <div><label>Fecha (texto)</label><input type="text" id="re_fecha" value="${escHtml(r.fecha||'')}"></div>
      <div><label>Peso (kg)</label><input type="text" id="re_peso" inputmode="decimal" value="${escHtml(String(r.peso??''))}"></div>
      <div><label>Talla (cm)</label><input type="text" id="re_talla" inputmode="decimal" value="${escHtml(String(r.talla??''))}"></div>
      <div><label>Responsable</label><input type="text" id="re_resp" value="${escHtml(r.responsable||'')}"></div>
      <div><label>Establecimiento</label><input type="text" id="re_est" value="${escHtml(r.establecimiento||'')}"></div>
    </div>
    <label style="margin-top:8px">Notas / diagnóstico (texto)</label>
    <textarea id="re_integral" rows="3" style="width:100%;font-family:inherit;font-size:13px;padding:8px;border-radius:8px;border:1.5px solid var(--line)">${escHtml(r.integral||'')}</textarea>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
      <button type="button" class="btn" style="width:auto;padding:8px 14px;margin:0" onclick="regGuardarEdicionPac(${r.id})">Guardar cambios</button>
      <button type="button" class="btn btn-clear" style="width:auto;padding:8px 14px;margin:0" onclick="document.getElementById('reg_editor').style.display='none'">Cancelar</button>
    </div>`;
  box.scrollIntoView({behavior:'smooth', block:'nearest'});
}

async function regGuardarEdicionPac(id){
  const r = await idbGet('pacientes', id);
  if(!r) return;
  r.nombre = document.getElementById('re_nombre').value.trim() || r.nombre;
  r.fecha = document.getElementById('re_fecha').value.trim();
  r.peso = document.getElementById('re_peso').value.trim();
  r.talla = document.getElementById('re_talla').value.trim();
  r.responsable = document.getElementById('re_resp').value.trim();
  r.establecimiento = document.getElementById('re_est').value.trim();
  r.integral = document.getElementById('re_integral').value.trim();
  r.guardado = new Date().toISOString();
  try{
    await idbPut('pacientes', r);
    document.getElementById('reg_editor').style.display='none';
    regRender();
    alert('Cambios guardados.');
  }catch(e){ alert('Error al guardar: '+(e.message||e)); }
}

async function regEditarR24(id){
  const r = await idbGet('recordatorios', id);
  const box = document.getElementById('reg_editor');
  if(!r){ box.style.display='none'; return; }
  document.getElementById('reg_detalle').style.display='none';
  box.style.display='block';
  box.innerHTML = `<h2>Editar recordatorio 24h #${r.id}</h2>
    <div class="reg-edit-grid">
      <div><label>Nombre</label><input type="text" id="re24_nombre" value="${escHtml(r.nombre||'')}"></div>
      <div><label>Peso (kg)</label><input type="text" id="re24_peso" inputmode="decimal" value="${escHtml(String(r.peso??''))}"></div>
      <div><label>Talla (cm)</label><input type="text" id="re24_talla" inputmode="decimal" value="${escHtml(String(r.talla??''))}"></div>
      <div><label>Edad</label><input type="text" id="re24_edad" inputmode="numeric" value="${escHtml(String(r.edad??''))}"></div>
    </div>
    <p style="font-size:12px;color:var(--muted);margin:8px 0 0">La lista de alimentos no se edita aquí (use un nuevo recordatorio si necesita corregirla).</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
      <button type="button" class="btn" style="width:auto;padding:8px 14px;margin:0" onclick="regGuardarEdicionR24(${r.id})">Guardar cambios</button>
      <button type="button" class="btn btn-clear" style="width:auto;padding:8px 14px;margin:0" onclick="document.getElementById('reg_editor').style.display='none'">Cancelar</button>
    </div>`;
  box.scrollIntoView({behavior:'smooth', block:'nearest'});
}

async function regGuardarEdicionR24(id){
  const r = await idbGet('recordatorios', id);
  if(!r) return;
  r.nombre = document.getElementById('re24_nombre').value.trim() || r.nombre;
  r.peso = document.getElementById('re24_peso').value.trim();
  r.talla = document.getElementById('re24_talla').value.trim();
  r.edad = document.getElementById('re24_edad').value.trim();
  r.guardado = new Date().toISOString();
  try{
    await idbPut('recordatorios', r);
    document.getElementById('reg_editor').style.display='none';
    regRender();
    alert('Cambios guardados.');
  }catch(e){ alert('Error al guardar: '+(e.message||e)); }
}

// Precargar IDB al iniciar (opcional, silencioso)
try { idbOpen().catch(()=>{}); } catch(e){}

