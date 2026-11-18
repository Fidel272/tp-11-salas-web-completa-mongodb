# Trabajo Práctico 11: Reemplazo completo de reservas desde la web

Este proyecto corresponde a la Unidad 11 del curso de Desarrollo Back-end con Node.js. Amplía el sistema de reservas de salas desarrollado en las unidades anteriores, incorporando la edición completa de reservas desde la interfaz web mediante formularios HTML.

Se implementa la precarga de los datos existentes, la validación de los campos enviados y el reemplazo completo de los documentos almacenados en MongoDB, reutilizando el servicio `reemplazar` que también utiliza la API REST.

Se mantiene la arquitectura por capas y la separación de responsabilidades entre rutas, middlewares, controladores, servicios y modelos, conservando las funcionalidades anteriores de la aplicación.

---

## 1. Origen del proyecto y base de datos

El proyecto parte de la versión funcional del TP10 (`tp-10-salas-consultas-mongodb`), conservando las operaciones existentes, la arquitectura por capas, las dependencias, las herramientas de calidad de código y la aplicación web.

Para esta unidad se utiliza una base de datos independiente en MongoDB Atlas:

### Versiones y tecnologías

- **Node.js:** 22.22.0
- **Sistema de módulos:** CommonJS
- **Express:** 5.2.1
- **Mongoose:** 9.10.3
- **EJS:** 6.0.1
- **express-ejs-layouts:** 2.5.1
- **Morgan:** 1.12.1
- **Prettier:** 3.9.9
- **ESLint:** 10.12.0
- **MongoDB Atlas:** base de datos en la nube.
- **Postman:** herramienta para probar los endpoints de la API.

---

## 2. Configuración del entorno y conexión a MongoDB Atlas

### Requisitos previos

Para ejecutar el proyecto se necesita:

- Node.js instalado.
- npm disponible.
- Una cuenta de MongoDB Atlas.
- Un clúster de MongoDB configurado.
- Acceso de red autorizado en Atlas.
- Postman para realizar las pruebas de la API.

### Configuración de MongoDB Atlas

El proyecto utiliza la base de datos:

`reservas_salas_u11`

Y la colección:

`reservas`

La conexión se realiza mediante una URI de MongoDB Atlas utilizando el esquema `mongodb+srv://`.

### Variables de entorno

El proyecto incluye un archivo `.env.example` como plantilla de configuración:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://USUARIO:CLAVE@HOST/reservas_salas_u11?retryWrites=true&w=majority
```

Para configurar el entorno local:

1. Crear un archivo `.env` en la raíz del proyecto.
2. Copiar el contenido de `.env.example`.
3. Reemplazar los valores de ejemplo por las credenciales y la URI reales de MongoDB Atlas.
4. Verificar que la conexión utilice la base de datos `reservas_salas_u11`.

**Importante:** el archivo `.env` contiene información sensible y debe permanecer excluido del repositorio mediante `.gitignore`. No deben publicarse credenciales, contraseñas ni cadenas de conexión reales.

### Configuración DNS y conexión

La conexión a MongoDB Atlas utiliza el esquema `mongodb+srv://`.

En `src/config/base-datos.js` se configura el ajuste DNS utilizado para resolver correctamente la dirección del clúster en el entorno local.

El servidor inicia la escucha únicamente después de establecer correctamente la conexión con MongoDB Atlas. De esta manera, se evita que la aplicación acepte solicitudes antes de disponer de acceso a la base de datos.

---

## 3. Instalación, comandos de inicio y calidad de código


### Instalar dependencias

Desde la carpeta del proyecto ejecutar:

```bash
npm ci
```

Este comando instala las dependencias utilizando las versiones registradas en `package-lock.json`.

### Comprobar la conexión a MongoDB Atlas

```bash
node --env-file=.env scripts/comprobar-conexion.js
```

### Verificar el proyecto

```bash
npm run check
```

Este comando ejecuta las comprobaciones de calidad de código configuradas en el proyecto.

### Iniciar el servidor

```bash
node --env-file=.env src/index.js
```

Una vez iniciado, acceder desde el navegador a:

`http://localhost:3000/reservas`

La aplicación utiliza el puerto definido mediante la variable de entorno `PORT`.

---

## 4. Arquitectura por capas


La aplicación mantiene una separación de responsabilidades para facilitar el mantenimiento y la reutilización de la lógica de negocio.

1. **Rutas (`src/rutas/`):** definen las direcciones HTTP y conectan los middlewares con las acciones de los controladores.

2. **Middlewares (`src/middleware/`):** procesan y validan las entradas recibidas. También intervienen en el manejo centralizado de errores.

3. **Controladores (`src/controladores/`):** reciben las solicitudes, invocan los servicios y coordinan las respuestas HTTP, tanto para las vistas HTML como para la API JSON.

