import { z } from 'zod';

/** Mismas reglas que back_ins/src/modules/auth/dto/auth.dto.ts. */

export const numeroDocumento = z
  .string()
  .trim()
  .min(1, 'Escribe tu documento o usuario')
  .min(3, 'Revisa el documento: debe tener entre 3 y 20 caracteres')
  .max(20, 'Revisa el documento: debe tener entre 3 y 20 caracteres');

export const iniciarSesionSchema = z.object({
  numeroDocumento,
  // Al iniciar sesión no se validan reglas de la contraseña (HU07-E2).
  contrasena: z.string().min(1, 'Escribe tu contraseña').max(128),
});
export type IniciarSesionForm = z.infer<typeof iniciarSesionSchema>;

export const documentoSchema = z.object({ numeroDocumento });
export type DocumentoForm = z.infer<typeof documentoSchema>;

export const nuevaContrasenaSchema = z
  .object({
    contrasena: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(128, 'La contraseña no puede superar 128 caracteres'),
    confirmacion: z.string(),
  })
  .refine((d) => d.contrasena === d.confirmacion, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmacion'],
  });
export type NuevaContrasenaForm = z.infer<typeof nuevaContrasenaSchema>;
