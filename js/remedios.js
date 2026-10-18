/* NutriAndes — módulo de remedios herbales */
let rmTabActual = 'todos';
let rmBuscadorTimeout = null;

function rmQuitarTildes(s){
  return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s\-\/\.]/g,' ');
}

function rmCautelaBadge(c){
  if(c==='Alto') return '<span style="background:#FCEBEB;color:#791F1F;border-radius:5px;padding:1px 6px;font-size:10.5px;font-weight:700">⚠ Alto</span>';
  if(c==='Moderado') return '<span style="background:#FAEEDA;color:#633806;border-radius:5px;padding:1px 6px;font-size:10.5px;font-weight:700">Moderado</span>';
  if(c==='Bajo') return '<span style="background:#EAF3DE;color:#27500A;border-radius:5px;padding:1px 6px;font-size:10.5px;font-weight:700">Bajo</span>';
  return '<span style="background:#E6F1FB;color:#0C447C;border-radius:5px;padding:1px 6px;font-size:10.5px;font-weight:700">Sin datos</span>';
}

function rmTarjetaPlanta(p){
  const riesgo = (p.riesgo||'').toUpperCase();
  let riesgoBadge = '';
  if(riesgo==='ALTO') riesgoBadge = '<span style="background:#FCEBEB;color:#791F1F;border-radius:5px;padding:1px 7px;font-size:10.5px;font-weight:700">Riesgo ALTO</span>';
  else if(riesgo==='MEDIO') riesgoBadge = '<span style="background:#FAEEDA;color:#633806;border-radius:5px;padding:1px 7px;font-size:10.5px;font-weight:700">Riesgo MEDIO</span>';
  else if(riesgo==='BAJO') riesgoBadge = '<span style="background:#EAF3DE;color:#27500A;border-radius:5px;padding:1px 7px;font-size:10.5px;font-weight:700">Riesgo BAJO</span>';
  const meta = [p.noms, p.pag!=null && p.pag!=='' ? 'p. '+p.pag : null, p.sec].filter(Boolean).join(' · ');
  return `<div class="manejo-box" style="margin-bottom:7px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;flex-wrap:wrap">
      <div style="font-size:13px;font-weight:700;color:#3d4d63">${p.nom}</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">${riesgoBadge}${rmCautelaBadge(p.caut)}</div>
    </div>
    <div style="font-size:11px;color:#5c6b82;margin-top:1px">${meta}</div>
    ${p.usos?`<div class="contenido" style="margin-top:5px"><b>Para qué se usa:</b> ${p.usos}</div>`:''}
    ${p.dol?`<div class="contenido" style="margin-top:3px"><b>Dolencias (guía):</b> ${p.dol}</div>`:''}
    ${p.formas?`<div class="contenido" style="margin-top:3px"><b>Cómo se aplica:</b> ${p.formas}</div>`:''}
    ${p.recetas?`<div class="contenido" style="margin-top:3px"><b>Recetas:</b> ${p.recetas}</div>`:''}
    ${p.prec?`<div class="contenido" style="margin-top:3px"><b>Precauciones / contraindicaciones:</b> ${p.prec}</div>`:''}
    ${p.caut?`<div class="contenido" style="margin-top:3px"><b>Cautela / interacciones:</b> ${p.caut}</div>`:''}
    ${p.com?`<div class="contenido" style="margin-top:3px;font-size:11.5px;color:var(--muted)"><b>Región / notas:</b> ${p.com}</div>`:''}
    ${p.fuente?`<div style="font-size:10.5px;color:var(--muted);margin-top:4px">${p.fuente}</div>`:''}
  </div>`;
}

