# Arquitectura — MYTHOS 404 Global Research v8.1 Final

## Objetivo

Escalar a decenas de miles de entradas sin cargar un catálogo mundial monolítico ni mezclar contenido revisado con candidatos de investigación.

## Arranque

```text
index.html
   ↓
js/core.js          metadatos, culturas, fuentes y módulos comunes
   ↓
js/index.js         1.022 revisadas + 120 relatos + 5.161 locators + manifiesto de shards
   ↓
js/store.js         loader, caché, búsqueda progresiva y lazy loading
   ↓
js/app.js           interfaz
```

El bootstrap descriptivo no incluye las 4.139 fichas discovery completas.

## Búsqueda en dos niveles

1. **Rápida:** se consulta el corpus revisado y el shard probable según nombre/alias.
2. **Exhaustiva bajo demanda:** la interfaz ofrece «Buscar también por tema en todo el índice» y carga los ocho shards solo cuando el usuario lo solicita.

Los shards son `abc`, `def`, `ghi`, `jkl`, `mnop`, `qrs`, `tuv` y `wxyz`. El Store deduplica resultados por ID.

## Locators y deep links

`js/index.js` conserva pares mínimos `id → culture` para todas las entidades. Por eso `#entity/<id>` puede resolver una ficha discovery sin precargar su shard. Los relatos y culturas usan `#myth/<id>` y `#culture/<id>`.

## Chunks culturales

Cada tradición/corpus vive en `data/cultures/<id>.js`. Abrir una ficha sigue la cadena:

```text
ID → locator → culture → chunk cultural → ficha completa
```

## PWA y caché

El shell se precachea; shards y chunks culturales se cachean al solicitarlos. v8.1 limita el Service Worker a su propio scope y consulta la caché nombrada de la versión actual, reduciendo interferencias con despliegues anteriores o apps vecinas.

## Build reproducible

`tools/rebuild-index.mjs` lee los 62 chunks y regenera estadísticas, fuentes usadas, variantes, índice revisado, locators y ocho shards. `tools/validate.mjs` actúa como quality gate y además ejecuta smoke tests HTTP/Store.

## Deuda técnica controlada

- `js/app.js` sigue siendo un módulo grande y será el siguiente candidato a dividir por features.
- Grecia ronda 900 KiB y debería subdividirse si continúa creciendo.
- Por encima de 10.000–20.000 entradas convendrá fragmentar también el locator y considerar un índice temático generado más compacto.
