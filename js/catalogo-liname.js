/* NutriAndes — catálogo de prestaciones LINAME, respaldo Ley 475 y tarjetas */
function renderCatalogoLiname(grupo, diagLabel){
  window.CAT_ITEMS = [];
  const cont = document.getElementById('r-catalogo');
  const bloque = document.getElementById('bloque-catalogo-liname');
  const motivoEl = document.getElementById('r-catalogo-motivo');
  if(!cont) return;

  const diag = String(diagLabel || '').trim();
  const d = diag.toLowerCase();

  // Flags de diagnóstico (evitar falsos positivos como "Sin desnutrición…")
  const noTiene = d.includes('no tiene desnutrición') || d.includes('no tiene desnutricion');
  const sinDesnutricion = noTiene || d.includes('sin desnutrición') || d.includes('sin desnutricion');
  const grave = !sinDesnutricion && (d.includes('grave') || d.includes('severa') || d.includes('kwashiorkor') || d.includes('marasmo'));
  const moderada = !sinDesnutricion && !grave && d.includes('moderad');
  const desnutricion = !sinDesnutricion && (
    d.includes('desnutrición aguda') || d.includes('desnutricion aguda') ||
    d.includes('desnutrición grave') || d.includes('desnutricion grave') ||
    (d.includes('desnutrición') || d.includes('desnutricion')) ||
    grave || moderada
  );
  const tallaBaja = d.includes('talla baja');
  const bajoPeso = d.includes('bajo peso') || d.includes('bajo peso grave') || d.includes('delgaz');
  const exceso = !noTiene && (d.includes('obesidad') || d.includes('sobrepeso'));
  const pesoNormalNino = d.includes('peso normal') || d.includes('talla adecuada') || d.includes('no tiene bajo peso');
  const normalAdulto = d === 'normal' || noTiene || d.includes('sin desnutrición ni exceso');
  const anemia = (d.includes('anemia') || d.includes('ferrop')) && !(window.ADOL_AIEPI && window.ADOL_AIEPI.clave==='grave');

  // Edad en meses (para Vit. A 100.000 vs 200.000 y mebendazol ≥12 m)
  let em = 0;
  try {
    const fn = document.getElementById('fecnac');
    if(fn && fn.value && typeof calcEdadDetalle === 'function'){
      const det = calcEdadDetalle(fn.value);
      if(det) em = det.totalMeses != null ? det.totalMeses : (det.años * 12 + (det.meses || 0));
    }
  } catch(e){}

  const keys = [];
  const razones = [];
  const push = (...cods) => cods.forEach(c => { if(c && !keys.includes(c)) keys.push(c); });

  // ========== NIÑOS 0–6 meses ==========
  // No hay chispitas ni desparasitación. Vit. A y ATLU solo si desnutrición.
  if(grupo === '0-6m'){
    if(grave || moderada || desnutricion){
      razones.push('0–6 meses · ' + (grave ? 'desnutrición aguda grave' : moderada ? 'desnutrición aguda moderada' : 'desnutrición'));
      push('A1115'); // Retinol 100.000 UI — criterio clínico
      if(grave) push('V0602'); // ATLU + referencia
    }
    // Peso normal / sin desnutrición → no se muestra bloque
  }

  // ========== NIÑOS 6–24 meses ==========
  // Programa de prevención + refuerzo según diagnóstico
  else if(grupo === '6-24m'){
    razones.push('6–24 meses · suplementación de programa');
    // Vitamina A universal
    if(em > 0 && em < 12) push('A1115');
    else push('A1116');
    push('B0305'); // Chispitas
    push('V0603'); // Nutribebé
    if(em >= 12) push('P0205'); // Mebendazol desde 12 meses

    if(grave){
      push('V0602','A1205','A1206');
      razones.push('desnutrición aguda grave → ATLU y zinc');
    } else if(moderada){
      push('V0602','A1205','A1206');
      razones.push('desnutrición aguda moderada → ATLU comunitario y zinc');
    } else if(tallaBaja){
      push('A1205','A1206');
      razones.push('talla baja → zinc según norma');
    }
  }

  // ========== NIÑOS 2–5 años ==========
  else if(grupo === '2-5a'){
    razones.push('2–5 años · suplementación de programa');
    push('A1116','P0205');
    if(grave){
      push('V0602','A1205','A1206');
      razones.push('desnutrición aguda grave → ATLU');
    } else if(moderada){
      push('V0602','A1205','A1206');
      razones.push('desnutrición aguda moderada');
    } else if(tallaBaja){
      push('A1205','A1206');
      razones.push('talla baja → zinc');
    }
  }

  // ========== ESCOLARES / ADOLESCENTES 5–17 a ==========
  // Sin programa universal de chispitas/Vit A; solo si hay déficit
  else if(grupo === '5-12a' || grupo === '12-17a'){
    if(grave || moderada || desnutricion || bajoPeso || tallaBaja || anemia){
      razones.push((grupo === '5-12a' ? '5–12 años' : '12–17 años') + ' · apoyo según diagnóstico');
      if(grave || moderada || desnutricion) push('V0602');
      if(bajoPeso || desnutricion || anemia) push('B0308','B0309','B0306');
      if(tallaBaja || moderada) push('A1206');
      if(anemia) push('D50');
    }
    // Normal / sobrepeso / obesidad / "Sin desnutrición ni exceso" → no mostrar
  }

  // ========== EMBARAZO / LACTANCIA ==========
  // Prevención de anemia y complemento: rutinarios en el control prenatal
  else if(grupo === 'embarazada'){
    const estado = (document.getElementById('estado_gestacion') || {}).value || '';
    if(estado === 'lactancia'){
      razones.push('puerperio / lactancia');
      push('B0308','B0309','A1116','V0607');
    } else {
      razones.push('embarazo · prevención de anemia y complemento');
      push('B0301','B0310','B0308','B0309','V0607');
    }
    if(bajoPeso) razones.push('bajo peso gestacional — reforzar seguimiento');
    if(exceso) razones.push('exceso de peso — consejería; suplementos de rutina se mantienen');
  }

  // ========== ADULTO MAYOR ==========
  else if(grupo === 'am'){
    if(bajoPeso || grave || moderada || desnutricion || anemia){
      razones.push('adulto mayor · riesgo nutricional');
      push('V0604','V0605','B0308');
      if(anemia) push('B0306','D50');
    } else if(normalAdulto || exceso || !diag || d.includes('sin datos')){
      // Programa de complemento del adulto mayor (prestación de servicio habitual)
      razones.push('adulto mayor · complemento nutricional de programa');
      push('V0604','V0605');
    } else {
      razones.push('adulto mayor · complemento nutricional de programa');
      push('V0604','V0605');
    }
  }

  // ========== ADULTO ==========
  else if(grupo === 'adulto_joven' || grupo === 'adulto'){
    if(bajoPeso || anemia || grave || desnutricion){
      razones.push('adulto · indicación clínica');
      push('B0308','B0306');
      if(anemia) push('D50','B0309');
    }
    // Normal / sobrepeso / obesidad → sin insumos de suplementación
  }

  const items = keys.map(c => PRESTACIONES_CATALOGO.find(p => p.codigo === c)).filter(Boolean);
  window.CAT_ITEMS = items;

  if(!items.length){
    if(bloque) bloque.style.display = 'none';
    cont.innerHTML = '';
    if(motivoEl) motivoEl.textContent = '';
    return;
  }

  if(bloque) bloque.style.display = 'block';
  if(motivoEl){
    const diagTxt = diag ? `Diagnóstico principal: <b>${diag}</b>. ` : '';
    motivoEl.innerHTML = diagTxt + 'Insumos LINAME según <b>' + razones.join(' · ') + '</b>.';
  }
  cont.innerHTML = `<table class="data-table"><thead><tr>
    <th>LINAME</th><th>ATC</th><th>Insumo</th><th>Forma</th><th>Dosis orientativa</th><th>Vía</th>
  </tr></thead><tbody>` + items.map(p => `<tr>
    <td><b>${p.codigo}</b></td>
    <td>${p.atc||'—'}</td>
    <td>${p.nombre}<div style="font-size:11px;color:var(--muted)">${p.categoria||''}</div></td>
    <td>${p.forma||'—'}</td>
    <td>${p.dosis||'—'}${(()=>{const L=LINAME_CATALOGO.find(x=>x.liname===p.codigo);return L?dosisKgHTML(L.m):'';})()}</td>
    <td>${p.via||'—'}</td>
  </tr>`).join('') + `</tbody></table>
  <p style="font-size:11.5px;color:var(--muted);margin-top:6px">Fuente: LINAME 2022-2024 (AGEMED). Listado orientativo según grupo etario y diagnóstico antropométrico; aplique norma MSyD y criterio clínico.</p>`;
}
const LEY475_MEDICAMENTOS = {};

