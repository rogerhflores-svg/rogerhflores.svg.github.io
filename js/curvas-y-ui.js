/* NutriAndes — curvas de crecimiento, modo noche, fecha de evaluación, edad y manejo Síndrome de Down */
/* ===== CURVAS DE CRECIMIENTO OMS: Z-SCORE → PERCENTIL ===== */
function normSDist(z){
  const b1=0.319381530,b2=-0.356563782,b3=1.781477937,b4=-1.821255978,b5=1.330274429,p=0.2316419,c=0.39894228;
  if(z>=0){ const t=1/(1+p*z); return 1-c*Math.exp(-z*z/2)*t*(t*(t*(t*(t*b5+b4)+b3)+b2)+b1); }
  const t=1/(1-p*z); return c*Math.exp(-z*z/2)*t*(t*(t*(t*(t*b5+b4)+b3)+b2)+b1);
}
function zToPercentil(z){
  if(z===null||z===undefined||isNaN(z)) return null;
  return Math.max(0.1, Math.min(99.9, normSDist(z)*100));
}
function gaugeZ(nombre, z){
  if(z===null||z===undefined||isNaN(z)) return '';
  const pct = zToPercentil(z);
  const pos = Math.max(0,Math.min(100, ((z+4)/8)*100));
  return `<div style="margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:3px"><span><b>${nombre}</b></span><span>Z: ${z.toFixed(2)} · Percentil ${pct.toFixed(1)}</span></div>
    <div style="position:relative;height:14px;border-radius:7px;background:linear-gradient(to right,#e08a8a 0%,#e08a8a 12.5%,#f0cd82 12.5%,#f0cd82 25%,#a3c98a 25%,#a3c98a 75%,#f0cd82 75%,#f0cd82 87.5%,#e08a8a 87.5%,#e08a8a 100%)">
      <div style="position:absolute;left:${pos}%;top:-3px;width:3px;height:20px;background:#1c2b40;border-radius:2px;transform:translateX(-50%)"></div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:9px;color:#9a8a6a;margin-top:2px"><span>-4DE</span><span>-2DE</span><span>Media</span><span>+2DE</span><span>+4DE</span></div>
  </div>`;
}
function gaugeGestacional(imc, semanas){
  if(isNaN(imc)||!semanas) return '';
  const u = imcGestacionalUmbrales(semanas);
  const lo = u.bajo-3, hi = u.sobre+3;
  const pos = Math.max(0,Math.min(100, ((imc-lo)/(hi-lo))*100));
  const posBajo = ((u.bajo-lo)/(hi-lo))*100;
  const posNormal = ((u.normal-lo)/(hi-lo))*100;
  const posSobre = ((u.sobre-lo)/(hi-lo))*100;
  return `<div style="margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:3px"><span><b>IMC gestacional</b></span><span>IMC: ${imc.toFixed(1)} · Semana ${semanas}</span></div>
    <div style="position:relative;height:14px;border-radius:7px;background:linear-gradient(to right,#e08a8a 0%,#e08a8a ${posBajo}%,#a3c98a ${posBajo}%,#a3c98a ${posNormal}%,#f0cd82 ${posNormal}%,#f0cd82 ${posSobre}%,#e08a8a ${posSobre}%,#e08a8a 100%)">
      <div style="position:absolute;left:${pos}%;top:-3px;width:3px;height:20px;background:#1c2b40;border-radius:2px;transform:translateX(-50%)"></div>
    </div>
    <div style="font-size:9px;color:#9a8a6a;margin-top:2px">Posición relativa según umbrales por semana (no es un percentil OMS estándar).</div>
  </div>`;
}
const PORCIONES = [
  {min:2,max:3,label:'2–3 años',cereales:4,verduras:2,frutas:2,lacteos:2,proteinas:2,grasas:2,nutrientes:'Proteínas, calcio, hierro, zinc, vitamina A, vitamina D'},
  {min:4,max:5,label:'4–5 años',cereales:5,verduras:2,frutas:2,lacteos:2,proteinas:2,grasas:2,nutrientes:'Proteínas, calcio, hierro, zinc, vitamina A'},
  {min:6,max:7,label:'6–7 años',cereales:5,verduras:2,frutas:2,lacteos:2,proteinas:2,grasas:2,nutrientes:'Calcio, hierro, zinc, vitaminas A, C y D'},
  {min:8,max:10,label:'8–10 años',cereales:6,verduras:2,frutas:2,lacteos:2,proteinas:2,grasas:3,nutrientes:'Calcio, hierro, zinc, vitaminas A, C y D'},
  {min:11,max:13,label:'11–13 años',cereales:7,verduras:3,frutas:3,lacteos:3,proteinas:3,grasas:3,nutrientes:'Calcio, hierro, proteínas, zinc, ácido fólico'},
  {min:14,max:18,label:'14–18 años',cereales:8,verduras:3,frutas:3,lacteos:3,proteinas:3,grasas:3,nutrientes:'Calcio, hierro, proteínas, vitamina D, ácido fólico'},
  {min:19,max:30,label:'19–30 años',cereales:6,verduras:3,frutas:3,lacteos:2,proteinas:2,grasas:3,nutrientes:'Fibra, proteínas, calcio, hierro (mujeres), vitaminas B y C'},
  {min:31,max:59,label:'31–59 años',cereales:5,verduras:3,frutas:3,lacteos:2,proteinas:2,grasas:2,nutrientes:'Fibra, proteínas, calcio, antioxidantes, potasio'},
  {min:60,max:69,label:'60–69 años',cereales:5,verduras:3,frutas:3,lacteos:3,proteinas:2,grasas:2,nutrientes:'Proteínas, calcio, vitamina D, vitamina B12, fibra'},
  {min:70,max:200,label:'≥70 años',cereales:4,verduras:3,frutas:3,lacteos:3,proteinas:2,grasas:2,nutrientes:'Proteínas, calcio, vitamina D, vitamina B12, zinc'}
];
function getPorciones(eaAnios){
  return PORCIONES.find(p=>eaAnios>=p.min && eaAnios<=p.max) || null;
}
const ALIMENTACION_COMPLEMENTARIA = [
  {min:6,max:6,label:'6 meses',frecuencia:'2–3 comidas/día',cantidad:'2–3 cucharadas, aumentando gradualmente hasta ½ taza',textura:'Puré espeso, papilla suave',alimentos:'Cereales, tubérculos, verduras, frutas, leguminosas bien cocidas, huevo, carnes',nutriente:'Hierro y zinc'},
  {min:7,max:8,label:'7–8 meses',frecuencia:'3–4 comidas/día',cantidad:'½ taza aprox.',textura:'Puré espeso, triturado y alimentos blandos',alimentos:'Cereales, papa, quinua, avena, verduras, frutas, huevo, pollo, pescado, carne, leguminosas',nutriente:'Hierro, zinc y proteínas'},
  {min:9,max:11,label:'9–11 meses',frecuencia:'3–4 comidas + 1–2 refrigerios según necesidad',cantidad:'½–¾ taza aprox.',textura:'Picado fino, triturado y alimentos blandos para comer con las manos',alimentos:'Mayor variedad de alimentos familiares saludables; carnes, huevo, legumbres, cereales, frutas y verduras',nutriente:'Hierro, energía y proteínas'},
  {min:12,max:23,label:'12–23 meses',frecuencia:'3–4 comidas + 1–2 refrigerios',cantidad:'¾–1 taza aprox.',textura:'Alimentos familiares, cortados en trozos pequeños',alimentos:'Dieta familiar variada y equilibrada',nutriente:'Hierro, calcio, zinc y proteínas'},
  {min:24,max:47,label:'2–3 años',frecuencia:'3 comidas principales + 2 refrigerios/día',cantidad:'1 taza aprox. por comida principal',textura:'Alimentos familiares en trozos pequeños, fáciles de masticar',alimentos:'Dieta familiar variada: cereales, tubérculos, verduras, frutas, carnes, huevo, leguminosas, lácteos',nutriente:'Hierro, calcio, zinc y vitamina A'},
  {min:48,max:59,label:'4–5 años',frecuencia:'3 comidas principales + 2 refrigerios/día',cantidad:'1–1½ tazas aprox. por comida principal',textura:'Alimentos familiares en trozos, textura normal',alimentos:'Dieta familiar variada y equilibrada, incluyendo todos los grupos de alimentos',nutriente:'Calcio, hierro, zinc, fibra y vitaminas A y D'}
];
function getAlimentacionComplementaria(em){
  return ALIMENTACION_COMPLEMENTARIA.find(a=>em>=a.min && em<=a.max) || null;
}
const TRIMESTRES = {
  1:{label:'Primer trimestre',ajuste:'Igual que mujer adulta',nutrientes:'Ácido fólico, hierro, yodo'},
  2:{label:'Segundo trimestre',ajuste:'+1 cereal, +1 proteína, +1 lácteo',nutrientes:'Hierro, calcio, proteínas, DHA'},
  3:{label:'Tercer trimestre',ajuste:'+1 cereal, +1 proteína, +1 lácteo',nutrientes:'Hierro, calcio, DHA, vitamina D'}
};
const LACTANCIA_ETAPAS = {
  '0-6m':{label:'0–6 meses posparto',ajuste:'+2 cereales, +1 proteína, +1 lácteo',nutrientes:'Proteínas, calcio, yodo, DHA, vitamina A'},
  '>6m':{label:'Más de 6 meses posparto',ajuste:'+1 cereal, +1 proteína',nutrientes:'Calcio, proteínas, vitamina B12'}
};
function getTrimestre(semanas){
  if(semanas<=13) return 1;
  if(semanas<=27) return 2;
  return 3;
}
function toggleEstadoGestacion(){
  const e = document.getElementById('estado_gestacion').value;
  document.getElementById('campo-semanas-input').style.display = e==='embarazada' ? 'block' : 'none';
  document.getElementById('campo-etapa-lactancia').style.display = e==='lactancia' ? 'block' : 'none';
}
function calcSemanasPorFPP(){
  const fpp = document.getElementById('fpp').value;
  if(!fpp) return;
  const hoy = getFechaEvaluacion();
  const fppDate = new Date(fpp);
  const diffDias = Math.round((fppDate - hoy)/86400000);
  const semanasRestantes = diffDias/7;
  let semanas = Math.round(40 - semanasRestantes);
  if(semanas<4) semanas=4;
  if(semanas>42) semanas=42;
  document.getElementById('semanas').value = semanas;
}
function updateTallasEstimadas(){
  const sexo = document.getElementById('sexo').value;
  const det = calcEdadDetalle(document.getElementById('fecnac').value);
  const edadA = det ? det.años : 0;
  const ar = pF(document.getElementById('alt_rodilla').value);
  const tc = tallaChumlea(sexo, ar, edadA);
  document.getElementById('talla_chumlea').value = tc ? tc.toFixed(1)+' cm' : '';
  const me = pF(document.getElementById('media_envergadura').value);
  document.getElementById('talla_envergadura').value = me ? (me*2).toFixed(1)+' cm' : '';
  updatePesoIdeal();
}
function pesoIdealCalc(){
  const g = document.getElementById('grupo').value;
  const sexo = document.getElementById('sexo').value;
  const talla = pF(document.getElementById('talla').value);
  const peso = pF(document.getElementById('peso').value);
  const muneca = pF(document.getElementById('muneca').value);
  const det = calcEdadDetalle(document.getElementById('fecnac').value);
  const R = (valor, metodo, detalle, nota) => ({valor, metodo, detalle: detalle||'', nota: nota||''});
  if(!g) return R(null,'Peso ideal','Seleccione el grupo etario.');
  if(g==='embarazada') return R(null,'Peso ideal','','No aplica en embarazo: se evalúa el IMC y la ganancia de peso según la semana gestacional.');
  if(!sexo || !talla) return R(null,'Peso ideal','Ingrese sexo y talla para calcularlo.');
  if(g==='adulto_joven' || g==='am'){
    const r = pesoIdealHamwiCompleto(talla, muneca, sexo); if(!r) return R(null,'Peso ideal (Hamwi)');
    let d = `Contextura: <b>${r.contextura}</b>`;
    if(r.r !== null) d += ` (r = ${r.r})`;
    d += ` · Base (media): ${r.ibwBase.toFixed(1)} kg`;
    if(r.contextura==='pequeña') d += ' · Ajuste −10%'; else if(r.contextura==='grande') d += ' · Ajuste +10%';
    else if(!muneca) d += ' · <span style="opacity:.8">(ingrese muñeca para ajustar contextura)</span>';
    return R(r.ibwAjustado, 'Peso ideal (Hamwi)', d);
  }
  if(!det) return R(null,'Peso ideal','Ingrese la fecha de nacimiento para calcularlo.');
  const em = det.totalMeses;
  if(g==='0-6m' || g==='6-24m' || g==='2-5a'){
    const alt = em >= 24, ref = wflRef(sexo, talla, alt);
    if(!ref) return R(null,'Peso ideal (OMS)', `Talla fuera del rango OMS de peso para la ${alt?'talla (65–120 cm)':'longitud (45–110 cm)'}.`);
    return R(ref.m, `Peso ideal (OMS peso/${alt?'talla':'longitud'})`,
      `Mediana OMS (Z = 0) para ${talla} cm de ${alt?'talla de pie':'longitud'}`);
  }
  const imc = getRefIMC512(em/12).m;
  return R(imc*Math.pow(talla/100,2), 'Peso ideal (IMC mediana OMS)', `IMC mediana OMS para ${det.años} años: ${imc.toFixed(1)} kg/m² × talla²`);
}
function updatePesoIdeal(){
  const piInput = document.getElementById('peso_ideal'), detalle = document.getElementById('pi-detalle'), lab = document.getElementById('pi-label');
  if(!piInput) return;
  const r = pesoIdealCalc(), peso = pF(document.getElementById('peso').value);
  window.PI_INFO = r;
  if(lab) lab.textContent = r.metodo;
  piInput.placeholder = r.nota ? 'No aplica' : 'Se calcula con sexo, talla y fecha de nacimiento';
  if(r.valor===null){ piInput.value=''; detalle.innerHTML = r.nota || r.detalle; return; }
  piInput.value = r.valor.toFixed(1) + ' kg';
  let txt = r.detalle;
  if(peso > 0){
    const d = peso - r.valor;
    txt += ` · Peso actual: <b>${Math.round(peso/r.valor*100)} %</b> del ideal (${d>=0?'+':'−'}${Math.abs(d).toFixed(1)} kg)`;
  }
  detalle.innerHTML = txt;
}
(function(){
  const ini = function(){
    ['talla','fecnac','peso','muneca'].forEach(function(id){ const e = document.getElementById(id); if(e) e.addEventListener('input', updatePesoIdeal); });
    (function(){ const e = document.getElementById('fecnac'); if(e) e.addEventListener('input', toggleAdolescente); })();
    ['sexo','grupo'].forEach(function(id){ const e = document.getElementById(id); if(e) e.addEventListener('change', updatePesoIdeal); });
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ini); else ini();
})();
function toggleCamposGrupo(){
  const g = document.getElementById('grupo').value;
  document.getElementById('campo-semanas').style.display = g==='embarazada' ? 'block' : 'none';
  document.getElementById('campo-pc').style.display = (g==='0-6m'||g==='6-24m') ? 'block' : 'none';
  const esAdulto = (g==='adulto_joven'||g==='am');
  document.getElementById('campo-pi').style.display = g ? 'block' : 'none';
  document.getElementById('campo-muneca').style.display = esAdulto ? 'block' : 'none';
  document.getElementById('campo-alt-rodilla').style.display = esAdulto ? 'grid' : 'none';
  document.getElementById('campo-envergadura').style.display = esAdulto ? 'grid' : 'none';
  document.getElementById('campo-prematuro-check').style.display = (g==='0-6m'||g==='6-24m'||g==='2-5a') ? 'block' : 'none';
  toggleAdolescente();
  updatePesoIdeal();
  if(typeof updateFormProgress==='function') updateFormProgress();
}
/* ===== MODO NOCHE / DÍA ===== */
function toggleModoNoche(){
  document.body.classList.toggle('modo-noche');
  const btn = document.getElementById('btn-modo');
  const esNoche = document.body.classList.contains('modo-noche');
  btn.textContent = esNoche ? '☀️ Modo día' : '🌙 Modo noche';
}


