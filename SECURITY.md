# Seguridad — MYTHOS 404 Knowledge Encyclopedia v9.0

## Modelo

Aplicación estática, local-first y sin backend propio. No hay cuentas, autenticación, base de datos remota, analítica ni telemetría runtime.

## Superficie de datos

Se guardan localmente preferencias, favoritos, progreso y notas de investigación mediante `localStorage`. La exportación/importación JSON es explícita.

La importación:

- limita tamaño;
- comprueba identidad de aplicación;
- sanea tipos/longitudes;
- no ejecuta contenido importado.

## XSS

La UI utiliza escapado HTML para contenido dinámico antes de interpolarlo en plantillas. Los datasets son locales y el proyecto no carga scripts de terceros en runtime.

## CSP

`index.html` incluye una CSP local-first con `object-src 'none'`, `base-uri 'none'` y `form-action 'self'`.

## Service Worker

La caché está versionada (`9.0.0`), limitada al scope de la aplicación y elimina versiones anteriores del mismo prefijo durante `activate`.

## Privacidad

Las notas de investigación permanecen en el navegador salvo que el usuario exporte manualmente una copia.

## Riesgos pendientes

- Cualquier aplicación que use `localStorage` comparte el riesgo del dispositivo/perfil local: no guardar secretos.
- La seguridad de GitHub Pages/HTTPS depende de la plataforma de hosting.
- Antes de monetización o integración de servicios externos debe rehacerse el threat model.