/* ===== DOSIS POR PESO / EDAD (evaluación antropométrica → fármacos LINAME) =====
   Esquemas estándar OMS/AIEPI. Solo fármacos con dosificación por peso o edad bien establecida;
   el resto muestra "consultar ficha técnica / norma MSyD" (no se inventa dosis).
   Campos: t=tipo ('kg' mg/kg · 'fija' por edad), u=unidad, mn/mx=rango por kg, n=dosis/día, frec, tope=máx por dosis, tD=máx diario, ed=meses mín, nota */
const DOSIS_KG = {
 'Paracetamol (Acetaminofeno)':{t:'kg',u:'mg',mn:10,mx:15,frec:'cada 6 h (VO)',tope:1000,tD:60,tDu:'mg/kg/día',nota:'Máx. 60 mg/kg/día (adulto ≤4 g/día).'},
 'Ibuprofeno':{t:'kg',u:'mg',mn:5,mx:10,frec:'cada 6–8 h (VO, con alimento)',tope:400,tD:40,tDu:'mg/kg/día',ed:6,nota:'No usar en <6 meses ni con deshidratación.'},
 'Amoxicilina':{t:'kg',u:'mg',mn:25,mx:25,frec:'cada 12 h (50 mg/kg/día)',tope:1000,nota:'Esquema AIEPI neumonía/otitis; dosis altas solo por indicación médica. Máx. 3 g/día.'},
 'Cotrimoxazol (Sulfametoxazol + Trimetoprima)':{t:'kg',u:'mg de trimetoprima',mn:4,mx:4,frec:'cada 12 h (8 mg/kg/día TMP)',tope:160,ed:2,nota:'No usar en <2 meses.'},
 'Metronidazol':{t:'kg',u:'mg',mn:5,mx:5,frec:'cada 8 h (15 mg/kg/día, giardiasis)',tope:500,nota:'Amebiasis: 30–50 mg/kg/día en 3 dosis, según indicación.'},
 'Gentamicina':{t:'kg',u:'mg',mn:5,mx:7.5,frec:'cada 24 h (IM/IV)',tope:360,nota:'Vigilar función renal; 7,5 mg/kg/día en desnutrición grave (AIEPI).'},
 'Ampicilina':{t:'kg',u:'mg',mn:25,mx:50,frec:'cada 6 h (100–200 mg/kg/día)',tope:2000,nota:'200 mg/kg/día en desnutrición aguda grave con infección.'},
 'Ceftriaxona':{t:'kg',u:'mg',mn:50,mx:100,frec:'cada 24 h (IM/IV)',tope:4000,nota:'Dosis diaria total; máx. 4 g/día.'},
 'Azitromicina':{t:'kg',u:'mg',mn:10,mx:10,frec:'cada 24 h × 3 días',tope:500},
 'Prednisona':{t:'kg',u:'mg',mn:1,mx:2,frec:'cada 24 h (dosis diaria)',tope:60,nota:'Dosis diaria total; esquema y duración según indicación.'},
 'Salbutamol':{t:'kg',u:'mg (nebulización)',mn:0.15,mx:0.15,frec:'por nebulización; mín. 2,5 mg',tope:5,nota:'Crisis: puede repetirse c/20 min × 3 bajo supervisión.'},
 'Sulfato ferroso':{t:'kg',u:'mg de hierro elemental',mn:3,mx:3,frec:'1 vez/día (tratamiento anemia; rango 3–6)',tope:60,nota:'Preventivo 2 mg/kg/día. Verifique mg de Fe elemental de la presentación.'},
 'Zinc (como sulfato)':{t:'fija',tab:[[0,6,'10 mg/día'],[6,999,'20 mg/día']],frec:'× 10–14 días (diarrea)'},
 'Retinol (Vitamina A)':{t:'fija',tab:[[0,6,'50.000 UI'],[6,12,'100.000 UI'],[12,999,'200.000 UI']],frec:'dosis única (terapéutica)',nota:'Universal: según esquema de suplementación vigente.'},
 'Mebendazol':{t:'fija',tab:[[0,12,'No indicado <12 meses'],[12,999,'500 mg']],frec:'dosis única, 2 veces/año'},
 'Albendazol':{t:'fija',tab:[[0,12,'No indicado <12 meses'],[12,24,'200 mg'],[24,999,'400 mg']],frec:'dosis única'}
};
function _normDosis(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
function dosisKgHTML(nombre){
  const k = Object.keys(DOSIS_KG).find(n=>_normDosis(n)===_normDosis(nombre));
  const P = window.PACIENTE_DOSIS || {};
  const peso = P.peso, em = P.em;
  const box = (c,b)=>`<div style="margin-top:5px;padding:6px 8px;background:#eef6ff;border:1.5px solid #b9d6f5;border-radius:8px;font-size:11.5px;color:#0C447C;line-height:1.45"><b>⚖ Dosis según antropometría:</b> ${b}${c||''}</div>`;
  if(!k) return box('', 'no calculable por peso en esta app — consulte ficha técnica, norma MSyD/AGEMED y criterio clínico.');
  const d = DOSIS_KG[k], ref = '<div style="font-size:10.5px;color:#5c6b82;margin-top:2px">'+'Dosis orientativa (OMS/AIEPI). Confirme con el médico o farmacéutico antes de prescribir o administrar. '+(d.nota||'')+'</div>';
  if(d.t==='fija'){
    if(em==null) return box(ref, 'complete la evaluación antropométrica (edad) para calcular.');
    const f = d.tab.find(r=>em>=r[0]&&em<r[1]);
    return box(ref, `<b>${f?f[2]:'—'}</b> ${d.frec} <span style="color:#5c6b82">(edad ${em} m)</span>`);
  }
  if(!peso) return box(ref, `${d.mn===d.mx?d.mn:d.mn+'–'+d.mx} ${d.u}/kg/dosis ${d.frec} — <i>falta peso: complete la evaluación antropométrica</i>.`);
  if(d.ed && em!=null && em<d.ed) return box(ref, `<b style="color:#791F1F">No recomendado en menores de ${d.ed} meses</b> (edad ${em} m).`);
  const r = v => Math.round(v*10)/10;
  let lo = r(peso*d.mn), hi = r(peso*d.mx), tope = d.tope && (lo>d.tope||hi>d.tope);
  lo = d.tope?Math.min(lo,d.tope):lo; hi = d.tope?Math.min(hi,d.tope):hi;
  const rango = lo===hi?`${lo}`:`${lo}–${hi}`;
  return box(ref, `<b>${rango} ${d.u}</b> ${d.frec} <span style="color:#5c6b82">(${d.mn===d.mx?d.mn:d.mn+'–'+d.mx} ${d.u}/kg × ${peso} kg)</span>${tope?' <b style="color:#791F1F">· limitado a dosis máx. '+d.tope+'</b>':''}`);
}


/* Mecanismo de acción (mec) e interacciones fármaco-nutriente (int) por
   nombre de medicamento (269 fármacos únicos del catálogo). Redactado como
   apoyo educativo general; ante dudas clínicas específicas, consultar el
   Vademécum institucional o al farmacéutico/médico responsable. */

function quitarTildesLey475(s){
  return (s||'').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}

function nivelBadgeLey475(nivel){
  const n = (nivel||'').trim();
  if(n==='I') return '<span style="background:#EAF3DE;color:#27500A;border-radius:5px;padding:1px 6px;font-size:10.5px;font-weight:700">I · PRIMER NIVEL</span>';
  if(n==='III') return '<span style="background:#FCEBEB;color:#791F1F;border-radius:5px;padding:1px 6px;font-size:10.5px;font-weight:700">III · TERCER NIVEL</span>';
  if(n==='II') return '<span style="background:#FAEEDA;color:#633806;border-radius:5px;padding:1px 6px;font-size:10.5px;font-weight:700">II · SEGUNDO NIVEL</span>';
  if(!n) return '';
  return `<span style="background:#E6F1FB;color:#0C447C;border-radius:5px;padding:1px 6px;font-size:10.5px;font-weight:700">${n}</span>`;
}

function linameBadgesHTML(info){
  if(!info || !info.liname || !info.liname.length) return '';
  return info.liname.map(L=>{
    const aw = L.aware==='Acceso' ? 'background:#EAF3DE;color:#27500A'
      : L.aware==='Vigilancia' ? 'background:#FAEEDA;color:#633806'
      : L.aware==='Reserva' ? 'background:#FCEBEB;color:#791F1F' : 'background:#f3efe0;color:#5c6b82';
    const rest = L.r ? '<span style="background:#FCEBEB;color:#791F1F;border-radius:4px;padding:0 5px;font-size:9.5px;font-weight:700;margin-left:3px">R</span>' : '';
    const awBadge = L.aware ? `<span style="${aw};border-radius:4px;padding:0 5px;font-size:9.5px;font-weight:700;margin-left:3px">AWaRe: ${L.aware}</span>` : '';
    return `<div style="margin-top:3px;font-size:10.5px;line-height:1.4">
      <span style="background:#E6F1FB;color:#0C447C;border-radius:4px;padding:0 5px;font-weight:700">LINAME ${L.liname||'—'}</span>
      <span style="color:#8a6a1f;font-weight:600;margin-left:4px">ATC ${L.atc||'—'}</span>
      ${rest}${awBadge}
      <span style="color:var(--muted);margin-left:4px">${L.f||''}${L.conc?' · '+L.conc:''}${L.clase?' · '+L.clase:''}</span>
    </div>`;
  }).join('');
}
function medicamentosHTMLLey475(codigo){
  const lista = LEY475_MEDICAMENTOS[codigo];
  if(!lista || !lista.length) return '';
  const filas = lista.map(m=>{
    const info = LEY475_FARMACO_INFO[m.m];
    const mecHTML = info ? `<div style="margin-top:3px;font-size:10.5px;color:#3d4d63"><b>Mecanismo:</b> ${info.mec}</div>` : '';
    const linameHTML = linameBadgesHTML(info);
    const intEnDosis = info && info.int
      ? `<div style="margin-top:4px;padding:4px 6px;background:#fdf6ea;border:1px solid #f0d99a;border-radius:6px;font-size:10.5px;color:#633806;line-height:1.35">
          <b>🍽 Interacción fármaco-nutriente / consejo de toma:</b> ${info.int}
        </div>`
      : '';
    return `<tr>
      <td style="padding:4px 6px;border:1px solid #ecdfc0;vertical-align:top">
        <div style="font-weight:700">${m.m}${m.k?` <span style="color:#8a6a1f;font-size:9.5px;font-weight:400">(${m.k})</span>`:''}</div>
        ${mecHTML}${linameHTML}
      </td>
      <td style="padding:4px 6px;border:1px solid #ecdfc0;vertical-align:top">${m.f||'—'}</td>
      <td style="padding:4px 6px;border:1px solid #ecdfc0;vertical-align:top">
        <div>${m.d||'—'}</div>
        ${intEnDosis}
      </td>
      <td style="padding:4px 6px;border:1px solid #ecdfc0;text-align:center;vertical-align:top">${m.v||'—'}</td>
      <td style="padding:4px 6px;border:1px solid #ecdfc0;text-align:center;vertical-align:top">${m.q||'—'}</td>
    </tr>`;
  }).join('');
  return `<details style="margin-top:6px" open><summary style="font-size:11.5px;font-weight:700;color:#8a6a1f;cursor:pointer">▶ Tratamiento / prevención farmacológica · LINAME · interacciones (${lista.length})</summary>
    <div style="overflow-x:auto;margin-top:4px"><table style="width:100%;border-collapse:collapse;font-size:11px">
    <thead><tr style="background:var(--soft)">
      <th style="text-align:left;padding:4px 6px;border:1px solid #ecdfc0">Medicamento · mecanismo · LINAME/ATC/AWaRe</th>
      <th style="text-align:left;padding:4px 6px;border:1px solid #ecdfc0">Forma</th>
      <th style="text-align:left;padding:4px 6px;border:1px solid #ecdfc0">Esquema + interacción fármaco-nutriente</th>
      <th style="padding:4px 6px;border:1px solid #ecdfc0">Vía</th>
      <th style="padding:4px 6px;border:1px solid #ecdfc0">Cant.</th>
    </tr></thead>
    <tbody>${filas}</tbody></table></div></details>`;
}

function tarjetaPrestacionLey475(p){
  const meta = [];
  if(p.cap) meta.push(`<span style="color:var(--muted)">Capítulo:</span> ${p.cap}`);
  if(p.sec) meta.push(`<span style="color:var(--muted)">Sección:</span> ${p.sec}`);
  if(p.tarifa) meta.push(`<span style="color:var(--muted)">Tarifa:</span> ${p.tarifa}`);
  if(p.pag) meta.push(`<span style="color:var(--muted)">Pág. manual:</span> ${p.pag}`);
  const metaHTML = meta.length ? `<div style="font-size:11px;color:var(--ink-2);margin-top:4px;line-height:1.45">${meta.join(' · ')}</div>` : '';
  const tarifaBadge = p.tarifa==='Abierta'
    ? '<span style="background:#E6F1FB;color:#0C447C;border-radius:5px;padding:1px 6px;font-size:10.5px;font-weight:700;margin-left:4px">Abierta</span>'
    : (p.tarifa==='Cerrada' ? '<span style="background:#f3efe0;color:#5c6b82;border-radius:5px;padding:1px 6px;font-size:10.5px;font-weight:700;margin-left:4px">Cerrada</span>' : '');
  return `<div class="manejo-box" style="margin-bottom:7px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px">
      <div style="font-size:12.5px;font-weight:700;color:#3d4d63">${p.d}</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:flex-end">${nivelBadgeLey475(p.n)}${tarifaBadge}</div>
    </div>
    <div style="font-size:10.5px;color:#8a6a1f;font-weight:700;margin-top:2px">Código: ${p.c}</div>
    ${metaHTML}
    ${p.o?`<div class="contenido" style="margin-top:5px">${p.o}</div>`:''}
    ${medicamentosHTMLLey475(p.c)}
  </div>`;
}

function tarjetaComplementariaLey475(c){
  return `<div class="manejo-box" style="margin-bottom:7px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px">
      <div style="font-size:12.5px;font-weight:700;color:#3d4d63">${c.d}</div>
      <span style="background:#F1E6FB;color:#5B2C8C;border-radius:5px;padding:1px 6px;font-size:10.5px;font-weight:700">${c.t}</span>
    </div>
    <div style="font-size:10.5px;color:#8a6a1f;font-weight:700;margin-top:2px">Código: ${c.c}${c.pag?` · Pág. manual: ${c.pag}`:''}</div>
  </div>`;
}

let ley475BuscadorTimeout = null;
function buscarPrestacionLey475(){
  clearTimeout(ley475BuscadorTimeout);
  ley475BuscadorTimeout = setTimeout(()=>{
    const raw = document.getElementById('pl_buscador').value.trim();
    const cont = document.getElementById('pl_resultados');
    const contador = document.getElementById('pl_contador');
    if(raw.length < 1){
      cont.innerHTML = '';
      contador.textContent = `${LINAME_CATALOGO.length} medicamentos LINAME 2022-2024 · ${LEY475_PRESTACIONES.length} prestaciones de servicio. Escriba nombre, código LINAME o ATC.`;
      return;
    }
    const term = quitarTildesLey475(raw);
    // ——— Fármacos LINAME (única fuente de medicamentos) ———
    const matchLiname = LINAME_CATALOGO.filter(L =>
      quitarTildesLey475(L.liname).includes(term) ||
      quitarTildesLey475(L.m).includes(term) ||
      quitarTildesLey475(L.atc).includes(term) ||
      quitarTildesLey475(L.f).includes(term) ||
      quitarTildesLey475(L.conc).includes(term) ||
      quitarTildesLey475(L.aware||'').includes(term) ||
      quitarTildesLey475(L.clase||'').includes(term) ||
      quitarTildesLey475(L.cap||'').includes(term) ||
      (L.r && (term==='r' || term.indexOf('restring')>=0))
    );
    // Agrupar por nombre de fármaco para fluidez
    const porNombre = {};
    matchLiname.forEach(L=>{
      const k = L.m;
      if(!porNombre[k]) porNombre[k] = [];
      porNombre[k].push(L);
    });
    const nombres = Object.keys(porNombre);
    // Prestaciones de servicio (sin fármacos del manual 2015)
    const matchPrest = term.length>=2 ? LEY475_PRESTACIONES.filter(p =>
      quitarTildesLey475(p.c).includes(term) ||
      quitarTildesLey475(p.d).includes(term) ||
      quitarTildesLey475(p.cap||'').includes(term) ||
      quitarTildesLey475(p.sec||'').includes(term)
    ) : [];
    const matchComp = term.length>=2 ? LEY475_COMPLEMENTARIAS.filter(c =>
      quitarTildesLey475(c.c).includes(term) || quitarTildesLey475(c.d).includes(term)
    ) : [];
    const total = matchLiname.length + matchPrest.length + matchComp.length;
    contador.textContent = total
      ? `${nombres.length} fármaco(s) LINAME (${matchLiname.length} presentaciones) · ${matchPrest.length} prestación(es) · ${matchComp.length} complementaria(s)`
      : 'Sin resultados. Pruebe nombre del fármaco, código LINAME (ej. J0106) o ATC (ej. J01CA04).';
    let html = '';
    if(nombres.length){
      html += `<div style="margin-bottom:10px"><div style="font-size:13px;font-weight:700;color:var(--gold);margin-bottom:6px">LINAME 2022-2024 · Medicamentos esenciales</div>`;
      nombres.slice(0, 60).forEach(nom=>{
        html += tarjetaLinameGrupo(nom, porNombre[nom]);
      });
      if(nombres.length>60) html += `<div style="font-size:12px;color:var(--muted);padding:6px">… y ${nombres.length-60} fármaco(s) más. Refine la búsqueda.</div>`;
      html += `</div>`;
    }
    if(matchPrest.length){
      html += `<div style="margin-top:8px"><div style="font-size:13px;font-weight:700;color:var(--gold);margin-bottom:6px">Prestaciones de servicio (SUS)</div>`;
      matchPrest.slice(0, 30).forEach(p=>{ html += tarjetaPrestacionLey475(p); });
      html += `</div>`;
    }
    if(matchComp.length){
      html += `<div style="margin-top:8px"><div style="font-size:13px;font-weight:700;color:var(--gold);margin-bottom:6px">Complementarias (lab / gabinete / banco)</div>`;
      matchComp.slice(0, 20).forEach(c=>{ html += tarjetaComplementariaLey475(c); });
      html += `</div>`;
    }
    cont.innerHTML = html;
  }, 120);
}
function tarjetaLinameGrupo(nombre, formas){
  const L0 = formas[0];
  const fi = LEY475_FARMACO_INFO[nombre];
  const mec = fi ? `<div style="margin-top:5px;font-size:11.5px;color:var(--ink-2);line-height:1.45"><b>Mecanismo de acción:</b> ${fi.mec}</div>` : '';
  const inter = fi && fi.int
    ? `<div style="margin-top:5px;padding:6px 8px;background:#fdf6ea;border:1.5px solid #f0d99a;border-radius:8px;font-size:11.5px;color:#633806;line-height:1.4"><b>🍽 Interacción fármaco-nutriente / consejo de toma:</b> ${fi.int}</div>`
    : '';
  const restAny = formas.some(f=>f.r);
  const awSet = [...new Set(formas.map(f=>f.aware).filter(Boolean))];
  const badges = [];
  if(restAny) badges.push('<span style="background:#FCEBEB;color:#791F1F;border-radius:5px;padding:1px 7px;font-size:10.5px;font-weight:700">Uso restringido (R)</span>');
  awSet.forEach(aw=>{
    const st = aw==='Acceso'?'background:#EAF3DE;color:#27500A':aw==='Vigilancia'?'background:#FAEEDA;color:#633806':aw==='Reserva'?'background:#FCEBEB;color:#791F1F':'background:#f3efe0;color:#5c6b82';
    badges.push(`<span style="${st};border-radius:5px;padding:1px 7px;font-size:10.5px;font-weight:700">AWaRe: ${aw}</span>`);
  });
  const filas = formas.map(L=>`<tr>
    <td style="padding:4px 6px;border:1px solid #ecdfc0"><span style="background:#E6F1FB;color:#0C447C;border-radius:4px;padding:1px 6px;font-weight:700;font-size:11px">${L.liname}</span></td>
    <td style="padding:4px 6px;border:1px solid #ecdfc0;font-weight:600;color:#8a6a1f">${L.atc||'—'}</td>
    <td style="padding:4px 6px;border:1px solid #ecdfc0">${L.f||'—'}</td>
    <td style="padding:4px 6px;border:1px solid #ecdfc0">${L.conc||'—'}</td>
    <td style="padding:4px 6px;border:1px solid #ecdfc0;font-size:10.5px;color:var(--muted)">${L.clase||L.cap||''}</td>
  </tr>`).join('');
  return `<div class="manejo-box" style="margin-bottom:8px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;flex-wrap:wrap">
      <div style="font-size:14px;font-weight:700;color:#1c2b40">${nombre}</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">${badges.join('')}</div>
    </div>
    ${L0.cap?`<div style="font-size:11px;color:var(--muted);margin-top:2px">${L0.cap}</div>`:''}
    <div style="overflow-x:auto;margin-top:6px">
      <table style="width:100%;border-collapse:collapse;font-size:11.5px">
        <thead><tr style="background:var(--soft)">
          <th style="text-align:left;padding:4px 6px;border:1px solid #ecdfc0">Código LINAME</th>
          <th style="text-align:left;padding:4px 6px;border:1px solid #ecdfc0">A.T.Q. (ATC)</th>
          <th style="text-align:left;padding:4px 6px;border:1px solid #ecdfc0">Forma</th>
          <th style="text-align:left;padding:4px 6px;border:1px solid #ecdfc0">Concentración</th>
          <th style="text-align:left;padding:4px 6px;border:1px solid #ecdfc0">Clase / capítulo</th>
        </tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </div>
    ${mec}${inter}${dosisKgHTML(nombre)}
  </div>`;
}
function tarjetaLiname(L){
  return tarjetaLinameGrupo(L.m, [L]);
}

/* ===== RESPALDO NORMATIVO LEY 475 PARA EL DIAGNÓSTICO NUTRICIONAL =====
   Combina (a) códigos ligados al diagnóstico antropométrico calculado y
   (b) códigos de prestaciones preventivas de rutina (anemia, vitamina A,
   desparasitación, complemento del adulto mayor) que corresponden según
   edad/grupo/estado, aunque el resultado sea normal. Fuente cruzada con
   Medicamentos_Desnutricion_Ley475.xlsx (prestaciones de prevención de
   carencias nutricionales, tratamiento de desnutrición y anemia D50). */
function getCodigosLey475(diagLabel, grupo, em, estadoGest){
  /* Códigos de prestaciones de servicio SUS (diagnóstico/manejo) del catálogo oficial.
     Los esquemas de micronutrientes y fármacos se orientan con LINAME 2022-2024 en getPrestaciones/getSuplementacion (ya no se listan PCxxx de suplementos del manual 2015). */
  let codigos = [];
  const esNino = (grupo==='0-6m'||grupo==='6-24m'||grupo==='2-5a');
  if(diagLabel.includes('grave')){
    if(esNino) codigos.push('PC91','E40','E41','E42');
  } else if(diagLabel.includes('moderad')){
    if(esNino) codigos.push('E440');
  } else if(diagLabel==='Talla baja'){
    codigos.push('E45');
  } else if(diagLabel==='Bajo peso'){
    if(grupo==='am') codigos.push('E46');
    else if(grupo==='embarazada') codigos.push('O25');
  }
  // Controles y prevención de servicio (no esquemas de sobres del manual 2015)
  if(grupo==='0-6m'||grupo==='6-24m'||grupo==='2-5a'){
    codigos.push('PC1'); // consulta de crecimiento
    if(em!==undefined && em<24) codigos.push('Z001'); // desarrollo <2 años
  }
  if(grupo==='am'){
    codigos.push('PC234'); // complemento adulto mayor (prestación de servicio)
  }
  if(grupo==='embarazada'){
    if(estadoGest==='lactancia') codigos.push('Z392');
    else codigos.push('Z34');
  }
  return [...new Set(codigos)];
}
function getRespaldoLey475(diagLabel, grupo, em, estadoGest){
  const codigos = getCodigosLey475(diagLabel, grupo, em, estadoGest);
  return codigos.map(c => LEY475_PRESTACIONES.find(p => p.c===c)).filter(Boolean);
}
function renderRespaldoLey475(diagLabel, grupo, em, estadoGest){
  const encontrados = getRespaldoLey475(diagLabel, grupo, em, estadoGest);
  const bloque = document.getElementById('bloque-ley475');
  const cont = document.getElementById('r-ley475');
  if(!encontrados.length){ bloque.style.display='none'; cont.innerHTML=''; return []; }
  bloque.style.display='block';
  cont.innerHTML = `<div class="warn-inline" style="margin-bottom:6px">Prestaciones del catálogo oficial del SUS que respaldan el diagnóstico y/o corresponden como prevención de rutina según edad/estado:</div>` + encontrados.map(tarjetaPrestacionLey475).join('');
  return encontrados;
}
