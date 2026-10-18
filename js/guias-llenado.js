/* Llenado ágil: Enter pasa al siguiente campo; contador de prestaciones marcadas en el encabezado plegable */
(function(){
  function visible(el){ return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length); }
  document.addEventListener('keydown', function(ev){
    if(ev.key !== 'Enter') return;
    const t = ev.target;
    if(!t || (t.tagName !== 'INPUT' && t.tagName !== 'SELECT') || t.type === 'checkbox' || t.id === 'antro_sus_buscador') return;
    const form = document.getElementById('form-section');
    if(!form || !form.contains(t)) return;
    ev.preventDefault();
    const lista = Array.prototype.filter.call(form.querySelectorAll('input:not([readonly]):not([type=checkbox]):not(#antro_sus_buscador), select'), visible);
    const i = lista.indexOf(t);
    if(i >= 0 && i < lista.length-1) lista[i+1].focus(); else t.blur();
  });
  document.addEventListener('DOMContentLoaded', function(){
    const n = document.getElementById('antro_sus_sel_n'), b = document.getElementById('sus-badge');
    if(!n || !b) return;
    const sync = function(){ const v = parseInt(n.textContent,10) || 0; b.textContent = v + (v===1 ? ' marcada' : ' marcadas'); b.style.display = v ? 'inline-block' : 'none'; };
    new MutationObserver(sync).observe(n, {childList:true, characterData:true, subtree:true}); sync();
  });
})();

/* Guía de llenado: marca campos completos y muestra el avance de los datos obligatorios */
function updateFormProgress(){
  const v = id => { const e = document.getElementById(id); return e ? String(e.value||'').trim() : ''; };
  const exacta = (document.getElementById('tipo_fecha')||{}).value !== 'anio';
  const req = [v('sexo'), exacta ? v('fecnac') : v('anio_nac'), v('grupo'), v('peso'), v('talla')];
  const n = req.filter(Boolean).length, pr = document.getElementById('fprog');
  if(!pr) return;
  document.getElementById('fprog-txt').textContent = 'Datos obligatorios ' + n + '/' + req.length;
  document.getElementById('fprog-fill').style.width = (n/req.length*100) + '%';
  document.getElementById('fprog-ok').style.display = n === req.length ? 'inline' : 'none';
  pr.classList.toggle('done', n === req.length);
  document.querySelectorAll('#form-section .fgrid input:not([type=checkbox]), #form-section .fgrid select').forEach(function(e){
    e.classList.toggle('filled', !!String(e.value||'').trim() && !e.readOnly);
  });
}
document.addEventListener('DOMContentLoaded', function(){
  const f = document.getElementById('form-section'); if(!f) return;
  f.addEventListener('input', updateFormProgress); f.addEventListener('change', updateFormProgress);
  updateFormProgress();
});

/* Recordatorio 24 h: marca campos completos y muestra el avance (datos + alimentos) */
function updateR24Progress(){
  const mod = document.getElementById('modulo-r24h'); if(!mod) return;
  const v = id => { const e = document.getElementById(id); return e ? String(e.value||'').trim() : ''; };
  const n = [v('r24_peso'), v('r24_talla'), v('r24_edad') || v('r24_edad_meses')].filter(Boolean).length;
  let m = 0; try { m = (typeof r24Lista !== 'undefined' && r24Lista.length) || 0; } catch(e) {}
  document.getElementById('r24prog-txt').textContent = 'Paso 1 · Datos ' + n + '/3 · Paso 2 · Alimentos ' + m;
  document.getElementById('r24prog-fill').style.width = ((n/3)*50 + (m > 0 ? 50 : 0)) + '%';
  const ok = n === 3 && m > 0;
  document.getElementById('r24prog-ok').style.display = ok ? 'inline' : 'none';
  document.getElementById('r24prog').classList.toggle('done', ok);
  mod.querySelectorAll('.fgrid input:not([type=checkbox]):not([type=range]), .fgrid select').forEach(function(e){
    e.classList.toggle('filled', !!String(e.value||'').trim() && !e.readOnly);
  });
}
document.addEventListener('DOMContentLoaded', function(){
  const mod = document.getElementById('modulo-r24h'); if(!mod) return;
  mod.addEventListener('input', updateR24Progress); mod.addEventListener('change', updateR24Progress);
  const tb = document.getElementById('r24_tabla_body');
  if(tb) new MutationObserver(updateR24Progress).observe(tb, {childList:true});
  updateR24Progress();
});

/* Gestograma: marca campos completos y muestra el avance de los datos */
function updateGestoProgress(){
  const mod = document.getElementById('modulo-gestograma'); if(!mod) return;
  const v = id => { const e = document.getElementById(id); return e ? String(e.value||'').trim() : ''; };
  const fum = v('g_fechaInicio') ? 1 : 0, opt = [v('g_peso'), v('g_talla')].filter(Boolean).length;
  document.getElementById('gprog-txt').textContent = 'FUM ' + fum + '/1 · IMC gestacional (opcional) ' + opt + '/2';
  document.getElementById('gprog-fill').style.width = (fum*50 + opt*25) + '%';
  document.getElementById('gprog-ok').style.display = fum ? 'inline' : 'none';
  document.getElementById('gprog').classList.toggle('done', !!fum);
  mod.querySelectorAll('.fgrid input, .fgrid select').forEach(function(e){
    e.classList.toggle('filled', !!String(e.value||'').trim() && !e.readOnly);
  });
}
document.addEventListener('DOMContentLoaded', function(){
  const mod = document.getElementById('modulo-gestograma'); if(!mod) return;
  mod.addEventListener('input', updateGestoProgress); mod.addEventListener('change', updateGestoProgress);
  updateGestoProgress();
});
