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

// --- Estudiantes y acudientes titulares (HU01) -------------------------------

export const TIPOS_DOCUMENTO = {
  RC: 'Registro civil',
  TI: 'Tarjeta de identidad',
  CC: 'Cédula de ciudadanía',
  CE: 'Cédula de extranjería',
  PA: 'Pasaporte',
  PEP: 'Permiso especial de permanencia',
} as const;
export type TipoDocumento = keyof typeof TIPOS_DOCUMENTO;

export const PARENTESCOS = {
  MADRE: 'Madre',
  PADRE: 'Padre',
  ABUELO: 'Abuelo(a)',
  TIO: 'Tío(a)',
  HERMANO: 'Hermano(a)',
  TUTOR_LEGAL: 'Tutor legal',
  OTRO: 'Otro',
} as const;
export type Parentesco = keyof typeof PARENTESCOS;

export type EstadoEstudiante = 'ACTIVO' | 'RETIRADO';
export type EstadoVinculo = 'ACTIVO' | 'INACTIVO';

/** GET grupos. `id` llega como texto (BIGINT). */
export interface Grupo {
  id: string;
  nombre: string;
  jornada: 'MANANA' | 'TARDE' | 'UNICA';
  horaSalida: string;
}

/** Un resultado de GET estudiantes. */
export interface ResumenEstudiante {
  uuid: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  estado: EstadoEstudiante;
  grupo: string | null;
  acudienteTitular: string | null;
}

export interface PaginaEstudiantes {
  total: number;
  estudiantes: ResumenEstudiante[];
}

export interface AcudienteFicha {
  uuid: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  correo: string | null;
  telefono: string | null;
  parentesco: Parentesco;
  titular: boolean;
  /** Estado del vínculo con este estudiante. */
  estado: EstadoVinculo;
  /** Estado de la cuenta del acudiente. */
  estadoCuenta: EstadoUsuario;
}

/** GET estudiantes/:uuid y respuesta de los PATCH. */
export interface FichaEstudiante {
  uuid: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string | null;
  estado: EstadoEstudiante;
  grupo: Grupo | null;
  acudientes: AcudienteFicha[];
  autorizacionDatos: {
    otorgadoEn: string;
    otorgadoPor: string;
    versionAviso: string;
    revocadoEn: string | null;
  } | null;
  creadoEn: string;
  actualizadoEn: string;
  actualizadoPor: string | null;
}

export interface RegistrarEstudianteBody {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento?: string;
  grupoId: number;
  acudiente: {
    tipoDocumento: TipoDocumento;
    numeroDocumento: string;
    nombres: string;
    apellidos: string;
    correo: string;
    telefono?: string;
    parentesco: Parentesco;
  };
  autorizacionTratamientoDatos: true;
}

/** Respuesta 201 de POST estudiantes. */
export interface EstudianteRegistrado {
  ficha: FichaEstudiante;
  cuentaAcudiente: 'CREADA' | 'REUTILIZADA';
}

export interface ActualizarEstudianteBody {
  nombres?: string;
  apellidos?: string;
  fechaNacimiento?: string;
  grupoId?: number;
  estado?: EstadoEstudiante;
}

export interface ActualizarAcudienteBody {
  correo?: string;
  /** `null` borra el teléfono. */
  telefono?: string | null;
  parentesco?: Parentesco;
  estado?: EstadoVinculo;
}
