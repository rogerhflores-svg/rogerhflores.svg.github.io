/* NutriAndes — módulo de recordatorio de 24 horas y análisis químico */
let r24Lista = [];
const R24_COMIDAS = [
  {id:'desayuno', label:'Desayuno'},
  {id:'media_manana', label:'Media mañana'},
  {id:'almuerzo', label:'Almuerzo'},
  {id:'media_tarde', label:'Media tarde'},
  {id:'cena', label:'Cena'},
  {id:'colacion_nocturna', label:'Colación nocturna'}
];
function r24LabelComida(id){
  const c = R24_COMIDAS.find(x=>x.id===id);
  return c ? c.label : (id||'Sin tiempo');
}
let r24SelFood = null;
let r24Get = 0;
let r24Geb = 0;

function r24PF(v){ const n=parseFloat(String(v||'').replace(',','.')); return isNaN(n)?0:n; }

/** Edad decimal en años (años + meses/12) para fórmulas pediátricas */
function r24EdadAnios(){
  const a = r24PF(document.getElementById('r24_edad').value);
  let m = r24PF(document.getElementById('r24_edad_meses') ? document.getElementById('r24_edad_meses').value : 0);
  if(m < 0) m = 0;
  if(m > 11) m = 11;
  return a + (m / 12);
}

/** Agua Holliday-Segar (ml/día) */
function r24AguaHolliday(pesoKg){
  if(!pesoKg || pesoKg <= 0) return 0;
  if(pesoKg <= 10) return pesoKg * 100;
  if(pesoKg <= 20) return 1000 + (pesoKg - 10) * 50;
  return 1500 + (pesoKg - 20) * 20;
}

/** Agua OMS adultos: 30–35 ml/kg (usamos 35 M / 30 F) y también 1 ml/kcal del GET */
function r24AguaOMS(pesoKg, sexo, getKcal){
  const mlKg = (sexo === 'M' ? 35 : 30) * (pesoKg || 0);
  const mlKcal = getKcal || 0; // ~1 ml por kcal
  return { mlKg, mlKcal, recomendado: Math.max(mlKg, mlKcal * 0.9) };
}
function r24AguaPorEdad(pesoKg, sexo, getKcal, edadAnios){
  /* Requerimiento hídrico automático según grupo etario (una sola cifra para evitar redundancia).
     <1 a y niños: Holliday-Segar; 10–17 a: HS con piso por kcal; adultos: max(ml/kg OMS, ~1 ml/kcal);
     adulto mayor: 30 ml/kg (o 25–30) con piso por kcal. */
  const peso = pesoKg || 0;
  const get = getKcal || 0;
  const edad = (edadAnios === undefined || edadAnios === null || isNaN(edadAnios)) ? 18 : edadAnios;
  const hs = r24AguaHolliday(peso);
  const mlKgAdulto = (sexo === 'M' ? 35 : 30) * peso;
  const mlKgAM = 30 * peso; // adulto mayor: ~30 ml/kg (rango habitual 25–30)
  const porKcal = get; // ≈ 1 ml por kcal de GET

  if(edad < 10){
    return {
      ml: hs,
      metodo: 'Holliday-Segar',
      detalle: 'Niños <10 a: 100 ml/kg (≤10 kg) · 50 ml/kg (10–20 kg) · 20 ml/kg (>20 kg)',
      grupo: edad < 1 ? 'lactante' : 'niño'
    };
  }
  if(edad < 18){
    // Adolescentes: HS como base, no bajar del aporte por energía si el GET es alto
    const ml = Math.max(hs, porKcal * 0.9);
    return {
      ml,
      metodo: 'Holliday-Segar (prioritario) + piso energético',
      detalle: `HS ${hs.toFixed(0)} ml · energía ≈ ${porKcal.toFixed(0)} ml → se usa el mayor razonable`,
      grupo: 'adolescente'
    };
  }
  if(edad >= 60){
    const ml = Math.max(mlKgAM, porKcal * 0.9);
    return {
      ml,
      metodo: 'Adulto mayor (~30 ml/kg) o 1 ml/kcal',
      detalle: `${mlKgAM.toFixed(0)} ml por peso (30 ml/kg) · energía ≈ ${porKcal.toFixed(0)} ml`,
      grupo: 'adulto mayor'
    };
  }
  // Adulto 18–59
  const ml = Math.max(mlKgAdulto, porKcal * 0.9);
  return {
    ml,
    metodo: `OMS adultos (${sexo==='M'?35:30} ml/kg) o 1 ml/kcal`,
    detalle: `${mlKgAdulto.toFixed(0)} ml por peso · energía ≈ ${porKcal.toFixed(0)} ml`,
    grupo: 'adulto'
  };
}



/** Lee % macros editables; normaliza si suman raro */
function r24LeerMacros(){
  let p = r24PF(document.getElementById('r24_pct_prot').value);
  let c = r24PF(document.getElementById('r24_pct_ch').value);
  let f = r24PF(document.getElementById('r24_pct_fat').value);
  if(!p && !c && !f){ p=15; c=55; f=30; }
  return { p, c, f, suma: p+c+f };
}

/** Redondeo a 1 decimal para % y 2 para g/kg */
function r24R1(x){ return Math.round(x * 10) / 10; }
function r24R2(x){ return Math.round(x * 100) / 100; }

/**
 * Correlación % proteína ↔ g/kg y cierre a 100% de macros.
 * origen: 'pct' | 'gkg' | 'ch' | 'fat'
 */
function r24PctAGkg(pct, get, peso){
  if(!get || !peso || get <= 0 || peso <= 0) return null;
  const gProt = (get * (pct / 100)) / 4;
  return gProt / peso;
}