let antroSusSeleccion = []; // {tipo:'prest'|'comp'|'liname', id, titulo, detalle, raw}

function antroSusKey(item){
  return item.tipo + '::' + item.id;
}

function esSusSeleccionado(tipo, id){
  return antroSusSeleccion.some(x => x.tipo===tipo && x.id===id);
}

function anadirSusSeleccion(tipo, id, titulo, detalle){
  if(esSusSeleccionado(tipo, id)) return;
  antroSusSeleccion.push({ tipo, id, titulo, detalle: detalle||'' });
  renderSusSeleccionAntro();
  // refrescar lista de búsqueda para marcar "Añadido"
  buscarPrestacionAntroSUS(true);
}

function quitarSusSeleccion(tipo, id){
  antroSusSeleccion = antroSusSeleccion.filter(x => !(x.tipo===tipo && x.id===id));
  renderSusSeleccionAntro();
  buscarPrestacionAntroSUS(true);
}

function limpiarSusSeleccionAntro(){
  antroSusSeleccion = [];
  renderSusSeleccionAntro();
  buscarPrestacionAntroSUS(true);
}

function renderSusSeleccionAntro(){
  const box = document.getElementById('antro_sus_seleccion_box');
  const cont = document.getElementById('antro_sus_seleccion');
  const nEl = document.getElementById('antro_sus_sel_n');
  if(!cont) return;
  if(nEl) nEl.textContent = String(antroSusSeleccion.length);
  if(box) box.style.display = antroSusSeleccion.length ? 'block' : 'none';
  cont.innerHTML = antroSusSeleccion.map(x => {
    const badge = x.tipo==='liname' ? 'LINAME' : (x.tipo==='comp' ? 'Comp.' : 'SUS');
    return `<span style="display:inline-flex;align-items:center;gap:4px;background:var(--surface);border:1.5px solid var(--line);border-radius:999px;padding:3px 8px 3px 10px;font-size:12px;max-width:100%">
      <span style="background:#E6F1FB;color:#0C447C;border-radius:4px;padding:0 5px;font-size:10px;font-weight:700">${badge}</span>
      <span style="font-weight:700">${x.id}</span>
      <span style="color:var(--ink-2);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${x.titulo}</span>
      <button type="button" title="Quitar" onclick="quitarSusSeleccion('${x.tipo}','${String(x.id).replace(/'/g,"\\'")}')" style="border:none;background:#FCEBEB;color:#791F1F;border-radius:50%;width:20px;height:20px;line-height:18px;padding:0;cursor:pointer;font-size:12px">×</button>
    </span>`;
  }).join('');
}

