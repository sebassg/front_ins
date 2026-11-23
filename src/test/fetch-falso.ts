import { vi } from 'vitest';

type Respuesta = { status: number; body?: unknown };
type Manejador = (init: RequestInit & { url: string }) => Respuesta | Promise<Respuesta>;

/**
 * Sustituye fetch por un enrutador de respuestas por "MÉTODO /ruta". Una
 * clave sin query string atiende la ruta con cualquier query.
 */
export function fetchFalso(rutas: Record<string, Manejador>) {
  const llamadas: { clave: string; init: RequestInit }[] = [];
  const mock = vi.fn(async (url: string, init: RequestInit = {}) => {
    const ruta = url.replace(/^\/api\/v1/, '');
    const clave = `${init.method ?? 'GET'} ${ruta}`;
    llamadas.push({ clave, init });
    const manejador = rutas[clave] ?? rutas[clave.split('?')[0]];
    if (!manejador) throw new Error(`Ruta no simulada: ${clave}`);
    const { status, body } = await manejador({ ...init, url });
    return new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', mock);
  return { mock, llamadas };
}

export const cuerpo = (init: RequestInit) => JSON.parse(String(init.body)) as Record<string, unknown>;