4. **Servicios (`src/servicios/`):** encapsulan las operaciones de persistencia mediante Mongoose. La edición web reutiliza `servicio.reemplazar`, evitando duplicar operaciones de base de datos.

5. **Modelos (`src/modelos/`):** definen los esquemas de Mongoose y las reglas de validación de los documentos almacenados.

Esta organización permite que la interfaz web y la API compartan la misma lógica de persistencia, aunque utilicen diferentes formatos de comunicación.

---

## 5. Esquema de datos y reglas de validación

La colección `reservas` contiene los siguientes campos:

| Campo | Tipo | Reglas de validación |
|---|---|---|
| `estudiante` | String | Obligatorio y con `trim`. |
| `email` | String | Obligatorio, con `trim` y debe incluir `@`. |
| `sala` | String | Enum: `Sala Norte`, `Sala Sur`, `Sala Multimedia`. |
| `fecha` | String | Obligatorio y con `trim`. |
| `turno` | String | Enum: `Mañana`, `Tarde`, `Noche`. |
| `personas` | Number | Entero entre 1 y 6. Acepta números o strings numéricos válidos. |
| `estado` | String | Enum: `pendiente` o `confirmada`. Por defecto, `pendiente` al crear una reserva. |

Las validaciones impiden almacenar valores fuera de las reglas establecidas para cada campo.

No se incorporan validaciones de disponibilidad, superposición de horarios, unicidad de reservas ni restricciones adicionales de calendario.

---

## 6. Edición completa de reservas desde la web

El objetivo principal del TP11 es incorporar la posibilidad de modificar una reserva existente desde el navegador.

El recorrido comienza desde el listado de reservas, donde se accede a la opción de edición correspondiente.

### 6.1. Precarga del formulario: GET

**Endpoint:**

`GET /reservas/:id/editar`

Busca la reserva mediante su identificador y muestra el formulario de edición con los siete campos precargados.

El ID se obtiene de la ruta y no se recibe como un campo editable del formulario.

**Comportamiento:**

- Si el ID es inválido, responde con `400 Bad Request` en HTML.
- Si el ID tiene un formato válido pero no existe, responde con `404 Not Found` en HTML.
- Si la reserva existe, muestra el formulario con sus datos actuales.

### 6.2. Guardar cambios: POST

**Endpoint:**

`POST /reservas/:id/editar`

Recibe los siete campos del formulario y realiza un reemplazo completo de la reserva existente mediante `servicio.reemplazar`.

**Comportamiento:**

- Comprueba que la reserva exista.
- Valida todos los campos obligatorios.
- Rechaza campos adicionales y datos no permitidos.
- Convierte y valida el campo `personas`.
- Construye explícitamente el objeto con los siete campos admitidos.
- Conserva el identificador original del documento.

**Respuesta exitosa:** `303 See Other`.

Después de guardar correctamente, el navegador es redirigido al detalle de la misma reserva:

`/reservas/:id`

Se utiliza el código `303` para que el navegador realice una nueva solicitud GET después del POST, evitando repetir el envío del formulario al actualizar la página.

### 6.3. Cancelación de la edición

El formulario dispone de una opción para cancelar y regresar al detalle de la reserva.

Cancelar no envía el formulario ni modifica el documento almacenado en MongoDB.

### 6.4. Conservación de valores ante errores

Cuando los datos ingresados no cumplen las reglas de validación:

- Se devuelve `400 Bad Request`.
- Se muestra nuevamente el formulario de edición.
- Se informa el motivo del error.
- Se conserva el identificador de la reserva.
- Se mantienen los textos ingresados para facilitar su corrección.
- No se modifica el documento almacenado.

También se conserva el contexto de edición cuando Mongoose rechaza el guardado, permitiendo que el manejador general de errores vuelva al formulario correspondiente.

Los errores inesperados se responden mediante mensajes seguros, sin exponer información interna del servidor.

---

## 7. Reemplazo completo de reservas mediante la API

La API conserva el endpoint de reemplazo implementado en las unidades anteriores.

**Endpoint:**

`PUT /api/reservas/:id`

Permite reemplazar completamente los siete campos editables de una reserva.

Los campos requeridos son:

- `estudiante`
- `email`
- `sala`
- `fecha`
- `turno`
- `personas`
- `estado`

**Validaciones:**

- Todos los campos deben estar presentes.
- Se rechazan campos desconocidos.
- Se rechazan operadores de MongoDB.
- No se permite modificar `_id`.
- Se comprueban los tipos y valores admitidos.
- Si falta algún campo o los datos son inválidos, responde con `400 Bad Request` sin modificar el documento.

