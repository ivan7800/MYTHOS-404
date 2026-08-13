# MYTHOS 404 — Knowledge Encyclopedia v9.1.0

PWA estática y local-first para explorar mitologías, religiones antiguas, tradiciones narrativas y folclore con una separación editorial explícita entre **corpus revisado**, **documentación externa trazable** e **índice de descubrimiento**.

## Estado de la edición

- **5.154 entidades** en 62 tradiciones/corpus.
- **1.027 fichas revisadas por MYTHOS**.
- **181 fichas documentadas externamente** con metadatos de evidencia A/B y revisión MYTHOS pendiente.
- **3.946 entradas de descubrimiento** tratadas como pistas de investigación, no como artículos académicos completos.
- **120 relatos**.
- **144 familias de fuentes/procedencias**.
- **8 shards** de búsqueda progresiva.
- **62 chunks culturales** bajo demanda.
- **40% de completitud documental media**.
- Sin backend, cuentas, telemetría ni dependencias runtime externas.

## Novedad v9.1 — Knowledge Expansion I

Esta edición revisa ocho conjuntos/figuras griegas con **loci antiguos identificables**: Melíades, Náyades, Oceánides, Nereidas, Ninfas Coricias, Tíades, Ménades y Hamadríades. El resultado neto es **5 promociones desde discovery**, **3 fichas revisadas previamente enriquecidas** y **7 registros duplicados consolidados** en entidades canónicas.

La promoción no se basa en la puntuación de un dataset ni en coincidencias de nombre. Las categorías antiguas o modernas cuya delimitación sigue siendo ambigua permanecen como discovery.

También incorpora:

- síntesis más explícitas para las **181 fichas documentadas externamente**, separando lo que afirma el registro upstream de lo que MYTHOS ha revisado;
- redirects internos para que los 7 IDs legacy consolidados sigan abriendo su ficha canónica;
- **cola editorial automática de 24 candidatos** en el Laboratorio Académico, con prioridad, completitud y campos pendientes;
- exclusión de placeholders y pseudo-corpus de discovery en esa cola;
- registro de la última promoción editorial dentro de `knowledgeStats`;
- actualización completa de estadísticas, PWA, documentación y QA a v9.1.0.

## MYTHOS Knowledge Standard

MYTHOS utiliza tres niveles:

1. **Revisada por MYTHOS** — ficha integrada en el corpus editorial y respaldada por una revisión interna documentable.
2. **Documentada externamente** — existe trazabilidad externa más fuerte, pero MYTHOS todavía no ha revisado independientemente la evidencia.
3. **Descubrimiento** — pista de investigación que requiere contraste adicional.

Cada ficha muestra además una **completitud documental de 0–100%**. El porcentaje mide cobertura de campos útiles (contexto, síntesis, relaciones, símbolos, fuentes, pasajes, variantes, etc.). **No es una puntuación de verdad, autenticidad, antigüedad ni importancia cultural.**

## Distribución actual de completitud

| Banda | Fichas |
|---|---:|
| Amplia · 80–100 | 83 |
| Desarrollada · 60–79 | 1.033 |
| En desarrollo · 40–59 | 525 |
| Básica · 0–39 | 3.513 |

Media global: **40%**.

## Funciones principales

- Atlas mundial y archivo de 5.154 entidades.
- Búsqueda global fragmentada y búsqueda temática ampliada.
- Deep links `#entity/...`, `#myth/...` y `#culture/...`.
- Filtros por cultura, tipo y madurez documental.
- Panel de cobertura por cultura.
- Cola editorial priorizada en el Laboratorio Académico.
- Comparador intercultural con cautelas explícitas.
- Motivos comparativos, cosmogonías e inframundos.
- Colección griega profunda: relatos, mapa, genealogía, cronología, Troya, Heracles, museo y trivia.
- Laboratorio académico: fuentes, variantes, glosario, lecturas y cuaderno local.
- Exportación Markdown de fichas con madurez y completitud.
- Favoritos, notas, progreso y copias JSON locales.
- 14 skins.
- PWA/offline progresivo.

## Ejecutar

Puede abrirse `index.html` directamente para la mayoría de funciones. Para comprobar Service Worker/PWA usa un servidor HTTP/HTTPS:

```bash
python -m http.server 8080
```

## Validación

Requiere Node.js 20+ solo para QA/desarrollo, no para ejecutar la web:

```bash
npm run build:data
npm test
```

`build:data` reconstruye índice raíz, shards, estadísticas de conocimiento, cola editorial y `CULTURE_INDEX.md` desde los 62 paquetes culturales.

## GitHub Pages

El proyecto usa rutas relativas y navegación por hash. Sube **el contenido del proyecto** a la raíz del repositorio, de forma que `index.html` quede en la raíz. Publica la rama `main` desde `/(root)` en **Settings → Pages**.

`.nojekyll` ya está incluido.

## Documentación

- `ARCHITECTURE.md` — arquitectura modular y carga bajo demanda.
- `ACADEMIC_METHOD.md` — estándar de conocimiento y metodología editorial.
- `CULTURE_INDEX.md` — cobertura regenerada por cultura/corpus.
- `COVERAGE_AND_ETHICS.md` — límites de cobertura y tradiciones vivas.
- `THIRD_PARTY_DATA.md` — procedencia y reglas de uso de datos externos.
- `SECURITY.md` — modelo de seguridad local-first.
- `QA_REPORT.md` — comprobaciones de la build final.
- `AUDIT_REPORT.md` — evaluación multidisciplinar.

## Principio editorial

MYTHOS 404 no afirma contener “todos los mitos existentes” ni convierte automáticamente una coincidencia de catálogo en un hecho histórico. El crecimiento de la enciclopedia se mide por **fichas mejor documentadas y mejor trazables**, no solo por cantidad de nombres.
