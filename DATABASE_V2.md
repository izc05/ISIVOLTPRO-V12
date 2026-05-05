# Base local cifrada V2

Este documento define la siguiente evolucion de la app Residencia Santa Teresa. El objetivo es separar usuarios, informes, adjuntos e historial sin perder compatibilidad con las fichas actuales.

## Principios

- La app sigue siendo PWA local y offline.
- No hay backend, Firebase, Supabase ni servidor externo.
- La base sigue siendo IndexedDB:
  - `DB_NAME`: `santa-teresa-secure-vault`
  - `STORE`: `kv`
- Todo dato personal debe ir cifrado dentro de `box`.
- El cifrado sigue siendo AES-GCM con clave derivada por PBKDF2.
- La copia cifrada debe exportar e importar todos los registros.
- Los registros antiguos `resident:<id>` no se borran durante la migracion.

## Datos permitidos sin cifrar

Para poder relacionar registros sin exponer informacion sensible, fuera de `box` solo se permite:

- `key`
- `type`
- `id`
- `personId`, cuando el registro pertenece a una persona
- `reportId`, cuando el registro pertenece a un informe
- `updatedAt`
- `legacyMigrated`, solo para marcar compatibilidad en registros antiguos

No se deben guardar nombres, habitaciones, zonas, observaciones, fotos ni textos de informes fuera de `box`.

## Meta

Clave:

```json
"meta"
```

Contenido:

```json
{
  "key": "meta",
  "type": "meta",
  "app": "santa-teresa-local-secure",
  "version": "3.x",
  "schemaVersion": 2,
  "vaultName": "Residencia Santa Teresa",
  "createdAt": "<iso>",
  "updatedAt": "<iso>",
  "kdf": {
    "name": "PBKDF2",
    "hash": "SHA-256",
    "iterations": 250000,
    "salt": "<base64>"
  },
  "verifier": {
    "iv": "<base64>",
    "data": "<base64>"
  }
}
```

`schemaVersion: 2` evita ejecutar la migracion mas de una vez.

## Personas

Clave:

```text
person:<personId>
```

Registro:

```json
{
  "key": "person:<id>",
  "type": "person",
  "id": "<id>",
  "updatedAt": "<iso>",
  "box": { "iv": "<base64>", "data": "<base64>" }
}
```

Contenido cifrado:

```json
{
  "id": "<id>",
  "nombreVisible": "",
  "habitacion": "",
  "zona": "",
  "estado": "Activa",
  "createdAt": "<iso>",
  "updatedAt": "<iso>",
  "qrCode": "",
  "perfil": {
    "resumen": "",
    "comunicacion": "",
    "movilidad": "",
    "alimentacion": "",
    "sueno": "",
    "alergias": "",
    "alertas": "",
    "observaciones": ""
  },
  "history": []
}
```

Estados de persona:

- `Activa`
- `Revision`
- `Archivada`

## Informes

Clave:

```text
report:<reportId>
```

Registro:

```json
{
  "key": "report:<id>",
  "type": "report",
  "id": "<id>",
  "personId": "<personId>",
  "updatedAt": "<iso>",
  "box": { "iv": "<base64>", "data": "<base64>" }
}
```

Contenido cifrado:

```json
{
  "id": "<id>",
  "personId": "<personId>",
  "reportNumber": 1,
  "reportType": "Ficha guiada",
  "status": "Borrador",
  "createdAt": "<iso>",
  "updatedAt": "<iso>",
  "snapshotPerson": {
    "nombreVisible": "",
    "habitacion": "",
    "zona": "",
    "estado": "Activa"
  },
  "sections": {
    "datosBasicos": {},
    "bienestar": {},
    "cuidados": {},
    "alertas": {},
    "observaciones": {}
  },
  "printHtml": "",
  "pdfGenerated": false,
  "pdfFileName": "",
  "attachments": [],
  "history": []
}
```

