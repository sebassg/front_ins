import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cuerpo, fetchFalso } from '../test/fetch-falso';
import { ApiError, peticion, registrarManejadorSesion } from './client';

describe('cliente del API', () => {
  let access: string | null;
  let refresh: string | null;
  const alExpirar = vi.fn();

  beforeEach(() => {
    access = 'access-viejo';
    refresh = 'refresh-1';
    alExpirar.mockReset();
    registrarManejadorSesion({
      accessToken: () => access,
      refreshToken: () => refresh,
      alRenovar: (t) => {
        access = t.accessToken;
        refresh = t.refreshToken;
      },
      alExpirar,
    });
  });

  afterEach(() => {
    registrarManejadorSesion(null);
    vi.unstubAllGlobals();
  });

  it('renueva una sola vez cuando varias peticiones reciben 401 a la vez', async () => {
    const { llamadas } = fetchFalso({
      'GET /usuarios/yo': ({ headers }) =>
        (headers as Record<string, string>).Authorization === 'Bearer access-nuevo'
          ? { status: 200, body: { ok: true } }
          : { status: 401, body: { message: 'Unauthorized' } },
      'POST /auth/renovar': async () => {
        await new Promise((r) => setTimeout(r, 10));
        return { status: 200, body: { accessToken: 'access-nuevo', refreshToken: 'refresh-2' } };
      },
    });

    const resultados = await Promise.all([
      peticion('/usuarios/yo'),
      peticion('/usuarios/yo'),
      peticion('/usuarios/yo'),
    ]);

    expect(resultados).toEqual([{ ok: true }, { ok: true }, { ok: true }]);
    const renovaciones = llamadas.filter((l) => l.clave === 'POST /auth/renovar');
    expect(renovaciones).toHaveLength(1);
    expect(cuerpo(renovaciones[0].init)).toEqual({ refreshToken: 'refresh-1' });
    expect(refresh).toBe('refresh-2');
  });

  it('cierra la sesión si el servidor rechaza el refresh token', async () => {
    fetchFalso({
      'GET /usuarios/yo': () => ({ status: 401 }),
      'POST /auth/renovar': () => ({ status: 401, body: { message: 'Unauthorized' } }),
    });

    await expect(peticion('/usuarios/yo')).rejects.toMatchObject({ status: 401 });
    expect(alExpirar).toHaveBeenCalledOnce();
  });

  it('no envía el access token en las rutas públicas ni intenta renovar', async () => {
    const { llamadas } = fetchFalso({
      'POST /auth/iniciar-sesion': () => ({
        status: 401,
        body: { statusCode: 401, message: 'Usuario o contraseña incorrectos' },
      }),
    });

    const error = await peticion('/auth/iniciar-sesion', {
      method: 'POST',
      body: {},
      autenticada: false,
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe('Usuario o contraseña incorrectos');
    expect(llamadas).toHaveLength(1);
    expect((llamadas[0].init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('traduce el límite de peticiones y la falta de red a mensajes claros', async () => {
    fetchFalso({ 'POST /auth/recuperar-contrasena': () => ({ status: 429 }) });
    await expect(
      peticion('/auth/recuperar-contrasena', { method: 'POST', autenticada: false }),
    ).rejects.toThrow('Demasiados intentos');

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(peticion('/salud', { autenticada: false })).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining('No fue posible conectarse') as string,
    });
  });

  it('conserva el campo de los errores de negocio y la lista de validación', async () => {
    fetchFalso({
      'POST /estudiantes': () => ({
        status: 409,
        body: { statusCode: 409, message: 'Ya existe una cuenta con ese correo electrónico', campo: 'acudiente.correo' },
      }),
      'PATCH /estudiantes/x': () => ({
        status: 400,
        body: {
          statusCode: 400,
          error: 'Bad Request',
          message: ['nombres: Ingrese los nombres', 'acudiente.correo: Ingrese un correo electrónico válido'],
        },
      }),
    });

    await expect(peticion('/estudiantes', { method: 'POST', body: {} })).rejects.toMatchObject({
      status: 409,
      campo: 'acudiente.correo',
      message: 'Ya existe una cuenta con ese correo electrónico',
    });
    await expect(peticion('/estudiantes/x', { method: 'PATCH', body: {} })).rejects.toMatchObject({
      status: 400,
      campo: undefined,
      message: 'nombres: Ingrese los nombres',
      mensajes: ['nombres: Ingrese los nombres', 'acudiente.correo: Ingrese un correo electrónico válido'],
    });
  });
});
