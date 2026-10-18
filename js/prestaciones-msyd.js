/* NutriAndes — clasificaciones, prestaciones MSyD, suplementación, próximo control y manejo protocolizado */
/* ===== PRESTACIONES MSyD ===== */
function getPrestaciones(grupo, em, eaAnios, estadoGest){
  /* Prestaciones operativas + insumos con códigos LINAME 2022-2024 (AGEMED).
     Los códigos PCxxx de esquemas farmacológicos del manual 2015 se sustituyeron por LINAME. */
  if(grupo==='0-6m'){
    if(em===0) return [
      'Vacunas del recién nacido según esquema PAI vigente (BCG, Hepatitis B) — servicio de inmunización',
      'Control CRED en las primeras 48-72 horas',
      'Consejería en lactancia materna exclusiva',
      'Bono Juana Azurduy (control posnatal)'
    ];
    return [
      'Vacunas del esquema PAI (pentavalente, polio, rotavirus, neumococo) según calendario — 2, 4 y 6 meses',
      'Retinol / Vitamina A (LINAME A1115 · ATC A11CA01 · 100.000 UI): media perla solo si desnutrición aguda, diarrea persistente o sospecha de sarampión — oral, dosis única bajo criterio clínico',
      'Lactancia materna exclusiva ≥10 veces/día, vaciando ambos pechos',
      'Control CRED mensual',
      'Bono Juana Azurduy (control mensual hasta 2 años)'
    ];
  }
  if(grupo==='6-24m'){
    if(em<12) return [
      'Retinol / Vitamina A (LINAME A1115 · ATC A11CA01 · 100.000 UI perla), oral, dosis única (suplemento universal según norma vigente)',
      'Micronutrientes / chispitas (LINAME B0305 · ATC B03AE10): 1 sobre/día × 60 días, mezclado en papilla semisólida',
      'Refuerzo de vacunas PAI según calendario',
      'Control CRED mensual',
      'Bono Juana Azurduy'
    ];
    return [
      'Retinol / Vitamina A (LINAME A1116 · ATC A11CA01 · 200.000 UI), oral, 2 veces/año (suplemento universal)',
      'Micronutrientes / chispitas (LINAME B0305 · ATC B03AE10): 1 sobre/día × 60 días (1 ciclo/año orientativo)',
      'Mebendazol (LINAME P0205 · ATC P02CA01 · 500 mg): 1 comprimido 2 veces/año en ayunas',
      'Complemento nutricional Nutribebé (LINAME V0603 · ATC V06DA): según norma — p. ej. 25 g + 100 mL agua en papilla',
      'Vacunas SRP y fiebre amarilla según PAI — 12 meses; refuerzos a los 18 meses',
      'Control CRED trimestral'
    ];
  }
  if(grupo==='2-5a') return [
    'Retinol / Vitamina A (LINAME A1116 · ATC A11CA01 · 200.000 UI), oral, 2 veces/año',
    'Mebendazol (LINAME P0205 · ATC P02CA01 · 500 mg): 2 veces/año en ayunas',
    'Zinc como sulfato (LINAME A1205/A1206 · ATC A12CB01 · 20 mg): si diarrea 14 días o talla baja según norma',
    'Control CRED cada 2 meses',
    'Evaluación de hitos del desarrollo',
    'Vacunas de refuerzo según esquema PAI'
  ];
  if(grupo==='5-12a') return [
    'Control de salud escolar y consejería nutricional',
    'Evaluación de salud oral',
    'Promoción de actividad física y alimentación saludable',
    'Desparasitación según norma local (Mebendazol LINAME P0205 · 500 mg) si corresponde al programa',
    'Vacunas de refuerzo según PAI'
  ];
  if(grupo==='12-17a') return [
    'Control de salud del adolescente y consejería nutricional',
    'Salud sexual y reproductiva según norma',
    'Promoción de estilos de vida saludable',
    'Suplementación con hierro/folato solo si hay indicación clínica (p. ej. Sulfato ferroso + ác. fólico + vit. C · LINAME B0308/B0309)'
  ];
  if(grupo==='adulto_joven') return [
    'Control de salud y consejería nutricional según hallazgos',
    'Tamizaje de factores de riesgo cardiometabólico',
    'Actividad física y alimentación saludable'
  ];
  if(grupo==='am') return [
    'Complemento nutricional para adulto mayor (LINAME V0605 / V0604 Carmelo · ATC V06DB) según norma de alimentación y nutrición',
    'Control de salud del adulto mayor',
    'Evaluación de deglución, dentición y polifarmacia',
    'Consejería en alimentación rica en proteína y micronutrientes'
  ];
  if(grupo==='embarazada'){
    if(estadoGest==='lactancia') return [
      'Sulfato ferroso + ác. fólico + vit. C (LINAME B0308 · ATC B03AE10) si no recibió hierro en el posparto inmediato — según norma',
      'Retinol / Vitamina A (LINAME A1116 · 200.000 UI) dosis única posparto si no se administró en el parto — según norma',
      'Complemento Nutri Mama (LINAME V0607 · ATC V06DB) según disponibilidad y norma',
      'Control puerperal y consejería en lactancia'
    ];
    return [
      'Control prenatal según norma (incluye peso, talla, IMC gestacional)',
      'Ácido fólico (LINAME B0301/B0310 · ATC B03BB01) y hierro (LINAME B0308/B0309) según esquema de prevención de anemia',
      'Complemento Nutri Mama (LINAME V0607) según norma desde la captación',
      'Vacunas e inmunizaciones del embarazo según PAI',
      'Consejería nutricional por trimestre'
    ];
  }
  return ['Completar grupo etario para listar prestaciones y suplementos LINAME aplicables'];
}

