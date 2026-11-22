/** Espejo de los contratos del backend (back_ins/src/modules). */

export const ROLES = ['ACUDIENTE', 'DOCENTE', 'ADMINISTRATIVO'] as const;
export type Rol = (typeof ROLES)[number];

export type EstadoUsuario = 'PENDIENTE_ACTIVACION' | 'ACTIVO' | 'INACTIVO';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** Respuesta de POST auth/iniciar-sesion. */
export interface SesionIniciada extends TokenPair {
  usuario: { uuid: string; nombres: string; apellidos: string; rol: Rol };
}

/** Respuesta de GET usuarios/yo. */
export interface PerfilUsuario {
  uuid: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  correo: string | null;
  rol: Rol;
  estado: EstadoUsuario;
}

export const NOMBRE_ROL: Record<Rol, string> = {
  ACUDIENTE: 'Acudiente',
  DOCENTE: 'Docente',
  ADMINISTRATIVO: 'Administrativo',
};
