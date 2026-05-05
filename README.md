# Residencia Santa Teresa · Base local segura

Aplicación PWA local-first para crear, guardar y modificar fichas de cuidados en una base local cifrada del propio dispositivo.

## Qué permite hacer

- Crear una base local cifrada la primera vez que se abre.
- Definir una contraseña maestra propia.
- Crear fichas de residentes/personas usuarias.
- Modificar fichas existentes.
- Añadir foto opcional cifrada dentro de la ficha.
- Buscar por nombre, habitación o estado.
- Imprimir o guardar la ficha como PDF desde el navegador.
- Exportar una copia cifrada de toda la base.
- Importar una copia cifrada en otro dispositivo.
- Cambiar la contraseña maestra recifrando las fichas.
- Bloqueo automático tras 10 minutos de inactividad.

## Seguridad local

Esta versión no usa servidor, no usa Firebase, no usa login externo y no envía datos a internet.

Los datos se guardan en IndexedDB y cada ficha se cifra antes de almacenarse usando Web Crypto:

- AES-GCM 256 para cifrado.
- PBKDF2 SHA-256 para derivar la clave desde la contraseña maestra.
- 250.000 iteraciones PBKDF2.
- La contraseña maestra no se guarda.
- Las copias de seguridad se exportan cifradas.

## Límites importantes

Esta app mejora mucho la privacidad frente al prototipo inicial, pero sigue siendo una app local. La seguridad real también depende del dispositivo:

- El móvil/tablet/PC debe tener bloqueo de pantalla.
- El navegador no debe compartirse con usuarios no autorizados.
- Hay que hacer copias cifradas periódicas.
- Si se pierde la contraseña maestra, no hay recuperación.
- Si se borra el almacenamiento del navegador, se pierde la base local salvo que exista copia.
- Para uso con datos reales, se recomienda revisión de protección de datos antes de implantarla.

## Uso básico

1. Abrir la app.
2. Crear la base local cifrada.
3. Guardar la contraseña maestra en un lugar seguro.
4. Crear fichas.
5. Pulsar "Guardar cifrada" después de cada cambio.
6. Exportar copias cifradas de forma periódica.
7. Bloquear la app al terminar.

## Recomendaciones antes de usar en producción

- Hacer el repositorio privado.
- Revisar la app con la persona responsable de protección de datos.
- Definir quién puede usar la tablet/equipo.
- Activar bloqueo automático del sistema operativo.
- Guardar copias cifradas en un lugar controlado.
- No publicar la app en una URL pública con datos reales.

## Privacidad en demos y desarrollo

- No subir datos reales a GitHub.
- No usar nombres reales en demos, pruebas o capturas.
- Usar una tablet controlada, con bloqueo de pantalla activo.
- Hacer copias cifradas periodicas.
- Ver `DATABASE_V2.md` para la evolucion prevista de usuarios, informes, adjuntos e historial cifrado.

## Archivos principales

- `index.html`: estructura de la app.
- `styles.css`: diseño visual e impresión.
- `app.js`: base local, cifrado, fichas, copias y bloqueo.
- `sw.js`: PWA y caché local de la app.
- `manifest.webmanifest`: instalación en móvil/tablet.
