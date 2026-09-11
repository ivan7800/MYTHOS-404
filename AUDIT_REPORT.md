# Auditoría final — MYTHOS 404 Knowledge Expansion v9.1.0

Fecha de reauditoría: 2026-09-11

## 1. Veredicto ejecutivo

MYTHOS 404 v9.1.0 es una **PWA estática técnicamente sólida y publicable** cuyo principal reto ya no es la arquitectura sino la profundidad editorial del archivo.

La expansión corrige el incentivo equivocado de “crecer por contador”: se revisan ocho conceptos con loci antiguos identificables, pero solo **5 discovery** ascienden de estado. Otras **3 fichas ya revisadas** se enriquecen y **7 duplicados** se eliminan mediante consolidación canónica. Por eso el total de entidades baja: se prefiere menos ruido a un contador artificialmente mayor.

Estado final:

- 5.154 entidades;
- 1.027 revisadas;
- 181 documentadas externamente;
- 3.946 discovery;
- 120 relatos;
- 62 tradiciones/corpus;
- 144 familias de fuentes/procedencias;
- completitud media: 40%;
- 99 archivos.

## 2. Cambios de Knowledge Expansion I

### 2.1 Ocho promociones conservadoras

Se revisaron y enriquecieron:

- Melíades;
- Náyades;
- Oceánides;
- Nereidas;
- Ninfas Coricias;
- Tíades;
- Ménades;
- Hamadríades.

Cada revisión añade pasaje/locus y una síntesis más prudente. Ménades, Nereidas y Oceánides ya existían como fichas revisadas y se enriquecen en vez de duplicarse; Náyades, Hamadríades y Melíades reutilizan registros canónicos previos de discovery; Ninfas Coricias y Tíades se mantienen como nuevos canónicos. Las categorías cuya delimitación histórica o terminológica no era suficientemente clara permanecen en discovery.

### 2.2 Documentación externa más honesta

Las 181 entradas DeityDB A/B mantienen el nivel **documentada externamente**. Sus síntesis dejan de sonar como artículos MYTHOS cerrados y explican qué procede del registro upstream y qué queda pendiente de validación interna.

### 2.3 Cola editorial

El Laboratorio Académico incorpora “Qué investigar después”: 24 candidatos calculados en build, con prioridad, completitud y huecos documentales. Se excluyen placeholders y pseudo-corpus discovery para que la cola sea accionable.

## 3. Arquitectura

**Valoración: 9,7/10.**

Fortalezas:

- shell pequeño frente al volumen total del corpus;
- datos culturales bajo demanda;
- shards de búsqueda progresivos;
- deep links resueltos mediante 5.154 locators + 7 redirects legacy;
- separación entre Store, datos e interfaz;
- rebuild reproducible;
- PWA local-first sin backend.

Riesgo principal: el chunk griego alcanza ~981 KiB y debería subdividirse si continúa la ampliación.

## 4. Calidad de datos y metodología

**Valoración: 8,0/10.**

Mejora respecto a v9.0 porque:

- sube la completitud media del 39% al 40%;
- hay 8 revisiones documentales nuevas;
- 181 fichas externas tienen una presentación metodológicamente más precisa;
- existe una cola de investigación reproducible.

La limitación sigue siendo grande: **3.946 entradas permanecen discovery** y 3.513 fichas están en la banda básica de completitud. La enciclopedia todavía no debe describirse como 5.154 artículos terminados.

## 5. UX/UI

**Valoración: 9,6/10.**

La madurez documental, completitud y huecos pendientes están integrados en la ficha y en el Laboratorio Académico. El nuevo panel convierte una deuda invisible en un flujo de trabajo comprensible.

Riesgo: conforme aumenten campos y metadatos, las fichas pueden volverse densas. Conviene mantener divulgación progresiva antes de añadir nuevos paneles.

## 6. QA

**Valoración: 9,5/10.**

`npm run build:data` y `npm test` pasan sin errores. El validador cubre estructura, unicidad, rutas, PWA, seguridad estática, Store smoke, shards, chunks, locators y coherencia de versión.

No se concede certificación E2E de navegador real porque la política del entorno bloquea la navegación de Chromium headless (`ERR_BLOCKED_BY_ADMINISTRATOR`). Esa limitación está declarada y no maquillada.

## 7. Seguridad

**Valoración: 9,5/10.**

- sin backend;
- sin secretos;
- CSP local-first;
- sin dependencias runtime obligatorias;
- importación local validada;
- datos de usuario confinados al navegador.

El riesgo dominante no es una superficie servidor, sino futuras regresiones al introducir recursos externos o nuevas importaciones.

## 8. Rendimiento

**Valoración: 9,6/10.**

- bootstrap ~687,0 KiB;
- índice raíz ~369,7 KiB;
- mayor shard ~260,5 KiB;
- carga diferida de 4.127 entradas externas.

El diseño escala razonablemente bien para GitHub Pages. La futura subdivisión del chunk griego es la mejora de mayor retorno.

## 9. Accesibilidad

**Valoración estructural: 9,4/10.**

El código contempla foco, etiquetas, ARIA, movimiento reducido, safe areas y forced colors. Falta certificar la experiencia con lectores de pantalla y dispositivos reales antes de elevar la nota.

## 10. GitHub Pages / mantenibilidad

**Valoración: 9,9/10.**

- rutas relativas;
- navegación hash;
- `.nojekyll`;
- Service Worker por scope;
- 99 archivos;
- build de datos reproducible.

Es publicable sin backend.

## 11. Deuda real restante

1. **3.946 discovery** por investigar.
2. **3.513 fichas** en completitud básica.
3. Faltan pruebas reales de Lighthouse/PWA/Safari/Android/Firefox/AT.
4. El chunk griego se aproxima a 1 MiB.
5. La capa documentada externamente todavía requiere revisión independiente ficha a ficha.

## 12. Puntuación

| Área | Nota |
|---|---:|
| Arquitectura | 9,7 |
| UX/UI | 9,6 |
| QA | 9,5 |
| Seguridad | 9,5 |
| Rendimiento | 9,6 |
| Accesibilidad estructural | 9,4 |
| GitHub Pages | 9,9 |
| Valor de producto | 9,8 |
| Profundidad enciclopédica | 8,0 |
| **Global ponderada** | **9,2/10** |

La subida respecto a v9.0 se justifica por calidad documental, no por volumen. No se concede todavía 9,5 global porque la mayor parte de la deuda del corpus sigue visible y cuantificada.

## 13. Próximo salto recomendado

No añadir miles de nombres. Ejecutar Knowledge Expansion II sobre la cola priorizada, cultura por cultura, con esta secuencia:

**locus → síntesis → variantes → relaciones → fuente secundaria → revisión → promoción**.

La métrica principal debe ser cuántas fichas salen de la banda básica y cuántas discovery reciben evidencia verificable, no el total bruto de entidades.