function r24SyncMacros(origen){
  const peso = r24PF(document.getElementById('r24_peso').value);
  let get = r24Get || 0;
  const elP = document.getElementById('r24_pct_prot');
  const elG = document.getElementById('r24_gkg_prot');
  const elC = document.getElementById('r24_pct_ch');
  const elF = document.getElementById('r24_pct_fat');
  const warn = document.getElementById('r24_macro_warn');

  let p = r24PF(elP.value);
  let c = r24PF(elC.value);
  let f = r24PF(elF.value);
  let gkg = r24PF(elG.value);

  // Si aún no hay GET, calcular primero (necesita peso/talla/edad)
  if(get <= 0 && peso > 0){
    r24CalcGE();
    get = r24Get || 0;
  }

  // 1) Correlacionar proteína % ↔ g/kg
  if(origen === 'gkg' && get > 0 && peso > 0){
    const gProt = gkg * peso;
    p = (gProt * 4 / get) * 100;
    if(p < 0) p = 0;
    if(p > 100) p = 100;
    elP.value = String(r24R1(p));
  } else if(origen === 'pct'){
    if(p < 0) p = 0;
    if(p > 100) p = 100;
    elP.value = String(r24R1(p));
    // Siempre calcular g/kg automáticamente al poner % proteína
    if(get > 0 && peso > 0){
      const gkgCalc = r24PctAGkg(p, get, peso);
      if(gkgCalc !== null) elG.value = String(r24R2(gkgCalc));
    } else if(warn){
      warn.textContent = 'Indique peso, talla y edad para ver g/kg de proteína.';
    }
  } else if((origen === 'gkg') && (get <= 0 || peso <= 0)){
    if(warn) warn.textContent = 'Indique peso y calcule GET para correlacionar % prot. y g/kg.';
    r24CalcGE();
    return;
  }

  // Releer proteína tras posible ajuste
  p = r24PF(elP.value);

  // 2) Cerrar suma a 100% según el origen
  if(origen === 'pct' || origen === 'gkg'){
    // Repartir el resto (100 − %prot) entre CH y grasa manteniendo su proporción actual
    const resto = Math.max(0, 100 - p);
    const base = c + f;
    if(base > 0){
      c = resto * (c / base);
      f = resto * (f / base);
    } else {
      // proporción por defecto ~55:30 del 85% no proteico → 64.7% / 35.3% del resto
      c = resto * (55 / 85);
      f = resto * (30 / 85);
    }
    elC.value = String(r24R1(c));
    elF.value = String(r24R1(f));
  } else if(origen === 'ch'){
    // Proteína fija; grasa = 100 − prot − CH
    if(c < 0) c = 0;
    f = 100 - p - c;
    if(f < 0){ f = 0; c = 100 - p; elC.value = String(r24R1(c)); }
    elF.value = String(r24R1(f));
  } else if(origen === 'fat'){
    // Proteína fija; CH = 100 − prot − grasa
    if(f < 0) f = 0;
    c = 100 - p - f;
    if(c < 0){ c = 0; f = 100 - p; elF.value = String(r24R1(f)); }
    elC.value = String(r24R1(c));
  }

  // 3) Mantener g/kg alineado con % prot si hay GET y peso
  if(get > 0 && peso > 0 && origen !== 'gkg'){
    const gProt = (get * (r24PF(elP.value) / 100)) / 4;
    elG.value = String(r24R2(gProt / peso));
  }

  const m = r24LeerMacros();
  if(warn){
    const ok = Math.abs(m.suma - 100) <= 1;
    warn.textContent = ok
      ? 'Suma de macros: 100% (Prot ' + r24R1(m.p) + '% · CH ' + r24R1(m.c) + '% · Grasa ' + r24R1(m.f) + '%).'
      : 'Suma de macros: ' + r24R1(m.suma) + '% — ajuste para llegar a 100%.';
  }
  r24CalcGE();
}


function r24SyncAjusteGetSlider(){
  const el = document.getElementById('r24_ajuste_get');
  const lab = document.getElementById('r24_ajuste_get_val');
  if(!el) return;
  let v = parseInt(el.value, 10);
  if(isNaN(v)) v = 0;
  if(lab){
    const sign = v > 0 ? '+' : '';
    lab.textContent = sign + v + '%';
    lab.style.color = v < 0 ? '#c45c26' : (v > 0 ? '#1a8f6a' : 'var(--ink)');
  }
  r24CalcGE();
}

