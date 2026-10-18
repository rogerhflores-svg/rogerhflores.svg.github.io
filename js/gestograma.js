/* NutriAndes — gestograma y manejo de gastritis */
/* ===== GESTOGRAMA ===== */
let gFUM = null, gSemanaSel = 1;
const MESES_ABR = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
function fechaSemana(sem){
  if(!gFUM) return null;
  const f = new Date(gFUM); f.setDate(f.getDate() + (sem-1)*7); return f;
}
function fmtCorta(f){ return f.getDate()+' '+MESES_ABR[f.getMonth()]; }
function fmtLarga(f){ return f.toLocaleDateString('es-BO',{weekday:'long',year:'numeric',month:'long',day:'numeric'}); }
function dibujarRueda(){
  const marks = document.getElementById('g_wheelMarks');
  if(!marks) return;
  const cx=200, cy=200, total=42, startAngle=-90, ang=360/total;
  const font = "Nunito Sans,DM Sans,system-ui,sans-serif";
  let html='';

  // Sectores de trimestre (anillo exterior)
  function sectorPath(fromSem, toSem, rIn, rOut){
    const a0 = (startAngle + (fromSem-1)*ang) * Math.PI/180;
    const a1 = (startAngle + toSem*ang) * Math.PI/180;
    const large = (toSem-fromSem+1) > 21 ? 1 : 0;
    const x0o=cx+Math.cos(a0)*rOut, y0o=cy+Math.sin(a0)*rOut;
    const x1o=cx+Math.cos(a1)*rOut, y1o=cy+Math.sin(a1)*rOut;
    const x1i=cx+Math.cos(a1)*rIn, y1i=cy+Math.sin(a1)*rIn;
    const x0i=cx+Math.cos(a0)*rIn, y0i=cy+Math.sin(a0)*rIn;
    return `M ${x0o.toFixed(1)} ${y0o.toFixed(1)} A ${rOut} ${rOut} 0 ${large} 1 ${x1o.toFixed(1)} ${y1o.toFixed(1)} L ${x1i.toFixed(1)} ${y1i.toFixed(1)} A ${rIn} ${rIn} 0 ${large} 0 ${x0i.toFixed(1)} ${y0i.toFixed(1)} Z`;
  }
  html += `<path d="${sectorPath(1,13,151,195)}" fill="rgba(245,163,192,0.22)"/>`;
  html += `<path d="${sectorPath(14,27,151,195)}" fill="rgba(142,197,227,0.28)"/>`;
  html += `<path d="${sectorPath(28,42,151,195)}" fill="rgba(212,138,170,0.20)"/>`;

  // Cuña de selección
  if(gSemanaSel>=1 && gSemanaSel<=42){
    const a0 = (startAngle + (gSemanaSel-1)*ang - ang*0.45) * Math.PI/180;
    const a1 = (startAngle + (gSemanaSel-1)*ang + ang*0.45) * Math.PI/180;
    const rIn=76, rOut=195;
    const x0o=cx+Math.cos(a0)*rOut, y0o=cy+Math.sin(a0)*rOut;
    const x1o=cx+Math.cos(a1)*rOut, y1o=cy+Math.sin(a1)*rOut;
    const x1i=cx+Math.cos(a1)*rIn, y1i=cy+Math.sin(a1)*rIn;
    const x0i=cx+Math.cos(a0)*rIn, y0i=cy+Math.sin(a0)*rIn;
    html += `<path d="M ${x0o.toFixed(1)} ${y0o.toFixed(1)} A ${rOut} ${rOut} 0 0 1 ${x1o.toFixed(1)} ${y1o.toFixed(1)} L ${x1i.toFixed(1)} ${y1i.toFixed(1)} A ${rIn} ${rIn} 0 0 0 ${x0i.toFixed(1)} ${y0i.toFixed(1)} Z" fill="rgba(212,84,138,0.14)" stroke="rgba(212,84,138,0.35)" stroke-width="0.8"/>`;
  }

  for(let i=0;i<total;i++){
    const sem=i+1, a=startAngle+i*ang, rad=a*Math.PI/180;
    const sel = sem===gSemanaSel;
    const esTrim = sem===1||sem===14||sem===28||sem===42;
    const esMayor = sem%5===0 || esTrim;

    // Marcas
    const rIn = 151, rOut = esMayor ? 195 : 186;
    html += `<line x1="${(cx+Math.cos(rad)*rIn).toFixed(1)}" y1="${(cy+Math.sin(rad)*rIn).toFixed(1)}" x2="${(cx+Math.cos(rad)*rOut).toFixed(1)}" y2="${(cy+Math.sin(rad)*rOut).toFixed(1)}" stroke="${sel?'#d4548a':(esTrim?'#c25b7f':(esMayor?'#6a9db8':'#a8cfe3'))}" stroke-width="${sel?2.4:(esTrim?2:(esMayor?1.3:0.7))}" stroke-linecap="round"/>`;

    // Números
    const rNum = 129;
    const tx=cx+Math.cos(rad)*rNum, ty=cy+Math.sin(rad)*rNum;
    const numSize = sel ? 13 : (esMayor ? 10.5 : 9);
    const numFill = sel ? '#ffffff' : (esTrim ? '#9a3d66' : '#3a5568');
    if(sel){
      html += `<circle cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="14" fill="#d4548a"/>`;
      html += `<circle cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="14" fill="none" stroke="#fff" stroke-width="2" opacity="0.55"/>`;
    } else if(esMayor){
      html += `<circle cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="10" fill="rgba(255,255,255,0.55)"/>`;
    }
    html += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" fill="${numFill}" font-family="${font}" font-size="${numSize}" font-weight="${sel||esMayor?'700':'600'}" text-anchor="middle" dominant-baseline="central">${sem}</text>`;

    // Fechas todas
    const f = fechaSemana(sem);
    if(f){
      const rFecha = 172.5;
      const fx=cx+Math.cos(rad)*rFecha, fy=cy+Math.sin(rad)*rFecha;
      let rotF = a + 90;
      if(rotF > 90 && rotF < 270) rotF += 180;
      const fSize = sel ? 8.2 : (esMayor ? 7.2 : 6.6);
      const fFill = sel ? '#1a3d55' : '#3d6480';
      const fW = sel || esTrim ? '700' : '500';
      html += `<text x="${fx.toFixed(1)}" y="${fy.toFixed(1)}" fill="${fFill}" font-family="${font}" font-size="${fSize}" font-weight="${fW}" text-anchor="middle" dominant-baseline="central" transform="rotate(${rotF.toFixed(1)}, ${fx.toFixed(1)}, ${fy.toFixed(1)})" opacity="${sel?1:0.9}">${fmtCorta(f)}</text>`;
    }
  }

  // Aguja
  const aSel = (startAngle + (gSemanaSel-1)*ang) * Math.PI/180;
  const tipX = cx + Math.cos(aSel)*145;
  const tipY = cy + Math.sin(aSel)*145;
  html += `<line x1="200" y1="200" x2="${tipX.toFixed(1)}" y2="${tipY.toFixed(1)}" stroke="#d4548a" stroke-width="2.8" stroke-linecap="round"/>`;
  html += `<circle cx="200" cy="200" r="6" fill="#d4548a" stroke="#fff" stroke-width="2"/>`;

  // Etiquetas trimestre
  const trimLabels = [
    {label:'1.er', mid:7, color:'#c46b8e'},
    {label:'2.do', mid:20.5, color:'#5a8fad'},
    {label:'3.er', mid:35, color:'#b06080'}
  ];
  trimLabels.forEach(t=>{
    const a = (startAngle + (t.mid-1)*ang) * Math.PI/180;
    const r = 92;
    const x = cx + Math.cos(a)*r, y = cy + Math.sin(a)*r;
    html += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" fill="${t.color}" font-family="${font}" font-size="9" font-weight="700" text-anchor="middle" dominant-baseline="central" opacity="0.8">${t.label}</text>`;
  });

  marks.innerHTML = html;
}
function seleccionarSemana(sem){
  gSemanaSel = Math.max(1, Math.min(42, sem));
  document.getElementById('g_slider').value = gSemanaSel;
  document.getElementById('g_semanasValor').textContent = gSemanaSel;
  const f = fechaSemana(gSemanaSel);
  const trim = gSemanaSel<=13?'Primer trimestre':(gSemanaSel<=27?'Segundo trimestre':'Tercer trimestre');
  document.getElementById('g_fechaCentro').textContent = f ? fmtCorta(f) : '';
  document.getElementById('g_detalleSemana').innerHTML = f
    ? `<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap"><span style="font-size:15px;font-weight:800;color:#d4548a">Semana ${gSemanaSel}</span><span style="font-size:12px;font-weight:600;color:var(--muted)">${trim}</span></div><div style="margin-top:4px">Inicia el <b>${fmtLarga(f)}</b></div>`
    : 'Ingrese la FUM para explorar las semanas.';
  dibujarRueda();
  if(typeof gmResaltar==='function') gmResaltar(gSemanaSel);
}
function anguloASemana(ev, svg){
  const r = svg.getBoundingClientRect();
  const p = ev.touches ? ev.touches[0] : ev;
  const x = ((p.clientX - r.left)/r.width)*400 - 200;
  const y = ((p.clientY - r.top)/r.height)*400 - 200;
  let a = Math.atan2(y, x)*180/Math.PI + 90;
  if(a<0) a += 360;
  return Math.round(a/(360/42)) + 1;
}
function initRuedaInteractiva(){
  const svg = document.getElementById('g_svg');
  if(!svg || svg.dataset.init) return;
  let activo = false;
  const mover = e=>{ if(!activo) return; e.preventDefault(); seleccionarSemana(anguloASemana(e, svg)); };
  svg.addEventListener('pointerdown', e=>{ activo=true; seleccionarSemana(anguloASemana(e, svg)); });
  svg.addEventListener('pointermove', mover);
  window.addEventListener('pointerup', ()=>{ activo=false; });
  svg.dataset.init='1';
}
function calcularGesto(){
  const v = document.getElementById('g_fechaInicio').value;
  const res = document.getElementById('g_resultado');
  const peso = pF(document.getElementById('g_peso').value);
  const talla = pF(document.getElementById('g_talla').value);
  const semManual = parseInt(document.getElementById('g_semanas_manual').value, 10);

  // IMC gestacional (puede calcularse aunque falte FUM si hay semanas manuales)
  let imcHtml = '';
  if(!isNaN(peso) && peso > 0 && !isNaN(talla) && talla > 0){
    const imc = peso / Math.pow(talla/100, 2);
    let semParaImc = (!isNaN(semManual) && semManual >= 4 && semManual <= 42) ? semManual : null;
    if(semParaImc === null && v){
      const fumTmp = new Date(v+'T12:00:00');
      const hoyT = getFechaEvaluacion();
      const diasT = Math.floor((hoyT - fumTmp)/86400000);
      const semT = Math.floor(diasT/7);
      if(semT >= 4 && semT <= 42) semParaImc = semT;
    }
    if(semParaImc){
      const cl = clasifIMCgest(imc, semParaImc);
      const u = typeof imcGestacionalUmbrales === 'function' ? imcGestacionalUmbrales(semParaImc) : null;
      imcHtml = `<br><b>Peso:</b> ${peso.toFixed(1)} kg · <b>Talla:</b> ${talla.toFixed(1)} cm<br>
        <b>IMC gestacional:</b> ${imc.toFixed(1)} kg/m² — <b>${cl.d}</b> (semana ${semParaImc})`;
      if(u) imcHtml += `<br><span style="font-size:12px;opacity:.9">Umbrales sem. ${semParaImc}: bajo &lt;${u.bajo} · normal hasta ${u.normal} · sobrepeso hasta ${u.sobre}</span>`;
    } else {
      imcHtml = `<br><b>Peso:</b> ${peso.toFixed(1)} kg · <b>Talla:</b> ${talla.toFixed(1)} cm · <b>IMC:</b> ${(imc).toFixed(1)} kg/m²<br>
        <span style="font-size:12px">Indique semanas (o FUM válida) para clasificar el IMC gestacional.</span>`;
    }
  }

  if(!v){
    res.innerHTML = (imcHtml ? imcHtml.replace(/^<br>/,'') : 'Ingrese la fecha de inicio del embarazo.') ;
    gFUM=null; dibujarRueda(); return;
  }
  gFUM = new Date(v+'T12:00:00');
  const parto = new Date(gFUM); parto.setDate(parto.getDate()+280);
  document.getElementById('g_fechaParto').value = parto.toISOString().split('T')[0];
  const hoy = getFechaEvaluacion();
  const dias = Math.floor((hoy-gFUM)/86400000);
  const sem = Math.floor(dias/7), d = dias%7;
  const fppTxt = fmtLarga(parto);
  if(sem<0){ res.innerHTML=`La fecha de inicio es posterior a hoy.<br><b>FPP:</b> ${fppTxt}${imcHtml}`; seleccionarSemana(1); return; }
  if(sem>42){ res.innerHTML=`Gestación calculada supera las 42 semanas — verificar FUM.<br><b>FPP:</b> ${fppTxt}${imcHtml}`; seleccionarSemana(42); return; }
  const trim = sem<=13?'Primer trimestre':(sem<=27?'Segundo trimestre':'Tercer trimestre');
  const semMostrada = (!isNaN(semManual) && semManual >= 4 && semManual <= 42) ? semManual : sem;
  let extraSem = '';
  if(!isNaN(semManual) && semManual >= 4 && semManual <= 42 && semManual !== sem){
    extraSem = `<br><b>Semanas indicadas (manual):</b> ${semManual} · <b>Por FUM:</b> ${sem} sem y ${d} d`;
  }
  res.innerHTML = `<b>Edad gestacional actual (FUM):</b> ${sem} semanas y ${d} días<br><b>Trimestre:</b> ${trim}<br><b>Fecha probable de parto:</b> ${fppTxt}${extraSem}${imcHtml}`;
  seleccionarSemana(Math.max(1, Math.min(42, semMostrada)));
}

