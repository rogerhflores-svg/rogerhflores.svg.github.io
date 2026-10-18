/* NutriAndes — navegación entre módulos */
/* ===== NAVEGACIÓN ENTRE MÓDULOS ===== */
/* Escapa texto antes de insertarlo como HTML (usada por el Registro y otros módulos) */
function escHtml(v){
  return String(v==null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function abrirModulo(m){
  if(m==='gestograma' && typeof updateGestoProgress==='function') setTimeout(updateGestoProgress, 0);
  if(m==='r24h' && typeof updateR24Progress==='function') setTimeout(updateR24Progress, 0);
  document.getElementById('menu-inicio').style.display='none';
  document.getElementById('modulo-antropometria').style.display = m==='antropometria' ? 'block' : 'none';
  document.getElementById('modulo-gestograma').style.display = m==='gestograma' ? 'block' : 'none';
  document.getElementById('modulo-prestaciones').style.display = m==='prestaciones' ? 'block' : 'none';
  document.getElementById('modulo-remedios').style.display = m==='remedios' ? 'block' : 'none';
  document.getElementById('modulo-r24h').style.display = m==='r24h' ? 'block' : 'none';
  document.getElementById('modulo-registro').style.display = m==='registro' ? 'block' : 'none';
  document.getElementById('modulo-acerca').style.display = m==='acerca' ? 'block' : 'none';
  if(m==='registro'){ regCambiarTab(regTabActual||'pacientes'); }
  if(m==='prestaciones'){ document.getElementById('pl_contador').textContent = `${LINAME_CATALOGO.length} medicamentos LINAME 2022-2024 · ${LEY475_PRESTACIONES.length} prestaciones de servicio. Escriba nombre, código LINAME o ATC.`; }
  if(m==='remedios'){ rmCambiarTab(rmTabActual || 'todos'); }
}
function volverMenu(){
  if(typeof r24EditId !== 'undefined' && r24EditId != null && document.getElementById('modulo-r24h').style.display !== 'none'){
    if(!confirm('Está editando un recordatorio guardado. ¿Salir sin guardar los cambios?')) return;
    r24SalirEdicion(true);
  }
  document.getElementById('menu-inicio').style.display='block';
  document.getElementById('modulo-antropometria').style.display='none';
  document.getElementById('modulo-gestograma').style.display='none';
  document.getElementById('modulo-prestaciones').style.display='none';
  document.getElementById('modulo-remedios').style.display='none';
  document.getElementById('modulo-r24h').style.display='none';
  document.getElementById('modulo-registro').style.display='none';
  document.getElementById('modulo-acerca').style.display='none';
}