function r24CalcGE(){
  const peso = r24PF(document.getElementById('r24_peso').value);
  const talla = r24PF(document.getElementById('r24_talla').value);
  const edadAnios = r24EdadAnios();
  const edadEntera = Math.floor(edadAnios);
  const meses = r24PF(document.getElementById('r24_edad_meses') ? document.getElementById('r24_edad_meses').value : 0);
  const sexo = document.getElementById('r24_sexo').value;
  const naf = r24PF(document.getElementById('r24_naf').value);
  const inj = r24PF(document.getElementById('r24_injuria').value);
  const box = document.getElementById('r24_ge_box');
  if(!peso || !talla || (!edadAnios && edadAnios !== 0)){
    box.innerHTML = 'Complete peso, talla y edad (años y, si aplica, meses).';
    r24Geb = 0; r24Get = 0; r24ActualizarComp(); return;
  }
  const imc = peso / Math.pow(talla/100, 2);
  let dxImc = 'Normal';
  let imcNota = '';
  let zImc = null;
  if(edadAnios >= 5 && edadAnios < 18){
    // IMC/edad OMS 5–17 años
    const refIMC = getRefIMC512(edadAnios);
    zImc = refIMC ? (imc - refIMC.m) / refIMC.s : null;
    const cl = clasifIMC512(zImc);
    dxImc = cl.d;
    imcNota = zImc !== null ? ` · Z IMC/edad OMS: ${zImc.toFixed(2)}` : ' · OMS 5–17 años';
  } else if(edadAnios >= 60){
    // Adulto mayor (criterios adaptados)
    const cl = clasifIMCam(imc);
    dxImc = cl.d + ' (adulto mayor)';
    imcNota = ' · puntos de corte AM: &lt;23 bajo peso · 23–27,9 normal · 28–29,9 sobrepeso · ≥30 obesidad';
  } else if(edadAnios >= 18){
    const cl = clasifIMCadulto(imc);
    dxImc = cl.d;
    imcNota = ' · OMS adulto';
  } else {
    // &lt;5 años: solo valor orientativo
    dxImc = 'Valor orientativo (&lt;5 a: priorizar P/T y P/E)';
    imcNota = '';
  }
  const munecaEl = document.getElementById('r24_muneca');
  const muneca = munecaEl ? r24PF(munecaEl.value) : 0;
  const resHamwi = pesoIdealHamwiCompleto(talla, muneca || null, sexo);
  let pi = resHamwi ? resHamwi.ibwAjustado : (sexo === 'M' ? 48 : 45.5);
  if(!muneca && talla < 152) pi = sexo === 'M' ? 48 : 45.5;
  const hamwiNota = resHamwi
    ? (muneca
        ? `contextura <b>${resHamwi.contextura}</b> (índice talla/muñeca ${resHamwi.r}) · base ${resHamwi.ibwBase} kg → ajustado <b>${resHamwi.ibwAjustado} kg</b>`
        : `complexión mediana (sin muñeca) · <b>${resHamwi.ibwBase} kg</b>`)
    : 'no calculado';
  // Peso corregido automático si hay obesidad (IMC≥30 en ≥18 a, o diagnóstico Obesidad)
  const esObeso = (edadAnios >= 18 && imc >= 30) || (String(dxImc).toLowerCase().indexOf('obesidad') >= 0 && edadAnios >= 18);
  let pesoUsado = peso;
  let pesoCorrNota = '';
  if(esObeso && pi > 0){
    // Peso ajustado / corregido = PI + 0,25 × (PA − PI)
    pesoUsado = pi + 0.25 * (peso - pi);
    pesoCorrNota = `Automático por obesidad (IMC ${imc.toFixed(1)}): PI ${pi.toFixed(1)} + 0,25×(PA−PI) = <b>${pesoUsado.toFixed(1)} kg</b>`;
  }
  let geb;
  let formulaNombre = '';
  if(edadAnios < 18){
    if(sexo === 'M'){
      if(edadAnios < 3) geb = 59.512 * pesoUsado - 30.4;
      else if(edadAnios < 10) geb = 22.706 * pesoUsado + 504.3;
      else geb = 17.686 * pesoUsado + 658.2;
    } else {
      if(edadAnios < 3) geb = 58.317 * pesoUsado - 31.1;
      else if(edadAnios < 10) geb = 20.315 * pesoUsado + 485.9;
      else geb = 13.384 * pesoUsado + 692.6;
    }
    formulaNombre = 'Schofield (&lt;18 a)';
  } else {
    if(sexo === 'M') geb = 10 * pesoUsado + 6.25 * talla - 5 * edadAnios + 5;
    else geb = 10 * pesoUsado + 6.25 * talla - 5 * edadAnios - 161;
    formulaNombre = 'Mifflin-St Jeor';
  }
  if(geb < 0) geb = 0;
  // GET base = GEB × NAF × injuria
  const getBase = geb * naf * inj;
  // Ajuste por objetivo del usuario (% sobre GET)
  const ajusteEl = document.getElementById('r24_ajuste_get');
  let ajustePct = ajusteEl ? r24PF(ajusteEl.value) : 0;
  if(isNaN(ajustePct)) ajustePct = 0;
  if(ajustePct < -40) ajustePct = -40;
  if(ajustePct > 40) ajustePct = 40;
  if(ajusteEl && r24PF(ajusteEl.value) !== ajustePct){
    ajusteEl.value = String(ajustePct);
  }
  const labAjuste = document.getElementById('r24_ajuste_get_val');
  if(labAjuste){
    const sign = ajustePct > 0 ? '+' : '';
    labAjuste.textContent = sign + ajustePct + '%';
    labAjuste.style.color = ajustePct < 0 ? '#c45c26' : (ajustePct > 0 ? '#1a8f6a' : 'var(--ink)');
  }
  const efis = r24EstadoFisio();
  const extra = r24KcalExtra(efis);
  const getBaseTot = getBase + extra.kcal;
  const get = getBaseTot * (1 + ajustePct / 100);
  r24Geb = geb;
  r24Get = get;
  window.r24GetBase = getBaseTot;
  window.r24KcalAdic = extra.kcal;
  window.r24AjustePct = ajustePct;
  window.r24PesoUsado = pesoUsado;
  window.r24PesoIdeal = pi;
  window.r24EsObeso = esObeso;

  // Macros editables
  const macros = r24LeerMacros();
  const gProt = (get * (macros.p/100)) / 4;
  const gCH = (get * (macros.c/100)) / 4;
  const gFat = (get * (macros.f/100)) / 9;
  const gkg = peso > 0 ? (gProt / peso) : 0;
  // Sincronizar campo g/kg sin disparar bucle (solo si el usuario no está en gkg)
  const gkgEl = document.getElementById('r24_gkg_prot');
  if(gkgEl && document.activeElement !== gkgEl){
    gkgEl.value = (Math.round(gkg * 100) / 100).toString();
  }

  // Agua automática según grupo etario (una sola recomendación)
  const agua = r24AguaPorEdad(peso, sexo, get, edadAnios);
  window.r24AguaMl = agua.ml;
  window.r24AguaMetodo = agua.metodo;
  const edadTxt = meses > 0 ? `${edadEntera} a ${Math.round(meses)} m` : `${edadEntera} años`;
  const ajusteTxt = ajustePct === 0
    ? 'sin ajuste (mantenimiento)'
    : (ajustePct < 0
        ? `<span style="color:#c45c26">déficit ${ajustePct}%</span> (objetivo: bajar de peso)`
        : `<span style="color:#1a8f6a">superávit +${ajustePct}%</span> (objetivo: subir de peso / anabolismo)`);
  const pesoUsadoTxt = esObeso
    ? `${pesoUsado.toFixed(1)} kg <span style="background:#FCEBEB;color:#791F1F;border-radius:5px;padding:1px 7px;font-size:11px;font-weight:700">peso corregido</span>`
    : `${pesoUsado.toFixed(1)} kg (peso actual)`;

  box.innerHTML = `<b>Edad:</b> ${edadTxt} · <b>IMC:</b> ${imc.toFixed(1)} kg/m² — <b>${dxImc}</b>${imcNota}<br>
    <b>Peso actual:</b> ${peso.toFixed(1)} kg · <b>Peso ideal (Hamwi):</b> ${pi.toFixed(1)} kg · ${hamwiNota}<br>
    <b>Peso usado en GEB:</b> ${pesoUsadoTxt}${pesoCorrNota ? `<br><span style="font-size:12.5px;color:var(--muted)">${pesoCorrNota}</span>` : ''}<br>
    <b>Fórmula GEB:</b> ${formulaNombre}<br>
    <b>GEB:</b> ${geb.toFixed(0)} kcal/día · <b>NAF:</b> ${naf} · <b>Injuria:</b> ${inj}<br>
    <b>GET base:</b> ${getBase.toFixed(0)} kcal/día (GEB×NAF×injuria) · <b>Ajuste objetivo:</b> ${ajusteTxt}<br>
    ${(efis.emb||efis.lact) ? `<div style="margin:6px 0;padding:8px 12px;border-radius:14px;background:var(--box);border:1.5px solid var(--box-line);font-size:13px;line-height:1.45">${extra.kcal>0 ? `<b>⚠ Energía aumentada por estado fisiológico:</b> +${extra.kcal} kcal/día (${extra.partes.join(' + ')}). GET sin este aumento: ${getBase.toFixed(0)} kcal → con aumento: ${getBaseTot.toFixed(0)} kcal/día.` : `<b>Estado fisiológico:</b> ${extra.partes.join(' + ')} (sin aumento energético en el 1.er trimestre).`} <span style="color:var(--muted)">Valores IOM/NASEM DRI (2005) para mujer sana; en bajo peso, sobrepeso u obesidad, o con ganancia de peso inadecuada, individualice.</span></div>` : ''}
    <b style="font-size:16px;color:#1a8f6a">GET objetivo: ${get.toFixed(0)} kcal/día</b>${ajustePct!==0 ? ` <span style="font-size:12px;color:var(--muted)">(base ${getBaseTot.toFixed(0)} × ${1+ajustePct/100})</span>` : ''}<br>
    <b>Macros sobre GET objetivo:</b> Prot ${macros.p}% = <b>${gProt.toFixed(1)} g</b> (${gkg.toFixed(2)} g/kg) · CH ${macros.c}% = <b>${gCH.toFixed(0)} g</b> · Grasa ${macros.f}% = <b>${gFat.toFixed(0)} g</b><br>
    <b>Agua (automática · ${agua.grupo}):</b> <b style="color:#1a8f6a">${agua.ml.toFixed(0)} ml/día</b> (≈ ${(agua.ml/1000).toFixed(2)} L) — ${agua.metodo}<br>
    <span style="font-size:12px;color:var(--muted)">${agua.detalle}</span>`;
  r24ActualizarComp();
}

