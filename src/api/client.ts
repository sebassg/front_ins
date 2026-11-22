import type { TokenPair } from './tipos';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

/** Error de la API con el mensaje que la persona puede leer. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
  }
}

const MENSAJES_POR_ESTADO: Record<number, string> = {
  429: 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.',
  500: 'Ocurrió un error en el servidor. Inténtalo de nuevo más tarde.',
  502: 'El servicio no está disponible. Inténtalo de nuevo más tarde.',
  503: 'El servicio no está disponible. Inténtalo de nuevo más tarde.',
};

const MENSAJE_SIN_CONEXION =
  'No fue posible conectarse. Revisa tu conexión a internet.';

/** Nest responde `{ statusCode, message }`; `message` puede ser una lista. */
async function mensajeDeError(respuesta: Response): Promise<string> {
  const porEstado = MENSAJES_POR_ESTADO[respuesta.status];
  if (porEstado) return porEstado;
  try {
    const cuerpo = (await respuesta.json()) as { message?: unknown };
    const { message } = cuerpo;
    if (typeof message === 'string' && message) return message;
    if (Array.isArray(message) && typeof message[0] === 'string') {
      return message[0];
    }
  } catch {
    // Cuerpo vacío o no JSON: se usa el mensaje genérico.
  }
  return 'No fue posible completar la solicitud.';
}

// --- Sesión en memoria -----------------------------------------------------

/**
 * Quien maneja la sesión (AuthProvider) registra aquí cómo leer y renovar
 * los tokens; el cliente no conoce React.
 */
export interface ManejadorSesion {
  accessToken: () => string | null;
  refreshToken: () => string | null;
  alRenovar: (tokens: TokenPair) => void;
  alExpirar: () => void;
}

let manejador: ManejadorSesion | null = null;

export function registrarManejadorSesion(m: ManejadorSesion | null): void {
  manejador = m;
}

let renovacionEnCurso: Promise<boolean> | null = null;

/**
 * Rota el refresh token. Varias peticiones que reciben 401 a la vez comparten
 * una sola renovación: dos rotaciones del mismo token se verían como reuso y
 * el backend cerraría la sesión entera.
 */
export function renovarSesion(): Promise<boolean> {
  renovacionEnCurso ??= (async () => {
    const refreshToken = manejador?.refreshToken();
    if (!refreshToken) return false;
    try {
      const tokens = await peticion<TokenPair>('/auth/renovar', {
        method: 'POST',
        body: { refreshToken },
        autenticada: false,
      });
      manejador?.alRenovar(tokens);
      return true;
    } catch (error) {
      // Solo un rechazo del servidor cierra la sesión; sin red, se conserva.
      if (error instanceof ApiError && error.status === 401) {
        manejador?.alExpirar();
      }
      return false;
    }
  })().finally(() => {
    renovacionEnCurso = null;
  });
  return renovacionEnCurso;
}

// --- Peticiones --------------------------------------------------------------

export interface OpcionesPeticion {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Envía el access token y renueva una vez si vence. Por defecto, sí. */
  autenticada?: boolean;
  signal?: AbortSignal;
}

export async function peticion<T>(
  ruta: string,
  { method = 'GET', body, autenticada = true, signal }: OpcionesPeticion = {},
  reintento = false,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Dispositivo': 'Web',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const accessToken = autenticada ? manejador?.accessToken() : null;
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE_URL}${ruta}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError(0, MENSAJE_SIN_CONEXION);
  }

  if (respuesta.status === 401 && autenticada && !reintento) {
    if (await renovarSesion()) {
      return peticion<T>(ruta, { method, body, autenticada, signal }, true);
    }
  }

  if (!respuesta.ok) {
    throw new ApiError(respuesta.status, await mensajeDeError(respuesta));
  }
  if (respuesta.status === 204) return undefined as T;
  const texto = await respuesta.text();
  return (texto ? JSON.parse(texto) : undefined) as T;
}
