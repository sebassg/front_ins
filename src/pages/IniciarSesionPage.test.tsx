import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Rutas } from '../App';
import { leerSesion } from '../api/sesion-storage';
import { AuthProvider } from '../auth/AuthProvider';
import { cuerpo, fetchFalso } from '../test/fetch-falso';

function renderizar(ruta = '/iniciar-sesion') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ruta]}>
        <AuthProvider>
          <Rutas />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const usuario = { uuid: 'u-1', nombres: 'Ana', apellidos: 'Gómez', rol: 'ACUDIENTE' };
const perfil = {
  ...usuario,
  tipoDocumento: 'CC',
  numeroDocumento: '1000000002',
  correo: 'ana@example.com',
  estado: 'ACTIVO',
};

describe('inicio de sesión (HU07 / HU12)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('valida los campos antes de llamar al API', async () => {
    const { mock } = fetchFalso({});
    renderizar();

    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('Escribe tu documento o usuario')).toBeInTheDocument();
    expect(screen.getByText('Escribe tu contraseña')).toBeInTheDocument();
    expect(mock).not.toHaveBeenCalled();
  });

  it('muestra el mensaje genérico del backend y limpia la contraseña', async () => {
    fetchFalso({
      'POST /auth/iniciar-sesion': () => ({
        status: 401,
        body: { statusCode: 401, message: 'Usuario o contraseña incorrectos' },
      }),
    });
    renderizar();

    await userEvent.type(screen.getByLabelText('Documento o usuario institucional'), '1000000002');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala-clave');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Usuario o contraseña incorrectos');
    expect(screen.getByLabelText('Contraseña')).toHaveValue('');
    expect(leerSesion()).toBeNull();
  });

  it('inicia sesión, guarda solo el refresh token y muestra el perfil con el rol', async () => {
    const { llamadas } = fetchFalso({
      'POST /auth/iniciar-sesion': () => ({
        status: 200,
        body: { accessToken: 'a-1', refreshToken: 'r-1', usuario },
      }),
      'GET /usuarios/yo': () => ({ status: 200, body: perfil }),
    });
    renderizar();

    await userEvent.type(screen.getByLabelText('Documento o usuario institucional'), ' 1000000002 ');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'clave-correcta');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('heading', { name: 'Hola, Ana' })).toBeInTheDocument();
    // HU12-E1: el menú del acudiente, sin las funciones de otros roles.
    const menu = screen.getByRole('navigation', { name: 'Menú principal' });
    expect(menu).toHaveTextContent(/Inicio.*Mi pase.*Autorizar.*Más/);
    expect(menu).not.toHaveTextContent('Escanear');

    await userEvent.click(screen.getByRole('link', { name: /Más/ }));
    expect(await screen.findByText('Acudiente')).toBeInTheDocument();
    expect(cuerpo(llamadas[0].init)).toEqual({
      numeroDocumento: '1000000002',
      contrasena: 'clave-correcta',
    });
    const perfilInit = llamadas.find((l) => l.clave === 'GET /usuarios/yo')!.init;
    expect((perfilInit.headers as Record<string, string>).Authorization).toBe('Bearer a-1');
    expect(leerSesion()).toEqual({ refreshToken: 'r-1', usuario });
    expect(localStorage.getItem('retiro-seguro.sesion')).not.toContain('a-1');
  });

  it('cierra la sesión en el servidor y vuelve al login', async () => {
    const { llamadas } = fetchFalso({
      'POST /auth/iniciar-sesion': () => ({
        status: 200,
        body: { accessToken: 'a-1', refreshToken: 'r-1', usuario },
      }),
      'GET /usuarios/yo': () => ({ status: 200, body: perfil }),
      'POST /auth/cerrar-sesion': () => ({ status: 204 }),
    });
    renderizar();
    await userEvent.type(screen.getByLabelText('Documento o usuario institucional'), '1000000002');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'clave');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    await userEvent.click(await screen.findByRole('link', { name: /Más/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByRole('heading', { name: 'Salida Escolar' })).toBeInTheDocument();
    const cierre = llamadas.find((l) => l.clave === 'POST /auth/cerrar-sesion')!;
    expect(cuerpo(cierre.init)).toEqual({ refreshToken: 'r-1' });
    expect(leerSesion()).toBeNull();
  });

  it('el docente ve su propio menú y no entra a secciones de otro rol', async () => {
    fetchFalso({
      'POST /auth/iniciar-sesion': () => ({
        status: 200,
        body: { accessToken: 'a-1', refreshToken: 'r-1', usuario: { ...usuario, rol: 'DOCENTE' } },
      }),
    });
    renderizar();
    await userEvent.type(screen.getByLabelText('Documento o usuario institucional'), '1000000003');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'clave');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    const menu = await screen.findByRole('navigation', { name: 'Menú principal' });
    expect(menu).toHaveTextContent(/Escanear.*Mi grupo.*Hora salida.*Más/);
    expect(menu).not.toHaveTextContent('Autorizar');
  });

  it('sin sesión, una ruta protegida lleva al login', async () => {
    fetchFalso({});
    renderizar('/');
    expect(await screen.findByRole('heading', { name: 'Salida Escolar' })).toBeInTheDocument();
  });
});