function r24QuitarTildes(s){
  return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}

function r24BuscarAlimento(){
  const raw = (document.getElementById('r24_buscador').value||'').trim();
  const cont = document.getElementById('r24_sugerencias');
  if(raw.length<2){ cont.innerHTML=''; return; }
  const term = r24QuitarTildes(raw);
  const matches = R24_ALIMENTOS.filter(a=>r24QuitarTildes(a.n).includes(term) || r24QuitarTildes(a.g).includes(term) || r24QuitarTildes(a.c).includes(term)).slice(0,25);
  if(!matches.length){ cont.innerHTML='<div class="warn-inline">Sin resultados</div>'; return; }
  cont.innerHTML = matches.map((a)=>`<div class="chk-row" style="cursor:pointer" onclick='r24Seleccionar(${R24_ALIMENTOS.indexOf(a)})'>
    <span><b>${a.n}</b><br>
    <span style="color:#6b6b6b;font-size:12px">${a.g||'—'} · ${a.kcal} kcal · Prot ${a.prot} · Fe ${a.fe||'—'} · Ca ${a.ca||'—'} · VitC ${a.vc||'—'}/100g</span></span>
  </div>`).join('');
}

function r24Seleccionar(idx){
  r24SelFood = R24_ALIMENTOS[idx];
  document.getElementById('r24_sel_nombre').value = r24SelFood.n + (r24SelFood.g?' · '+r24SelFood.g:'')+(r24SelFood.u?' · valores por '+r24SelFood.u+' (ingrese ml como g)':'')+(r24SelFood.med?' · medida '+r24SelFood.med+' g':'')+(r24SelFood.mos?' · '+r24SelFood.mos+' mOsm/L':'');
  document.getElementById('r24_sugerencias').innerHTML = '';
  document.getElementById('r24_buscador').value = '';
}

function r24Agregar(){
  if(!r24SelFood){ alert('Seleccione un alimento de la lista de búsqueda.'); return; }
  const cant = r24PF(document.getElementById('r24_cant').value);
  if(!cant||cant<=0){ alert('Indique la cantidad en gramos.'); return; }
  const f = cant/100;
  const src = r24SelFood;
  const keys = ['kcal','prot','ch','fat','ags','agm','agp','agt','col','o3','o6','fib','fibs','fibi','ca','p','fe','na','k','zn','cu','mg','se','ret','b1','b2','b3','fol','b12','vc','vd','ve','vk'];
  const per100 = {};
  keys.forEach(k=>{ per100[k] = src[k]||0; });
  const comidaEl = document.getElementById('r24_comida');
  const comida = (comidaEl && comidaEl.value) ? comidaEl.value : 'desayuno';
  const item = {n: src.n, g: src.g, cant, per100, comida};
  keys.forEach(k=>{ item[k] = per100[k]*f; });
  r24Lista.push(item);
  r24SelFood = null;
  document.getElementById('r24_sel_nombre').value = '';
  document.getElementById('r24_cant').value = '100';
  r24RenderLista();
}

function r24Quitar(i){
  if(!confirm('¿Eliminar «'+(r24Lista[i]?r24Lista[i].n:'')+'» de la lista?')) return;
  r24Lista.splice(i,1);
  r24RenderLista();
}
function r24LimpiarLista(){
  if(r24Lista.length && !confirm('¿Vaciar toda la lista de alimentos?')) return;
  r24Lista=[];
  r24RenderLista();
}

/** Editar cantidad (g) de un alimento ya agregado; recalcula nutrientes */
function r24EditarCant(i, nuevaCant){
  const item = r24Lista[i];
  if(!item) return;
  const cant = r24PF(nuevaCant);
  if(!cant || cant <= 0){
    alert('Cantidad inválida. Use un número mayor que 0.');
    r24RenderLista();
    return;
  }
  const keys = ['kcal','prot','ch','fat','ags','agm','agp','agt','col','o3','o6','fib','fibs','fibi','ca','p','fe','na','k','zn','cu','mg','se','ret','b1','b2','b3','fol','b12','vc','vd','ve','vk'];
  // Si no hay per100 (registros antiguos), reconstruir por proporción
  if(!item.per100){
    const old = item.cant || 100;
    const factor0 = old > 0 ? 100 / old : 1;
    item.per100 = {};
    keys.forEach(k=>{ item.per100[k] = (item[k]||0) * factor0; });
  }
  const f = cant / 100;
  item.cant = cant;
  keys.forEach(k=>{ item[k] = (item.per100[k]||0) * f; });
  r24RenderLista();
}

function r24Totales(){
  const keys = ['cant','kcal','prot','ch','fat','ags','agm','agp','agt','col','o3','o6','fib','fibs','fibi','ca','p','fe','na','k','zn','cu','mg','se','ret','b1','b2','b3','fol','b12','vc','vd','ve','vk'];
  const t = {};
  keys.forEach(k=>t[k]=0);
  r24Lista.forEach(x=>{
    t.cant += x.cant||0;
    keys.forEach(k=>{ if(k!=='cant') t[k] += (x[k]||0); });
  });
  return t;
}

/* Totales de cada nutriente por tiempo de comida (solo los que tienen alimentos) */
function r24TotalesPorComida(){
  const keys = ['kcal','prot','ch','fat','ags','agm','agp','agt','col','o3','o6','fib','fibs','fibi','ca','p','fe','na','k','zn','cu','mg','se','ret','b1','b2','b3','fol','b12','vc','vd','ve','vk'];
  const out = {};
  r24Lista.forEach(x=>{
    const c = x.comida || 'desayuno';
    if(!out[c]){ out[c] = {}; keys.forEach(k=>out[c][k]=0); }
    keys.forEach(k=>{ out[c][k] += (x[k]||0); });
  });
  return out;
}
const R24_COMIDA_CORTO = {desayuno:'Desayuno', media_manana:'M. mañana', almuerzo:'Almuerzo', media_tarde:'M. tarde', cena:'Cena', colacion_nocturna:'Col. noct.'};

function r24CambiarComida(i, nueva){
  if(!r24Lista[i]) return;
  r24Lista[i].comida = nueva || 'desayuno';
  r24RenderLista();
}

function r24TotalesComida(id){
  const keys = ['cant','kcal','prot','ch','fat','fib'];
  const t = {}; keys.forEach(k=>t[k]=0);
  r24Lista.filter(x=>(x.comida||'desayuno')===id).forEach(x=>{
    keys.forEach(k=> t[k] += (x[k]||0));
  });
  return t;
}