function renderSusSeleccionEnResultados(){
  const bloque = document.getElementById('bloque-sus-seleccion');
  const cont = document.getElementById('r-sus-seleccion');
  if(!bloque || !cont) return;
  if(!antroSusSeleccion.length){
    bloque.style.display = 'none';
    cont.innerHTML = '';
    return;
  }
  bloque.style.display = 'block';
  cont.innerHTML = `<div class="warn-inline" style="margin-bottom:8px">Prestaciones e insumos marcados en la evaluación (${antroSusSeleccion.length}):</div>` +
    antroSusSeleccion.map(x => {
      const badge = x.tipo==='liname' ? 'LINAME' : (x.tipo==='comp' ? 'Complementaria' : 'Prestación SUS');
      return `<div class="esq-item" style="align-items:flex-start">
        <span class="esq-icon">✓</span>
        <span><b>${x.id}</b> — ${x.titulo}${x.detalle ? `<div style="font-size:12px;color:var(--muted);margin-top:2px">${x.detalle}</div>` : ''}${x.tipo==='liname' ? dosisKgHTML((LINAME_CATALOGO.find(L=>L.liname===x.id)||{}).m||x.titulo) : ''}<div style="font-size:11px;color:var(--gold);margin-top:2px">${badge}</div></span>
      </div>`;
    }).join('');
}

