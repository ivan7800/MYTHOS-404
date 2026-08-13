# Changelog

## 9.1.0 — Knowledge Expansion I — 2026-08-13

- Revisados 8 conceptos griegos con loci antiguos: 5 promociones netas, 3 fichas canónicas enriquecidas y 7 registros duplicados consolidados.
- Añadidos pasajes y cautelas para Melíades, Náyades, Oceánides, Nereidas, Ninfas Coricias, Tíades, Ménades y Hamadríades.
- Reescritas las síntesis de 181 fichas documentadas externamente para separar metadatos upstream de revisión MYTHOS.
- Añadida cola editorial automática de 24 candidatos con prioridad, completitud y campos pendientes.
- Añadidos 7 redirects legacy para preservar deep links tras la consolidación canónica.
- La cola excluye placeholders y pseudo-corpus de discovery.
- Estadísticas actualizadas a 5.154 entidades: 1.027 revisadas + 181 documentadas + 3.946 discovery; completitud media 40%.
- Runtime, PWA, Service Worker, documentación y quality gate alineados a 9.1.0.

## 9.0.0 — Knowledge Edition — 2026-08-13

### Conocimiento y rigor editorial

- Nuevo **MYTHOS Knowledge Standard** con tres niveles: revisada, documentada externamente y discovery.
- 181 entradas DeityDB A/B pasan a “documentada externamente”; **ninguna** se promueve automáticamente a revisada.
- 20 entradas DeityDB C/D permanecen en discovery.
- Nuevo indicador de **completitud documental** por ficha (0–100) con cautela explícita de que no mide certeza histórica.
- Cada ficha enumera campos pendientes para orientar la investigación.
- Exportación Markdown incluye madurez y completitud.
- Dashboard de conocimiento en Academia.
- Atlas mundial muestra revisadas/documentadas/discovery y completitud media por corpus.
- Filtro específico “Documentadas externamente”.

### Arquitectura y UX

- Índice ligero incorpora `knowledgeStatus` y `completeness`.
- Seleccionar “Documentadas externamente” carga los shards necesarios para no mostrar una lista parcial.
- “Todo el archivo” y discovery conservan expansión progresiva.
- `CULTURE_INDEX.md` se regenera desde la build.
- Service Worker y manifest actualizados a 9.0.0.

### QA

- Quality gate comprueba tres niveles de madurez, cobertura de shards y rango de completitud.
- Se mantiene la regla de no promover automáticamente entradas externas a revisadas.