function r24RenderLista(){
  const body = document.getElementById('r24_tabla_body');
  const totalK = r24Totales().kcal || 0;
  let html = '';
  // índices originales para editar/eliminar
  R24_COMIDAS.forEach(com=>{
    const indices = [];
    r24Lista.forEach((x,i)=>{ if((x.comida||'desayuno')===com.id) indices.push(i); });
    if(!indices.length) return;
    const sub = r24TotalesComida(com.id);
    const pct = totalK > 0 ? (sub.kcal/totalK*100) : 0;
    html += `<tr class="row-group">
      <td colspan="8" class="row-group" style="padding:8px 10px;border:1.5px solid var(--line);font-weight:700;color:var(--gold);font-size:13px">
        ${com.label}
        <span style="font-weight:600;color:var(--muted);font-size:12px;margin-left:8px">
          ${sub.kcal.toFixed(0)} kcal (${pct.toFixed(0)}%) · Prot ${sub.prot.toFixed(1)} g · CH ${sub.ch.toFixed(1)} g · Grasa ${sub.fat.toFixed(1)} g · ${sub.cant.toFixed(0)} g
        </span>
      </td>
    </tr>`;
    indices.forEach(i=>{
      const x = r24Lista[i];
      const opts = R24_COMIDAS.map(c=>`<option value="${c.id}"${(x.comida||'desayuno')===c.id?' selected':''}>${c.label}</option>`).join('');
      html += `<tr>
        <td style="padding:7px 8px;border:1.5px solid var(--line);color:var(--ink)">${x.n}${x.g?' <span style="color:#8fa0b8;font-size:11px">('+x.g+')</span>':''}</td>
        <td style="padding:7px 8px;border:1.5px solid var(--line);text-align:center;color:var(--ink)">
          <input type="text" inputmode="decimal" value="${x.cant.toFixed(0)}"
            style="width:64px;padding:4px 6px;min-height:0;font-size:12px;text-align:center;border-radius:8px"
            onchange="r24EditarCant(${i}, this.value)" title="Editar cantidad en gramos">
        </td>
        <td style="padding:7px 8px;border:1.5px solid var(--line);text-align:center;color:var(--ink)">${x.kcal.toFixed(0)}</td>
        <td style="padding:7px 8px;border:1.5px solid var(--line);text-align:center;color:var(--ink)">${x.prot.toFixed(1)}</td>
        <td style="padding:7px 8px;border:1.5px solid var(--line);text-align:center;color:var(--ink)">${x.ch.toFixed(1)}</td>
        <td style="padding:7px 8px;border:1.5px solid var(--line);text-align:center;color:var(--ink)">${x.fat.toFixed(1)}</td>
        <td style="padding:7px 8px;border:1.5px solid var(--line);text-align:center;color:var(--ink)">${x.fib.toFixed(1)}</td>
        <td style="padding:7px 8px;border:1.5px solid var(--line);text-align:center;white-space:nowrap;color:var(--ink)">
          <select onchange="r24CambiarComida(${i}, this.value)" title="Cambiar tiempo de comida"
            style="max-width:120px;padding:3px 4px;min-height:0;font-size:11px;margin-bottom:2px">
            ${opts}
          </select>
          <button type="button" onclick="r24Quitar(${i})" title="Eliminar alimento" style="border:none;background:#FCEBEB;color:#791F1F;border-radius:5px;padding:2px 8px;cursor:pointer;font-size:11px">Eliminar</button>
        </td>
      </tr>`;
    });
  });
  // alimentos sin tiempo reconocido
  r24Lista.forEach((x,i)=>{
    if(R24_COMIDAS.some(c=>c.id===(x.comida||'desayuno'))) return;
    html += `<tr>
      <td style="padding:7px 8px;border:1.5px solid var(--line);color:var(--ink)">${x.n}</td>
      <td style="padding:7px 8px;border:1.5px solid var(--line);text-align:center;color:var(--ink)">${x.cant.toFixed(0)}</td>
      <td style="padding:7px 8px;border:1.5px solid var(--line);text-align:center;color:var(--ink)">${x.kcal.toFixed(0)}</td>
      <td style="padding:7px 8px;border:1.5px solid var(--line);text-align:center;color:var(--ink)">${x.prot.toFixed(1)}</td>
      <td style="padding:7px 8px;border:1.5px solid var(--line);text-align:center;color:var(--ink)">${x.ch.toFixed(1)}</td>
      <td style="padding:7px 8px;border:1.5px solid var(--line);text-align:center;color:var(--ink)">${x.fat.toFixed(1)}</td>
      <td style="padding:7px 8px;border:1.5px solid var(--line);text-align:center;color:var(--ink)">${x.fib.toFixed(1)}</td>
      <td style="padding:7px 8px;border:1.5px solid var(--line);text-align:center;color:var(--ink)"><button type="button" onclick="r24Quitar(${i})" style="border:none;background:#FCEBEB;color:#791F1F;border-radius:5px;padding:2px 8px;cursor:pointer;font-size:11px">Eliminar</button></td>
    </tr>`;
  });
  body.innerHTML = html || '<tr><td colspan="8" style="padding:10px;color:var(--muted);text-align:center">Sin alimentos. Agregue por tiempo de comida.</td></tr>';

  // Resumen por tiempo
  const resBox = document.getElementById('r24_resumen_comidas');
  if(resBox){
    if(!r24Lista.length){
      resBox.innerHTML = '';
    } else {
      const chips = R24_COMIDAS.map(com=>{
        const sub = r24TotalesComida(com.id);
        if(sub.cant<=0 && sub.kcal<=0) return '';
        const pct = totalK > 0 ? (sub.kcal/totalK*100) : 0;
        return `<span style="display:inline-block;margin:2px 4px 2px 0;padding:4px 10px;border-radius:999px;background:var(--soft);border:1.5px solid var(--line);font-size:12px;color:var(--ink)">
          <b>${com.label}</b>: ${sub.kcal.toFixed(0)} kcal (${pct.toFixed(0)}%)
        </span>`;
      }).filter(Boolean).join('');
      resBox.innerHTML = `<div style="margin-bottom:4px;font-weight:700;color:var(--ink-2)">Aporte por tiempo de comida</div>${chips}`;
    }
  }

  const t = r24Totales();
  document.getElementById('r24_t_g').textContent = t.cant.toFixed(0);
  document.getElementById('r24_t_kcal').textContent = t.kcal.toFixed(0);
  document.getElementById('r24_t_prot').textContent = t.prot.toFixed(1);
  document.getElementById('r24_t_ch').textContent = t.ch.toFixed(1);
  document.getElementById('r24_t_fat').textContent = t.fat.toFixed(1);
  document.getElementById('r24_t_fib').textContent = t.fib.toFixed(1);
  r24ActualizarComp();
}

function r24Interp(pct){
  if(pct<70) return {t:'Deficiente',c:'red'};
  if(pct<90) return {t:'Bajo',c:'yellow'};
  if(pct<=110) return {t:'Adecuado',c:'green'};
  if(pct<=130) return {t:'Alto',c:'yellow'};
  return {t:'Excesivo',c:'orange'};
}

