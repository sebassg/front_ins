import { peticion } from './client';
import type { PerfilUsuario, SesionIniciada } from './tipos';

/** Endpoints de back_ins/src/modules/auth y usuarios (HU07, HU12). */

export interface RespuestaEnlace {
  mensaje: string;
}

export const authApi = {
  iniciarSesion: (numeroDocumento: string, contrasena: string) =>
    peticion<SesionIniciada>('/auth/iniciar-sesion', {
      method: 'POST',
      body: { numeroDocumento, contrasena },
      autenticada: false,
    }),

  cerrarSesion: (refreshToken: string) =>
    peticion<void>('/auth/cerrar-sesion', {
      method: 'POST',
      body: { refreshToken },
      autenticada: false,
    }),

  recuperarContrasena: (numeroDocumento: string) =>
    peticion<RespuestaEnlace>('/auth/recuperar-contrasena', {
      method: 'POST',
      body: { numeroDocumento },
      autenticada: false,
    }),

  restablecerContrasena: (token: string, contrasena: string) =>
    peticion<void>('/auth/restablecer-contrasena', {
      method: 'POST',
      body: { token, contrasena },
      autenticada: false,
    }),

  reenviarActivacion: (numeroDocumento: string) =>
    peticion<RespuestaEnlace>('/auth/reenviar-activacion', {
      method: 'POST',
      body: { numeroDocumento },
      autenticada: false,
    }),

  activarCuenta: (token: string, contrasena: string) =>
    peticion<void>('/auth/activar', {
      method: 'POST',
      body: { token, contrasena },
      autenticada: false,
    }),

  perfil: () => peticion<PerfilUsuario>('/usuarios/yo'),
};
