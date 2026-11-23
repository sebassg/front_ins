import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchFalso } from '../../test/fetch-falso';
import { grupos } from '../../test/datos-estudiantes';
import { renderizarConSesion, rutaRenovar } from '../../test/renderizar';

const pagina = {
  total: 2,
  estudiantes: [
    {
      uuid: 'e-1',
      numeroDocumento: '1090447112',
      nombres: 'Sofía',
      apellidos: 'Ramírez Gómez',
      estado: 'ACTIVO',
      grupo: 'Transición A',
      acudienteTitular: 'Marta L. Gómez Peláez',
    },
    {
      uuid: 'e-2',
      numeroDocumento: '1090447113',
      nombres: 'Mateo',
      apellidos: 'Castaño Ruiz',
      estado: 'RETIRADO',
      grupo: null,
      acudienteTitular: null,
    },
  ],
};

describe('listado de estudiantes (HU01-E3)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('el personal administrativo entra al listado con su menú', async () => {
    fetchFalso({ ...rutaRenovar, 'GET /estudiantes': () => ({ status: 200, body: pagina }) });
    renderizarConSesion('/');

    const lista = await screen.findByRole('list', { name: 'Estudiantes' });
    const filas = within(lista).getAllByRole('link');
    expect(filas[0]).toHaveTextContent('Sofía Ramírez Gómez');
    expect(filas[0]).toHaveTextContent('Transición A · Marta L. Gómez Peláez');
    expect(filas[0]).toHaveTextContent('Activa');
    expect(filas[0]).toHaveAttribute('href', '/estudiantes/e-1');
    expect(filas[1]).toHaveTextContent('Sin grupo · Sin acudiente titular');
    expect(filas[1]).toHaveTextContent('Retirada');

    const menu = screen.getByRole('navigation', { name: 'Menú principal' });
    expect(menu).toHaveTextContent(/Estudiantes.*Cuentas.*Más/);
    expect(menu).not.toHaveTextContent('Inicio');
  });

  it('busca por nombre o documento', async () => {
    const { llamadas } = fetchFalso({
      ...rutaRenovar,
      'GET /estudiantes': ({ url }) => ({
        status: 200,
        body: url.includes('buscar=') ? { total: 0, estudiantes: [] } : pagina,
      }),
    });
    renderizarConSesion('/estudiantes');
    await screen.findByRole('list', { name: 'Estudiantes' });

    await userEvent.type(screen.getByLabelText('Buscar por nombre o documento'), 'Lopera');

    expect(await screen.findByText('No hay estudiantes que coincidan con «Lopera».')).toBeInTheDocument();
    const busqueda = llamadas.filter((l) => l.clave.startsWith('GET /estudiantes?'));
    expect(busqueda.at(-1)!.clave).toBe('GET /estudiantes?pagina=1&porPagina=20&buscar=Lopera');
  });

  it('lleva al registro de un estudiante', async () => {
    fetchFalso({
      ...rutaRenovar,
      'GET /estudiantes': () => ({ status: 200, body: pagina }),
      'GET /grupos': () => ({ status: 200, body: grupos }),
    });
    renderizarConSesion('/estudiantes');

    await userEvent.click(await screen.findByRole('link', { name: 'Registrar estudiante' }));

    expect(await screen.findByText('Nuevo estudiante')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Menú principal' })).not.toBeInTheDocument();
  });

  it('otro rol no entra a estudiantes', async () => {
    fetchFalso({ ...rutaRenovar });
    renderizarConSesion('/estudiantes', 'DOCENTE');

    const menu = await screen.findByRole('navigation', { name: 'Menú principal' });
    expect(menu).toHaveTextContent(/Escanear.*Mi grupo/);
    expect(screen.queryByText('Buscar por nombre o documento')).not.toBeInTheDocument();
  });
});