/* Requerimientos por grupo etario, sexo y estado fisiológico: Requerimientos_nutricionales_macro_micro_por_edad_sexo.xlsx (hoja "Resumen edad-sexo", basada principalmente en NASEM DRI) */
const DRI_REQ = [{"g":"0–6 meses","s":"Ambos","agua":0.7,"ca":200,"ch":60,"fib":null,"fe":0.27,"mg":30,"prot":9.1,"ret":400,"vc":40,"vd":10,"ve":4,"vk":2,"yodo":110,"zn":2},{"g":"14–18 años","s":"Femenino","agua":2.3,"ca":1300,"ch":130,"fib":26,"fe":15,"mg":360,"prot":46,"ret":700,"vc":65,"vd":15,"ve":15,"vk":75,"yodo":150,"zn":9},{"g":"14–18 años","s":"Masculino","agua":3.3,"ca":1300,"ch":130,"fib":38,"fe":11,"mg":410,"prot":52,"ret":900,"vc":75,"vd":15,"ve":15,"vk":75,"yodo":150,"zn":11},{"g":"19–30 años","s":"Femenino","agua":2.7,"ca":1000,"ch":130,"fib":25,"fe":18,"mg":310,"prot":46,"ret":700,"vc":75,"vd":15,"ve":15,"vk":90,"yodo":150,"zn":8},{"g":"19–30 años","s":"Masculino","agua":3.7,"ca":1000,"ch":130,"fib":38,"fe":8,"mg":400,"prot":56,"ret":900,"vc":90,"vd":15,"ve":15,"vk":120,"yodo":150,"zn":11},{"g":"1–3 años","s":"Ambos","agua":1.3,"ca":700,"ch":130,"fib":19,"fe":7,"mg":80,"prot":13,"ret":300,"vc":15,"vd":15,"ve":6,"vk":30,"yodo":90,"zn":3},{"g":"31–50 años","s":"Femenino","agua":2.7,"ca":1000,"ch":130,"fib":25,"fe":18,"mg":320,"prot":46,"ret":700,"vc":75,"vd":15,"ve":15,"vk":90,"yodo":150,"zn":8},{"g":"31–50 años","s":"Masculino","agua":3.7,"ca":1000,"ch":130,"fib":38,"fe":8,"mg":420,"prot":56,"ret":900,"vc":90,"vd":15,"ve":15,"vk":120,"yodo":150,"zn":11},{"g":"4–8 años","s":"Ambos","agua":1.7,"ca":1000,"ch":130,"fib":25,"fe":10,"mg":130,"prot":19,"ret":400,"vc":25,"vd":15,"ve":7,"vk":55,"yodo":90,"zn":5},{"g":"51–70 años","s":"Femenino","agua":2.7,"ca":1200,"ch":130,"fib":21,"fe":8,"mg":320,"prot":46,"ret":700,"vc":75,"vd":15,"ve":15,"vk":90,"yodo":150,"zn":8},{"g":"51–70 años","s":"Masculino","agua":3.7,"ca":1000,"ch":130,"fib":30,"fe":8,"mg":420,"prot":56,"ret":900,"vc":90,"vd":15,"ve":15,"vk":120,"yodo":150,"zn":11},{"g":"7–12 meses","s":"Ambos","agua":0.8,"ca":260,"ch":95,"fib":null,"fe":11,"mg":75,"prot":11,"ret":500,"vc":50,"vd":10,"ve":5,"vk":2.5,"yodo":130,"zn":3},{"g":"9–13 años","s":"Femenino","agua":2.1,"ca":1300,"ch":130,"fib":26,"fe":8,"mg":240,"prot":34,"ret":600,"vc":45,"vd":15,"ve":11,"vk":60,"yodo":120,"zn":8},{"g":"9–13 años","s":"Masculino","agua":2.4,"ca":1300,"ch":130,"fib":31,"fe":8,"mg":240,"prot":34,"ret":600,"vc":45,"vd":15,"ve":11,"vk":60,"yodo":120,"zn":8},{"g":">70 años","s":"Femenino","agua":2.7,"ca":1200,"ch":130,"fib":21,"fe":8,"mg":320,"prot":46,"ret":700,"vc":75,"vd":15,"ve":15,"vk":90,"yodo":150,"zn":8},{"g":">70 años","s":"Masculino","agua":3.7,"ca":1200,"ch":130,"fib":30,"fe":8,"mg":420,"prot":56,"ret":900,"vc":90,"vd":15,"ve":15,"vk":120,"yodo":150,"zn":11},{"g":"Embarazo 14–18 años","s":"Embarazo","agua":3,"ca":1300,"ch":175,"fib":null,"fe":27,"mg":null,"prot":71,"ret":750,"vc":80,"vd":15,"ve":null,"vk":null,"yodo":220,"zn":12},{"g":"Embarazo 19–30 años","s":"Embarazo","agua":3,"ca":1000,"ch":175,"fib":null,"fe":27,"mg":null,"prot":71,"ret":770,"vc":85,"vd":15,"ve":null,"vk":null,"yodo":220,"zn":11},{"g":"Embarazo 31–50 años","s":"Embarazo","agua":3,"ca":1000,"ch":175,"fib":null,"fe":27,"mg":null,"prot":71,"ret":770,"vc":85,"vd":15,"ve":null,"vk":null,"yodo":220,"zn":11},{"g":"Lactancia 14–18 años","s":"Lactancia","agua":3.8,"ca":1300,"ch":175,"fib":null,"fe":10,"mg":null,"prot":71,"ret":1200,"vc":115,"vd":15,"ve":null,"vk":null,"yodo":290,"zn":13},{"g":"Lactancia 19–30 años","s":"Lactancia","agua":3.8,"ca":1000,"ch":175,"fib":null,"fe":9,"mg":null,"prot":71,"ret":1300,"vc":120,"vd":15,"ve":null,"vk":null,"yodo":290,"zn":12},{"g":"Lactancia 31–50 años","s":"Lactancia","agua":3.8,"ca":1000,"ch":175,"fib":null,"fe":9,"mg":null,"prot":71,"ret":1300,"vc":120,"vd":15,"ve":null,"vk":null,"yodo":290,"zn":12}];
function r24EstadoFisio(){
  const f = document.getElementById('r24_sexo').value==='F';
  const e = document.getElementById('r24_embarazada'), l = document.getElementById('r24_lactancia');
  return {emb: f && !!(e&&e.checked), lact: f && !!(l&&l.checked)};
}
function r24EstadoFisioCambio(){ r24CalcGE(); }
function r24ActualizarEstadoFisio(){
  const box = document.getElementById('r24_estado_fis'); if(!box) return;
  const f = document.getElementById('r24_sexo').value==='F';
  box.style.display = f ? 'block' : 'none';
  if(!f){ ['r24_embarazada','r24_lactancia'].forEach(id=>{ const c=document.getElementById(id); if(c) c.checked=false; }); }
  const ef = r24EstadoFisio();
  const t = document.getElementById('r24_fis_trim'), l = document.getElementById('r24_fis_lact');
  if(t) t.style.display = ef.emb ? 'block' : 'none';
  if(l) l.style.display = ef.lact ? 'block' : 'none';
}
/* Energía adicional (IOM/NASEM DRI 2005, mujer sana): embarazo 1.er trim. +0, 2.º +340, 3.er +452 kcal/día; lactancia 0–6 m +330, 7–12 m +400 kcal/día */
function r24KcalExtra(est){
  est = est || r24EstadoFisio();
  let kcal = 0; const partes = [];
  if(est.emb){
    const t = document.getElementById('r24_trimestre').value;
    const k = t==='1' ? 0 : (t==='2' ? 340 : 452);
    kcal += k; partes.push(`embarazo, ${t==='1'?'1.er':(t==='2'?'2.º':'3.er')} trimestre: ${k>0?'+'+k:'+0'} kcal/día`);
  }
  if(est.lact){
    const p = document.getElementById('r24_lact_per').value;
    const k = p==='2' ? 400 : 330;
    kcal += k; partes.push(`lactancia, ${p==='2'?'7–12':'0–6'} meses: +${k} kcal/día`);
  }
  return {kcal: kcal, partes: partes};
}
function r24ReqMicros(){
  const sexo = document.getElementById('r24_sexo').value;
  const m = sexo==='M';
  let ea = r24EdadAnios(); if(!ea) ea = 30;
  const meses = ea*12, a = Math.floor(ea + 1e-9);
  const est = r24EstadoFisio();
  const fila = (g,s)=> DRI_REQ.find(x=>x.g===g && x.s===s) || null;
  let grupo;
  if(meses<7) grupo='0–6 meses'; else if(meses<12) grupo='7–12 meses'; else if(a<=3) grupo='1–3 años';
  else if(a<=8) grupo='4–8 años'; else if(a<=13) grupo='9–13 años'; else if(a<=18) grupo='14–18 años';
  else if(a<=30) grupo='19–30 años'; else if(a<=50) grupo='31–50 años'; else if(a<=70) grupo='51–70 años'; else grupo='>70 años';
  const ambos = ['0–6 meses','7–12 meses','1–3 años','4–8 años'].includes(grupo);
  const KS = ['agua','ca','ch','fib','fe','mg','prot','ret','vc','vd','ve','vk','yodo','zn'];
  const v = {}; const fb = []; let etiqueta = grupo + (ambos?'':(m?' · masculino':' · femenino')); let nota = '';
  if(est.emb || est.lact){
    const pre = a<=18 ? '14–18 años' : (a<=30 ? '19–30 años' : '31–50 años');
    if(a<14 || a>50) nota = `Edad fuera del rango del Excel para embarazo/lactancia (14–50 años): se usó el grupo ${pre}. `;
    const filas = [est.emb?fila('Embarazo '+pre,'Embarazo'):null, est.lact?fila('Lactancia '+pre,'Lactancia'):null].filter(Boolean);
    const base = fila(pre,'Femenino') || {};
    KS.forEach(k=>{
      const vals = filas.map(r=>r[k]).filter(x=>x!=null);
      if(vals.length) v[k] = Math.max.apply(null, vals);
      else { v[k] = base[k]!=null ? base[k] : 0; if(['fib','mg','ve','vk'].includes(k)) fb.push(k); }
    });
    etiqueta = (est.emb?'Embarazo ':'') + (est.emb&&est.lact?'+ ':'') + (est.lact?'Lactancia ':'') + pre;
    if(est.emb && est.lact) nota += 'Con ambas marcadas se usa el mayor valor de cada nutriente. ';
  } else {
    const r = fila(grupo, ambos?'Ambos':(m?'Masculino':'Femenino')) || {};
    KS.forEach(k=>{ v[k] = r[k]!=null ? r[k] : 0; });
  }
  return {
    fib: v.fib, ca: v.ca, p: 700, fe: v.fe, na: 2300, k: 3500, zn: v.zn, cu: 0.9, mg: v.mg, se: 55,
    ret: v.ret, b1: m ? 1.2 : 1.1, b2: m ? 1.3 : 1.1, b3: m ? 16 : 14, fol: 400, b12: 2.4,
    vc: v.vc, vd: v.vd, ve: v.ve, vk: v.vk/1000,
    _el: est.emb || est.lact, _g: etiqueta, _aguaMl: v.agua*1000, _prot: v.prot, _ch: v.ch, _fb: fb, _nota: nota
  };
}
function r24MostrarNotaFisio(micro){
  const n = document.getElementById('r24_fis_nota'); if(!n) return;
  if(!micro._el){ n.textContent = ''; return; }
  const ET = {fib:'fibra', mg:'magnesio', ve:'vitamina E', vk:'vitamina K'};
  let t = `Requerimientos aplicados: ${micro._g} (Excel DRI). ` + micro._nota;
  if(micro._fb.length) t += `No especificados en el Excel para este grupo (${micro._fb.map(k=>ET[k]).join(', ')}): se usó el valor de mujer no gestante de la misma edad. `;
  t += `Referencia RDA: proteína ${micro._prot} g/día y carbohidratos ${micro._ch} g/día. `;
  const ex = r24KcalExtra(); if(ex.partes.length) t += `Energía adicional aplicada al GET: ${ex.partes.join(' + ')}.`;
  n.textContent = t;
}

