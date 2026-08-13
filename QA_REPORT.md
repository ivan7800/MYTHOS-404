# QA REPORT — MYTHOS 404 Knowledge Encyclopedia v9.1.0

Fecha de validación: 2026-08-13  
Objetivo: comprobar que Knowledge Expansion I es publicable en GitHub Pages, mantiene el corpus y endurece el estándar editorial sin introducir regresiones.

## 1. Resultado ejecutivo

**Quality gate: PASA sin errores.**

La build contiene **5.154 entidades**, **120 relatos**, **62 tradiciones/corpus**, **62 chunks culturales** y **8 shards de búsqueda**:

- **1.027 fichas revisadas por MYTHOS**;
- **181 fichas documentadas externamente**;
- **3.946 entradas de descubrimiento**.

La completitud documental media es **40%**. La métrica indica cobertura de campos, no certeza histórica.

## 2. Pruebas automatizadas

Comandos ejecutados:

```bash
npm run build:data
npm test
```

Resultado del validador:

- sintaxis válida en `core.js`, `index.js`, `store.js`, `app.js` y `sw.js`;
- manifest y `package.json` válidos;
- **94 IDs HTML únicos**;
- rutas relativas compatibles con subrutas de GitHub Pages;
- CSP local-first;
- botones con `type` explícito;
- formulario del Oráculo accesible;
- importación JSON limitada y validada;
- CSS responsive, foco visible, safe areas y `prefers-reduced-motion`;
- **5.154 IDs de entidad únicos**;
- **120 relatos únicos**;
- 62/62 corpus con contenido;
- atlas mundial cubre los 62 corpus y no tiene nodos exactamente superpuestos;
- **5.154 locators** para entidades canónicas y **7 redirects legacy** para deep links consolidados;
- **4.127 entradas externas** cubiertas por 8 shards;
- **144 familias de fuentes/procedencias** válidas;
- versión coherente `9.1.0` en datos/runtime/PWA;
- 21 vistas/rutas;
- iconos PWA `any` y `maskable`;
- Service Worker `9.1.0` aislado por scope/caché;
- shards fuera del precache inicial;
- nombres compatibles con Git/GitHub/Windows;
- **99 archivos totales**.

## 3. Smoke tests de runtime

El validador inicia un servidor estático local y comprueba HTTP 200 para shell, CSS/JS, manifest, Service Worker, un shard y chunks culturales representativos.

El Store smoke verifica:

1. bootstrap con solo las **1.027 revisadas**;
2. carga del shard `abc` bajo demanda;
3. resolución de deep links mediante locator;
4. resolución de un ID legacy consolidado hacia su ficha canónica;
5. carga bajo demanda de `greek` y `hawaiian`.

## 4. Knowledge Standard

| Nivel | Entidades |
|---|---:|
| Revisada por MYTHOS | 1.027 |
| Documentada externamente | 181 |
| Descubrimiento | 3.946 |
| **Total** | **5.154** |

La expansión revisa ocho conceptos con loci antiguos identificables: **5 fichas pasan de discovery a revisadas**, **3 fichas ya revisadas reciben evidencia y cautelas adicionales**, y **7 registros duplicados se consolidan**. Ninguna entrada se promueve por puntuación upstream o por pertenecer a un dataset abierto.

Las 181 documentadas externamente conservan su nivel intermedio y ahora explicitan la separación entre metadatos upstream y validación MYTHOS.

## 5. Completitud documental

| Banda | Fichas |
|---|---:|
| Amplia · 80–100 | 83 |
| Desarrollada · 60–79 | 1.033 |
| En desarrollo · 40–59 | 525 |
| Básica · 0–39 | 3.513 |

Media: **40%**.

## 6. Cola editorial

La build genera 24 candidatos discovery priorizados. Se validó que:

- no promueve automáticamente;
- limita la concentración por cultura;
- excluye nombres-placeholder entre corchetes;
- excluye pseudo-corpus cuyo identificador comienza por `discovery-`;
- expone completitud y campos que faltan.

## 7. Rendimiento estructural

- bootstrap sin imágenes: **~687,0 KiB**;
- índice raíz: **~369,7 KiB**;
- mayor shard: **~260,5 KiB**;
- mayor chunk cultural: **~975,4 KiB**;
- 4.127 entradas externas fuera del bootstrap inicial.

La arquitectura sigue siendo adecuada para GitHub Pages. Si el corpus griego crece de forma significativa, conviene subdividir su chunk.

## 8. Accesibilidad estructural

Se verifican en código:

- botones con tipo explícito;
- estados ARIA relevantes;
- formulario etiquetado;
- foco visible;
- `prefers-reduced-motion`;
- safe areas móviles;
- `forced-colors` contemplado por CSS;
- indicadores de madurez que no dependen exclusivamente del color.

## 9. Limitación E2E del entorno

La validación automatizada del proyecto sí pasa. El entorno disponible no permite certificar como superada una sesión completa de Chromium headless por los fallos DBus/zygote ya observados en esta imagen de ejecución.

Por tanto quedan por certificar en la URL HTTPS publicada:

- Lighthouse;
- instalación y actualización PWA;
- Safari iPhone/iPad;
- Chrome Android;
- Firefox;
- NVDA, VoiceOver y TalkBack.

No se presentan esas pruebas como realizadas.
