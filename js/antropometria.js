/* NutriAndes — evaluación antropométrica (calcular) y utilidades */
function calcular(){
  const nombre = document.getElementById('nombre').value.trim()||'Paciente';
  const sexo = document.getElementById('sexo').value;
  const grupo = document.getElementById('grupo').value;
  const comorbilidad = document.getElementById('comorbilidad').value;
  if(!sexo||!grupo){ alert('Completar sexo y grupo etario (obligatorios).'); return; }
  if(!comorbilidad){ alert('Seleccionar comorbilidad presente (obligatorio, marque "Ninguna" si no aplica).'); return; }

  const responsable = document.getElementById('responsable').value.trim();
  const establecimiento = document.getElementById('establecimiento').value.trim();
  const peso = pF(document.getElementById('peso').value);
  const talla = pF(document.getElementById('talla').value);
  const fnCheck = document.getElementById('fecnac').value;
  if(!fnCheck){ alert('La fecha de nacimiento es obligatoria.'); return; }
  if(isNaN(peso)||isNaN(talla)){ alert('Peso y talla son obligatorios (use punto o coma para decimales, ej: 12.5 o 12,5).'); return; }
  const pc = pF(document.getElementById('pc').value);
  const perimCintura = pF(document.getElementById('perimetro_cintura').value);
  const det = calcEdadDetalle(fnCheck);
  const alimentacion = '';
  const antecedentes = '';

  const signos = {};
  const edemaGrado = parseInt(document.getElementById('edema_grado').value)||0;
  signos.edema = edemaGrado>0;

  const em = det ? det.totalMeses : 0;
  window.PACIENTE_DOSIS = {peso: peso, em: em};
  const eaAnios = det ? det.años : 0;
  const edadStr = det ? `${det.años} año(s) ${det.meses} mes(es) ${det.dias} día(s)` : 'No registrada';

  let cards='', diagPrincipal={d:'Sin datos antropométricos',c:'blue'}, zPrincipal=null;
  window.ADOL_AIEPI = null;
  let tabDatos = {pe:null,te:null,pt:null,imc512:null,gest:null};
  let alertas = [];
  let curvasHTML = '';
  let zpcGlobal = null;

  if(grupo==='0-6m'||grupo==='6-24m'||grupo==='2-5a'){
    const refPE=getRefPE(sexo,em), refTE=getRefTE(sexo,em), refPT=getRefPT(sexo,talla,em);
    const zpe = zRef(peso, refPE);
    const zte = zRef(talla, refTE);
    const zpt = refPT ? zLMS(peso, refPT.L, refPT.m, refPT.S) : null;
    const dpe = em<2 ? clasifPE2m(zpe) : clasificarZ(zpe);
    const dte = clasifTE(zte);
    const dpt = clasifPT(zpt);
    if(dpt.d.includes('grave')){ diagPrincipal=dpt; zPrincipal=zpt; }
    else if(dpt.d.includes('moderad')){ diagPrincipal=dpt; zPrincipal=zpt; }
    else if(dte.d==='Talla baja'){ diagPrincipal=dte; zPrincipal=zte; }
    else { diagPrincipal=dpt; zPrincipal=zpt; }
    if(edemaGrado>=2){ diagPrincipal = {d:`Desnutrición aguda grave (severa) — edema +${edemaGrado}, tipo kwashiorkor`,c:'red'}; alertas.push(`Edema grado +${edemaGrado} presente — signo de desnutrición aguda grave/severa. Referencia INMEDIATA.`); }
    cards += tarjeta('Peso / Edad', `${peso.toFixed(2)} kg`, dpe, zpe!==null?zpe.toFixed(2):null);
    cards += tarjeta('Talla / Edad (crónica)', `${talla.toFixed(1)} cm`, dte, zte!==null?zte.toFixed(2):null);
    cards += tarjeta('Peso / Talla (aguda)', `${peso.toFixed(2)} kg / ${talla.toFixed(1)} cm`, dpt, zpt!==null?zpt.toFixed(2):null);
    if(!isNaN(pc)){ const refPC=getRefPC(sexo,em); const zpc=zRef(pc, refPC); const dpc=clasifPC(zpc); cards+=tarjeta('Perímetro cefálico',`${pc.toFixed(1)} cm`,dpc,zpc!==null?zpc.toFixed(2):null); zpcGlobal=zpc; if(zpc!==null&&Math.abs(zpc)>2) alertas.push('Perímetro cefálico fuera de rango — referir a pediatría.'); }
    if(det && det.diffDias<=28){ const dRN=clasifRN(peso*1000); cards+=tarjeta('Peso al nacer/RN (0-28 días)', `${(peso*1000).toFixed(0)} g`, dRN); if(dRN.d.includes('grave')) alertas.push('Recién nacido con bajo peso grave — referir URGENTEMENTE al hospital.'); }
    if(zpt===null && talla) alertas.push(`Peso/Talla sin calcular: la talla (${talla} cm) está fuera del rango OMS de peso para la ${em>=24?'talla (65–120 cm)':'longitud (45–110 cm)'}. Valore con Talla/Edad e IMC.`);
    if(dpt.d.includes('grave')) alertas.push('Desnutrición aguda GRAVE — referencia urgente al hospital, iniciar ATLU.');
    else if(dpt.d.includes('moderad')) alertas.push('Desnutrición aguda moderada — manejo ambulatorio y seguimiento estrecho.');
    if(dte.d==='Talla baja') alertas.push('Talla baja — evaluar lactancia y descartar enfermedades asociadas.');
    tabDatos.pe = {z:zpe,d:dpe.d,aplica:true};
    tabDatos.te = {z:zte,d:dte.d,aplica:true};
    tabDatos.pt = {z:zpt,d:dpt.d,aplica:true};
    curvasHTML += gaugeZ('Peso/Edad (P/E)', zpe);
    curvasHTML += gaugeZ('Talla/Edad (T/E)', zte);
    curvasHTML += gaugeZ('Peso/Talla (P/T)', zpt);
    curvasHTML += gaugeZ('Perímetro cefálico/Edad', zpcGlobal);
  } else if(grupo==='5-12a'||grupo==='12-17a'){
    const imc = peso/Math.pow(talla/100,2);
    const refIMC = getRefIMC512(det ? det.totalMeses/12 : eaAnios);
    const z = refIMC ? (imc-refIMC.m)/refIMC.s : null;
    const esAdolAiepi = em >= 120;
    if(esAdolAiepi){
      const chk = id => { const e = document.getElementById(id); return !!(e && e.checked); };
      const sg = {enflaq:chk('ad_enflaq'), palidez:chk('ad_palidez'), distorsion:chk('ad_distorsion'), hta:chk('ad_hta')};
      const ra = aiepiAdolescente(z, sg);
      window.ADOL_AIEPI = ra; diagPrincipal = ra.principal; zPrincipal = z;
      ra.alertas.forEach(a => alertas.push(a));
      if(sg.enflaq || sg.palidez || sg.distorsion || sg.hta){
        const lista = [sg.enflaq&&'enflaquecimiento extremo', sg.palidez&&'palidez palmar intensa', sg.distorsion&&'distorsión de la imagen corporal', sg.hta&&'hipertensión arterial'].filter(Boolean).join(' · ');
        cards += tarjeta('Signos clínicos (AIEPI 2021)', lista, {d:'Presentes', c:(sg.enflaq||sg.palidez)?'red':'yellow'});
      }
    } else { diagPrincipal = clasifIMC512(z); zPrincipal = z; }
    const refTE2 = getRefTE(sexo,em);
    const zte2 = zRef(talla, refTE2);
    const dte2 = clasifTE(zte2);
    cards += tarjeta('Talla/Edad (hasta 18 años)', `${talla.toFixed(1)} cm`, dte2, zte2!==null?zte2.toFixed(2):null);
    cards += tarjeta('IMC/Edad', `IMC: ${imc.toFixed(1)} kg/m²`, diagPrincipal, z!==null?z.toFixed(2):null);
    if(diagPrincipal.d.includes('grave')) alertas.push('Desnutrición grave — referir URGENTEMENTE al hospital.');
    if(dte2.d==='Talla baja') alertas.push('Talla baja para la edad — evaluar antecedentes nutricionales y descartar enfermedades asociadas.');
    tabDatos.imc512 = {z:z,d:diagPrincipal.d,aplica:true};
    tabDatos.te = {z:zte2,d:dte2.d,aplica:true};
    curvasHTML += gaugeZ('IMC/Edad', z);
    curvasHTML += gaugeZ('Talla/Edad (T/E)', zte2);
  } else if(grupo==='adulto_joven'){
    const imc = peso/Math.pow(talla/100,2);
    diagPrincipal = clasifIMCadulto(imc);
    cards += tarjeta('IMC adulto (OMS 18-59a)', `IMC: ${imc.toFixed(1)} kg/m²`, diagPrincipal);
    tabDatos.imc512 = {z:null,d:diagPrincipal.d,aplica:true};
  } else if(grupo==='am'){
    const imc = peso/Math.pow(talla/100,2);
    diagPrincipal = clasifIMCam(imc);
    cards += tarjeta('IMC adulto mayor (≥60 años, Cuadro 7 MSyD)', `IMC: ${imc.toFixed(1)} kg/m²`, diagPrincipal);
    tabDatos.imc512 = {z:null,d:diagPrincipal.d,aplica:true};
  } else if(grupo==='embarazada'){
    const estadoGest = document.getElementById('estado_gestacion').value;
    if(estadoGest==='lactancia'){
      const imc = peso/Math.pow(talla/100,2);
      diagPrincipal = clasifIMCadulto(imc);
      cards += tarjeta('IMC (periodo de lactancia)', `IMC: ${imc.toFixed(1)} kg/m²`, diagPrincipal);
      tabDatos.imc512 = {z:null,d:diagPrincipal.d,aplica:true};
    } else {
      const semanas = parseInt(document.getElementById('semanas').value);
      if(semanas){
        const imc = peso/Math.pow(talla/100,2);
        diagPrincipal = clasifIMCgest(imc, semanas);
        cards += tarjeta(`IMC gestacional (semana ${semanas})`, `IMC: ${imc.toFixed(1)} kg/m²`, diagPrincipal);
        if(diagPrincipal.d==='Bajo peso') alertas.push('Bajo peso gestacional — reforzar consejería nutricional y seguimiento mensual.');
        if(diagPrincipal.d==='Obesidad') alertas.push('Obesidad gestacional — riesgo de complicaciones, referir a control especializado.');
        tabDatos.gest = {z:null,d:diagPrincipal.d,aplica:true};
        curvasHTML += gaugeGestacional(imc, semanas);
      } else {
        cards = '<div class="diag-card blue"><div class="diag-title">IMC gestacional</div><div class="diag-value">No calculado</div><div class="diag-sub">Ingrese semanas de gestación para clasificar.</div></div>';
      }
    }
  }
  if(edemaGrado>=2) alertas.push('Signo de peligro presente — evaluación clínica inmediata.');
  if(comorbilidad==='sindrome_down'){
    if(!isNaN(perimCintura)) cards += tarjeta('Perímetro de cintura', `${perimCintura.toFixed(1)} cm`, {d:'Registrado — predictor de riesgo cardiometabólico',c:'blue'});
    alertas.push('Paciente con Síndrome de Down — las curvas OMS estándar pueden sobreestimar talla baja/microcefalia. Ver recomendaciones específicas abajo.');
    document.getElementById('r-down').innerHTML = getRecomendacionesDown(grupo) + (function(){
      let hitosAlcanzados = {motricidadGruesa:[],motricidadFina:[],autoayuda:[],socialComunicacion:[]};
      Object.keys(HITOS_SD).forEach(area=>{
        HITOS_SD[area].forEach(h=>{
          const el = document.getElementById('hito_'+h.id);
          if(el && el.checked) hitosAlcanzados[area].push(h.id);
        });
      });
      const rep = generarReporteEvaluacion(em, hitosAlcanzados);
      const proximos = obtenerProximosHitos(em, 5);
      const colorSev = {NO_APLICA:'blue',EN_RANGO:'green',RETRASO_LEVE:'yellow',RETRASO_MODERADO:'yellow',RETRASO_SEVERO:'red'};
      let html = `<div class="esq-block"><h3>Evaluación del Desarrollo (${rep.totalAlcanzados}/${rep.totalHitos} hitos, ${rep.porcentajeLogrado}%)</h3>`;
      if(rep.alertaMaxima.startsWith('RETRASO')) html += `<div class="alert-box">⚠ Alerta de mayor severidad detectada: <b>${rep.alertaMaxima.replace('_',' ')}</b> — considerar referencia a estimulación temprana/terapia.</div>`;
      Object.keys(rep.areas).forEach(area=>{
        const a = rep.areas[area];
        const retrasados = a.detalle.filter(d=>d.estado.startsWith('RETRASO'));
        html += `<div style="margin-bottom:8px"><b>${a.nombreArea}:</b> ${a.detalle.filter(d=>d.alcanzado).length}/${a.detalle.length} alcanzados`;
        if(retrasados.length){
          html += `<div style="margin-top:3px">` + retrasados.map(d=>`<div class="esq-item"><span class="esq-icon" style="color:${d.estado==='RETRASO_SEVERO'?'#791F1F':'#a05a1f'}">⚠</span><span style="font-size:11.5px">${d.nombre} — <b>${d.estado.replace('_',' ')}</b> (esperado hasta ${d.edadEsperada}m)</span></div>`).join('') + `</div>`;
        }
        html += `</div>`;
      });
      if(proximos.length){
        html += `<div style="margin-top:6px"><b>Próximos objetivos terapéuticos:</b>` + proximos.map(p=>`<div class="esq-item"><span class="esq-icon">🎯</span><span style="font-size:11.5px">[${p.area}] ${p.nombre} (esperado ${p.edadMin}-${p.edadMax}m)</span></div>`).join('') + `</div>`;
      }
      html += `<div style="font-size:9.5px;color:#9a8a6a;margin-top:6px;font-style:italic">Referencia: hitos del desarrollo poblacional general, usados para cuantificar la brecha respecto al desarrollo típico — método habitual de seguimiento en Síndrome de Down.</div>`;
      html += `</div>`;
      return html;
    })();
    document.getElementById('bloque-down').style.display='block';
  } else {
    document.getElementById('bloque-down').style.display='none';
  }

  if(comorbilidad==='gastritis'){
    document.getElementById('bloque-gastritis').style.display='block';
    document.getElementById('r-gastritis').innerHTML = getRecomendacionesGastritis(grupo);
  } else {
    document.getElementById('bloque-gastritis').style.display='none';
  }

  const nacioPrematuro = document.getElementById('prematuro_check') && document.getElementById('prematuro_check').checked;
  let edadCorregidaHTML = '';
  if(nacioPrematuro){
    const semanasGestNacer = parseInt(document.getElementById('semanas_gest_nacer').value);
    if(semanasGestNacer && semanasGestNacer>=22 && semanasGestNacer<=40){
      const ec = calcularEdadCorregida(fnCheck, getFechaEvaluacion(), semanasGestNacer);
      const semanaPM = semanasGestNacer + ec.semanasCronologicas;
      let fentonHTML = '';
      if(semanaPM>=22 && semanaPM<=50){
        const ref = getFentonRef(semanaPM, sexo);
        if(ref){
          const zf = zLMS(peso*1000, ref.L, ref.M, ref.S);
          const diagF = clasifFenton(zf);
          const pctF = zToPercentil(zf);
          fentonHTML = `<div class="esq-item"><span class="esq-icon">⚖️</span><span><b>Peso según Fenton 2013</b> (edad postmenstrual ${semanaPM.toFixed(2)} sem, interpolado): <b>${diagF.d}</b> — Z: ${zf.toFixed(3)} · Percentil ${pctF.toFixed(2)} · P50 referencia: ${ref.M.toFixed(0)}g</span></div>`;
          if(diagF.d.includes('PEG')||diagF.d.includes('GEG')) alertas.push(`Fenton 2013: ${diagF.d} — evaluar con neonatología/pediatría.`);
        }
      } else {
        fentonHTML = `<div class="esq-item"><span class="esq-icon">ℹ️</span><span>Edad postmenstrual (${semanaPM.toFixed(1)} sem) fuera del rango Fenton (22-50 sem) — a partir de aquí usar curvas OMS con la <b>edad corregida</b>.</span></div>`;
      }
      let omsCorregidaHTML = '';
      const emCorregida = Math.round(ec.mesesCorregidos);
      if(ec.usarEdadCorregida && emCorregida>=0){
        const refPEc = getRefPE(sexo, emCorregida);
        const zpec = zRef(peso, refPEc);
        const refTEc = getRefTE(sexo, emCorregida);
        const ztec = zRef(talla, refTEc);
        omsCorregidaHTML = `
        <div class="esq-item"><span class="esq-icon">📈</span><span>P/E con edad corregida (${emCorregida}m): ${zpec!==null?clasificarZ(zpec).d+' (Z: '+zpec.toFixed(2)+')':'sin datos'}</span></div>
        <div class="esq-item"><span class="esq-icon">📈</span><span>T/E con edad corregida (${emCorregida}m): ${ztec!==null?clasifTE(ztec).d+' (Z: '+ztec.toFixed(2)+')':'sin datos'}</span></div>`;
      }
      edadCorregidaHTML = `
      <div class="integral-box" style="margin-bottom:8px">
        <b>Semanas de gestación al nacer:</b> ${semanasGestNacer} · <b>Semanas de prematuridad:</b> ${ec.semanasPrematuridad}<br>
        <b>Edad cronológica:</b> ${ec.mesesCronologicos.toFixed(1)} meses (${ec.diasCronologicos} días)<br>
        <b>Edad corregida:</b> ${ec.mesesCorregidos.toFixed(1)} meses (${ec.diasCorregidos} días)<br>
        ${ec.usarEdadCorregida ? '<b>✓ Usar edad corregida</b> para interpretar curvas de crecimiento (válido hasta los 24 meses corregidos).' : '<b>Edad corregida &gt; 24 meses:</b> ya no es necesario corregir, usar edad cronológica.'}
      </div>
      ${fentonHTML}
      ${omsCorregidaHTML}`;
    } else {
      edadCorregidaHTML = '<div style="font-size:12.5px;color:#5c6b82">Ingrese las semanas de gestación al nacer (22-40) para calcular la edad corregida.</div>';
    }
    document.getElementById('bloque-edad-corregida').style.display='block';
  } else {
    document.getElementById('bloque-edad-corregida').style.display='none';
  }
  document.getElementById('r-edad-corregida').innerHTML = edadCorregidaHTML;

  document.getElementById('r-nombre').textContent = nombre;
  document.getElementById('r-info').textContent = `${sexo==='M'?'Masculino':'Femenino'} · ${edadStr} · Grupo: ${document.getElementById('grupo').selectedOptions[0].text}`;
  document.getElementById('r-alerta').innerHTML = alertas.length ? `<div class="alert-box">⚠ ${alertas.join('<br>⚠ ')}</div>` : '';
  document.getElementById('r-indicadores').innerHTML = cards;
  document.getElementById('r-curvas').innerHTML = curvasHTML || '<div style="font-size:12.5px;color:#5c6b82">Este grupo etario (adulto joven, adulto mayor o lactancia) usa puntos de corte fijos de la OMS/MSyD y no cuenta con curva de crecimiento por percentil.</div>';

  const filas = [
    {n:'Peso/Edad (P/E)', d:tabDatos.pe},
    {n:'Talla/Edad (T/E)', d:tabDatos.te},
    {n:'Peso/Talla (P/T)', d:tabDatos.pt},
    {n:'IMC/Edad (5-17a) o IMC adulto/mayor', d:tabDatos.imc512},
    {n:'IMC gestacional', d:tabDatos.gest}
  ];
  document.getElementById('r-tabla-ind-body').innerHTML = filas.map(f=>{
    const aplica = f.d && f.d.aplica;
    return `<tr><td style="padding:5px;border:1px solid #ecdfc0">${f.n}</td>
      <td style="padding:5px;border:1px solid #ecdfc0;text-align:center">${aplica?'Aplica':'No aplica'}</td>
      <td style="padding:5px;border:1px solid #ecdfc0;text-align:center">${aplica&&f.d.z!==null&&f.d.z!==undefined?f.d.z.toFixed(2):(aplica?'—':'N/A')}</td>
      <td style="padding:5px;border:1px solid #ecdfc0;text-align:center">${aplica?f.d.d:'—'}</td></tr>`;
  }).join('');

  if(grupo==='6-24m'||grupo==='2-5a'){
    const ac = getAlimentacionComplementaria(em);
    if(ac){
      document.getElementById('r-alim-complementaria').innerHTML = `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:11px">
        <tbody>
          <tr><td style="padding:4px;border:1px solid #ecdfc0;font-weight:700;background:#f3efe0">Edad</td><td style="padding:7px 8px;border:1.5px solid var(--line);color:var(--ink)">${ac.label}</td></tr>
          <tr><td style="padding:4px;border:1px solid #ecdfc0;font-weight:700;background:#f3efe0">Frecuencia</td><td style="padding:7px 8px;border:1.5px solid var(--line);color:var(--ink)">${ac.frecuencia}</td></tr>
          <tr><td style="padding:4px;border:1px solid #ecdfc0;font-weight:700;background:#f3efe0">Cantidad orientativa</td><td style="padding:7px 8px;border:1.5px solid var(--line);color:var(--ink)">${ac.cantidad}</td></tr>
          <tr><td style="padding:4px;border:1px solid #ecdfc0;font-weight:700;background:#f3efe0">Textura</td><td style="padding:7px 8px;border:1.5px solid var(--line);color:var(--ink)">${ac.textura}</td></tr>
          <tr><td style="padding:4px;border:1px solid #ecdfc0;font-weight:700;background:#f3efe0">Alimentos recomendados</td><td style="padding:7px 8px;border:1.5px solid var(--line);color:var(--ink)">${ac.alimentos}</td></tr>
          <tr><td style="padding:4px;border:1px solid #ecdfc0;font-weight:700;background:#f3efe0">Nutriente prioritario</td><td style="padding:7px 8px;border:1.5px solid var(--line);color:var(--ink)"><b>${ac.nutriente}</b></td></tr>
        </tbody>
      </table></div>`;
      document.getElementById('bloque-alim-complementaria').style.display='block';
    } else { document.getElementById('bloque-alim-complementaria').style.display='none'; }
  } else { document.getElementById('bloque-alim-complementaria').style.display='none'; }

  const alimTxt = 'no registrada';

  const pesoAnterior = pF(document.getElementById('peso_anterior').value);
  let cambioPesoTxt = '';
  if(!isNaN(pesoAnterior) && pesoAnterior>0 && !isNaN(peso)){
    const delta = peso-pesoAnterior;
    const pct = (delta/pesoAnterior*100).toFixed(1);
    cambioPesoTxt = `Peso anterior: ${pesoAnterior} kg (variación: ${delta>=0?'+':''}${delta.toFixed(2)} kg, ${pct}%). `;
  }
  const piVal = document.getElementById('peso_ideal').value;
  const piDet = document.getElementById('pi-detalle') ? document.getElementById('pi-detalle').textContent : '';
  if(piVal){
    cambioPesoTxt += `${(window.PI_INFO&&window.PI_INFO.metodo)||'Peso ideal'}: ${piVal}`;
    if(piDet) cambioPesoTxt += ` [${piDet.replace(/\s+/g,' ').trim()}]`;
    cambioPesoTxt += '. ';
  }

  const historialTxt = '';
  const signosTxt = [];

  const integral = `<b>Diagnóstico antropométrico principal:</b> ${diagPrincipal.d}${zPrincipal!==null?` (Z: ${zPrincipal.toFixed(2)})`:''}.<br><br>
  <b>Peso y variación:</b> ${cambioPesoTxt||'sin datos previos registrados'}`;
  document.getElementById('r-integral').innerHTML = integral;

  document.getElementById('r-prestaciones').innerHTML = getPrestaciones(grupo,em,eaAnios,document.getElementById('estado_gestacion').value).map(p=>`<div class="esq-item"><span class="esq-icon">✓</span><span>${p}</span></div>`).join('');
  try { renderSusSeleccionEnResultados(); } catch(e) {}

  const respaldoLey475 = renderRespaldoLey475(diagPrincipal.d, grupo, em, document.getElementById('estado_gestacion').value);
  document.getElementById('r-suplementacion').innerHTML = getSuplementacion(grupo,em,eaAnios,peso,diagPrincipal.d,signos,document.getElementById('estado_gestacion').value).map(p=>`<div class="esq-item"><span class="esq-icon">💊</span><span>${p}</span></div>`).join('');
  try { renderCatalogoLiname(grupo, diagPrincipal.d); } catch(e) { console.warn(e); }
  document.getElementById('r-control').textContent = comorbilidad==='sindrome_down' ? getControlDown(grupo) : getProximoControl(grupo,em,diagPrincipal.d,signos);

  const grave = /grave/i.test((diagPrincipal && diagPrincipal.d) || '') || document.getElementById('edema_grado').value !== '0';
  const agua = aguaAntro(peso, sexo, eaAnios, em, grupo, (document.getElementById('estado_gestacion')||{}).value, grave);
  window.AGUA_ANTRO = agua;
  document.getElementById('r-agua').innerHTML = agua
    ? `<b>${agua.ml.toFixed(0)} ml/día</b> (≈ ${(agua.ml/1000).toFixed(2)} litros/día) — ${agua.metodo} · ${agua.grupo}. ${agua.detalle}<span style="display:block;font-size:12px;color:var(--muted);margin-top:3px;line-height:1.4"> ${agua.nota}</span>`
    : 'Peso no registrado — no se puede calcular';

  let edadParaPorciones = eaAnios;
  if(grupo==='2-5a' && eaAnios<2) edadParaPorciones = 2;
  let porcionesHTML = '';
  if(grupo==='0-6m'||grupo==='6-24m'){
    porcionesHTML = '<div style="font-size:12.5px;color:#5c6b82">Alimentación basada en lactancia materna / complementaria según edad. La tabla de porciones por grupos de alimentos aplica a partir de los 2 años.</div>';
  } else {
    const p = getPorciones(edadParaPorciones);
    if(p){
      porcionesHTML = `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead><tr style="background:var(--soft)"><th style="padding:7px 8px;border:1.5px solid var(--line);color:var(--ink)">Cereales</th><th style="padding:7px 8px;border:1.5px solid var(--line);color:var(--ink)">Verduras</th><th style="padding:7px 8px;border:1.5px solid var(--line);color:var(--ink)">Frutas</th><th style="padding:7px 8px;border:1.5px solid var(--line);color:var(--ink)">Lácteos</th><th style="padding:7px 8px;border:1.5px solid var(--line);color:var(--ink)">Proteínas</th><th style="padding:7px 8px;border:1.5px solid var(--line);color:var(--ink)">Grasas</th></tr></thead>
        <tbody><tr><td style="padding:7px 8px;border:1.5px solid var(--line);text-align:center;color:var(--ink)">${p.cereales}</td><td style="padding:7px 8px;border:1.5px solid var(--line);text-align:center;color:var(--ink)">${p.verduras}</td><td style="padding:7px 8px;border:1.5px solid var(--line);text-align:center;color:var(--ink)">${p.frutas}</td><td style="padding:7px 8px;border:1.5px solid var(--line);text-align:center;color:var(--ink)">${p.lacteos}</td><td style="padding:7px 8px;border:1.5px solid var(--line);text-align:center;color:var(--ink)">${p.proteinas}</td><td style="padding:7px 8px;border:1.5px solid var(--line);text-align:center;color:var(--ink)">${p.grasas}</td></tr></tbody>
      </table></div>
      <div style="font-size:12px;margin-top:6px"><b>Referencia:</b> ${p.label} (porciones/día) · <b>Nutrientes prioritarios:</b> ${p.nutrientes}</div>`;
      if(grupo==='embarazada'){
        const estadoGest = document.getElementById('estado_gestacion').value;
        if(estadoGest==='lactancia'){
          const etapa = document.getElementById('etapa_lactancia').value;
          const l = LACTANCIA_ETAPAS[etapa];
          porcionesHTML += `<div class="integral-box" style="margin-top:8px"><b>Ajuste por lactancia (${l.label}):</b> ${l.ajuste}<br><b>Nutrientes prioritarios:</b> ${l.nutrientes}</div>`;
        } else {
          const semanasVal = parseInt(document.getElementById('semanas').value);
          if(semanasVal){
            const t = TRIMESTRES[getTrimestre(semanasVal)];
            porcionesHTML += `<div class="integral-box" style="margin-top:8px"><b>Ajuste por trimestre (${t.label}, semana ${semanasVal}):</b> ${t.ajuste}<br><b>Nutrientes prioritarios:</b> ${t.nutrientes}</div>`;
          }
        }
      }
    } else {
      porcionesHTML = '<div style="font-size:12.5px;color:#5c6b82">Edad fuera del rango cubierto por esta tabla de referencia.</div>';
    }
  }
  document.getElementById('r-porciones').innerHTML = porcionesHTML;

  const manejoHTML = getManejo10Pasos(diagPrincipal.d, grupo, em, peso, edemaGrado);
  if(manejoHTML){ document.getElementById('r-manejo10').innerHTML = manejoHTML; document.getElementById('bloque-manejo10').style.display='block'; }
  else { document.getElementById('bloque-manejo10').style.display='none'; }

  let rec = '';
  if(diagPrincipal.d.includes('grave')) rec = 'Referir <b>URGENTEMENTE</b> al hospital/centro de salud de mayor capacidad resolutiva. Iniciar manejo inmediato según protocolo, prevenir hipotermia e hipoglucemia.';
  else if(diagPrincipal.d.includes('moderad')||diagPrincipal.d==='Talla baja'||diagPrincipal.d==='Bajo peso') rec = 'Manejo ambulatorio activo: consejería nutricional intensiva, suplementación según esquema, y seguimiento estrecho según cronograma sugerido.';
  else if(diagPrincipal.d.includes('Sobrepeso')||diagPrincipal.d.includes('Obesidad')) rec = 'Evaluar patrón de alimentación y actividad física, brindar consejería para corrección de hábitos, referir si no hay mejoría.';
  else if(diagPrincipal.d==='Sin datos antropométricos') rec = 'Completar peso y talla en una próxima consulta para obtener el diagnóstico nutricional completo.';
  else rec = 'Elogiar a la madre/paciente, continuar controles de crecimiento y desarrollo según calendario del MSyD, reforzar prácticas de alimentación saludable según edad.';
  document.getElementById('r-rec-text').innerHTML = rec;

  ultimoReporte = {ts:Date.now(),fecha:getFechaEvaluacion().toLocaleDateString('es-BO'),nombre,sexo,edadStr,grupoTxt:document.getElementById('grupo').selectedOptions[0].text,comorbilidadTxt:document.getElementById('comorbilidad').selectedOptions[0].text,responsable,establecimiento,peso:isNaN(peso)?'No registrado':peso,talla:isNaN(talla)?'No registrada':talla,pc:isNaN(pc)?'No registrado':pc,alimTxt,signosTxt,antecedentes,diagPrincipal:diagPrincipal.d,cardsTxt:cards.replace(/<[^>]+>/g,' '),integral:integral.replace(/<[^>]+>/g,''),prestaciones:getPrestaciones(grupo,em,eaAnios,document.getElementById('estado_gestacion').value),ley475:respaldoLey475.map(p=>`${p.c} — ${p.d} (Nivel ${p.n})${p.o?': '+p.o:''}`),suplementacion:getSuplementacion(grupo,em,eaAnios,peso,diagPrincipal.d,signos,document.getElementById('estado_gestacion').value),control:getProximoControl(grupo,em,diagPrincipal.d,signos),rec:rec.replace(/<[^>]+>/g,''),alertas,agua:agua?`${agua.ml.toFixed(0)} ml/día (${(agua.ml/1000).toFixed(2)} L) — ${agua.metodo} · ${agua.grupo}`:'No calculada'};
  try {
    window.__PREST_ACT = ultimoReporte.prestaciones; window.__SUP_ACT = ultimoReporte.suplementacion;
    const sint = renderSintesisPrestaciones(grupo, diagPrincipal.d, respaldoLey475);
    ultimoReporte.sintesis = sint.lineas;
  } catch(e){ console.warn('síntesis', e); }
  ultimoReporte.dosisSeleccion = antroSusSeleccion.filter(x=>x.tipo==='liname').map(x=>{
    const m = (LINAME_CATALOGO.find(L=>L.liname===x.id)||{}).m || x.titulo;
    const t = dosisKgHTML(m).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').replace(/Referencia orientativa.*$/,'').trim();
    return x.id+' '+m+' — '+t;
  });

  document.getElementById('form-section').style.display='none';
  document.getElementById('result').style.display='block';
  // Auto-guardar evaluación en IndexedDB (teléfono)
  try { guardarPacienteIDB(true); } catch(e) { console.warn('IDB auto-save', e); }
}