function r24ActualizarComp(){
  r24ActualizarEstadoFisio();
  const t = r24Totales();
  const get = r24Get || 0;
  const macros = r24LeerMacros();
  const reqProt = get ? (get * (macros.p/100)) / 4 : 0;
  const reqCH = get ? (get * (macros.c/100)) / 4 : 0;
  const reqFat = get ? (get * (macros.f/100)) / 9 : 0;
  const peso = r24PF(document.getElementById('r24_peso').value);
  const sexo = document.getElementById('r24_sexo').value;
  const edadAnios = r24EdadAnios();
  const agua = r24AguaPorEdad(peso, sexo, get, edadAnios);
  const micro = r24ReqMicros();
  r24MostrarNotaFisio(micro);
  if(micro._el) agua.metodo = 'Excel DRI · ' + micro._g, agua.ml = micro._aguaMl;
  const rows = [
    {k:'kcal', n:'Energía (kcal)', c:t.kcal, r:get},
    {k:'prot', n:'Proteína (g)', c:t.prot, r:reqProt},
    {k:'ch', n:'Carbohidratos (g)', c:t.ch, r:reqCH},
    {k:'fat', n:'Grasas totales (g)', c:t.fat, r:reqFat},
    {n:`Agua — ${agua.metodo} (ml)`, c:0, r:agua.ml},
    {k:'ags', n:'A.G. saturados (g)', c:t.ags, r:0},
    {k:'agm', n:'A.G. monoinsaturados (g)', c:t.agm, r:0},
    {k:'agp', n:'A.G. poliinsaturados (g)', c:t.agp, r:0},
    {k:'col', n:'Colesterol (mg)', c:t.col, r:300},
    {k:'fib', n:'Fibra total (g)', c:t.fib, r:micro.fib},
    {k:'ca', n:'Calcio (mg)', c:t.ca, r:micro.ca},
    {k:'p', n:'Fósforo (mg)', c:t.p, r:micro.p},
    {k:'fe', n:'Hierro (mg)', c:t.fe, r:micro.fe},
    {k:'na', n:'Sodio (mg)', c:t.na, r:micro.na},
    {k:'k', n:'Potasio (mg)', c:t.k, r:micro.k},
    {k:'zn', n:'Zinc (mg)', c:t.zn, r:micro.zn},
    {k:'cu', n:'Cobre (mg)', c:t.cu, r:micro.cu},
    {k:'mg', n:'Magnesio (mg)', c:t.mg, r:micro.mg},
    {k:'se', n:'Selenio (mcg)', c:t.se, r:micro.se},
    {k:'ret', n:'Retinol / Vit A (mcg)', c:t.ret, r:micro.ret},
    {k:'b1', n:'Tiamina B1 (mg)', c:t.b1, r:micro.b1},
    {k:'b2', n:'Riboflavina B2 (mg)', c:t.b2, r:micro.b2},
    {k:'b3', n:'Niacina B3 (mg)', c:t.b3, r:micro.b3},
    {k:'fol', n:'Ácido fólico (mcg)', c:t.fol, r:micro.fol},
    {k:'b12', n:'Vitamina B12 / Cobalamina (mg)', c:t.b12, r:micro.b12},
    {k:'vc', n:'Vitamina C / Ác. ascórbico (mg)', c:t.vc, r:micro.vc},
    {k:'vd', n:'Vitamina D (mcg)', c:t.vd, r:micro.vd},
    {k:'ve', n:'Vitamina E / Tocoferol (mg)', c:t.ve, r:micro.ve},
    {k:'vk', n:'Vitamina K / Filoquinona (mg)', c:t.vk, r:micro.vk},
  ];
  window.r24FilasComp = rows; window.r24MicroActual = micro; window.r24AguaActual = agua;
  const pm = r24TotalesPorComida();
  const comidas = R24_COMIDAS.filter(c=>pm[c.id]);
  const TH = 'padding:7px 8px;border:1.5px solid var(--line)';
  const headEl = document.getElementById('r24_comp_head');
  if(headEl) headEl.innerHTML =
    `<th style="text-align:left;position:sticky;left:0;background:var(--surface);${TH}">Parámetro</th>` +
    comidas.map(c=>`<th style="${TH}">${R24_COMIDA_CORTO[c.id]||c.label}</th>`).join('') +
    `<th style="${TH}">${comidas.length?'Total día':'Consumido'}</th><th style="${TH}">Requerido</th><th style="${TH}">% Adec.</th><th style="text-align:left;${TH}">Interpretación</th>`;
  document.getElementById('r24_comp_body').innerHTML = rows.map(row=>{
    const pct = row.r>0 ? (row.c/row.r*100) : 0;
    const inter = row.r>0 ? r24Interp(pct) : (row.c>0 ? {t:'Registrado',c:'blue'} : {t:'Sin dato',c:'yellow'});
    const dec = row.n.includes('kcal')||row.n.includes('Energ') ? 0 : (Math.max(row.r,row.c)>=10?1:2);
    const cons = row.c>0 ? row.c.toFixed(dec) : '—';
    const TD = 'padding:7px 8px;border:1.5px solid var(--line);text-align:center;color:var(--ink)';
    const celdas = comidas.map(c=>{
      const v = row.k ? (pm[c.id][row.k]||0) : 0;
      return `<td style="${TD}">${v>0 ? v.toFixed(dec) : '—'}</td>`;
    }).join('');
    return `<tr>
      <td style="padding:7px 8px;border:1.5px solid var(--line);color:var(--ink);position:sticky;left:0;background:var(--surface)">${row.n}</td>
      ${celdas}
      <td style="${TD};font-weight:700">${cons}</td>
      <td style="${TD}">${row.r?row.r.toFixed(dec):'—'}</td>
      <td style="${TD}">${row.r?pct.toFixed(0)+'%':'—'}</td>
      <td style="padding:7px 8px;border:1.5px solid var(--line);color:var(--ink)"><span class="diag-card ${inter.c}" style="display:inline-block;padding:2px 8px;margin:0;font-size:11px">${inter.t}</span></td>
    </tr>`;
  }).join('');
}

