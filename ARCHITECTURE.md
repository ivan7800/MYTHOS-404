# Arquitectura — MYTHOS 404 Knowledge Encyclopedia v9.1

## Objetivo

Mantener una enciclopedia estática de miles de entidades sin convertir el arranque en una descarga monolítica, preservando deep links, búsqueda global, funcionamiento local-first y GitHub Pages.

## Capas de datos

```text
js/core.js       metadatos globales, estadísticas, fuentes, rutas y cola editorial
js/index.js      1.027 fichas revisadas + locators + mapas de chunks/shards
data/cultures/   62 chunks culturales con el corpus completo
data/index/      8 shards progresivos para 4.127 entradas externas
js/store.js      caché, carga bajo demanda y resolución de entidades
js/app.js        interfaz, rutas, vistas, exportación y Laboratorio Académico
```

El bootstrap contiene solo las **1.027 fichas revisadas**. Las **4.127 entradas externas** (181 documentadas + 3.946 discovery) viven en ocho shards de búsqueda y 62 paquetes culturales.

## Flujo de búsqueda

1. `Store.search()` consulta el índice raíz ya cargado.
2. Si la consulta necesita ampliar resultados, determina el shard por clave normalizada.
3. El shard se descarga una sola vez y queda cacheado en memoria.
4. Para abrir una ficha se usa el locator `id → culture` y se carga únicamente el chunk cultural necesario.
5. Los filtros que necesitan recorrer una clase global concreta pueden precargar los shards de forma explícita.

## Deep links

Los **5.154 locators** permiten resolver `#entity/<id>` sin descargar todos los shards. Además, `core.entityRedirects` conserva **7 IDs legacy** de registros consolidados y los redirige a la entidad canónica, evitando romper enlaces antiguos.

## Knowledge pipeline

`tools/rebuild-index.mjs` recorre el corpus y reconstruye:

- índice de revisadas;
- locators;
- shards externos;
- `knowledgeStatus`;
- completitud documental;
- estadísticas por cultura;
- bandas globales;
- uso de fuentes;
- índice de variantes;
- cola editorial de 24 candidatos;
- redirects de consolidación de IDs legacy;
- `CULTURE_INDEX.md`.

La cola editorial excluye placeholders entre corchetes y pseudo-corpus `discovery-*`, limita candidatos por cultura y **no cambia automáticamente el estado editorial**.

## Estado v9.1

- 5.154 entidades.
- 1.027 revisadas.
- 181 documentadas externamente.
- 3.946 discovery.
- 120 relatos.
- 62 culturas/chunks.
- 8 shards.
- 144 familias de fuentes/procedencias.
- completitud media 40%.

## PWA y caché

El Service Worker precachea únicamente el shell esencial. Shards y chunks se almacenan tras su primer uso. La caché está versionada como `9.1.0` y limitada al scope de la instalación.

Esta estrategia evita precachear varios megabytes de datos que muchos usuarios no consultarán.

## Seguridad

- CSP local-first.
- Sin scripts runtime de terceros.
- Sin backend ni secretos.
- Importaciones JSON limitadas y validadas.
- Datos persistentes restringidos al navegador del usuario.

## Rendimiento estructural de la build validada

- bootstrap sin imágenes: ~687,0 KiB;
- índice raíz: ~369,7 KiB;
- mayor shard: ~260,5 KiB;
- mayor chunk: ~975,4 KiB (griego).

El chunk griego es el principal candidato a subdivisión si la expansión continúa.

## Restricción de proyecto

La distribución mantiene **99 archivos**, por debajo del límite operativo de 100. Cualquier ampliación estructural debe preferir regenerar o subdividir de forma compensada en lugar de añadir archivos indiscriminadamente.
