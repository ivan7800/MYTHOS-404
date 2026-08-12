# QA REPORT — MYTHOS 404 v8.1.0 Final

## Alcance

Validación de la build corregida posterior a la auditoría multidisciplinar, con especial atención a coherencia de datos, GitHub Pages, PWA, seguridad, accesibilidad estructural y comportamiento del Store fragmentado.

## Quality gate automatizado

`npm test` comprueba, entre otros puntos:

- sintaxis de core/index/store/app/service worker;
- 92 IDs HTML únicos y rutas relativas;
- botones HTML con `type` explícito y formulario del Oráculo accesible;
- CSP local-first y ausencia de dependencias runtime externas;
- búsqueda global progresiva + ampliación temática completa;
- importación JSON limitada/validada;
- CSS responsive, foco, safe-area, contraste forzado y reducción de movimiento;
- **5.161 entidades únicas**, **120 relatos**, **62 chunks con contenido**;
- **1.022 revisadas + 4.139 discovery** y bootstrap solo del corpus revisado;
- 5.161 locators y cobertura discovery completa mediante 8 shards;
- contadores culturales basados en `sourceRefs` realmente utilizados;
- 3.096 fichas CC0 con descripción neutralizada;
- atlas con 62 corpus, coordenadas dentro de rango y sin nodos exactamente solapados;
- manifest, iconos maskable y Service Worker v8.1;
- aislamiento del Service Worker por scope y caché de versión;
- shards fuera del precache inicial;
- bootstrap por debajo de 900 KiB;
- nombres compatibles con Git/GitHub/Windows y menos de 100 archivos.

## Smoke tests

### HTTP

El validador levanta un servidor estático efímero y exige HTTP 200 para shell, CSS, core, índice, Store, app, manifest, Service Worker, un shard y chunks culturales de muestra.

### Store

En VM de Node se verifica arranque del bootstrap revisado, carga de un chunk profundo, carga de shard discovery y apertura posterior de un chunk discovery.

## Resultado de esta build

- Entidades: **5.161**.
- Relatos: **120**.
- Chunks culturales: **62**.
- Shards: **8**.
- Bootstrap sin imágenes: **~641,8 KiB**.
- Índice raíz: **~348,7 KiB**.
- Mayor shard: **~234,9 KiB**.
- Mayor chunk cultural: **~899,8 KiB**.
- Archivos: **99**.
- Resultado: **Quality gate sin errores**.

## Limitación de entorno

Se intentó E2E headless con Chromium, pero el navegador del contenedor no completó de forma fiable por restricciones del entorno. Por rigor, no se certifican aquí Lighthouse, instalación/actualización PWA ni matriz Safari/iOS/Android/lectores de pantalla. Deben repetirse sobre la URL HTTPS final y dispositivos reales.