function r24Descargar(){
  const t = r24Totales();
  const peso = document.getElementById('r24_peso').value;
  const talla = document.getElementById('r24_talla').value;
  const edad = document.getElementById('r24_edad').value;
  const meses = document.getElementById('r24_edad_meses') ? document.getElementById('r24_edad_meses').value : '0';
  const sexo = document.getElementById('r24_sexo').value;
  const macros = r24LeerMacros();
  const pesoN = r24PF(peso);
  const aguaHS = r24AguaHolliday(pesoN);
  const aguaOMS = r24AguaOMS(pesoN, sexo, r24Get);
  const gProt = r24Get ? (r24Get * (macros.p/100)) / 4 : 0;
  let txt = `RECORDATORIO DE 24 HORAS Y ANÁLISIS QUÍMICO
========================================================
DATOS: Peso ${peso} kg · Talla ${talla} cm · Edad ${edad} a ${meses||0} m · Sexo ${sexo==='M'?'Masculino':'Femenino'}${r24EstadoFisio().emb?' · Embarazada':''}${r24EstadoFisio().lact?' · En lactancia':''}
GEB: ${r24Geb.toFixed(0)} kcal · GET: ${r24Get.toFixed(0)} kcal${r24KcalExtra().kcal?' (incluye +'+r24KcalExtra().kcal+' kcal por '+r24KcalExtra().partes.join(' + ')+')':''}
MACROS: Prot ${macros.p}% (${gProt.toFixed(1)} g; ${pesoN? (gProt/pesoN).toFixed(2):'—'} g/kg) · CH ${macros.c}% · Grasa ${macros.f}%
AGUA: Holliday-Segar ${aguaHS.toFixed(0)} ml · OMS adultos ≈ ${aguaOMS.recomendado.toFixed(0)} ml

ALIMENTOS CONSUMIDOS
`;
  r24Lista.forEach((x,i)=>{
    txt += `${i+1}. ${x.n} — ${x.cant.toFixed(0)} g · ${x.kcal.toFixed(0)} kcal · P ${x.prot.toFixed(1)} · CH ${x.ch.toFixed(1)} · G ${x.fat.toFixed(1)}\n`;
  });
  txt += `\nTOTALES: ${t.kcal.toFixed(0)} kcal · Prot ${t.prot.toFixed(1)} g · CH ${t.ch.toFixed(1)} g · Grasa ${t.fat.toFixed(1)} g · Fibra ${t.fib.toFixed(1)} g
========================================================
Documento de apoyo. No sustituye valoración clínica presencial.
`;
  const blob = new Blob([txt], {type:'text/plain;charset=utf-8'});
  nutriGuardarArchivo('recordatorio_24h.txt', blob);
}
