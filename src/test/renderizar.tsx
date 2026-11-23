import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Rutas } from '../App';
import { guardarSesion } from '../api/sesion-storage';
import type { Rol } from '../api/tipos';
import { AuthProvider } from '../auth/AuthProvider';

/** Respuesta a la renovación con la que arranca una sesión guardada. */
export const rutaRenovar = {
  'POST /auth/renovar': () => ({
    status: 200,
    body: { accessToken: 'a-1', refreshToken: 'r-2' },
  }),
};

/** Monta la app en `ruta` con una sesión ya iniciada del rol indicado. */
export function renderizarConSesion(ruta: string, rol: Rol = 'ADMINISTRATIVO') {
  guardarSesion({
    refreshToken: 'r-1',
    usuario: { uuid: 'u-adm', nombres: 'Patricia', apellidos: 'Soto', rol },
  });
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
