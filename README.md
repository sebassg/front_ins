# Retiro Seguro — Web

Frontend del sistema de **retiro seguro de estudiantes de preescolar** de la
I.E. Esteban Ochoa (Equipo 1.1). Consume la API de [`back_ins`](https://github.com/sebassg/back_ins).

**Stack**: React 19 · Vite · TypeScript · React Router · TanStack Query ·
react-hook-form + zod · Vitest + Testing Library.

**Diseño**: [Figma — Sistema de Salida Escolar](https://www.figma.com/design/q0iuLqhrBRGPQgTf9Yz7CL/IE-Esteban-Ochoa-%E2%80%94-Sistema-de-Salida-Escolar),
página ② Flujos (flujo F1) y página ③ Plantillas (HU01). Los tokens de `src/index.css` llevan los nombres
de las variables del archivo.

## Estado

| Entrega | Historias | Pantallas |
|---|---|---|
| v1 | HU07 (inicio de sesión del acudiente) · HU12 (inicio de sesión del personal por rol) | Login, recuperar y restablecer contraseña, activar cuenta, inicio con perfil y rol |
| v2 | HU01 (estudiantes y acudientes titulares, personal administrativo) | Listado y búsqueda, registro, ficha, edición con historial |

## Puesta en marcha

Con el backend corriendo en `http://localhost:3000` (ver su README):

```bash
npm install
cp .env.example .env.local   # opcional: por defecto la API es /api/v1
npm run dev                  # http://localhost:5173
```

En desarrollo, Vite reenvía `/api` al backend (`vite.config.ts`), así que la
API no necesita CORS. Para apuntar a otro backend: `API_URL=http://host:3000 npm run dev`.

## Rutas

| Ruta | Endpoint | Historia |
|---|---|---|
| `/iniciar-sesion` | `POST auth/iniciar-sesion` | HU07-E1, HU12-E1 |
| `/recuperar-contrasena` | `POST auth/recuperar-contrasena` | HU07-E3 |
| `/restablecer-contrasena?token=` | `POST auth/restablecer-contrasena` | HU07-E3 (enlace del correo) |
| `/reenviar-activacion` | `POST auth/reenviar-activacion` | HU07-E1 |
| `/activar-cuenta?token=` | `POST auth/activar` | HU07-E1 (enlace del correo) |
| `/` | `GET usuarios/yo` | HU12-E1 (protegida; ADMINISTRATIVO va a `/estudiantes`) |
| `/estudiantes` | `GET estudiantes?buscar&pagina&porPagina` | HU01-E3 (solo ADMINISTRATIVO) |
| `/estudiantes/nuevo` | `GET grupos` · `POST estudiantes` | HU01-E1, HU01-E2 |
| `/estudiantes/:uuid` | `GET estudiantes/:uuid` | HU01-E3 |
| `/estudiantes/:uuid/editar` | `PATCH estudiantes/:uuid` · `PATCH estudiantes/:uuid/acudientes/:uuidAcudiente` | HU01-E3 |

`/restablecer-contrasena` y `/activar-cuenta` son las URLs que el backend pone
en los correos (`URL_RESTABLECER_CONTRASENA` y `URL_APP` en su `.env`).

## Diferencias con el diseño

- **Intentos restantes, cuenta bloqueada y cuenta desactivada** (frames
  35:678, 35:707, 35:724): el backend responde siempre el mismo 401 genérico
  (HU07-E2), así que el front no puede saber cuántos intentos quedan ni si la
  cuenta está bloqueada o inactiva. La alerta recuerda la regla del bloqueo y
  esas dos pantallas no se implementan hasta que la API exponga ese estado.
- **Entrada según rol** (35:608, 35:643): la tarjeta «Salida de hoy» y las
  acciones dependen de HU02–HU09. Hoy la entrada muestra el saludo, el rol y el
  menú de cada rol; las secciones pendientes lo dicen.
- **Menú del rol ADMINISTRATIVO**: el de la plantilla HU01 (Estudiantes, Cuentas,
  Más). Cuentas (HU12) sigue pendiente.
- **Registrar estudiante** (49:83): el backend exige más de lo que muestra la
  plantilla. «Nombre completo» se divide en Nombres y Apellidos, y se agregan
  Fecha de nacimiento, Tipo de documento, Correo, Teléfono y Parentesco del
  acudiente, todos con el componente Campo. La autorización de tratamiento de
  datos es una casilla dentro de la alerta informativa: el backend exige
  registrarla explícitamente.
- **Validación y duplicidad** (49:127): la alerta cuenta los datos que faltan;
  si el backend rechaza por duplicidad (409), el mensaje va junto al campo que
  indica (`campo`) y la alerta dice «Hay N datos por corregir».
- **Listado** (49:21): la plantilla no trae cómo llegar al registro; se usa el
  bloque «Acción» de la lista del grupo (20:702) con «Registrar estudiante».
  Los retirados llevan el badge Usado («⊘ Retirada»).
- **Ficha** (49:155): «Terceros autorizados» se muestra sin enlace hasta HU03.
- **Editar ficha** (49:225): no hay frame para editar los datos del
  estudiante; siguen la misma plantilla en una sola pantalla con los del
  acudiente. El tipo y número de documento no se pueden cambiar (el backend no
  lo permite) y se muestran deshabilitados.
- **Historial de auditoría** (49:245): el backend no expone la auditoría. El
  historial se arma con la ficha (`actualizadoPor`, `actualizadoEn`,
  `creadoEn`, autorización de datos); el detalle «antes → después» solo se
  conoce para los cambios guardados en la sesión.
- Recuperar, restablecer y activar no tienen frame: siguen «Acceso único».

## Sesión

- El **access token** (15 min) vive solo en memoria. El **refresh token** y el
  usuario se guardan en `localStorage` para sobrevivir a una recarga: el
  backend los entrega en el cuerpo, no en una cookie httpOnly.
- Ante un 401, `src/api/client.ts` rota el refresh token **una sola vez**
  aunque varias peticiones fallen a la vez: el backend trata una segunda
  rotación del mismo token como reuso y cierra la sesión entera.
- Si el servidor rechaza el refresh token, la sesión se cierra localmente.
- El login muestra el mensaje genérico del backend tal cual (HU07-E2) y nunca
  se registran contraseñas ni tokens en la consola (RNF-03).

## Estructura

```
src/
├── api/          cliente HTTP, endpoints y tipos (espejo de back_ins)
├── auth/         AuthProvider, guards de ruta y esquemas zod
├── estudiantes/  esquemas, formatos y errores de HU01
├── components/   piezas de UI compartidas
├── pages/        una pantalla por ruta
└── test/         setup de Vitest y fetch simulado
```

## Comandos

| Comando | Para qué |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Typecheck y build de producción a `dist/` |
| `npm test` | Pruebas (Vitest) |
| `npm run lint` | oxlint |
