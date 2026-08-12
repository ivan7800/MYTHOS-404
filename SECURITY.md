# Seguridad y privacidad — MYTHOS 404 v8.1.0 Final

## Modelo

- PWA estática, sin backend, cuentas, telemetría ni secretos de servidor.
- Favoritos, notas y progreso permanecen en `localStorage` salvo exportación explícita del usuario.
- No hay dependencias runtime externas; chunks y shards se cargan desde el mismo origen.

## Controles aplicados

- CSP local-first mediante `<meta http-equiv="Content-Security-Policy">`.
- Renderizado dinámico con escape de contenido textual antes de introducirlo en HTML.
- Importación JSON con límite de **1 MiB**, validación de identidad de la app, filtrado de IDs y límites de texto.
- Service Worker v8.1 limitado a su `registration.scope` y a una caché de versión explícita.
- Registro del Service Worker con `updateViaCache: 'none'`.
- Sin ejecución de HTML/JavaScript procedente de las importaciones del usuario.
- Sin credenciales, tokens ni claves privadas en el paquete.

## Riesgos residuales

GitHub Pages no ofrece al proyecto control completo sobre cabeceras HTTP de seguridad personalizadas; esta edición usa CSP por meta y arquitectura same-origin. Una política de cabeceras gestionada por CDN/proxy sería una mejora opcional para un despliegue con requisitos empresariales más estrictos.

Los datos discovery son contenido editorial, no datos personales. La revisión de licencias/procedencia debe continuar antes de reutilizar material descriptivo de terceros; por esa razón v8.1 omite los blurbs no revisados del catálogo CC0 y conserva solo metadatos de descubrimiento y trazabilidad.