/* ===== SUPLEMENTACIÓN / TRATAMIENTO ===== */
function atluSobres(pesoKg){
  if(!pesoKg) return 'evaluar en consulta (falta peso)';
  const t = ATLU_TABLA.find(r=>pesoKg>=r.min && pesoKg<=r.max);
  if(t) return t.sobres;
  if(pesoKg>13.5) return 'según 200 Kcal/kg/día';
  return 'evaluar en hospital';
}
function getSuplementacion(grupo, em, eaAnios, pesoKg, diagLabel, signos, estadoGest){
  if(window.ADOL_AIEPI && (grupo==='5-12a'||grupo==='12-17a')) return window.ADOL_AIEPI.tratar.slice(); /* AIEPI 2021: conductas del adolescente */
  /* Esquemas orientativos con códigos LINAME 2022-2024. No sustituyen la norma oficial vigente ni la prescripción presencial. */
  let items = [];
  if(grupo==='0-6m'){
    if(em>=2 && (diagLabel.includes('grave')||diagLabel.includes('moderad')||signos.diarrea))
      items.push('Retinol / Vitamina A (LINAME A1115 · 100.000 UI): media perla por indicación clínica (desnutrición, diarrea persistente o sarampión)');
    items.push('Promover lactancia materna exclusiva, mínimo 10 veces al día/noche, vaciando ambos pechos');
    if(diagLabel.includes('grave')){
      items.push(`Alimento terapéutico listo para uso — ATLU (LINAME V0602 · ATC V06DB): ${atluSobres(pesoKg)} sobres/día según peso, si no es posible referir a unidad de nutrición intensiva`);
      items.push('Dextrosa al 10% vía oral, prevenir hipotermia, referir URGENTE al hospital');
    }
  }
  if(grupo==='6-24m'){
    if(em<12) items.push('Retinol / Vitamina A (LINAME A1115 · ATC A11CA01 · 100.000 UI) dosis única — suplemento universal según norma');
    else items.push('Retinol / Vitamina A (LINAME A1116 · ATC A11CA01 · 200.000 UI), 2 veces al año — suplemento universal según norma');
    items.push('Micronutrientes / chispitas (LINAME B0305 · ATC B03AE10): 1 sobre/día por 60 días en papilla semisólida (no en líquidos)');
    if(em>=12) items.push('Mebendazol (LINAME P0205 · ATC P02CA01 · 500 mg): 1 comprimido 2 veces al año en ayunas');
    items.push('Nutribebé (LINAME V0603 · ATC V06DA): según norma de complemento infantil (p. ej. 25 g + 100 mL de agua en papilla)');
    if(diagLabel.includes('moderad')||signos.diarrea)
      items.push('Zinc (LINAME A1205 jarabe / A1206 comprimido · ATC A12CB01 · 20 mg): 1 dosis/día × 14 días (diarrea) o según norma si talla baja; separado de las comidas principales');
    if(diagLabel.includes('grave')){
      items.push(`ATLU (LINAME V0602): ${atluSobres(pesoKg)} sobres/día; priorizar referencia hospitalaria en desnutrición aguda grave`);
      items.push('Referir URGENTE al hospital, prevenir hipotermia e hipoglucemia');
    }
  }
  if(grupo==='2-5a'){
    items.push('Retinol / Vitamina A (LINAME A1116 · 200.000 UI), 2 veces al año');
    items.push('Mebendazol (LINAME P0205 · 500 mg), 2 veces al año en ayunas');
    if(diagLabel.includes('moderad')||signos.diarrea)
      items.push('Zinc (LINAME A1205/A1206 · 20 mg): 14 días si diarrea, o esquema prolongado si talla baja según norma');
    if(diagLabel.includes('grave')){
      items.push('Primera dosis de antibiótico según protocolo local y referencia URGENTE al hospital');
      items.push('ATLU (LINAME V0602) orientado a ~200 kcal/kg/día mientras se organiza el traslado');
    }
  }
  if(grupo==='5-12a'||grupo==='12-17a'){
    items.push('Encuesta alimentaria y consejería nutricional según hallazgos');
    items.push('Evaluación de salud oral');
    items.push('Promoción de estilos de vida saludable (actividad física, alimentación balanceada)');
    if(diagLabel.includes('grave')) items.push('Referir URGENTEMENTE al hospital para manejo de desnutrición grave');
    if(diagLabel.includes('anemia')||diagLabel.includes('ferrop'))
      items.push('Sulfato ferroso ± ác. fólico ± vit. C (LINAME B0308 comprimido / B0309 solución · ATC B03AE10) según edad y norma de anemia');
  }
  if(grupo==='am'){
    items.push('Complemento nutricional adulto mayor (LINAME V0605 o V0604 Carmelo · ATC V06DB): según norma (p. ej. 30 g en agua tibia o jugo)');
    items.push('Revisar polifarmacia, dentición y riesgo de deshidratación');
    if(diagLabel.includes('bajo')||diagLabel.includes('desnutr'))
      items.push('Reforzar proteína de calidad y fraccionamiento de comidas; control quincenal o mensual');
  }
  if(grupo==='adulto_joven'){
    items.push('Consejería nutricional personalizada según IMC y comorbilidades');
    if(diagLabel.includes('Obesidad')||diagLabel.includes('Sobrepeso'))
      items.push('Plan de déficit calórico moderado, actividad física y control de comorbilidades');
    if(diagLabel.includes('bajo')||diagLabel.includes('delgaz'))
      items.push('Incremento calórico-proteico gradual y despistaje de causas orgánicas');
  }
  if(grupo==='embarazada'){
    if(estadoGest==='lactancia'){
      items.push('Sulfato ferroso + ác. fólico + vit. C (LINAME B0308 · ATC B03AE10) si no recibió hierro tras el parto — según norma');
      items.push('Retinol / Vitamina A (LINAME A1116 · 200.000 UI) dosis única posparto si no se administró en el parto');
      items.push('Nutri Mama (LINAME V0607 · ATC V06DB) según disponibilidad y norma de complemento');
      items.push('Consejería en lactancia materna y alimentación de la madre');
    } else {
      items.push('Ácido fólico (LINAME B0301 · 5 mg o B0310 · 800 mcg · ATC B03BB01) según momento del embarazo y norma');
      items.push('Sulfato ferroso + ác. fólico + vit. C (LINAME B0308/B0309 · ATC B03AE10) para prevención/tratamiento de anemia gestacional');
      items.push('Nutri Mama (LINAME V0607) según norma desde la captación prenatal');
      if(diagLabel==='Bajo peso') items.push('Consejería nutricional intensiva y seguimiento mensual por bajo peso gestacional');
      if(diagLabel.includes('Obesidad')||diagLabel.includes('Sobrepeso')) items.push('Consejería en alimentación saludable y control de ganancia de peso gestacional');
    }
  }
  return items.length ? items : ['Sin recomendaciones específicas — completar evaluación con personal de nutrición'];
}

