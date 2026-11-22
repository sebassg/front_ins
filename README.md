# Retiro Seguro — Web

Frontend del sistema de **retiro seguro de estudiantes de preescolar** de la
I.E. Esteban Ochoa (Equipo 1.1). Consume la API de [`back_ins`](https://github.com/sebassg/back_ins).

**Stack**: React 19 · Vite · TypeScript · React Router · TanStack Query ·
react-hook-form + zod · Vitest + Testing Library.

**Diseño**: [Figma — Sistema de Salida Escolar](https://www.figma.com/design/q0iuLqhrBRGPQgTf9Yz7CL/IE-Esteban-Ochoa-%E2%80%94-Sistema-de-Salida-Escolar),
página ② Flujos, flujo F1. Los tokens de `src/index.css` llevan los nombres
de las variables del archivo.

## Estado

| Entrega | Historias | Pantallas |
|---|---|---|
| v1 | HU07 (inicio de sesión del acudiente) · HU12 (inicio de sesión del personal por rol) | Login, recuperar y restablecer contraseña, activar cuenta, inicio con perfil y rol |

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
| `/` | `GET usuarios/yo` | HU12-E1 (protegida) |

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
- **Menú del rol ADMINISTRATIVO**: no tiene frame; usa Inicio, Usuarios y Más.
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