function rmTarjetaGuia(g){
  const remedios = g.remedios || [];
  let lista = '';
  if(remedios.length){
    lista = remedios.map(r=>{
      const badge = rmCautelaBadge(r.caut||'');
      return `<div style="border-top:0.5px solid #ecdfc0;margin-top:8px;padding-top:6px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px">
          <div style="font-size:12.5px;font-weight:700;color:#3d4d63">${r.nom}</div>
          ${badge}
        </div>
        ${r.noms?`<div style="font-size:10.5px;color:#5c6b82;margin-top:1px">${r.noms}${r.sec?' · '+r.sec:''}</div>`:''}
        ${r.usos?`<div class="contenido" style="margin-top:4px"><b>Para qué se usa:</b> ${r.usos}</div>`:''}
        ${r.formas?`<div class="contenido" style="margin-top:3px"><b>Cómo se aplica:</b> ${r.formas}</div>`:''}
        ${r.recetas?`<div class="contenido" style="margin-top:3px"><b>Recetas / preparación:</b> ${r.recetas}</div>`:''}
        ${r.prec?`<div class="contenido" style="margin-top:3px;color:#633806"><b>Contraindicaciones / precauciones:</b> ${r.prec}</div>`:''}
      </div>`;
    }).join('');
  } else {
    lista = `<div class="contenido" style="margin-top:5px">${g.plantas||'Sin detalle disponible'}</div>`;
  }
  return `<div class="manejo-box" style="margin-bottom:7px">
    <div style="font-size:11px;color:#8a6a1f;font-weight:700;text-transform:uppercase;letter-spacing:.04em">${g.cat||''}</div>
    <div style="font-size:13px;font-weight:700;color:#3d4d63;margin-top:2px">${g.dol}</div>
    ${lista}
  </div>`;
}

function rmTarjetaCasero(c){
  return `<div class="manejo-box" style="margin-bottom:7px">
    <div style="font-size:13px;font-weight:700;color:#3d4d63">${c.nom} <span style="font-size:11px;color:#5c6b82;font-weight:400">· p. ${c.pag}</span></div>
    <div class="contenido" style="margin-top:5px"><b>Indicaciones:</b> ${c.ind}</div>
    ${c.dosis?`<div class="contenido" style="margin-top:3px"><b>Dosis / forma:</b> ${c.dosis}</div>`:''}
    ${c.prec?`<div class="contenido" style="margin-top:3px;color:#633806"><b>Precauciones:</b> ${c.prec}</div>`:''}
  </div>`;
}

function rmTarjetaPrep(p){
  return `<div class="manejo-box" style="margin-bottom:7px">
    <div style="font-size:13px;font-weight:700;color:#3d4d63">${p.met} <span style="font-size:11px;color:#5c6b82;font-weight:400">· p. ${p.pag}</span></div>
    <div class="contenido" style="margin-top:5px"><b>Qué es:</b> ${p.que}</div>
    ${p.ind?`<div class="contenido" style="margin-top:3px"><b>Indicaciones:</b> ${p.ind}</div>`:''}
  </div>`;
}

function rmTarjetaAdv(a){
  return `<div class="manejo-box" style="margin-bottom:7px">
    <div style="font-size:13px;font-weight:700;color:#3d4d63">${a.tema}</div>
    <div class="contenido" style="margin-top:5px">${a.dice}</div>
    ${a.pag?`<div style="font-size:10.5px;color:#5c6b82;margin-top:3px">p. ${a.pag}</div>`:''}
  </div>`;
}

function rmCambiarTab(tab){
  rmTabActual = tab;
  ['todos','plantas','guia','prep','caseros','adv','alto','infusiones'].forEach(t=>{
    const btn = document.getElementById('rm-tab-'+t);
    if(!btn) return;
    if(t===tab){ btn.className='btn'; btn.style.width='auto'; btn.style.padding='6px 10px'; btn.style.fontSize='12px'; btn.style.margin='0'; }
    else { btn.className='btn btn-clear'; btn.style.width='auto'; btn.style.padding='6px 10px'; btn.style.fontSize='12px'; btn.style.margin='0'; }
  });
  document.getElementById('rm_buscador').value = '';
  rmBuscar();
}