**Respuesta exitosa:** `200 OK`, con el documento actualizado y conservando el mismo identificador.

### Relación entre la web y la API

La edición web y el reemplazo mediante PUT utilizan el mismo servicio de persistencia.

La diferencia está en la entrada y en la respuesta:

- **Web:** formulario HTML mediante POST y respuesta con redirección 303.
- **API:** cuerpo JSON mediante PUT y respuesta JSON con estado 200.

No se realizan solicitudes HTTP desde el servidor hacia su propia API ni se duplican operaciones de MongoDB en los controladores.

---

## 8. Recorrido de pruebas en Postman y navegador

Las siguientes pruebas permiten comprobar el funcionamiento de la edición web, la API y la persistencia de los datos.

Para las solicitudes API que envían JSON utilizar:

`Content-Type: application/json`

### 8.1. Consultar una reserva existente

**Método:** `GET`

**URL:**

`http://localhost:3000/api/reservas/ID_REAL`

**Resultado esperado:** `200 OK`.

Verificar los siete campos de la reserva y guardar el identificador para las pruebas posteriores.

### 8.2. Abrir el formulario de edición

**Desde el navegador:**

`http://localhost:3000/reservas/ID_REAL/editar`

**Resultado esperado:**

- Formulario de edición visible.
- Siete campos precargados con los valores actuales.
- Identificador correspondiente a la reserva seleccionada.

### 8.3. Guardar cambios desde la web

Modificar los siguientes valores:

- Personas: `4`.
- Estado: `confirmada`.

Mantener los demás campos y seleccionar Guardar cambios.

**Resultado esperado:**

- Respuesta `303 See Other`.
- Redirección al detalle de la misma reserva.
- Los cambios aparecen reflejados en pantalla.

Comprobar posteriormente mediante:

`GET http://localhost:3000/api/reservas/ID_REAL`

Verificar que conserva el mismo ID, que `personas` sea `4` y que `estado` sea `confirmada`.

### 8.4. Comprobar el reemplazo mediante PUT

**Método:** `PUT`

**URL:**

`http://localhost:3000/api/reservas/ID_REAL`

**Body → raw → JSON:**

```json
{
  "estudiante": "Ana Ejemplo",
  "email": "ana@example.com",
  "sala": "Sala Norte",
  "fecha": "2026-11-04",
  "turno": "Mañana",
  "personas": 3,
  "estado": "pendiente"
}
```

**Resultado esperado:** `200 OK`.

Verificar que los siete campos se hayan reemplazado y que el identificador original se conserve.

Abrir nuevamente el formulario de edición desde el navegador y comprobar que los valores coincidan con los enviados mediante PUT.

### 8.5. Comprobar un PUT incompleto

Repetir la solicitud anterior omitiendo el campo `estado`.

**Resultado esperado:** `400 Bad Request`.

Consultar nuevamente la reserva mediante GET y verificar que el documento permanezca intacto, sin modificaciones parciales.

### 8.6. Probar un formulario inválido

**Método:** `POST`

**URL:**

`http://localhost:3000/reservas/ID_REAL/editar`

**Body → x-www-form-urlencoded:**

Enviar los siete campos del formulario y utilizar:

- Estudiante: `Prueba de validación`.
- Email: `ana@example.com`.
- Sala: `Sala Norte`.
- Fecha: `2026-11-04`.
- Turno: `Mañana`.
- Personas: `0`.
- Estado: `pendiente`.

**Resultado esperado:**

- `400 Bad Request`.
- Se muestra nuevamente el formulario de edición.
- Se conserva el ID.
- Se mantienen los valores enviados, incluido el valor inválido de personas.
- Se muestra una explicación del error.
- El documento almacenado no se modifica.

Comprobar mediante GET de la API que la reserva conserva sus últimos valores válidos.

### 8.7. Corregir el formulario y reenviar

Modificar `personas` a un valor válido, por ejemplo `3`, y volver a enviar los siete campos.

**Resultado esperado:** `303 See Other`.

El navegador debe redirigir al detalle de la reserva con los cambios guardados.

Para observar el código 303 en Postman, desactivar `Automatically follow redirects` en Settings y revisar la cabecera `Location`.

### 8.8. Comprobar la cancelación

1. Abrir una reserva existente.
2. Ingresar al formulario de edición.
3. Modificar uno o varios campos.
4. Seleccionar Cancelar sin guardar.

**Resultado esperado:** regreso al detalle sin modificaciones en MongoDB.

Consultar la reserva mediante la API para comprobar que sus valores originales permanecen intactos.

### 8.9. Comprobar identificadores inválidos e inexistentes

Probar las siguientes situaciones desde el navegador:

