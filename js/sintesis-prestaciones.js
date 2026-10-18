/* NutriAndes — síntesis de prestaciones del SUS (sin repeticiones) */
/* ===== SÍNTESIS DE PRESTACIONES DEL SUS: una sola lista sin repeticiones ===== */
const SINT_FARM = [
  {k:'atlu', ord:0, nom:'Alimento terapéutico listo para uso (ATLU)', ico:'🥜', re:/atlu|alimento terap/i, lin:/^Alimento terap/i, fb:['V0602'], dk:[]},
  {k:'compl', ord:6, nom:'Complemento nutricional', ico:'🥣', re:/nutribeb|nutri mama|carmelo|complemento nutricional/i, lin:/^Complemento nutricional/i, fb:[], dk:[]},
  {k:'chis', ord:2, nom:'Micronutrientes en polvo (chispitas)', ico:'✨', re:/chispitas/i, lin:/^Micronutrientes/i, fb:['B0305'], dk:[]},
  {k:'vitA', ord:1, nom:'Vitamina A (retinol)', ico:'🟠', re:/vitamina a|retinol/i, lin:/^Retinol/i, fb:['A1116'], dk:['Retinol (Vitamina A)']},
  {k:'parasit', ord:5, nom:'Desparasitación', ico:'🪱', re:/mebendazol|albendazol|desparasit/i, lin:/^(Mebendazol|Albendazol)/i, fb:['P0205','P0201'], dk:['Mebendazol','Albendazol']},
  {k:'zinc', ord:4, nom:'Zinc', ico:'🧪', re:/\bzinc\b/i, lin:/^Zinc/i, fb:['A1206','A1205'], dk:['Zinc (como sulfato)']},
  {k:'hierro', ord:3, nom:'Hierro y ácido fólico', ico:'🩸', re:/hierro|sulfato ferroso|f[óo]lico|folato/i, lin:/^(Sulfato ferroso|[ÁA]cido f[óo]lico)/i, fb:['B0308'], dk:['Sulfato ferroso']}
];
const SINT_OTRAS = [
  {k:'skip', re:/^realice (visita de seguimiento|control cada)/i, grp:'skip'},
  {k:'pa', re:/presi[óo]n arterial/i, grp:'cond'},
  {k:'ref', re:/refier|referir|referencia|urgente/i, grp:'ref'},
  {k:'psico', re:/psicol[óo]gica|conducta alimentaria/i, grp:'cond'},
  {k:'oral', re:/salud oral/i, grp:'cond'},
  {k:'vacuna', re:/vacuna|inmuniz/i, grp:'aten'},
  {k:'bono', re:/bono/i, grp:'aten'},
  {k:'cred', re:/cred\b|control prenatal|control de salud|control mensual|control trimestral|hitos|desarrollo/i, grp:'aten'},
  {k:'sexual', re:/salud sexual/i, grp:'cond'},
  {k:'lact', re:/lactancia/i, grp:'cond'},
  {k:'orient', re:/orient|consejer|alimentaci[óo]n (saludable|rica)|brinde|estilos de vida|actividad f[ií]sica|promoci[óo]n|encuesta alimentaria/i, grp:'cond'}
];
function _sintLimpiar(t){
  let x = String(t||'').replace(/\(LINAME\s+[^·)]+?(?:·\s*ATC\s+[A-Z0-9]+)?\s*(?:·\s*([^)]*))?\)/g, function(m, r){ return r ? '('+r.trim()+')' : ''; });
  x = x.replace(/\s*\(\s*p[áa]g\.?[^)]*\)/gi,'').replace(/\s+([,.:;])/g,'$1').replace(/\s{2,}/g,' ').replace(/\(\s*\)/g,'').trim();
  return x.replace(/[.:]$/,'');
}
function _sintPags(t){
  const nums = [];
  String(t||'').replace(/p[áa]g\.?\s*([\d][\d,\sya]*)/gi, function(m, g){
    const rg = g.match(/(\d+)\s*a\s*(\d+)/);
    if(rg){ for(let i = +rg[1]; i <= +rg[2]; i++) nums.push(i); g = g.replace(rg[0], ''); }
    (g.match(/\d+/g)||[]).forEach(n => nums.push(+n));
    return m;
  });
  return nums;
}
function _fmtPags(nums){
  const u = [...new Set(nums)].sort((a,b) => a-b), out = [];
  for(let i = 0; i < u.length;){
    let j = i; while(j+1 < u.length && u[j+1] === u[j]+1) j++;
    if(j-i >= 2) out.push(u[i] + '–' + u[j]); else for(let k = i; k <= j; k++) out.push(String(u[k]));
    i = j+1;
  }
  return out.join(', ');
}
function _sintFilaLiname(code){
  const c = PRESTACIONES_CATALOGO.find(p => p.codigo === code);
  if(c) return c;
  const L = LINAME_CATALOGO.find(x => x.liname === code); if(!L) return null;
  return {codigo:L.liname, nombre:L.m, forma:(L.f||'')+(L.conc?' '+L.conc:''), dosis:'', via:'Oral', atc:L.atc, categoria:L.cap||''};
}
function _sintInfo(codigo, nombre){
  const L = LINAME_CATALOGO.find(x => x.liname === codigo);
  const fi = LEY475_FARMACO_INFO[(L && L.m) || nombre] || LEY475_FARMACO_INFO[nombre];
  if(!fi) return null;
  const mec = /^Principio activo incluido/.test(fi.mec||'') ? '' : (fi.mec||'');
  const inter = /^Siga la indicación del personal/.test(fi.int||'') ? '' : (fi.int||'');
  return (mec || inter) ? {mec:mec, int:inter} : null;
}
function renderSintesisPrestaciones(grupo, diagLabel, leyItems){
  const prest = (typeof getPrestaciones==='function' ? (window.__PREST_ACT||[]) : []), sup = window.__SUP_ACT||[];
  const adol = !!window.ADOL_AIEPI && (grupo==='5-12a'||grupo==='12-17a');
  const items = [];
  prest.forEach(t => items.push({t:t, from:'p'}));
  sup.forEach(t => items.push({t:t, from:'s'}));
  const farm = {}, otras = {}, orden = [];
  const aiepiPrio = x => (adol && x.from==='s') ? 1 : 0;
  items.forEach(it => {
    const f = SINT_FARM.find(d => d.re.test(it.t));
    if(f && adol && it.from==='p') return;
    if(f){ (farm[f.k] = farm[f.k] || {def:f, txt:[]}).txt.push(it); return; }
    const o = SINT_OTRAS.find(d => d.re.test(it.t));
    const k = o ? o.k : 'x:' + _sintLimpiar(it.t).toLowerCase().slice(0,40);
    if(o && o.grp==='skip') return;
    if(adol && it.from==='p' && o && ['orient','oral','vacuna','cred','sexual'].indexOf(o.k) >= 0) return; /* el cuadro AIEPI ya define la conducta */
    (otras[k] = otras[k] || {grp:o?o.grp:'cond', txt:[]}).txt.push(it);
  });
  (window.CAT_ITEMS||[]).forEach(r => { const f = SINT_FARM.find(d => d.lin.test(r.nombre||'')); if(f && !(adol && !farm[f.k])) farm[f.k] = farm[f.k] || {def:f, txt:[]}; });
  const lineas = [];
  const esc = escHtml;
  /* ---- derivación / alerta ---- */
  const refs = Object.keys(otras).filter(k => otras[k].grp==='ref');
  let html = '';
  const refTxt = [];
  refs.forEach(k => otras[k].txt.forEach(it => { const t = _sintLimpiar(it.t); if(t && refTxt.map(x=>x.toLowerCase()).indexOf(t.toLowerCase()) < 0) refTxt.push(t); }));
  if(refTxt.length){
    html += '<div class="sint-ref">' + refTxt.map(t => '<div>🚨 ' + esc(t) + '</div>').join('') + '</div>';
    refTxt.forEach(t => lineas.push('DERIVACIÓN: ' + t));
  }
  /* ---- fármacos e insumos (una tarjeta por concepto) ---- */
  const tarjetas = [];
  SINT_FARM.slice().sort((a,b) => a.ord - b.ord).forEach(def => {
    const g = farm[def.k]; if(!g) return;
    let rows = (window.CAT_ITEMS||[]).filter(r => def.lin.test(r.nombre||''));
    if(!rows.length) rows = def.fb.map(_sintFilaLiname).filter(Boolean);
    const cand = g.txt.slice().sort((a,b) => aiepiPrio(b) - aiepiPrio(a) || _sintLimpiar(b.t).length - _sintLimpiar(a.t).length);
    let ind = cand.length ? _sintLimpiar(cand[0].t) : '';
    const pags = [].concat.apply([], g.txt.map(i => _sintPags(i.t)));
    if(!ind && rows.length) ind = (rows[0].categoria||'') + (rows[0].dosis ? ' — ' + rows[0].dosis : '');
    const filas = rows.map(r => '<div class="sint-fila"><span class="sint-cod">' + esc(r.codigo) + '</span> ' + esc(r.forma||'') + (r.via ? ' · ' + esc(r.via) : '') + (r.atc ? ' · ATC ' + esc(r.atc) : '') + '</div>').join('');
    const dosis = (def.k==='hierro' && adol) ? '' : def.dk.filter(n => Object.keys(DOSIS_KG).some(k => _normDosis(k)===_normDosis(n))).map(n => dosisKgHTML(n)).join('');
    const infos = [], vistos = {};
    (def.k==='hierro' ? rows.slice().sort((x,y) => /ferroso/i.test(y.nombre||'') - /ferroso/i.test(x.nombre||'')) : rows).forEach(r => {
      const i = _sintInfo(r.codigo, r.nombre), key = (LINAME_CATALOGO.find(x => x.liname===r.codigo)||{m:r.nombre}).m;
      if(i && !vistos[key] && infos.length < 2){ vistos[key] = 1; infos.push({n:r.nombre, i:i}); }
    });
    if(!infos.length && def.dk.length){ const i = _sintInfo('', def.dk[0]); if(i) infos.push({n:def.dk[0], i:i}); }
    if(def.k==='compl' && grupo!=='am') infos.length = 0;
    const det = infos.length ? '<details class="sint-det"><summary>Mecanismo de acción e interacciones</summary>' + infos.map(x =>
      (infos.length > 1 ? '<div><b>' + esc(x.n) + '</b></div>' : '') +
      (x.i.mec ? '<div><b>Mecanismo de acción:</b> ' + esc(x.i.mec) + '</div>' : '') +
      (x.i.int ? '<div class="sint-int"><b>🍽 Interacciones / consejo de toma:</b> ' + esc(x.i.int) + '</div>' : '')).join('') + '</details>' : '';
    const norma = [rows.length ? 'LINAME ' + rows.map(r => r.codigo).join(' · ') : '', pags.length ? 'AIEPI 2021, pág. ' + _fmtPags(pags) : ''].filter(Boolean).join(' · ');
    tarjetas.push('<div class="sint-card"><div class="sint-head"><span class="sint-ico">' + def.ico + '</span><b>' + esc(def.nom) + '</b></div>' +
      (ind ? '<div class="sint-ind">' + esc(ind) + '</div>' : '') + filas + dosis + det +
      (norma ? '<div class="sint-norma">📋 ' + esc(norma) + '</div>' : '') + '</div>');
    lineas.push(def.nom + (ind ? ': ' + ind : '') + (norma ? ' [' + norma + ']' : ''));
  });
  if(tarjetas.length) html += '<div class="sint-sub">💊 Fármacos e insumos (LINAME 2022–2024)</div>' + tarjetas.join('');
  /* ---- conductas y atención ---- */
  const lista = grp => Object.keys(otras).filter(k => otras[k].grp===grp).map(k => {
    const o = otras[k], cand = o.txt.slice().sort((a,b) => aiepiPrio(b) - aiepiPrio(a) || _sintLimpiar(b.t).length - _sintLimpiar(a.t).length);
    const pags = [].concat.apply([], o.txt.map(i => _sintPags(i.t)));
    let t = _sintLimpiar(cand[0].t);
    if(adol && k==='orient'){ /* un solo renglón con las acciones distintas del cuadro AIEPI */
      const uni = []; o.txt.forEach(i => { const x = _sintLimpiar(i.t); if(x && uni.map(y => y.toLowerCase()).indexOf(x.toLowerCase()) < 0) uni.push(x); });
      t = uni.map((x, i) => i ? x.charAt(0).toLowerCase() + x.slice(1) : x).join('; ');
    }
    return {t:t, pag:pags};
  }).filter(x => x.t);
  const conds = lista('cond'), aten = lista('aten');
  const li = x => '<li>' + esc(x.t) + (x.pag.length ? ' <span class="sint-pag">AIEPI pág. ' + esc(_fmtPags(x.pag)) + '</span>' : '') + '</li>';
  if(conds.length) html += '<div class="sint-sub">🗣️ Conductas, orientación y evaluación</div><ul class="sint-list">' + conds.map(li).join('') + '</ul>';
  if(aten.length) html += '<div class="sint-sub">📅 Atención preventiva y programas</div><ul class="sint-list">' + aten.map(li).join('') + '</ul>';
  conds.concat(aten).forEach(x => lineas.push(x.t + (x.pag.length ? ' [AIEPI 2021, pág. ' + _fmtPags(x.pag) + ']' : '')));
  /* ---- respaldo normativo (una sola vez) ---- */
  const ley = (leyItems||[]);
  if(ley.length || adol){
    html += '<div class="sint-sub">📋 Respaldo normativo</div><div class="sint-norm-box">';
    if(adol) html += '<div>AIEPI — Atención integrada al continuo del curso de la vida (2021): cuadro de evaluación nutricional del adolescente.</div>';
    if(ley.length){
      html += '<div class="sint-ley-t">Prestaciones del catálogo del SUS (Ley 475)</div><table class="sint-ley"><tbody>' + ley.map(p => '<tr><td><span class="sint-cod">' + esc(p.c) + '</span></td><td>' + esc(p.d) + '</td><td>Nivel ' + esc(p.n||'—') + (p.pag ? ' · pág. ' + esc(p.pag) : '') + '</td></tr>').join('') + '</tbody></table>';
      ley.forEach(p => lineas.push('Ley 475 — ' + p.c + ': ' + p.d + ' (nivel ' + (p.n||'—') + (p.pag ? ', pág. ' + p.pag : '') + ')'));
    }
    html += '</div>';
  }
  if(adol) lineas.push('AIEPI 2021 — cuadro de evaluación nutricional del adolescente');
  const cont = document.getElementById('r-sintesis');
  if(cont) cont.innerHTML = html || '<div style="font-size:13px;color:var(--muted)">Sin prestaciones específicas para este grupo y diagnóstico.</div>';
  ['bloque-ley475','bloque-catalogo-liname'].forEach(id => { const e = document.getElementById(id); if(e) e.style.display = 'none'; });
  return {lineas:lineas, html:html};
}
/* ===== REQUERIMIENTO DE AGUA AUTOMÁTICO POR GRUPO ETARIO =====
   <18 años: Holliday-Segar (100 ml/kg hasta 10 kg · +50 ml/kg de 10 a 20 kg · +20 ml/kg sobre 20 kg).
   ≥18 años: criterio OMS en ml/kg (35 hombres · 30 mujeres · 30 adulto mayor); el recordatorio de 24 h agrega el piso por energía.
   Embarazo/lactancia: agua total de referencia DRI (3,0 L / 3,8 L). Mismo criterio que el módulo de recordatorio de 24 h. */
