/* ===== PUENTE NATIVO (Capacitor): descargas, compartir y almacenamiento persistente ===== */
const IS_NATIVE = !!(window.Capacitor && typeof window.Capacitor.isNativePlatform==='function' && window.Capacitor.isNativePlatform());
function nutriBlobBase64(blob){
  return new Promise((ok,err)=>{ const fr=new FileReader(); fr.onload=()=>ok(String(fr.result).split(',')[1]); fr.onerror=()=>err(fr.error); fr.readAsDataURL(blob); });
}
async function nutriGuardarArchivo(nombre, blob){
  nombre = String(nombre||'archivo').replace(/[\\/:*?"<>|]+/g,'_');
  if(IS_NATIVE){
    try{
      const P = window.Capacitor.Plugins, FS = P.Filesystem, SH = P.Share;
      await FS.writeFile({path:nombre, data: await nutriBlobBase64(blob), directory:'CACHE'});
      const r = await FS.getUri({path:nombre, directory:'CACHE'});
      await SH.share({title:nombre, url:r.uri, dialogTitle:'Guardar o compartir'});
      return true;
    }catch(e){
      if(e && /cancel/i.test(String(e.message||e))) return false;
      alert('No se pudo guardar el archivo: ' + (e && e.message || e)); return false;
    }
  }
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 4000);
  return true;
}
try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){}

/* ===== RESPALDO DEL REGISTRO LOCAL (exportar / importar) ===== */
async function registroExportar(){
  try{
    const pacientes = await idbGetAll('pacientes'), recordatorios = await idbGetAll('recordatorios');
    if(!pacientes.length && !recordatorios.length){ alert('No hay registros para respaldar.'); return; }
    const data = {app:'NutriAndes', formato:1, fecha:new Date().toISOString(), pacientes, recordatorios};
    const blob = new Blob([JSON.stringify(data)], {type:'application/json'});
    await nutriGuardarArchivo('nutriandes_respaldo_'+new Date().toISOString().slice(0,10)+'.json', blob);
  }catch(e){ alert('No se pudo exportar el registro: '+(e.message||e)); }
}
async function registroImportar(input){
  const f = input.files && input.files[0]; input.value='';
  if(!f) return;
  try{
    const d = JSON.parse(await f.text());
    if(!d || d.app!=='NutriAndes' || !Array.isArray(d.pacientes) || !Array.isArray(d.recordatorios)) throw new Error('El archivo no es un respaldo de NutriAndes.');
    const firma = r => (r.ts||'')+'|'+(r.nombre||'');
    let nuevos=0, repetidos=0;
    for(const [store, lista] of [['pacientes',d.pacientes],['recordatorios',d.recordatorios]]){
      const existentes = new Set((await idbGetAll(store)).map(firma));
      for(const r of lista){
        if(existentes.has(firma(r))){ repetidos++; continue; }
        const c = Object.assign({}, r); delete c.id;
        await idbAdd(store, c); existentes.add(firma(c)); nuevos++;
      }
    }
    alert('Importación lista: '+nuevos+' registro(s) nuevo(s), '+repetidos+' ya existían.');
    if(typeof regRender==='function') regRender();
  }catch(e){ alert('No se pudo importar: '+(e.message||e)); }
}

/* ===== AVISO CLÍNICO (se muestra al abrir la app hasta que el usuario lo acepte) ===== */
const AVISO_KEY = 'nutriandes_aviso_v1';
function avisoAceptado(){ try{ return localStorage.getItem(AVISO_KEY)==='1'; }catch(e){ return false; } }
function avisoAceptar(){ try{ localStorage.setItem(AVISO_KEY,'1'); }catch(e){} document.getElementById('aviso-clinico').hidden = true; }
document.addEventListener('DOMContentLoaded', function(){ if(!avisoAceptado()) document.getElementById('aviso-clinico').hidden = false; });
