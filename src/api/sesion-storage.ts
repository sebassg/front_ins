import type { Rol } from './tipos';

/**
 * Lo que sobrevive a una recarga: el refresh token y quién es el usuario.
 * El access token (15 min) vive solo en memoria y se renueva al arrancar.
 *
 * El backend entrega el refresh token en el cuerpo, no en una cookie httpOnly,
 * así que el navegador lo guarda en localStorage. Nunca se guarda la
 * contraseña ni se escribe nada de esto en la consola (RNF-03).
 */
export interface SesionGuardada {
  refreshToken: string;
  usuario: UsuarioSesion;
}

export interface UsuarioSesion {
  uuid: string;
  nombres: string;
  apellidos: string;
  rol: Rol;
}

const CLAVE = 'retiro-seguro.sesion';

export function leerSesion(): SesionGuardada | null {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const valor = JSON.parse(crudo) as Partial<SesionGuardada>;
    if (typeof valor.refreshToken !== 'string' || !valor.usuario) return null;
    return valor as SesionGuardada;
  } catch {
    return null;
  }
}

export function guardarSesion(sesion: SesionGuardada): void {
  localStorage.setItem(CLAVE, JSON.stringify(sesion));
}

export function borrarSesion(): void {
  localStorage.removeItem(CLAVE);
}
