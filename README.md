# MYTHOS 404 — Global Research Encyclopedia v8.1.0 Final

PWA estática y local-first para explorar mitologías, religiones antiguas, tradiciones narrativas y folclore con una separación editorial explícita entre **corpus revisado** e **índice de descubrimiento**.

## Estado de esta edición

- **5.161 entidades**: 1.022 revisadas + 4.139 discovery.
- **120 relatos**.
- **62 tradiciones/corpus**, todos con contenido.
- **144 familias de fuentes/procedencias** realmente utilizadas.
- **8 shards** de búsqueda discovery y **62 chunks culturales** bajo demanda.
- **14 skins**, deep links, PWA, offline progresivo, herramientas académicas y exportación local.
- **99 archivos** y sin dependencias runtime externas.

## Mejoras v8.1 Final

- Corrige cinco corpus discovery visibles que aparecían vacíos: Polinesia, Melanesia, Micronesia, Indonesia y Vodou.
- Reasigna 180 entradas a esos corpus usando la ruta de procedencia del catálogo, sin cambiar sus IDs ni convertirlas en contenido revisado.
- Neutraliza 3.096 descripciones coloquiales del catálogo CC0: se conservan nombre, alias y procedencia, pero no se presenta su blurb de terceros como conocimiento académico.
- Corrige los contadores de fuentes por cultura para basarlos en `sourceRefs` realmente usados.
- Reposiciona nodos del atlas mundial para evitar solapes exactos y errores conceptuales evidentes.
- Añade búsqueda global progresiva: shard rápido por nombre/alias + opción explícita para cargar los ocho shards y buscar por tema en todo el discovery.
- Refuerza accesibilidad de formularios, grupos, foco y estados de carga.
- Aísla el Service Worker por scope y por caché de versión; registro con `updateViaCache: none`.
- Amplía el quality gate con smoke HTTP y Store, corpus no vacíos, neutralidad discovery, mapa, accesibilidad y PWA.

## Desarrollo local

No necesita build para publicarse. Para servirlo localmente:

```bash
python -m http.server 8080
```

Después abre `http://localhost:8080/`.

## Verificación

Requiere Node.js 20 o superior:

```bash
npm run build:data
npm test
```

`build:data` reconstruye los índices derivados desde los chunks culturales. `npm test` valida sintaxis, integridad del corpus, referencias, versiones, rutas, PWA, búsqueda fragmentada, tamaños, accesibilidad estructural y smoke tests.

## GitHub Pages

`index.html` está en la raíz, las rutas de runtime son relativas, la navegación profunda usa `#hash` y se incluye `.nojekyll`. La publicación recomendada para este paquete estático es **main → /(root)**.

## Política editorial

**Discovery no significa verificado.** Una entrada de descubrimiento es una pista trazable, no una ficha académica. No debe promocionarse al corpus revisado hasta contrastar tradición, fuente primaria/material, edición, bibliografía y cautelas comunitarias cuando proceda.

Consulta `AUDIT_REPORT.md`, `QA_REPORT.md`, `THIRD_PARTY_DATA.md`, `COVERAGE_AND_ETHICS.md`, `ACADEMIC_METHOD.md` y `ARCHITECTURE.md`.
