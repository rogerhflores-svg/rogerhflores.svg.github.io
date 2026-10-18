/* ===== GESTOGRAMA: DESARROLLO MES A MES ===== */
const GM_MESES = [
 {n:1, d:1, h:4, bebe:[
   "Fecundación: el óvulo y el espermatozoide forman el cigoto, que se divide y viaja hacia el útero.",
   "Implantación: hacia el día 6-12 el embrión se fija en el endometrio (la capa interna del útero).",
   "El embrión mide solo 1-2 mm. Al final del mes se cierra el tubo neural (origen del cerebro y la médula) y el corazón primitivo empieza a latir."],
  madre:[
   "Sube la hormona hCG (gonadotropina coriónica), la que detecta la prueba de embarazo, y la progesterona, que mantiene el embarazo.",
   "El útero se prepara: el endometrio se engrosa y el moco del cuello uterino se espesa."],
  sint:[
   "Retraso menstrual (amenorrea).",
   "Sangrado leve y breve de implantación (en algunas mujeres).",
   "Sensibilidad en las mamas, cansancio, somnolencia, ganas de orinar con más frecuencia."],
  alarma:[
   "Dolor abdominal intenso de un solo lado o sangrado abundante (descartar embarazo ectópico)."]},
 {n:2, d:5, h:8, bebe:[
   "Período embrionario: se forman los órganos (organogénesis). Es la etapa más sensible a medicamentos, alcohol, infecciones y falta de ácido fólico.",
   "Aparecen los esbozos de brazos y piernas, ojos, oídos y la cara. El corazón ya se ve latir en la ecografía.",
   "Al final del mes mide unos 16 mm y pesa cerca de 1 g."],
  madre:[
   "Los niveles hormonales altos provocan náuseas y cambios en el gusto y el olfato.",
   "Las mamas aumentan de volumen y la areola se oscurece. El útero crece, pero aún no se nota por fuera.",
   "El peso casi no cambia, o baja un poco si hay vómitos."],
  sint:[
   "Náuseas y vómitos, sobre todo por la mañana; mayor salivación; rechazo a ciertos olores o comidas.",
   "Cansancio, estreñimiento, ganas frecuentes de orinar, cambios de ánimo."],
  alarma:[
   "Vómitos que impiden comer o beber, orina escasa y oscura (riesgo de deshidratación).",
   "Sangrado vaginal o dolor tipo cólico."]},
 {n:3, d:9, h:13, bebe:[
   "Desde la semana 9-10 se llama feto: los órganos ya están formados y ahora maduran y crecen.",
   "Los dedos se separan, se forman las uñas y se diferencian los genitales externos. Los riñones empiezan a producir orina.",
   "Se mueve, aunque la madre aún no lo siente. Al final del mes mide unos 7 cm y pesa 25-45 g."],
  madre:[
   "El volumen de sangre empieza a aumentar. El útero sube y sobrepasa el hueso del pubis hacia la semana 12.",
   "Las náuseas suelen disminuir al final del mes. La ganancia de peso es pequeña (1-2 kg en total)."],
  sint:[
   "Flujo vaginal blanquecino más abundante (leucorrea fisiológica, sin mal olor ni picazón).",
   "Somnolencia, mareos al ponerse de pie, acidez, estreñimiento, aparición de manchas en la piel.",
   "Entre las semanas 11 y 13 se realiza la ecografía de translucencia nucal (tamizaje de alteraciones cromosómicas)."],
  alarma:[
   "Sangrado vaginal con coágulos, dolor cólico fuerte o salida de tejido."]},
 {n:4, d:14, h:17, bebe:[
   "Crecimiento acelerado. La piel es muy fina y se cubre de lanugo (vello suave y delgado).",
   "Los huesos se endurecen (osificación), hace movimientos de succión y gestos con la cara.",
   "A veces ya se puede ver el sexo en la ecografía. Al final del mes mide unos 12 cm (cabeza al glúteo) y pesa 100-150 g."],
  madre:[
   "Mejora el malestar del primer trimestre y vuelve el apetito. El útero se palpa entre el pubis y el ombligo.",
   "El volumen de sangre sigue aumentando y los vasos se dilatan, por lo que la presión arterial tiende a bajar un poco.",
   "Comienza la ganancia de peso sostenida (aprox. 0.3-0.5 kg por semana según el estado nutricional previo)."],
  sint:[
   "Congestión nasal y sangrado leve de encías (por mayor flujo de sangre en las mucosas).",
   "Mareos al levantarse rápido, línea oscura en el abdomen (línea nigra) y manchas en el rostro (melasma).",
   "Se nota el abdomen más redondeado."],
  alarma:[
   "Pérdida de líquido por la vagina, sangrado o dolor abdominal persistente."]},
 {n:5, d:18, h:22, bebe:[
   "La madre empieza a sentir sus movimientos (alrededor de las semanas 18-20 en el primer embarazo, antes en los siguientes).",
   "Se cubre de vérnix caseoso, una capa blanca que protege la piel. Ya oye sonidos y se forman las huellas digitales.",
   "Hacia la semana 20 mide unos 25 cm (cabeza al talón) y pesa 300-450 g."],
  madre:[
   "El fondo del útero llega a la altura del ombligo hacia la semana 20 (unos 20 cm medidos desde el pubis).",
   "El centro de gravedad cambia: la postura se ajusta y aumenta la carga sobre la zona lumbar.",
   "Entre las semanas 18 y 22 se hace la ecografía morfológica, que revisa la anatomía del bebé."],
  sint:[
   "Movimientos del bebé (como burbujas o aleteos), dolor lumbar, calambres en las piernas.",
   "Estrías, picazón en la piel del abdomen, acidez y digestión lenta.",
   "Aumento del apetito y hormigueo en las manos en algunas mujeres."],
  alarma:[
   "Sangrado, contracciones dolorosas regulares o pérdida de líquido.",
   "Fiebre, ardor al orinar o dolor en la zona de los riñones."]},
 {n:6, d:23, h:27, bebe:[
   "Desde la semana 24 puede sobrevivir fuera del útero con cuidados intensivos (viabilidad).",
   "Los pulmones empiezan a producir surfactante, sustancia que evita que los alvéolos se colapsen al respirar.",
   "Abre los ojos, tiene ciclos de sueño y vigilia y reacciona a ruidos. Al final del mes mide unos 35 cm y pesa 800-1000 g."],
  madre:[
   "El útero crece rápido (fondo uterino de 24 a 28 cm). La ganancia de peso es constante.",
   "Entre las semanas 24 y 28 se hace la prueba de tolerancia a la glucosa para descartar diabetes gestacional.",
   "La retención de líquidos y la presión del útero sobre las venas facilitan várices y hemorroides."],
  sint:[
   "Hinchazón leve de pies y tobillos, várices, hemorroides, calambres nocturnos.",
   "Contracciones de Braxton Hicks (endurecimiento del abdomen, indoloro e irregular).",
   "Acidez, falta de aire al esfuerzo, dificultad para dormir."],
  alarma:[
   "Dolor de cabeza fuerte, visión borrosa, zumbidos, hinchazón repentina de cara o manos, dolor en la boca del estómago (posible preeclampsia).",
   "Contracciones regulares o pérdida de líquido antes de la semana 37."]},
 {n:7, d:28, h:31, bebe:[
   "Comienza el tercer trimestre. El cerebro crece rápido y los nervios se recubren de mielina, lo que mejora la coordinación.",
   "Acumula grasa debajo de la piel y almacena hierro y calcio. Responde a la luz y a la voz de la madre.",
   "Al final del mes mide unos 40 cm y pesa 1.2-1.8 kg."],
  madre:[
   "El útero ocupa gran parte del abdomen (fondo uterino de 28 a 31 cm) y eleva el diafragma, con lo que cuesta más respirar profundo.",
   "Aumenta la demanda de hierro, calcio y proteínas; los controles prenatales se hacen más frecuentes."],
  sint:[
   "Falta de aire, acidez más intensa, dolor lumbar y pélvico, ganas frecuentes de orinar.",
   "Dolor en la zona de la ingle o de la cadera (por la relajación de los ligamentos), hinchazón de pies.",
   "Sueño interrumpido y cansancio."],
  alarma:[
   "El bebé se mueve claramente menos de lo habitual.",
   "Sangrado vaginal, pérdida de líquido, dolor de cabeza intenso o hinchazón súbita."]},
 {n:8, d:32, h:36, bebe:[
   "Gana unos 200-250 g por semana. Los pulmones siguen madurando.",
   "Se pierde buena parte del lanugo. La mayoría se coloca con la cabeza hacia abajo (posición cefálica).",
   "Al final del mes mide unos 45 cm y pesa 2.2-2.8 kg."],
  madre:[
   "El fondo uterino mide de 32 a 36 cm. Hacia la semana 36 el bebé suele descender hacia la pelvis (encajamiento), sobre todo en el primer embarazo.",
   "Mejora la respiración, pero aumenta la presión sobre la vejiga y la pelvis."],
  sint:[
   "Contracciones de Braxton Hicks más frecuentes, cansancio, dificultad para dormir.",
   "Hinchazón de pies, hemorroides, estreñimiento, ganas muy frecuentes de orinar.",
   "Presión en la pelvis y molestias al caminar."],
  alarma:[
   "Contracciones regulares y dolorosas, pérdida de líquido o sangrado antes de la semana 37 (posible parto prematuro).",
   "Disminución de los movimientos del bebé."]},
 {n:9, d:37, h:42, bebe:[
   "A término desde la semana 37. El bebé está listo: pulmones maduros, buen reflejo de succión y de agarre.",
   "Suele estar encajado, con la cabeza en la pelvis. Mide 48-52 cm y pesa 2.9-3.6 kg en promedio.",
   "El vérnix disminuye y la piel se vuelve más lisa."],
  madre:[
   "El cuello del útero se acorta (borramiento) y empieza a abrirse (dilatación). Las contracciones se vuelven más regulares y fuertes.",
   "En una mujer con peso normal antes del embarazo, la ganancia total recomendada es de aproximadamente 11.5 a 16 kg.",
   "Se puede eliminar el tapón mucoso (moco espeso, a veces con un poco de sangre)."],
  sint:[
   "Presión en la pelvis, dolor lumbar, contracciones de pródromos (irregulares), aumento del flujo vaginal.",
   "Menos acidez y mejor respiración si el bebé ya descendió, pero más ganas de orinar.",
   "Ansiedad, insomnio y cansancio."],
  alarma:[
   "Contracciones regulares cada 5 minutos o menos que aumentan en intensidad, rotura de bolsa (salida de líquido) o sangrado: acudir al establecimiento de salud.",
   "Los movimientos del bebé disminuyen o desaparecen."]}
];

