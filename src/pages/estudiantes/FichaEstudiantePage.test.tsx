import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cuerpo, fetchFalso } from '../../test/fetch-falso';
import { ficha, grupos, UUID, UUID_ACUDIENTE } from '../../test/datos-estudiantes';
import { renderizarConSesion, rutaRenovar } from '../../test/renderizar';

describe('ficha del estudiante (HU01-E3)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('muestra la identidad y el acudiente titular con formato', async () => {
    fetchFalso({ ...rutaRenovar, [`GET /estudiantes/${UUID}`]: () => ({ status: 200, body: ficha }) });
    renderizarConSesion(`/estudiantes/${UUID}`);

    expect(await screen.findByRole('heading', { name: 'Sofía Ramírez Gómez' })).toBeInTheDocument();
    const identidad = within(screen.getByRole('region', { name: 'Identidad' }));
    expect(identidad.getByText('1.090.447.112')).toBeInTheDocument();
    expect(identidad.getByText(/Transición A · \d+ años/)).toBeInTheDocument();
    expect(identidad.getByText('Activa')).toBeInTheDocument();

    const acudiente = within(screen.getByRole('region', { name: 'Acudiente titular' }));
    expect(acudiente.getByText('Madre')).toBeInTheDocument();
    expect(acudiente.getByText('300 412 88 50')).toBeInTheDocument();
    expect(acudiente.getByText('marta.gomez@correo.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Editar ficha' })).toHaveAttribute(
      'href',
      `/estudiantes/${UUID}/editar`,
    );
  });

  it('dice qué hacer si el estudiante no existe', async () => {
    fetchFalso({
      ...rutaRenovar,
      [`GET /estudiantes/${UUID}`]: () => ({
        status: 404,
        body: { statusCode: 404, message: 'Estudiante no encontrado', error: 'Not Found' },
      }),
    });
    renderizarConSesion(`/estudiantes/${UUID}`);

    expect(await screen.findByRole('alert')).toHaveTextContent('Estudiante no encontrado');
  });
});

describe('editar ficha (HU01-E3)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('envía solo lo que cambió, guarda a nombre de quien edita y lo registra en el historial', async () => {
    const actualizada = {
      ...ficha,
      acudientes: [{ ...ficha.acudientes[0], telefono: '3012207741' }],
      actualizadoEn: new Date().toISOString(),
      actualizadoPor: 'Patricia Soto',
    };
    const { llamadas } = fetchFalso({
      ...rutaRenovar,
      'GET /grupos': () => ({ status: 200, body: grupos }),
      'GET /estudiantes': () => ({ status: 200, body: { total: 0, estudiantes: [] } }),
      [`GET /estudiantes/${UUID}`]: () => ({ status: 200, body: ficha }),
      [`PATCH /estudiantes/${UUID}/acudientes/${UUID_ACUDIENTE}`]: () => ({
        status: 200,
        body: actualizada,
      }),
    });
    renderizarConSesion(`/estudiantes/${UUID}/editar`);

    const telefono = await screen.findByLabelText('Teléfono de contacto');
    await userEvent.clear(telefono);
    await userEvent.type(telefono, '3012207741');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Cambios guardados a tu nombre')).toBeInTheDocument();
    const envio = llamadas.find((l) => l.clave.startsWith('PATCH'))!;
    expect(cuerpo(envio.init)).toEqual({ telefono: '3012207741' });
    expect(llamadas.some((l) => l.clave === `PATCH /estudiantes/${UUID}`)).toBe(false);

    const historial = within(screen.getByRole('region', { name: 'HISTORIAL DE AUDITORÍA' }));
    expect(historial.getByText('Hace un momento')).toBeInTheDocument();
    expect(historial.getByText('Cambio en teléfono de contacto')).toBeInTheDocument();
    expect(
      historial.getByText(
        'Patricia Soto (Personal administrativo) · Teléfono de contacto: 300 412 88 50 → 301 220 77 41',
      ),
    ).toBeInTheDocument();
    expect(historial.getByText('Estudiante registrado')).toBeInTheDocument();
    expect(telefono.closest('.campo')).toHaveClass('campo--valido');
  });

  it('un teléfono vacío se envía como null y el retiro va a la ficha del estudiante', async () => {
    const { llamadas } = fetchFalso({
      ...rutaRenovar,
      'GET /grupos': () => ({ status: 200, body: grupos }),
      'GET /estudiantes': () => ({ status: 200, body: { total: 0, estudiantes: [] } }),
      [`GET /estudiantes/${UUID}`]: () => ({ status: 200, body: ficha }),
      [`PATCH /estudiantes/${UUID}`]: () => ({
        status: 200,
        body: { ...ficha, estado: 'RETIRADO', actualizadoPor: 'Patricia Soto' },
      }),
      [`PATCH /estudiantes/${UUID}/acudientes/${UUID_ACUDIENTE}`]: () => ({
        status: 200,
        body: { ...ficha, estado: 'RETIRADO', actualizadoPor: 'Patricia Soto' },
      }),
    });
    renderizarConSesion(`/estudiantes/${UUID}/editar`);

    await userEvent.selectOptions(await screen.findByLabelText('Estado del estudiante'), 'Retirada');
    await userEvent.clear(screen.getByLabelText('Teléfono de contacto'));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Cambios guardados a tu nombre')).toBeInTheDocument();
    const [primero, segundo] = llamadas.filter((l) => l.clave.startsWith('PATCH'));
    expect(primero.clave).toBe(`PATCH /estudiantes/${UUID}`);
    expect(cuerpo(primero.init)).toEqual({ estado: 'RETIRADO' });
    expect(cuerpo(segundo.init)).toEqual({ telefono: null });
  });

  it('pone el correo duplicado junto a su campo', async () => {
    fetchFalso({
      ...rutaRenovar,
      'GET /grupos': () => ({ status: 200, body: grupos }),
      [`GET /estudiantes/${UUID}`]: () => ({ status: 200, body: ficha }),
      [`PATCH /estudiantes/${UUID}/acudientes/${UUID_ACUDIENTE}`]: () => ({
        status: 409,
        body: { statusCode: 409, message: 'Ya existe una cuenta con ese correo electrónico', campo: 'correo' },
      }),
    });
    renderizarConSesion(`/estudiantes/${UUID}/editar`);

    const correo = await screen.findByLabelText('Correo *');
    await userEvent.clear(correo);
    await userEvent.type(correo, 'otra@correo.com');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Ya existe una cuenta con ese correo electrónico')).toBeInTheDocument();
    expect(correo).toHaveAttribute('aria-invalid', 'true');
  });
});
