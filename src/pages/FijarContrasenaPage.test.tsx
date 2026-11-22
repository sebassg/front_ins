import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cuerpo, fetchFalso } from '../test/fetch-falso';
import { FijarContrasenaPage } from './FijarContrasenaPage';

function renderizar(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/restablecer-contrasena" element={<FijarContrasenaPage variante="restablecer" />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('restablecer contraseña (HU07-E3)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('envía el token del enlace con la contraseña nueva', async () => {
    const { llamadas } = fetchFalso({
      'POST /auth/restablecer-contrasena': () => ({ status: 204 }),
    });
    renderizar('/restablecer-contrasena?token=abc123');

    await userEvent.type(screen.getByLabelText('Contraseña nueva'), 'nueva-clave-1');
    await userEvent.type(screen.getByLabelText('Confirma la contraseña'), 'nueva-clave-1');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }));

    expect(await screen.findByText('Contraseña actualizada')).toBeInTheDocument();
    expect(cuerpo(llamadas[0].init)).toEqual({ token: 'abc123', contrasena: 'nueva-clave-1' });
  });

  it('exige que las contraseñas coincidan y tengan 8 caracteres', async () => {
    const { mock } = fetchFalso({});
    renderizar('/restablecer-contrasena?token=abc123');

    await userEvent.type(screen.getByLabelText('Contraseña nueva'), 'corta');
    await userEvent.type(screen.getByLabelText('Confirma la contraseña'), 'otra');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }));

    expect(await screen.findByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument();
    expect(mock).not.toHaveBeenCalled();
  });

  it('si el enlace venció, lo dice y ofrece pedir otro', async () => {
    fetchFalso({
      'POST /auth/restablecer-contrasena': () => ({
        status: 400,
        body: { statusCode: 400, message: 'El enlace no es válido o ya venció' },
      }),
    });
    renderizar('/restablecer-contrasena?token=viejo');

    await userEvent.type(screen.getByLabelText('Contraseña nueva'), 'nueva-clave-1');
    await userEvent.type(screen.getByLabelText('Confirma la contraseña'), 'nueva-clave-1');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }));

    expect(await screen.findByRole('heading', { name: 'El enlace ya no sirve' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pedir un enlace nuevo' })).toBeInTheDocument();
  });

  it('sin token, ofrece pedir un enlace nuevo', () => {
    renderizar('/restablecer-contrasena');
    expect(screen.getByRole('link', { name: 'Pedir un enlace nuevo' })).toBeInTheDocument();
  });
});
