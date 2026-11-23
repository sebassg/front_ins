import { z } from 'zod';
import { PARENTESCOS, TIPOS_DOCUMENTO } from '../api/tipos';

/**
 * Mismas reglas que back_ins/src/modules/estudiantes/dto/estudiante.dto.ts.
 * Cada mensaje dice qué hacer, no qué falló (componente «Campo», 8:90).
 */

const documento = (quien: string) =>
  z
    .string()
    .trim()
    .min(1, `Ingresa el documento ${quien}.`)
    .min(3, 'Revisa el documento: debe tener entre 3 y 20 caracteres.')
    .max(20, 'Revisa el documento: debe tener entre 3 y 20 caracteres.');

const nombre = (que: string) =>
  z
    .string()
    .trim()
    .min(1, `Ingresa ${que}.`)
    .min(2, `Escribe ${que} completos.`)
    .max(100, 'Usa máximo 100 caracteres.');

const tipoDocumento = z.enum(Object.keys(TIPOS_DOCUMENTO) as [keyof typeof TIPOS_DOCUMENTO]);
const parentesco = z.enum(Object.keys(PARENTESCOS) as [keyof typeof PARENTESCOS], {
  error: 'Selecciona el parentesco con el estudiante.',
});

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const fechaNacimiento = z
  .string()
  .refine((v) => v === '' || FECHA.test(v), 'Escribe la fecha como AAAA-MM-DD.')
  .refine((v) => v === '' || v <= new Date().toISOString().slice(0, 10), 'La fecha no puede ser futura.');

const correo = z
  .string()
  .trim()
  .min(1, 'Ingresa el correo del acudiente: allí recibirá el enlace de activación.')
  .max(150, 'Usa máximo 150 caracteres.')
  .pipe(z.email('Revisa el correo: debe verse como nombre@dominio.com.'));

const telefono = z.string().trim().max(20, 'Usa máximo 20 caracteres.');

const grupoId = z.string().min(1, 'Selecciona el grupo del estudiante.');

export const registrarEstudianteSchema = z.object({
  tipoDocumento,
  numeroDocumento: documento('del estudiante'),
  nombres: nombre('los nombres del estudiante'),
  apellidos: nombre('los apellidos del estudiante'),
  fechaNacimiento,
  grupoId,
  acudiente: z.object({
    tipoDocumento,
    numeroDocumento: documento('del acudiente'),
    nombres: nombre('los nombres del acudiente'),
    apellidos: nombre('los apellidos del acudiente'),
    correo,
    telefono,
    parentesco,
  }),
  autorizacionTratamientoDatos: z
    .boolean()
    .refine((v) => v, 'Marca la autorización: sin ella no se pueden registrar datos de un menor.'),
});
export type RegistrarEstudianteForm = z.input<typeof registrarEstudianteSchema>;

export const editarFichaSchema = z.object({
  estudiante: z.object({
    nombres: nombre('los nombres del estudiante'),
    apellidos: nombre('los apellidos del estudiante'),
    fechaNacimiento,
    grupoId,
    estado: z.enum(['ACTIVO', 'RETIRADO']),
  }),
  acudiente: z.object({
    correo,
    telefono,
    parentesco,
    estado: z.enum(['ACTIVO', 'INACTIVO']),
  }),
});
export type EditarFichaForm = z.input<typeof editarFichaSchema>;