let ultimoReporte = null;

/* ===== MANEJO NUTRICIONAL — GASTRITIS ===== */
const GASTRITIS_APA = [
  'National Institute of Diabetes and Digestive and Kidney Diseases. (2020). <i>Gastritis</i>. U.S. Department of Health and Human Services. https://www.niddk.nih.gov',
  'Chey, W. D., Leontiadis, G. I., Howden, C. W., &amp; Moss, S. F. (2017). ACG Clinical Guideline: Treatment of Helicobacter pylori infection. <i>American Journal of Gastroenterology, 112</i>(2), 212–239. https://doi.org/10.1038/ajg.2016.563',
  'Jones, N. L., Koletzko, S., Goodman, K., Bontems, P., Cadranel, S., Casswall, T., Czinn, S., Gold, B. D., Guarner, J., Elitsur, Y., Homan, M., Kalach, N., Kori, M., Madrazo, A., Megraud, F., &amp; Papadopoulou, A. (2017). Joint ESPGHAN/NASPGHAN guidelines for the management of Helicobacter pylori in children and adolescents. <i>Journal of Pediatric Gastroenterology and Nutrition, 64</i>(6), 991–1003. https://doi.org/10.1097/MPG.0000000000001594'
];
const GASTRITIS = {
  incluir: [
    {cat:'Carbohidratos de fácil digestión', ej:'arroz, avena, papa cocida, camote, pasta al dente, pan tostado, galletas de soda'},
    {cat:'Proteínas magras', ej:'pollo sin piel, pavo, pescado blanco, huevo pochado, tofu, queso fresco bajo en grasa'},
    {cat:'Vegetales cocidos no ácidos', ej:'zanahoria, calabacín, espinaca cocida, calabaza, judías verdes'},
    {cat:'Frutas no ácidas', ej:'banano maduro, manzana cocida/compota, pera madura, papaya, melón'},
    {cat:'Grasas saludables (moderación)', ej:'aceite de oliva virgen, aguacate maduro, nueces molidas'},
    {cat:'Alimentos mucilaginosos', ej:'aloe vera comestible, okra, linaza molida'}
  ],
  evitar: [
    {cat:'Irritantes directos', ej:'alcohol, café, tabaco, chocolate'},
    {cat:'Picantes/condimentos fuertes', ej:'chile/ají, curry en exceso, mostaza fuerte, salsa de soja concentrada'},
    {cat:'Ácidos', ej:'cítricos, tomate y derivados, vinagre, jugos no diluidos'},
    {cat:'Grasos y fritos', ej:'comida rápida, embutidos, carnes rojas grasas, frituras, salsas cremosas'},
    {cat:'Ultraprocesados', ej:'snacks industrializados, dulces, gaseosas, cereales azucarados'}
  ],
  hidratacion: 'Agua tibia/temperatura ambiente, té de manzanilla, jengibre débil, hinojo o anís, caldo de pollo bajo en sodio. Evitar bebidas carbonatadas, muy frías, café/té negro y alcohol. Meta: 30-35 ml/kg/día en sorbos pequeños entre comidas.',
  patron: '5 comidas/día en porciones pequeñas-moderadas; masticar bien (20-30 veces); comer sin prisa; no acostarse hasta 3h después de comer; horarios regulares.',
  estiloVida: ['Eliminación total de alcohol y tabaco', 'Manejo del estrés (relajación, mindfulness)', 'Peso corporal saludable', 'Revisar AINEs/aspirina/corticoides con el médico', 'Elevar cabecera de la cama 15-20cm si hay reflujo asociado'],
  banderasRojas: ['Vómito con sangre o "poso de café" (hematemesis)', 'Heces negras/alquitranadas (melena)', 'Dolor abdominal severo persistente', 'Pérdida de peso involuntaria (>5% en 6 meses)', 'Dificultad para tragar progresiva', 'Anemia o fatiga extrema (sangrado oculto)', 'Síntomas >2 semanas pese a tratamiento', '>55 años con síntomas nuevos de dispepsia']
};
function getNotaEdadGastritis(grupo){
  if(grupo==='0-6m'||grupo==='6-24m') return 'En lactantes, la gastritis franca es poco frecuente: descartar primero reflujo, alergia a proteína de leche o infección. No auto-medicar; requiere evaluación pediátrica. Priorizar tomas pequeñas y frecuentes, evitar suspender lactancia materna sin indicación médica.';
  if(grupo==='2-5a'||grupo==='5-12a') return 'En niños, adaptar texturas (blandas/cocidas), porciones más pequeñas que las del adulto, y evitar automedicación con AINEs. La erradicación de H. pylori en niños sigue criterios pediátricos específicos (ESPGHAN/NASPGHAN), distintos al adulto.';
  if(grupo==='12-17a') return 'En adolescentes, reforzar la eliminación de alcohol/tabaco y vigilar el uso frecuente de AINEs (deportes, dismenorrea) como causa de gastritis química.';
  if(grupo==='embarazada') return 'En el embarazo/lactancia, evitar automedicación: IBP, antibióticos de erradicación y AINEs requieren valoración médica por riesgo fetal/lactante. Priorizar manejo dietético y consultar antes de cualquier suplemento (hierro/B12 en dosis altas).';
  if(grupo==='am') return 'En el adulto mayor, mayor sospecha de gastritis atrófica autoinmune y uso crónico de AINEs; vigilar deficiencia de B12/hierro y evaluar toda dispepsia de inicio reciente como bandera roja (>55 años).';
  return 'Aplicar el manejo general del adulto, ajustando según tipo de gastritis (autoinmune, H. pylori, química/reactiva o aguda) y comorbilidades.';
}
function getRecomendacionesGastritis(grupo){
  let html = `<div class="manejo-critico">🚩 Banderas rojas — buscar atención médica inmediata: ${GASTRITIS.banderasRojas.join(' · ')}</div>`;
  html += `<div class="integral-box" style="margin-bottom:8px"><b>Nota según edad:</b> ${getNotaEdadGastritis(grupo)}</div>`;
  html += `<details class="manejo-box" open><summary>Alimentos recomendados</summary><div class="contenido">` + GASTRITIS.incluir.map(c=>`<b>${c.cat}:</b> ${c.ej}<br>`).join('') + `</div></details>`;
  html += `<details class="manejo-box"><summary>Alimentos a evitar</summary><div class="contenido">` + GASTRITIS.evitar.map(c=>`<b>${c.cat}:</b> ${c.ej}<br>`).join('') + `</div></details>`;
  html += `<details class="manejo-box"><summary>Patrón de comidas e hidratación</summary><div class="contenido"><b>Comidas:</b> ${GASTRITIS.patron}<br><br><b>Hidratación:</b> ${GASTRITIS.hidratacion}</div></details>`;
  html += `<details class="manejo-box"><summary>Estilo de vida</summary><div class="contenido">` + GASTRITIS.estiloVida.map(e=>'• '+e).join('<br>') + `</div></details>`;
  html += `<div style="font-size:10.5px;color:#7a6a3a;margin-top:8px;font-style:italic;border-top:0.5px solid #ecdfc0;padding-top:6px">📚 Referencias (APA):<br>` + GASTRITIS_APA.map(r=>r).join('<br><br>') + `</div>`;
  html += `<div style="font-size:10px;color:#a05a1f;margin-top:6px;font-style:italic">Esta información es educativa y no sustituye la consulta médica; personalizar según tipo de gastritis, comorbilidades y medicación concurrente.</div>`;
  return html;
}
