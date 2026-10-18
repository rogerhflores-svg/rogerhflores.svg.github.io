# NutriAndes

Herramienta de apoyo para el personal de salud en Bolivia: evaluación, tratamiento y seguimiento nutricional, requerimiento nutricional diario y recordatorio de 24 horas. Todo funciona en el teléfono o el navegador, **sin internet** y sin servidor.

> Herramienta educativa y de apoyo. No sustituye la valoración clínica ni las normas vigentes del MSyD y AGEMED. Las dosis de fármacos son orientativas y deben ser confirmadas por un médico o farmacéutico.

## Cómo usarla

- **Local:** abra `index.html` en el navegador (no requiere instalar nada).
- **GitHub Pages:** en el repositorio, *Settings → Pages → Deploy from a branch → `main` / `(root)`*. La app quedará en `https://<usuario>.github.io/<repositorio>/`.
- **Android:** el mismo código se empaqueta con Capacitor (ver el proyecto `nutriandes-capacitor`).

La tipografía (Nunito Sans) se carga desde Google Fonts cuando hay internet; sin conexión se usa la fuente del sistema y todo lo demás funciona igual.

## Estructura

```
index.html                  Estructura de la página (módulos y formularios)
css/
  styles.css                Estilos, modo noche y color por módulo
js/
  datos/                    Bases de datos (solo datos, sin lógica)
    liname-catalogo.js        Catálogo LINAME y prestaciones
    ley475.js                 Prestaciones Ley 475, mecanismo de acción e interacciones
    remedios.js               Remedios herbales
    alimentos-24h.js          Tabla de composición de alimentos
  referencias-oms.js        Tablas OMS (0–5 años), Fenton y Síndrome de Down
  prestaciones-msyd.js      Clasificaciones, prestaciones MSyD, suplementación, control
  sintesis-prestaciones.js  Síntesis de prestaciones del SUS sin repeticiones
  curvas-y-ui.js            Curvas de crecimiento, modo noche, fecha y edad
  catalogo-liname.js        Catálogo LINAME, respaldo Ley 475 y tarjetas de fármacos
  navegacion.js             Navegación entre módulos
  gestograma.js             Gestograma y manejo de gastritis
  remedios.js               Módulo de remedios herbales
  recordatorio-24h.js       Recordatorio de 24 h y análisis químico
  antropometria.js          Evaluación antropométrica (cálculo del diagnóstico)
  registro.js               Registro local (IndexedDB) y edición de recordatorios
  guias-llenado.js          Guía visual de llenado y avance de los formularios
  puente-nativo.js          Descargas y compartir en Android (Capacitor)
  gestograma-meses.js       Desarrollo mes a mes del embarazo
  nutripdf.js               Generador de PDF propio (sin librerías)
```

## Orden de carga

Los archivos son scripts clásicos que comparten el mismo ámbito global, así que **el orden de las etiquetas `<script>` en `index.html` importa**: primero los datos (`js/datos/`), luego la lógica, y al final el gestograma por meses y el generador de PDF. Si agrega un archivo nuevo, inclúyalo en `index.html` después de los datos que use.

## Datos y privacidad

Los datos de pacientes se guardan solo en el dispositivo (IndexedDB). La app no envía información a ningún servidor. Use *Registro de pacientes → Exportar respaldo* para guardar copias.

## Fuentes de referencia

OMS (patrones de crecimiento 2006, referencia 2007), AIEPI, Atención integrada al continuo del curso de la vida (2021), catálogo de prestaciones del SUS (Ley 475) y LINAME 2022–2024. Las referencias completas están en el módulo *Acerca de*.