| Caso | Resultado esperado |
|---|---|
| ID con formato inválido, por ejemplo `123` | `400 Bad Request` HTML |
| ID válido que no existe | `404 Not Found` HTML |
| ID válido y existente | Formulario de edición con datos precargados |

### 8.10. Comprobar la persistencia

1. Guardar un reemplazo válido desde la web o mediante PUT.
2. Reiniciar el servidor.
3. Consultar nuevamente el mismo ID mediante la API.
4. Abrir su formulario de edición desde el navegador.

**Resultado esperado:** los siete valores del último reemplazo válido permanecen almacenados en MongoDB Atlas y conservan el mismo identificador.

---

## 9. Matriz de pruebas y resultados

| Caso de prueba | Resultado esperado |
|---|---|
| Abrir edición | Siete campos precargados. |
| Guardar desde web | 303 y redirección al detalle del mismo ID. |
| Verificar edición mediante API | Mismo ID y valores actualizados. |
| Cancelar edición | Documento intacto. |
| Formulario inválido | 400 HTML y valores recibidos conservados. |
| PUT completo | 200 JSON y reemplazo de los siete campos. |
| PUT incompleto | 400 sin modificaciones. |
| ID inválido | 400 HTML. |
| ID válido inexistente | 404 HTML. |
| Validación de personas | Rechazo de valores fuera del rango de 1 a 6. |
| Persistencia | Datos conservados después de reiniciar el servidor. |
| Funcionalidades anteriores | Creación, listado y lectura continúan funcionando. |
| Error de validación de Mongoose | Regreso al formulario de edición con los valores conservados. |

---

## 10. Pruebas de funcionamiento

Se realizaron pruebas mediante Postman y el navegador para verificar el funcionamiento de la edición de reservas, las validaciones y la persistencia de los datos.

### 10.1. Pruebas de edición web

| Prueba | Resultado esperado |
|---|---|
| Acceder a `GET /reservas/:id/editar` con un ID existente. | Se muestra el formulario con los datos actuales de la reserva. |
| Enviar `POST /reservas/:id/editar` con los siete campos válidos. | Se reemplazan los datos y se responde con una redirección HTTP 303 al detalle de la reserva. |
| Enviar datos inválidos, como una cantidad de personas igual a 0. | Se responde con HTTP 400 y se muestra nuevamente el formulario conservando los valores ingresados. |
| Acceder con un ID inválido. | Se responde con HTTP 400. |
| Acceder con un ID válido que no existe. | Se responde con HTTP 404. |
| Cancelar la edición. | Se regresa sin modificar la reserva. |

### 10.2. Pruebas de la API

| Prueba | Resultado esperado |
|---|---|
| Enviar `PUT /api/reservas/:id` con todos los campos válidos. | Se actualiza la reserva y se responde con HTTP 200. |
| Enviar una solicitud incompleta, omitiendo algún campo obligatorio. | Se responde con HTTP 400 y el documento permanece sin modificaciones. |
| Consultar la reserva después de actualizarla desde la web. | La API devuelve los nuevos valores almacenados. |
| Consultar la reserva después de actualizarla mediante la API. | El formulario web refleja los cambios al volver a acceder a la edición. |

### 10.3. Persistencia de datos

Se comprobó que las modificaciones realizadas permanecen almacenadas en MongoDB Atlas incluso después de detener y volver a iniciar el servidor.

También se verificó que las operaciones de creación y consulta implementadas en las entregas anteriores continúan funcionando correctamente.

---

## 11. Alcance y continuidad del proyecto

El TP11 incorpora exclusivamente la edición de reservas mediante reemplazo completo desde la interfaz web.

Se mantienen las funcionalidades heredadas de las unidades anteriores, incluyendo la creación, el listado, la consulta individual y las operaciones disponibles en la API.

No se implementa modificación parcial (`PATCH`) ni eliminación (`DELETE`) desde la interfaz web, ya que estos contenidos corresponden a la Unidad 12.

Tampoco se incorporan filtros, ordenamiento ni paginación nuevos en los listados HTML.

La implementación permite mantener la coherencia entre la aplicación web y la API, ya que ambas utilizan el mismo servicio de reemplazo y trabajan sobre los mismos documentos almacenados en MongoDB.

---

## 12. Consideraciones finales

El TP11 amplía el sistema de reservas de salas incorporando un mecanismo de edición completa desde la interfaz web.

La implementación permite recuperar los datos existentes, modificarlos mediante un formulario y guardar los cambios sin generar documentos nuevos ni alterar el identificador original.

También se refuerzan las validaciones de entrada, la conservación de valores ante errores y la reutilización de la lógica de persistencia entre la aplicación web y la API REST.

De esta manera, se mantiene una aplicación organizada por capas, con respuestas diferenciadas para cada tipo de solicitud y persistencia de los datos en MongoDB Atlas.