/* ===== PRÓXIMO CONTROL ===== */
function getProximoControl(grupo, em, diagLabel, signos){
  if(window.ADOL_AIEPI && (grupo==='5-12a'||grupo==='12-17a')) return window.ADOL_AIEPI.seguimiento;
  if(grupo==='0-6m' && em===0) return '3 a 4 controles durante el primer mes de vida (la primera semana es la más importante)';
  if(diagLabel.includes('moderad') && !diagLabel.includes('crónica')) return 'Cada 7 días (desnutrición aguda moderada sin complicación)';
  if(diagLabel==='Talla baja') return 'Cada 30 días (talla baja) — control de tendencia de crecimiento cada 2-4 meses';
  if(signos.diarrea) return 'Cada 5 días (diarrea persistente / problemas de alimentación)';
  if(grupo==='0-6m'||grupo==='6-24m') return 'Control mensual';
  if(grupo==='2-5a') return 'Control cada 2 meses';
  if(grupo==='5-12a'||grupo==='12-17a') return 'Control escolar periódico (cada 6 meses recomendado)';
  if(grupo==='am') return 'Control anual del adulto mayor (o antes según hallazgos)';
  if(grupo==='embarazada') return 'Control prenatal mensual (mínimo 4 controles durante el embarazo)';
  return 'Según criterio clínico';
}

