# Método académico y MYTHOS Knowledge Standard — v9.1

Fecha de revisión: 2026-08-13

MYTHOS 404 es una herramienta editorial y de exploración. No sustituye una edición crítica, una monografía especializada ni la consulta directa de fuentes primarias.

## 1. Tres niveles de madurez

### Revisada por MYTHOS

Una ficha puede marcarse como revisada cuando el equipo editorial ha podido identificar y contrastar una base documental suficiente para la afirmación central de la ficha. En v9.1 una promoción desde discovery exige, como regla mínima, **al menos un testimonio primario/antiguo identificable o una evidencia especializada equivalente**, además de una síntesis prudente.

### Documentada externamente

La ficha dispone de metadatos de evidencia o procedencia más fuertes que un simple índice de nombres, pero la evidencia no se considera todavía verificada por MYTHOS. Este nivel evita confundir trazabilidad de terceros con revisión editorial propia.

### Descubrimiento

La entrada sirve para localizar un posible personaje, ser, categoría o variante. Puede proceder de un dataset abierto, lista enciclopédica o índice comparativo y **no debe citarse como afirmación académica sin contraste posterior**.

## 2. Regla de promoción v9.1

La primera Knowledge Expansion revisó ocho conceptos griegos únicamente cuando existía un locus antiguo localizable. Cinco implicaron promoción neta desde discovery; tres enriquecieron fichas ya revisadas y los duplicados se consolidaron en IDs canónicos:

- Melíades — Hesíodo, *Teogonía* 183–187.
- Náyades — Homero, *Odisea* 13.102–112 y 13.345–360.
- Oceánides — Hesíodo, *Teogonía* 337–370.
- Nereidas — Hesíodo, *Teogonía* 240–264.
- Ninfas Coricias — Pausanias 10.32.7.
- Tíades — Pausanias 10.32.7.
- Ménades — Eurípides, *Bacantes* 43–63 y 1043–1080.
- Hamadríades — Pseudo-Apolodoro, *Biblioteca* 2.1.5.

La existencia de un pasaje no convierte todas las interpretaciones modernas de una categoría en equivalentes. Cuando la taxonomía, cronología o identidad entre nombres sigue siendo incierta, MYTHOS conserva la cautela o mantiene la entrada en discovery.

## 3. Completitud documental

La completitud 0–100% mide **cobertura de campos**, no certeza histórica. El cálculo pondera, entre otros:

- síntesis editorial no genérica;
- tradición, región y periodo;
- fuentes y pasajes;
- variantes/cautelas;
- relaciones;
- símbolos y lugares;
- notas de procedencia y estado académico.

Una ficha puede tener una completitud alta y seguir requiriendo debate historiográfico. Una ficha discovery puede tener varios campos cumplimentados y continuar siendo discovery porque aún falta evidencia suficiente.

## 4. Fuentes y loci

MYTHOS distingue:

- **fuente primaria/antigua**: texto, inscripción, iconografía u otro testimonio históricamente pertinente;
- **fuente secundaria especializada**: investigación moderna con aparato crítico;
- **registro de documentación externa**: dataset o catálogo que aporta metadatos trazables;
- **índice de descubrimiento**: recurso útil para localizar nombres, no para validar por sí solo una afirmación.

Las referencias se expresan preferentemente mediante obra + pasaje/locus para poder ser comprobadas en distintas ediciones.

## 5. Variantes y comparación

MYTHOS no fuerza un “canon mundial”. Las variantes incompatibles se conservan y etiquetan. Un parecido funcional o narrativo entre dos culturas se trata como **paralelo comparativo**, no como identidad histórica, préstamo o parentesco salvo evidencia adicional.

## 6. Tradiciones vivas

Las tradiciones con comunidades portadoras actuales requieren un nivel de prudencia superior. La aplicación evita presentar conocimientos restringidos, ceremonias privadas o generalizaciones coloniales como si fueran una voz interna de la comunidad.

## 7. Cola editorial

`build:data` genera una cola de 24 candidatos discovery a partir de señales estructurales: completitud actual, procedencia, fuentes ya asociadas y huecos documentales. Se limita la representación por cultura y se excluyen placeholders y pseudo-corpus de descubrimiento.

**La cola prioriza trabajo; no promueve automáticamente fichas.** Cada candidatura necesita revisión humana y evidencia suficiente antes de cambiar de nivel.

## 8. Reproducibilidad

Las estadísticas se reconstruyen desde los 62 chunks culturales mediante:

```bash
npm run build:data
npm test
```

El proceso recalcula índices, shards, `knowledgeStats`, completitud, cobertura cultural y `CULTURE_INDEX.md`, reduciendo el riesgo de que la interfaz y la documentación estadística diverjan del corpus real.