function descargarHistoria(){
  if(!ultimoReporte) return;
  const r = ultimoReporte;
  const fecha = r.fecha;
  const texto = `HISTORIA CLÍNICA NUTRICIONAL
Ministerio de Salud y Deportes - Estado Plurinacional de Bolivia
Fecha de evaluación: ${fecha}
========================================================
DATOS DEL PACIENTE
Nombre: ${r.nombre}
Sexo: ${r.sexo==='M'?'Masculino':'Femenino'}
Edad: ${r.edadStr}
Grupo etario: ${r.grupoTxt}
Comorbilidad: ${r.comorbilidadTxt||'Ninguna'}
Responsable: ${r.responsable||'No registrado'}
Establecimiento: ${r.establecimiento||'No registrado'}

MEDIDAS
Peso: ${r.peso} kg | Talla: ${r.talla} cm | PC: ${r.pc} cm

RESULTADOS ANTROPOMÉTRICOS
${r.cardsTxt}

DIAGNÓSTICO INTEGRAL
${r.integral}

ALERTAS
${r.alertas.length? r.alertas.map(a=>'- '+a).join('\n') : 'Sin alertas'}

${(r.sintesis&&r.sintesis.length) ? 'PRESTACIONES DEL SUS Y TRATAMIENTO\n'+r.sintesis.map(p=>'- '+p).join('\n')+'\n' : 'PRESTACIONES MSyD CORRESPONDIENTES\n'+r.prestaciones.map(p=>'- '+p).join('\n')+'\n\nRESPALDO NORMATIVO — PRESTACIONES DEL SUS\n'+(r.ley475.length? r.ley475.map(p=>'- '+p).join('\n') : 'Sin código específico identificado en el catálogo para este diagnóstico.')+'\n\nESQUEMA DE SUPLEMENTACIÓN / TRATAMIENTO\n'+r.suplementacion.map(p=>'- '+p).join('\n')+'\n'}${(r.dosisSeleccion&&r.dosisSeleccion.length)?'\nDOSIS POR PESO DE FÁRMACOS MARCADOS (orientativa, validar con norma vigente)\n'+r.dosisSeleccion.map(p=>'- '+p).join('\n')+'\n':''}
REQUERIMIENTO DE AGUA (AUTOMÁTICO POR GRUPO ETARIO)
${r.agua}

PRÓXIMO CONTROL SUGERIDO
${r.control}

PLAN DE MANEJO
${r.rec}
========================================================
Documento generado por NutriAndes — herramienta de apoyo al
diagnóstico nutricional comunitario. No sustituye la valoración
clínica presencial del personal de salud.
`;
  const blob = new Blob([texto], {type:'text/plain;charset=utf-8'});
  nutriGuardarArchivo(`historia_nutricional_${r.nombre.replace(/\s+/g,'_')}.txt`, blob);
}