function gmLista(arr){ return '<ul>'+arr.map(x=>'<li>'+x+'</li>').join('')+'</ul>'; }
function gmRender(){
  const c = document.getElementById('gm-lista'); if(!c) return;
  c.innerHTML = GM_MESES.map(m=>`<details class="gm-mes" data-mes="${m.n}" data-d="${m.d}" data-h="${m.h}">
    <summary>Mes ${m.n} <span class="gm-sem">· semanas ${m.d}-${m.h}</span> <span class="gm-badge" hidden>Semana actual</span></summary>
    <div class="gm-bloque"><h4>👶 El bebé</h4>${gmLista(m.bebe)}</div>
    <div class="gm-bloque"><h4>🤰 La madre: cambios fisiológicos</h4>${gmLista(m.madre)}</div>
    <div class="gm-bloque"><h4>🩺 Signos y síntomas frecuentes</h4>${gmLista(m.sint)}</div>
    <div class="gm-bloque gm-alarma"><h4>⚠️ Consulte sin demora si hay</h4>${gmLista(m.alarma)}</div>
  </details>`).join('');
  /* abrir un mes cierra los demás */
  c.querySelectorAll('details.gm-mes').forEach(d=>{
    d.addEventListener('toggle', ()=>{ if(d.open) c.querySelectorAll('details.gm-mes').forEach(o=>{ if(o!==d) o.open=false; }); });
  });
}
function gmResaltar(sem){
  const c = document.getElementById('gm-lista'); if(!c) return;
  const hay = (typeof gFUM!=='undefined') && !!gFUM;
  c.querySelectorAll('details.gm-mes').forEach(d=>{
    const act = hay && sem>=+d.dataset.d && sem<=+d.dataset.h;
    d.classList.toggle('gm-actual', act);
    const b = d.querySelector('.gm-badge'); if(b) b.hidden = !act;
  });
}
gmRender();
if(typeof gSemanaSel!=='undefined') gmResaltar(gSemanaSel);