function rmBuscar(){
  clearTimeout(rmBuscadorTimeout);
  rmBuscadorTimeout = setTimeout(()=>{
    const raw = (document.getElementById('rm_buscador').value||'').trim();
    const cont = document.getElementById('rm_resultados');
    const contador = document.getElementById('rm_contador');
    const term = rmQuitarTildes(raw);
    let html = '';
    let total = 0;

    if(rmTabActual==='todos'){
      // Unified search across plants, Andean, infusions, caseros
      const results = [];
      const addMatch = (tipo, nom, extra, blob) => {
        if(term.length < 2 || rmQuitarTildes(blob).includes(term)){
          results.push({tipo, nom, extra, blob});
        }
      };
      (REMEDIOS_DATA.plantas||[]).forEach(p=>{
        const blob = [p.nom,p.noms,p.usos,p.dol,p.formas,p.recetas,p.prec,p.sec].join(' ');
        addMatch('planta', p.nom, p, blob);
      });
      (REMEDIOS_DATA.alto_infusiones||[]).forEach(c=>{
        const blob = [c.nom,c.ind,c.dosis,c.prec].join(' ');
        addMatch('infusion', c.nom, c, blob);
      });
      (REMEDIOS_DATA.caseros||[]).forEach(c=>{
        const blob = [c.nom,c.ind,c.dosis,c.prec].join(' ');
        addMatch('casero', c.nom, c, blob);
      });
      // dedupe by name+tipo
      const seen = new Set();
      const unique = [];
      results.forEach(r=>{
        const k = r.tipo+'|'+r.nom;
        if(!seen.has(k)){ seen.add(k); unique.push(r); }
      });
      let matches = term.length < 2 ? unique : unique.filter(r=>rmQuitarTildes(r.blob).includes(term));
      // when no term, show message to type
      if(term.length < 2){
        contador.textContent = `${unique.length} remedios indexados (plantas, hongos, altoandinos, infusiones y caseros). Escriba al menos 2 letras para buscar.`;
        cont.innerHTML = '<div class="integral-box">Escriba un síntoma, signo o nombre de remedio (ej. <b>muña</b>, <b>gastritis</b>, <b>mate de coca</b>, <b>tos</b>) para buscar en todo el catálogo.</div>';
        return;
      }
      contador.textContent = matches.length ? `${matches.length} resultado(s) en todo el catálogo${matches.length>50?' — mostrando los primeros 50':''}.` : 'Sin resultados. Pruebe otra palabra clave.';
      matches.slice(0,50).forEach(r=>{
        if(r.tipo==='planta') html += rmTarjetaPlanta(r.extra);
        else if(r.tipo==='infusion'){
          const c = r.extra;
          html += `<div class="manejo-box" style="margin-bottom:7px">
            <div style="font-size:13px;font-weight:700;color:#3d4d63">🍵 ${c.nom}</div>
            <div class="contenido" style="margin-top:5px"><b>Para qué se usa:</b> ${c.ind||''}</div>
            ${c.dosis?`<div class="contenido" style="margin-top:3px"><b>Cómo se aplica:</b> ${c.dosis}</div>`:''}
            ${c.prec?`<div class="contenido" style="margin-top:3px;color:#633806"><b>Contraindicaciones / precauciones:</b> ${c.prec}</div>`:''}
          </div>`;
        } else if(r.tipo==='casero'){
          html += rmTarjetaCasero(r.extra);
        }
      });
    } else if(rmTabActual==='plantas'){
      const list = REMEDIOS_DATA.plantas;
      let matches;
      if(term.length < 2){
        matches = list;
        contador.textContent = `${list.length} plantas / hongos / líquenes. Escriba al menos 2 caracteres para filtrar, o explore la lista.`;
      } else {
        matches = list.filter(p => {
          const blob = rmQuitarTildes([p.nom,p.noms,p.usos,p.dol,p.formas,p.recetas,p.prec,p.caut,p.com,p.sec,p.riesgo,p.fuente,p.bloque].join(' '));
          return blob.includes(term);
        });
        contador.textContent = matches.length ? `${matches.length} resultado(s)${matches.length>60?' — mostrando los primeros 60':''}.` : 'Sin resultados. Pruebe otro síntoma o nombre.';
      }
      matches.slice(0,60).forEach(p => { html += rmTarjetaPlanta(p); });
    } else if(rmTabActual==='guia'){
      const list = REMEDIOS_DATA.guia;
      let matches;
      if(term.length < 2){
        matches = list;
        contador.textContent = `${list.length} dolencias / usos en la guía. Escriba para filtrar por síntoma o categoría.`;
      } else {
        matches = list.filter(g => {
          const noms = (g.remedios||[]).map(r=>r.nom).join(' ');
          const blob = rmQuitarTildes([g.cat,g.dol,noms,g.plantas].join(' '));
          return blob.includes(term);
        });
        contador.textContent = matches.length ? `${matches.length} resultado(s)${matches.length>40?' — mostrando los primeros 40':''}.` : 'Sin resultados.';
      }
      matches.slice(0,40).forEach(g => { html += rmTarjetaGuia(g); });
    } else if(rmTabActual==='caseros'){
      const list = REMEDIOS_DATA.caseros;
      let matches = term.length < 2 ? list : list.filter(c => rmQuitarTildes([c.nom,c.ind,c.dosis,c.prec].join(' ')).includes(term));
      contador.textContent = `${matches.length} remedio(s) casero(s).`;
      matches.forEach(c => { html += rmTarjetaCasero(c); });
    } else if(rmTabActual==='prep'){
      const list = REMEDIOS_DATA.prep;
      let matches = term.length < 2 ? list : list.filter(p => rmQuitarTildes([p.met,p.que,p.ind].join(' ')).includes(term));
      contador.textContent = `${matches.length} método(s) de preparación.`;
      matches.forEach(p => { html += rmTarjetaPrep(p); });
    } else if(rmTabActual==='adv'){
      const list = REMEDIOS_DATA.adv;
      let matches = term.length < 2 ? list : list.filter(a => rmQuitarTildes([a.tema,a.dice].join(' ')).includes(term));
      contador.textContent = `${matches.length} advertencia(s) general(es).`;
      matches.forEach(a => { html += rmTarjetaAdv(a); });
    } else if(rmTabActual==='alto'){
      const list = REMEDIOS_DATA.plantas.filter(p => (p.sec||'').includes('altoandina'));
      let matches;
      if(term.length < 2){
        matches = list;
        contador.textContent = `${list.length} remedios de la zona altoandina (Perú, Bolivia, Argentina, Chile). Escriba para filtrar.`;
      } else {
        matches = list.filter(p => {
          const blob = rmQuitarTildes([p.nom,p.noms,p.usos,p.dol,p.formas,p.recetas,p.prec].join(' '));
          return blob.includes(term);
        });
        contador.textContent = matches.length ? `${matches.length} resultado(s) altoandinos.` : 'Sin resultados en remedios altoandinos.';
      }
      matches.forEach(p => { html += rmTarjetaPlanta(p); });
    } else if(rmTabActual==='infusiones'){
      const list = REMEDIOS_DATA.alto_infusiones || [];
      let matches = term.length < 2 ? list : list.filter(c => rmQuitarTildes([c.nom,c.ind,c.dosis,c.prec].join(' ')).includes(term));
      contador.textContent = `${matches.length} infusión(es) / mates tradicionales altoandinos.`;
      matches.forEach(c => {
        html += `<div class="manejo-box" style="margin-bottom:7px">
          <div style="font-size:13px;font-weight:700;color:#3d4d63">🍵 ${c.nom}</div>
          <div class="contenido" style="margin-top:5px"><b>Para qué se usa:</b> ${c.ind||''}</div>
          ${c.dosis?`<div class="contenido" style="margin-top:3px"><b>Cómo se aplica:</b> ${c.dosis}</div>`:''}
          ${c.prec?`<div class="contenido" style="margin-top:3px;color:#633806"><b>Contraindicaciones / precauciones:</b> ${c.prec}</div>`:''}
          ${c.pag?`<div style="font-size:10.5px;color:#5c6b82;margin-top:3px">${c.pag}</div>`:''}
        </div>`;
      });
    }

    if(!html) html = '<div class="integral-box">No hay resultados para mostrar.</div>';
    cont.innerHTML = html;
  }, 120);
}