function aguaAntro(peso, sexo, eaAnios, em, grupo, estadoGest, graveSevera){
  if(!peso || peso <= 0) return null;
  let ml, metodo, detalle, gtxt, nota = '';
  if(grupo === 'embarazada'){
    const lact = estadoGest === 'lactancia', a = eaAnios || 25, pre = a <= 18 ? '14–18 años' : (a <= 30 ? '19–30 años' : '31–50 años');
    const fila = DRI_REQ.find(x => x.g === (lact ? 'Lactancia ' : 'Embarazo ') + pre && x.s === (lact ? 'Lactancia' : 'Embarazo'));
    if(fila){ ml = fila.agua * 1000; metodo = 'Referencia OMS/DRI · agua total'; gtxt = lact ? 'lactancia' : 'embarazo'; detalle = 'Incluye el agua de bebidas y alimentos.'; }
    else { const r = r24AguaPorEdad(peso, 'F', 0, a); ml = r.ml; metodo = r.metodo; gtxt = 'adulta'; detalle = r.detalle; }
  } else {
    const f1 = n => Math.round(n*10)/10;
    if(eaAnios < 18){
      ml = r24AguaHolliday(peso); metodo = 'Holliday-Segar'; gtxt = eaAnios < 1 ? 'lactante' : (eaAnios < 10 ? 'niño' : 'adolescente');
      detalle = peso <= 10 ? `${f1(peso)} kg × 100 ml.` : (peso <= 20 ? `1000 + (${f1(peso)} − 10) × 50 ml.` : `1500 + (${f1(peso)} − 20) × 20 ml.`);
    } else {
      const mk = eaAnios >= 60 ? 30 : (sexo === 'M' ? 35 : 30);
      ml = mk * peso; metodo = `OMS (${mk} ml/kg)`; gtxt = eaAnios >= 60 ? 'adulto mayor' : 'adulto';
      detalle = `${f1(peso)} kg × ${mk} ml.`;
    }
    if(grupo === '0-6m') nota = 'Menor de 6 meses: la leche materna a libre demanda cubre el requerimiento; no ofrezca agua ni otros líquidos.';
    else if(grupo === '6-24m') nota = 'Incluye leche materna o fórmula y agua de los alimentos; ofrezca agua segura a sorbos con la alimentación complementaria.';
    else if(eaAnios < 18) nota = 'Cifra de mantenimiento total (bebidas y alimentos); aumente con fiebre, calor, diarrea o vómitos.';
    else nota = 'Aumente con fiebre, calor, ejercicio, diarrea o vómitos; restrinja solo por indicación médica (insuficiencia cardíaca o renal).';
  }
  if(graveSevera && eaAnios < 18) nota += ' En desnutrición aguda grave o edema NO use esta cifra para hidratar: siga el protocolo hospitalario.';
  return {ml:ml, metodo:metodo, detalle:detalle, grupo:gtxt, nota:nota};
}