/* ===== MANEJO PROTOCOLIZADO 10 PASOS (solo 0-5 años) ===== */
function getManejo10Pasos(diagLabel, grupo, em, pesoKg, edemaGrado){
  if(!['0-6m','6-24m','2-5a'].includes(grupo)) return '';
  const esSevera = diagLabel.includes('grave')||diagLabel.includes('severa');
  const esModerada = diagLabel.includes('moderad');
  if(!esSevera && !esModerada) return '';
  const sobres = atluSobres(pesoKg);
  const menor6m = grupo==='0-6m';
  let html = `<div class="manejo-critico">⚠ Manejo protocolizado en 10 pasos — reduce la letalidad hospitalaria de 35-40% a menos de 5% cuando se aplica correctamente. Criterio clínico prevalece sobre laboratorio.</div>`;
  html += `<details class="manejo-box"><summary>1. Bases científicas: Adaptación Reductiva</summary><div class="contenido">Ante desnutrición severa el organismo reduce su gasto: menor gasto cardíaco, menor síntesis proteica hepática, mucosa digestiva atrófica y menor inmunidad. Manejo: líquidos IV solo en choque (usar ReSoMal vía oral), dieta baja en proteína al inicio (F-75), comidas pequeñas y frecuentes, antibiótico de amplio espectro desde el ingreso a todos los casos.</div></details>`;
  html += `<details class="manejo-box"><summary>2. Clasificación y laboratorio</summary><div class="contenido"><b>Severa emaciada (marasmo):</b> P/T &lt;-3DE. <b>Severa edematosa (kwashiorkor):</b> edema simétrico bilateral${edemaGrado>=2?` (paciente actual: grado +${edemaGrado})`:''}. <b>Moderada:</b> P/T -2 a -3DE sin edema.<br>Hipoglucemia si glucemia &lt;54 mg/dL. Anemia grave si Hb &lt;4g (llano) o &lt;7-8g (altura).</div></details>`;
  html += `<details class="manejo-box"><summary>Pasos 1-2: Hipoglucemia e hipotermia</summary><div class="contenido"><b>Hipoglucemia:</b> consciente → bolo 50 mL dextrosa 10% VO/SNG; inconsciente → 5 mL/kg dextrosa 10% IV.<br><b>Hipotermia</b> (T° rectal &lt;35.5°C): arropar, contacto piel a piel, alimentar de inmediato.</div></details>`;
  html += `<details class="manejo-box"><summary>Paso 3: Deshidratación y choque séptico</summary><div class="contenido">Rehidratación IV solo en choque. Usar <b>ReSoMal</b> (bajo en sodio, alto en potasio) vía oral. Vigilar signos de sobrecarga.</div></details>`;
  html += `<details class="manejo-box"><summary>Pasos 4-6: Electrolitos, infecciones y micronutrientes</summary><div class="contenido"><b>Infección:</b> presumir en todos los casos. Esquema: Ampicilina 200 mg/kg/día + Gentamicina 7.5 mg/kg/día por 7 días.<br><b>Micronutrientes:</b> Vitamina A al ingreso según edad; Ácido fólico 5mg día 1, luego 1mg/día. <b>No dar hierro</b> en la primera semana.</div></details>`;
  html += `<details class="manejo-box"><summary>Pasos 7-8: Alimentación y recuperación</summary><div class="contenido"><b>Fase de estabilización (F-75):</b> 75 kcal/100mL, tomas cada 2h, día y noche.<br><b>Fase de transición:</b> cambio gradual de F-75 a F-100 cuando retorna el apetito y bajan los edemas.<br><b>Fase de recuperación (F-100):</b> 100 kcal/100mL; se agrega hierro 3 mg/kg/día.${menor6m?'<br><b>Menor de 6 meses:</b> usar F-75/F-100 maternizada, priorizar lactancia materna.':''}</div></details>`;
  html += `<details class="manejo-box"><summary>Pasos 9-10: Estimulación y alta</summary><div class="contenido">Estimulación sensorial (juego terapéutico, afecto) para mitigar retraso del desarrollo.<br><b>Criterios de alta:</b> come bien, gana &gt;5 g/kg/día, clínicamente estable, familia capacitada.</div></details>`;
  html += `<details class="manejo-box"><summary>Situaciones especiales</summary><div class="contenido"><b>Anemia grave:</b> transfundir 10 mL/kg solo si Hb &lt;4g/dL (llano) o &lt;7g/dL (altura &gt;2500msnm).<br><b>Lesiones oculares</b> (déficit Vit. A): ulceración corneal → atropina + apósito estéril + antibiótico tópico.<br><b>Dermatosis grave:</b> baños con permanganato de potasio al 1%.</div></details>`;
  html += `<details class="manejo-box" open><summary>Manejo ambulatorio con ATLU (Plumpy'nut)</summary><div class="contenido">Para desnutrición aguda severa <b>sin complicaciones</b>, con buen apetito y alerta.<br>Dosis aproximada: 200 Kcal/kg/día → con el peso actual (${pesoKg?pesoKg.toFixed(1)+' kg':'no registrado'}) corresponde a <b>${sobres}</b> sobres/día.<br>Administrar en 5-8 tomas pequeñas al día, ofrecer agua potable abundante.</div></details>`;
  html += `<details class="manejo-box"><summary>Vigilancia de mortalidad (referencia institucional)</summary><div class="contenido"><table><tr><th>Letalidad</th><th>Interpretación</th></tr><tr><td>&gt;20%</td><td>Inaceptable</td></tr><tr><td>11-20%</td><td>Deficiente</td></tr><tr><td>5-10%</td><td>Moderada</td></tr><tr><td>&lt;5%</td><td>Aceptable</td></tr></table>Momentos críticos: primeras 24h, 48-72h, durante la noche.</div></details>`;
  return html;
}