function buscarPrestacionAntroSUS(keepOpen){
  clearTimeout(window._antroSusT);
  const run = ()=>{
    const raw = (document.getElementById('antro_sus_buscador')||{}).value || '';
    const cont = document.getElementById('antro_sus_resultados');
    const contador = document.getElementById('antro_sus_contador');
    if(!cont) return;
    const term = (typeof quitarTildesLey475 === 'function' ? quitarTildesLey475(raw) : raw).trim().toLowerCase();
    if(term.length < 2){
      cont.innerHTML = '';
      if(contador) contador.textContent = antroSusSeleccion.length
        ? `${antroSusSeleccion.length} seleccionada(s). Busque para añadir más.`
        : 'Escriba al menos 2 caracteres. Use + Añadir en cada ítem.';
      return;
    }
    const prest = (typeof LEY475_PRESTACIONES !== 'undefined' ? LEY475_PRESTACIONES : []).filter(p => {
      const blob = [p.c, p.d, p.cap, p.sec, p.o, p.n].map(x => (x||'')+'').join(' ');
      const t = typeof quitarTildesLey475 === 'function' ? quitarTildesLey475(blob) : blob;
      return t.includes(term);
    });
    const comp = (typeof LEY475_COMPLEMENTARIAS !== 'undefined' ? LEY475_COMPLEMENTARIAS : []).filter(c => {
      const blob = [c.c, c.d, c.cap||'', c.tipo||''].map(x => (x||'')+'').join(' ');
      const t = typeof quitarTildesLey475 === 'function' ? quitarTildesLey475(blob) : blob;
      return t.includes(term);
    });
    let lin = [];
    if(typeof LINAME_CATALOGO !== 'undefined'){
      lin = LINAME_CATALOGO.filter(L => {
        const blob = [L.liname, L.m, L.atc, L.f, L.conc, L.clase, L.cap].map(x => (x||'')+'').join(' ');
        const t = typeof quitarTildesLey475 === 'function' ? quitarTildesLey475(blob) : blob;
        return t.includes(term);
      }).slice(0, 20);
    }
    const total = prest.length + comp.length + lin.length;
    if(contador){
      contador.textContent = total
        ? `${total} hallazgo(s). Pulse + Añadir · ${antroSusSeleccion.length} en selección`
        : 'Sin resultados. Pruebe otro término.';
    }

    const btnAdd = (tipo, id, titulo, detalle, ya) => {
      if(ya) return `<button type="button" disabled style="width:auto;padding:2px 8px;font-size:11px;margin:0;border-radius:6px;border:1.5px solid var(--line);background:var(--soft);color:var(--muted)">Añadido</button>`;
      const t = String(titulo||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
      const det = String(detalle||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
      const i = String(id||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
      return `<button type="button" class="btn" style="width:auto;padding:2px 8px;font-size:11px;margin:0;background:var(--gold);color:#1a1a18" onclick="anadirSusSeleccion('${tipo}','${i}','${t}','${det}')">+ Añadir</button>`;
    };

    const fila = (tipo, id, titulo, extra) => {
      const ya = esSusSeleccionado(tipo, id);
      return `<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;padding:6px 8px;border-bottom:1px solid var(--line);background:${ya?'rgba(26,143,106,.08)':'transparent'}">
        <div style="min-width:0;flex:1">
          <div style="font-size:13px;line-height:1.35"><b>${id}</b> — ${titulo}</div>
          ${extra ? `<div style="font-size:11.5px;color:var(--muted);margin-top:2px">${extra}</div>` : ''}
        </div>
        ${btnAdd(tipo, id, titulo, extra||'', ya)}
      </div>`;
    };

    let htmlOut = '';
    if(prest.length){
      htmlOut += `<div style="font-size:11px;font-weight:700;color:var(--gold);padding:4px 8px;background:var(--soft)">Prestaciones SUS</div>`;
      prest.slice(0, 30).forEach(p => {
        const extra = [p.cap, p.n ? 'Nivel '+p.n : '', p.tarifa].filter(Boolean).join(' · ');
        htmlOut += fila('prest', p.c, p.d, extra);
      });
    }
    if(comp.length){
      htmlOut += `<div style="font-size:11px;font-weight:700;color:var(--gold);padding:4px 8px;background:var(--soft)">Complementarias</div>`;
      comp.slice(0, 15).forEach(c => {
        htmlOut += fila('comp', c.c, c.d, c.cap||c.tipo||'');
      });
    }
    if(lin.length){
      htmlOut += `<div style="font-size:11px;font-weight:700;color:var(--gold);padding:4px 8px;background:var(--soft)">LINAME</div>`;
      lin.forEach(L => {
        htmlOut += fila('liname', L.liname, L.m, [L.atc, L.f, L.conc].filter(Boolean).join(' · '));
      });
    }
    cont.innerHTML = htmlOut;
  };
  if(keepOpen) run();
  else window._antroSusT = setTimeout(run, 150);
}



function toggleComorbilidad(){
  const c = document.getElementById('comorbilidad').value;
  document.getElementById('campo-cintura').style.display = c==='sindrome_down' ? 'block' : 'none';
  document.getElementById('campo-hitos-down').style.display = c==='sindrome_down' ? 'block' : 'none';
  if(c==='sindrome_down' && !document.getElementById('hitos-checklist').dataset.render){
    renderHitosChecklist();
    document.getElementById('hitos-checklist').dataset.render = '1';
  }
}
function renderHitosChecklist(){
  const cont = document.getElementById('hitos-checklist');
  let html = '';
  Object.keys(HITOS_SD).forEach(area=>{
    html += `<details style="margin-bottom:6px"><summary style="font-size:12px;font-weight:700;color:#3d4d63;cursor:pointer">${NOMBRES_AREA[area]} (${HITOS_SD[area].length} hitos)</summary><div style="margin-top:4px">`;
    HITOS_SD[area].forEach(h=>{
      html += `<div class="chk-row" style="border-bottom:none;padding:2px 0"><input type="checkbox" id="hito_${h.id}"><span style="font-size:11.5px">${h.nombre} <span class="opcional-tag">(esperado ${h.edadMin}-${h.edadMax}m)</span></span></div>`;
    });
    html += `</div></details>`;
  });
  cont.innerHTML = html;
}
/* ===== FECHA DE EVALUACIÓN ===== */


/* Fechas dd/mm/aaaa — entrada guiada sin errores */
function soloDigitosFecha(str){
  return String(str||'').replace(/\D/g,'');
}
/** Formatea mientras se escribe: 09032020 → 09/03/2020 (máx 8 dígitos) */
function mascaraFechaDMY(str){
  let d = soloDigitosFecha(str).slice(0, 8);
  if(d.length <= 2) return d;
  if(d.length <= 4) return d.slice(0,2) + '/' + d.slice(2);
  return d.slice(0,2) + '/' + d.slice(2,4) + '/' + d.slice(4);
}
function parseFechaDMY(str){
  if(!str) return null;
  const s = String(str).trim();
  // 8 dígitos compactos ddmmyyyy
  const dig = soloDigitosFecha(s);
  let d, mo, y;
  if(/^\d{8}$/.test(dig)){
    d = parseInt(dig.slice(0,2),10);
    mo = parseInt(dig.slice(2,4),10)-1;
    y = parseInt(dig.slice(4,8),10);
  } else {
    let m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if(m){
      d = parseInt(m[1],10); mo = parseInt(m[2],10)-1; y = parseInt(m[3],10);
    } else {
      m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if(!m) return null;
      y = parseInt(m[1],10); mo = parseInt(m[2],10)-1; d = parseInt(m[3],10);
    }
  }
  if(isNaN(d)||isNaN(mo)||isNaN(y)) return null;
  if(mo<0||mo>11||d<1||d>31||y<1900||y>2100) return null;
  const dt = new Date(y, mo, d, 12, 0, 0);
  if(dt.getFullYear()!==y || dt.getMonth()!==mo || dt.getDate()!==d) return null; // ej. 31/02
  return dt;
}
function formatFechaDMY(dt){
  if(!dt || isNaN(dt.getTime())) return '';
  const d = String(dt.getDate()).padStart(2,'0');
  const m = String(dt.getMonth()+1).padStart(2,'0');
  const y = dt.getFullYear();
  return d+'/'+m+'/'+y;
}
function setFechaCampoEstado(id, estado, msg){
  const el = document.getElementById(id);
  const hint = document.getElementById(id + '_hint');
  if(el){
    el.classList.remove('fecha-ok','fecha-bad');
    if(estado==='ok') el.classList.add('fecha-ok');
    if(estado==='bad') el.classList.add('fecha-bad');
  }
  if(hint){
    hint.classList.remove('fecha-ok-txt','fecha-bad-txt');
    if(msg) hint.innerHTML = msg;
    if(estado==='ok') hint.classList.add('fecha-ok-txt');
    if(estado==='bad') hint.classList.add('fecha-bad-txt');
  }
}
function onFechaDMYInput(id){
  const el = document.getElementById(id);
  if(!el) return;
  const posEnd = el.selectionEnd;
  const before = el.value;
  const masked = mascaraFechaDMY(el.value);
  if(masked !== before){
    el.value = masked;
    // cursor al final si se insertó /
    try { el.setSelectionRange(masked.length, masked.length); } catch(e){}
  }
  const dig = soloDigitosFecha(el.value);
  if(dig.length === 0){
    setFechaCampoEstado(id, '', 'Escriba solo números; se formatea solo como <b>dd/mm/aaaa</b>.');
  } else if(dig.length < 8){
    setFechaCampoEstado(id, '', 'Completando fecha… <b>' + (el.value||'') + '</b> (' + dig.length + '/8 dígitos)');
  } else {
    const dt = parseFechaDMY(el.value);
    if(dt){
      el.value = formatFechaDMY(dt);
      setFechaCampoEstado(id, 'ok', 'Fecha válida: <b>' + formatFechaDMY(dt) + '</b>');
    } else {
      setFechaCampoEstado(id, 'bad', 'Fecha no válida (revise día/mes/año). Use <b>dd/mm/aaaa</b>.');
    }
  }
  if(id === 'fecnac') calcEdad();
  else if(id === 'fecha_evaluacion') recalcularEdad();
}
function onFechaDMYBlur(id){
  const el = document.getElementById(id);
  if(!el) return;
  const dig = soloDigitosFecha(el.value);
  if(!dig){
    setFechaCampoEstado(id, '', id==='fecha_evaluacion'
      ? 'Por defecto se usa la fecha de hoy si queda vacío.'
      : 'Escriba la fecha de nacimiento como <b>dd/mm/aaaa</b>.');
    if(id==='fecnac') calcEdad();
    return;
  }
  const dt = parseFechaDMY(el.value);
  if(dt){
    el.value = formatFechaDMY(dt);
    setFechaCampoEstado(id, 'ok', 'Fecha válida: <b>' + formatFechaDMY(dt) + '</b>');
  } else {
    setFechaCampoEstado(id, 'bad', 'No se pudo interpretar la fecha. Ejemplo: <b>15/03/2018</b> o <b>15032018</b>.');
  }
  if(id === 'fecnac') calcEdad();
  else if(id === 'fecha_evaluacion') recalcularEdad();
}
function normalizarFechaCampo(id){
  onFechaDMYBlur(id);
}



function getFechaEvaluacion(){
  const el = document.getElementById('fecha_evaluacion');
  const v = el ? el.value : '';
  const dt = parseFechaDMY(v);
  return dt || new Date();
}

function recalcularEdad(){
  const t = document.getElementById('tipo_fecha').value;
  if(t==='exacta') calcEdad(); else calcEdadPorAnio();
}

(function initFechasAntro(){
  const fe = document.getElementById('fecha_evaluacion');
  if(fe && !fe.value.trim()) fe.value = formatFechaDMY(new Date());
})();

window.addEventListener('DOMContentLoaded', function(){
  const campoFecha = document.getElementById('fecha_evaluacion');
  if(campoFecha && !campoFecha.value){
    campoFecha.value = new Date().toISOString().split('T')[0];
  }
});
/* ===== EDAD ===== */
function calcEdadDetalle(fn){
  if(!fn) return null;
  const hoy = getFechaEvaluacion();
  const nac = (fn instanceof Date) ? fn : parseFechaDMY(fn);
  if(!nac || isNaN(nac.getTime())) return null;
  let a = hoy.getFullYear()-nac.getFullYear(); let m = hoy.getMonth()-nac.getMonth(); let d = hoy.getDate()-nac.getDate();
  if(d<0){m--; d+=30;} if(m<0){a--; m+=12;}
  const totalMeses = a*12+m;
  const diffDias = Math.floor((hoy-nac)/86400000);
  if(totalMeses<0) return null;
  return {años:a, meses:m, dias:d, totalMeses, diffDias};
}
function autoGrupo(det){
  if(!det) return '';
  if(det.totalMeses<6) return '0-6m';
  if(det.totalMeses<=23) return '6-24m';
  if(det.totalMeses<60) return '2-5a';
  if(det.años<12) return '5-12a';
  if(det.años<18) return '12-17a';
  if(det.años<60) return 'adulto_joven';
  if(det.años>=60) return 'am';
  return '';
}
function calcEdad(){
  const fn = document.getElementById('fecnac').value;
  const el = document.getElementById('edad-display');
  const warn = document.getElementById('grupo-warn');
  warn.textContent='';
  if(!fn || !soloDigitosFecha(fn)){ el.textContent=''; return; }
  if(soloDigitosFecha(fn).length < 8){
    el.textContent = 'Fecha incompleta — complete dd/mm/aaaa';
    return;
  }
  const det = calcEdadDetalle(fn);
  if(!det){ el.textContent='Fecha de nacimiento no válida'; return; }
  // Edad no puede ser negativa (nacimiento después de evaluación)
  if(det.totalMeses < 0 || det.diffDias < 0){
    el.textContent = 'La fecha de nacimiento no puede ser posterior a la evaluación';
    return;
  }
  el.textContent = `Edad: ${det.años} año(s) ${det.meses} mes(es) ${det.dias} día(s)`;
  const grupoActual = document.getElementById('grupo').value;
  const g = autoGrupo(det);
  if(g && grupoActual!=='embarazada'){ document.getElementById('grupo').value = g; }
  toggleCamposGrupo();
}
function toggleTipoFecha(){
  const t = document.getElementById('tipo_fecha').value;
  document.getElementById('campo-fecha-exacta').style.display = t==='exacta' ? 'block' : 'none';
  document.getElementById('campo-fecha-anio').style.display = t==='anio' ? 'block' : 'none';
  document.getElementById('fecnac').value = '';
  document.getElementById('anio_nac').value = '';
  document.getElementById('edad-display').textContent = '';
}
function calcEdadPorAnio(){
  const campo = document.getElementById('anio_nac');
  campo.value = campo.value.replace(/[^0-9]/g,'').slice(0,4);
  const el = document.getElementById('edad-display');
  if(campo.value.length<4){ el.textContent=''; return; }
  const anio = parseInt(campo.value);
  if(!anio || anio<1900 || anio>2026){ el.textContent='Año fuera de rango (1900-2026)'; return; }
  const fechaAprox = `01/07/${anio}`;
  document.getElementById('fecnac').value = fechaAprox;
  const det = calcEdadDetalle(fechaAprox);
  if(!det){ el.textContent='Año inválido'; return; }
  el.textContent = `Edad aproximada: ${det.años} año(s) (calculada desde el año de nacimiento, fecha exacta no registrada)`;
  const grupoActual = document.getElementById('grupo').value;
  const g = autoGrupo(det);
  if(g && grupoActual!=='embarazada'){ document.getElementById('grupo').value = g; }
  toggleCamposGrupo();
}

function tarjeta(titulo, valor, diag, zsStr){
  return `<div class="diag-card ${diag.c}"><div class="diag-title">${titulo}</div><div class="diag-value">${diag.d}</div><div class="diag-sub">${valor}</div>${zsStr?`<div class="zscore">Z: ${zsStr}</div>`:''}</div>`;
}

/* ===== MANEJO NUTRICIONAL — SÍNDROME DE DOWN ===== */
function getControlDown(grupo){
  if(grupo==='0-6m'||grupo==='6-24m') return 'Cada 3 meses (lactante con Síndrome de Down)';
  if(grupo==='2-5a'||grupo==='5-12a'||grupo==='12-17a') return 'Cada 6 meses (niño/adolescente con Síndrome de Down)';
  return 'Al menos 1 vez al año (adulto con Síndrome de Down)';
}
function getRecomendacionesDown(grupo){
  const esAdulto = (grupo==='adulto_joven'||grupo==='am');
  let html = `<div class="manejo-critico">⚠ Curvas OMS estándar NO deben usarse como referencia principal en Síndrome de Down: sobreestiman la talla baja y la microcefalia. Use curvas de crecimiento específicas para SD (por edad y sexo) cuando estén disponibles. ${esAdulto?'En adultos no existen curvas SD validadas: use población general con cautela, priorizando perímetro de cintura y tendencia del IMC.':''}</div>`;

  html += `<details class="manejo-box" open><summary>1. Recomendaciones nutricionales (síntesis ejecutiva)</summary><div class="contenido">
  <b>Estructura de comidas:</b> 3 comidas principales + 1-2 refrigerios saludables, horarios fijos.<br>
  <b>Regla del plato:</b> ½ plato verduras/hortalizas variadas · ¼ proteína magra (pescado azul, pollo, huevo, legumbres) · ¼ carbohidratos complejos (arroz/pasta/pan integral, patata con piel).<br>
  <b>Frutas:</b> mínimo 2 piezas al día (enteras, mejor que en zumo).<br>
  <b>Lácteos:</b> diarios (leche, yogur o queso) para calcio y vitamina D.<br>
  <b>Hidratación:</b> agua como bebida principal — cero bebidas azucaradas y zumos industriales.<br>
  <b>Reducir/evitar:</b> bollería industrial, ultraprocesados, embutidos/salchichas, fritos y dulces.<br>
  <b>Control calórico estricto:</b> gastan 10-15% menos energía; porciones menores que un niño sin SD de la misma edad.<br>
  <b>Nutrientes a vigilar</b> (suplementar solo si déficit comprobado): vitamina D, calcio, hierro, zinc, omega-3 y fibra (estreñimiento).<br>
  <b>Educación familiar:</b> imprescindible implicar a los cuidadores como modelo a seguir.</div></details>`;

  html += `<details class="manejo-box"><summary>2. Formato de aplicación antropométrica (acción clínica)</summary><div class="contenido">
  <b>1. Curva específica:</b> usar OBLIGATORIAMENTE curvas de crecimiento específicas para SD (por edad y sexo) — no usar estándares OMS (sobreestiman talla baja y microcefalia).<br>
  <b>2. Mediciones básicas:</b> peso, talla (o longitud en &lt;2 años) y perímetro cefálico (niños y adolescentes), con técnica estandarizada.<br>
  <b>3. Índice clave:</b> calcular IMC (peso/talla²) y graficarlo en la curva específica de SD — principal marcador de cribado de obesidad.<br>
  <b>4. Medición obligatoria (riesgo metabólico):</b> perímetro de cintura (altura del ombligo, fin de espiración) — mejor predictor de riesgo cardiometabólico en esta población, por encima del IMC.<br>
  <b>5. Composición corporal (opcional):</b> si hay plicómetro, medir pliegue tricipital y subescapular para seguir tendencia de grasa (sin fórmulas, solo tendencia).<br>
  <b>6. Frecuencia de controles:</b> lactantes cada 3 meses · niños/adolescentes cada 6 meses · adultos al menos 1 vez al año. Evaluar tendencia (percentil ascendente/descendente), no solo el punto aislado.</div></details>`;

  html += `<details class="manejo-box"><summary>3. Datos clave adicionales para el manejo</summary><div class="contenido">
  <b>Descartar comorbilidades:</b> en cada control revisar función tiroidea (TSH/T4) y pesquisar enfermedad celíaca (muy prevalentes en SD).<br>
  <b>Evaluación funcional:</b> preguntar siempre por capacidad masticatoria/deglución y autonomía para comer (adaptar texturas y utensilios si es necesario).<br>
  <b>Actividad física:</b> prescribir mínimo 60 min/día de ejercicio moderado-intenso adaptado a sus capacidades — el gasto calórico debe aumentarse, no basta solo la dieta.<br>
  <b>Estreñimiento:</b> muy frecuente; asegurar ingesta hídrica y de fibra; si persiste, valorar osmóticos (ej. polietilenglicol) bajo supervisión médica.<br>
  <b>Adultos:</b> al no existir curvas SD validadas, use curvas de población general con cautela (mayor tolerancia al sobrepeso por su contextura); priorice siempre perímetro de cintura y tendencia del IMC.</div></details>`;

  html += `<div class="esq-item" style="margin-top:6px"><span class="esq-icon">📅</span><span><b>Frecuencia de control recomendada:</b> ${getControlDown(grupo)}</span></div>`;
  return html;
}