function volverForm(){ document.getElementById('form-section').style.display='block'; document.getElementById('result').style.display='none'; }
function limpiar(){
  ['nombre','responsable','establecimiento','peso','talla','pc','semanas','fpp','peso_anterior','peso_ideal','muneca','alt_rodilla','talla_chumlea','media_envergadura','talla_envergadura','anio_nac','perimetro_cintura'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  const piDet = document.getElementById('pi-detalle'); if(piDet) piDet.textContent='';
  ['sexo','fecnac','grupo'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('comorbilidad').value='ninguna';
  toggleComorbilidad();
  document.querySelectorAll('#hitos-checklist input[type="checkbox"]').forEach(cb=>cb.checked=false);
  document.getElementById('prematuro_check').checked=false;
  document.getElementById('semanas_gest_nacer').value='';
  togglePrematuro();
  toggleAdolescente();
  if(typeof updateFormProgress==='function') updateFormProgress();
  document.getElementById('estado_gestacion').value='embarazada';
  document.getElementById('etapa_lactancia').value='0-6m';
  toggleEstadoGestacion();
  document.getElementById('edema_grado').value='0';
  document.getElementById('fecha_evaluacion').value = new Date().toISOString().split('T')[0];
  document.getElementById('edad-display').textContent=''; document.getElementById('grupo-warn').textContent='';
  toggleCamposGrupo();
  try{ limpiarSusSeleccionAntro(); }catch(e){}   /* no arrastrar prestaciones marcadas del paciente anterior */
  volverForm();
}