/* ===== ESTIMACIONES ANTROPOMÉTRICAS AUXILIARES ===== */
/**
 * Peso ideal Hamwi completo con contextura corporal (muñeca)
 * @param {number} alturaCm - Altura en centímetros
 * @param {number} munecaCm - Circunferencia de muñeca en centímetros
 * @param {'M'|'F'} sexo
 * @returns {object|null} { r, contextura, ibwBase, ibwAjustado }
 */
function pesoIdealHamwiCompleto(alturaCm, munecaCm, sexo) {
  if (!alturaCm || alturaCm <= 0) return null;
  // Si no hay muñeca, calcular solo base (complexión mediana)
  const tieneMuneca = munecaCm && munecaCm > 0;
  let r = null, contextura = 'mediana';

  if (tieneMuneca) {
    r = alturaCm / munecaCm;
    if (sexo === 'M') {
      if (r > 10.4) contextura = 'pequeña';
      else if (r >= 9.6) contextura = 'mediana';
      else contextura = 'grande';
    } else {
      if (r > 11.0) contextura = 'pequeña';
      else if (r >= 10.1) contextura = 'mediana';
      else contextura = 'grande';
    }
  }

  // Fórmula de Hamwi (complexión media) — base en pulgadas
  const alturaPulgadas = alturaCm / 2.54;
  const base = sexo === 'M' ? 48 : 45.5;
  const incremento = sexo === 'M' ? 2.7 : 2.2;
  let ibwBase = base + incremento * (alturaPulgadas - 60);
  if (ibwBase < 0) ibwBase = 0;

  // Ajuste por contextura
  let ibwAjustado = ibwBase;
  if (contextura === 'pequeña') ibwAjustado *= 0.9;
  else if (contextura === 'grande') ibwAjustado *= 1.1;

  return {
    r: r !== null ? Math.round(r * 100) / 100 : null,
    contextura,
    ibwBase: Math.round(ibwBase * 10) / 10,
    ibwAjustado: Math.round(ibwAjustado * 10) / 10
  };
}

/** Compatibilidad: devuelve solo el peso ajustado (o base si no hay muñeca) */
function pesoIdealHamwi(sexo, tallaCm, munecaCm) {
  const res = pesoIdealHamwiCompleto(tallaCm, munecaCm, sexo);
  return res ? res.ibwAjustado : null;
}
function tallaChumlea(sexo, altRodilla, edadA){
  if(!sexo||!altRodilla) return null;
  if(sexo==='M') return 64.19 - (0.04*edadA) + (2.02*altRodilla);
  return 84.88 - (0.24*edadA) + (1.83*altRodilla);
}
function hollidaySegar(pesoKg){
  if(!pesoKg) return null;
  if(pesoKg<=10) return pesoKg*100;
  if(pesoKg<=20) return 1000 + (pesoKg-10)*50;
  return 1500 + (pesoKg-20)*20;
}
