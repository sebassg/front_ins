import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router';
import { authApi } from '../api/auth';
import { ApiError } from '../api/client';
import { nuevaContrasenaSchema, type NuevaContrasenaForm } from '../auth/esquemas';
import { AccesoLayout, PantallaEstado } from '../components/AccesoLayout';
import { Alerta } from '../components/Alerta';
import { Campo } from '../components/Campo';

const VARIANTES = {
  restablecer: {
    titulo: 'Nueva contraseña',
    exito: {
      titulo: 'Contraseña actualizada',
      texto: 'Por seguridad cerramos las sesiones que tenías abiertas. Ingresa con tu nueva contraseña.',
    },
    enviar: authApi.restablecerContrasena,
    pedirOtro: '/recuperar-contrasena',
  },
  activar: {
    titulo: 'Activa tu cuenta',
    exito: {
      titulo: 'Cuenta activada',
      texto: 'Ya puedes ingresar con tu documento y la contraseña que definiste.',
    },
    enviar: authApi.activarCuenta,
    pedirOtro: '/reenviar-activacion',
  },
} as const;

/**
 * Destino de los enlaces del correo: /restablecer-contrasena?token=… (HU07-E3)
 * y /activar-cuenta?token=…. Sin frame en Figma: sigue «Acceso único».
 */
export function FijarContrasenaPage({ variante }: { variante: keyof typeof VARIANTES }) {
  const { titulo, exito, enviar, pedirOtro } = VARIANTES[variante];
  const [params] = useSearchParams();
  const token = params.get('token');
  const [listo, setListo] = useState(false);
  const [enlaceInvalido, setEnlaceInvalido] = useState(!token);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NuevaContrasenaForm>({
    resolver: zodResolver(nuevaContrasenaSchema),
    defaultValues: { contrasena: '', confirmacion: '' },
  });

  const alEnviar = handleSubmit(async ({ contrasena }) => {
    if (!token) return;
    setErrorServidor(null);
    try {
      await enviar(token, contrasena);
      setListo(true);
    } catch (error) {
      // 400: el enlace venció o ya se usó; no tiene sentido reintentar.
      if (error instanceof ApiError && error.status === 400) {
        setEnlaceInvalido(true);
        return;
      }
      setErrorServidor(
        error instanceof ApiError ? error.message : 'No fue posible guardar la contraseña.',
      );
    }
  });

  if (enlaceInvalido) {
    return (
      <PantallaEstado
        senal="⊘"
        tono="critico"
        titulo="El enlace ya no sirve"
        accion={
          <Link className="boton boton--secundario" to={pedirOtro}>
            Pedir un enlace nuevo
          </Link>
        }
      >
        El enlace no es válido o ya venció. Cada enlace funciona una sola vez.
      </PantallaEstado>
    );
  }

  if (listo) {
    return (
      <PantallaEstado
        senal="✓"
        tono="exito"
        titulo={exito.titulo}
        accion={
          <Link className="boton boton--primario" to="/iniciar-sesion">
            Ingresar
          </Link>
        }
      >
        {exito.texto}
      </PantallaEstado>
    );
  }

  return (
    <AccesoLayout titulo={titulo} subtitulo="Usa al menos 8 caracteres.">
      <form className="formulario" onSubmit={alEnviar} noValidate>
        {errorServidor && <Alerta nivel="advertencia" titulo={errorServidor} />}
        <Campo
          etiqueta="Contraseña nueva"
          type="password"
          autoComplete="new-password"
          autoFocus
          error={errors.contrasena?.message}
          {...register('contrasena')}
        />
        <Campo
          etiqueta="Confirma la contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.confirmacion?.message}
          {...register('confirmacion')}
        />
        <button className="boton boton--primario" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </AccesoLayout>
  );
}