Estados de informe:

- `Borrador`
- `Cerrado`
- `Archivado`
- `Exportado PDF`

Cada informe guarda `snapshotPerson` para conservar el nombre, habitacion, zona y estado del momento en que se creo. Asi, si la persona cambia de habitacion despues, los informes antiguos no cambian.

## Adjuntos

Clave:

```text
attachment:<attachmentId>
```

Registro:

```json
{
  "key": "attachment:<id>",
  "type": "attachment",
  "id": "<id>",
  "personId": "<personId>",
  "reportId": "<reportId>",
  "updatedAt": "<iso>",
  "box": { "iv": "<base64>", "data": "<base64>" }
}
```

Contenido cifrado:

```json
{
  "id": "<id>",
  "personId": "<personId>",
  "reportId": "<reportId>",
  "fileName": "",
  "mimeType": "",
  "size": 0,
  "dataUrl": "",
  "description": "",
  "createdAt": "<iso>"
}
```

## Historial

El historial puede vivir dentro de personas e informes. Si hace falta consultar acciones globales, tambien se puede crear:

```text
audit:<auditId>
```

Contenido cifrado:

```json
{
  "id": "<id>",
  "entityType": "person",
  "entityId": "<id>",
  "action": "created",
  "ts": "<iso>",
  "details": {}
}
```

## Migracion desde V1

La migracion debe ejecutarse despues de desbloquear la base, porque hace falta la clave maestra para descifrar los registros antiguos.

Flujo propuesto:

1. Leer `meta`.
2. Si `meta.schemaVersion >= 2`, no hacer nada.
3. Buscar registros `resident:<id>` con `type: "resident"`.
4. Descifrar cada residente con la clave maestra actual.
5. Crear `person:<id>` con datos basicos y perfil cifrado.
6. Crear opcionalmente un primer `report:<id>` de tipo `Ficha importada` si la ficha antigua contiene datos de cuidado suficientes.
7. No borrar el registro `resident:<id>`.
8. Si se actualiza el registro antiguo, marcarlo con `legacyMigrated: true` fuera de `box`.
9. Actualizar `meta.schemaVersion` a `2`.

Durante la transicion, `state.residents` puede seguir apuntando a `state.people` para no romper modulos actuales.

## Funciones V2

Funciones nuevas previstas en `app.js`:

- `loadPeople()`
- `loadReports()`
- `loadReportsByPerson(personId)`
- `savePerson(person)`
- `saveReport(report)`
- `deleteReport(reportId)`
- `archiveReport(reportId)`
- `closeReport(reportId)`
- `nextReportNumber()`
- `migrateLegacyResidents()`

## Flujo de informes

1. La pantalla Informe muestra un buscador de usuario y opcion de QR.
2. Al seleccionar usuario, se crea un informe en borrador.
3. Guardar informe crea o actualiza `report:<id>`, sin sobrescribir la persona.
4. El listado de informes de una persona permite ver, editar borradores, imprimir/PDF y archivar.
5. Antes de imprimir un informe no guardado se muestra el aviso: `Guarda primero el informe para conservarlo en el historial.`
6. Al imprimir un informe guardado se marca `pdfGenerated: true` o se anade una accion al historial.

## Copias cifradas

La exportacion debe incluir todos los registros del store `kv`:

- `meta`
- `person`
- `report`
- `attachment`
- `audit`
- `resident` antiguo, si existe

La importacion restaura la base completa igual que ahora. Despues de importar, el usuario debe desbloquear con la misma contrasena maestra de esa copia.

## Privacidad y uso recomendado

- Usar la app en tablet controlada por la residencia.
- Mantener bloqueo de pantalla activo.
- Hacer copias cifradas periodicas.
- Guardar la contrasena maestra fuera de la tablet en un lugar seguro.
- No subir datos reales a GitHub.
- No usar nombres reales en demos, pruebas o capturas publicas.
