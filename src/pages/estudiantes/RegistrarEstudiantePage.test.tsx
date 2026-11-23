import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cuerpo, fetchFalso } from '../../test/fetch-falso';
import { ficha, grupos, UUID } from '../../test/datos-estudiantes';
import { renderizarConSesion, rutaRenovar } from '../../test/renderizar';

async function diligenciar() {
  const estudiante = within(await screen.findByRole('group', { name: 'Datos del estudiante' }));
  await userEvent.type(estudiante.getByLabelText('Nombres *'), 'Sofía');
  await userEvent.type(estudiante.getByLabelText('Apellidos *'), 'Ramírez Gómez');
  await userEvent.type(estudiante.getByLabelText('Número de documento *'), '1090447112');
  await userEvent.selectOptions(await estudiante.findByLabelText('Grupo *'), 'Transición A');

  const acudiente = within(screen.getByRole('group', { name: 'Acudiente titular' }));
  await userEvent.type(acudiente.getByLabelText('Nombres *'), 'Marta L.');
  await userEvent.type(acudiente.getByLabelText('Apellidos *'), 'Gómez Peláez');
  await userEvent.type(acudiente.getByLabelText('Documento *'), '1094887213');
  await userEvent.selectOptions(acudiente.getByLabelText('Parentesco *'), 'Madre');
  await userEvent.type(acudiente.getByLabelText('Correo *'), 'Marta.Gomez@correo.com');
  await userEvent.click(screen.getByLabelText(/El acudiente autorizó/));
}

describe('registrar estudiante (HU01-E1/E2)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('valida antes de enviar y resume lo que falta', async () => {
    const { llamadas } = fetchFalso({
      ...rutaRenovar,
      'GET /grupos': () => ({ status: 200, body: grupos }),
    });
    renderizarConSesion('/estudiantes/nuevo');
    await screen.findByRole('group', { name: 'Datos del estudiante' });

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Faltan 10 datos por diligenciar')).toBeInTheDocument();
    expect(screen.getByText('Ingresa el documento del estudiante.')).toBeInTheDocument();
    expect(screen.getByText(/Marca la autorización/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar' })).toHaveAttribute('aria-disabled', 'true');
    expect(llamadas.some((l) => l.clave === 'POST /estudiantes')).toBe(false);
  });

  it('registra y muestra la ficha con el aviso de activación', async () => {
    const { llamadas } = fetchFalso({
      ...rutaRenovar,
      'GET /grupos': () => ({ status: 200, body: grupos }),
      'POST /estudiantes': () => ({ status: 201, body: { ficha, cuentaAcudiente: 'CREADA' } }),
    });
    renderizarConSesion('/estudiantes/nuevo');

    await diligenciar();
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Estudiante registrado')).toBeInTheDocument();
    expect(screen.getByText('Enviamos el enlace de activación a marta.gomez@correo.com.')).toBeInTheDocument();
    const envio = llamadas.find((l) => l.clave === 'POST /estudiantes')!;
    expect(cuerpo(envio.init)).toEqual({
      tipoDocumento: 'RC',
      numeroDocumento: '1090447112',
      nombres: 'Sofía',
      apellidos: 'Ramírez Gómez',
      grupoId: 1,
      acudiente: {
        tipoDocumento: 'CC',
        numeroDocumento: '1094887213',
        nombres: 'Marta L.',
        apellidos: 'Gómez Peláez',
        correo: 'marta.gomez@correo.com',
        parentesco: 'MADRE',
      },
      autorizacionTratamientoDatos: true,
    });
    expect(llamadas.some((l) => l.clave === `GET /estudiantes/${UUID}`)).toBe(false);
  });

  it('pone la duplicidad del acudiente junto a su campo', async () => {
    fetchFalso({
      ...rutaRenovar,
      'GET /grupos': () => ({ status: 200, body: grupos }),
      'POST /estudiantes': () => ({
        status: 409,
        body: {
          statusCode: 409,
          message: 'Ese documento ya está registrado con datos diferentes. Verifique el nombre del acudiente',
          campo: 'acudiente.numeroDocumento',
        },
      }),
    });
    renderizarConSesion('/estudiantes/nuevo');

    await diligenciar();
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    const acudiente = within(screen.getByRole('group', { name: 'Acudiente titular' }));
    const documento = acudiente.getByLabelText('Documento *');
    expect(await screen.findByText('Hay 1 dato por corregir')).toBeInTheDocument();
    expect(documento).toHaveAttribute('aria-invalid', 'true');
    expect(documento).toHaveAccessibleDescription(/datos diferentes/);
  });

  it('avisa cuando reutiliza la cuenta de un acudiente existente', async () => {
    fetchFalso({
      ...rutaRenovar,
      'GET /grupos': () => ({ status: 200, body: grupos }),
      'POST /estudiantes': () => ({ status: 201, body: { ficha, cuentaAcudiente: 'REUTILIZADA' } }),
    });
    renderizarConSesion('/estudiantes/nuevo');

    await diligenciar();
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText(/ya tenía cuenta/)).toBeInTheDocument();
  });
});
