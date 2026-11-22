import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate, type Location } from 'react-router';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/auth-context';
import { iniciarSesionSchema, type IniciarSesionForm } from '../auth/esquemas';
import { AccesoLayout } from '../components/AccesoLayout';
import { Alerta } from '../components/Alerta';
import { Campo } from '../components/Campo';

/**
 * «Acceso único» (Figma 35:580) y «Credenciales incorrectas» (35:678).
 * HU07-E1 / HU12-E1: una sola entrada; el rol lo decide el backend.
 */
export function IniciarSesionPage() {
  const { iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const desde = (ubicacion.state as { desde?: Location } | null)?.desde;
  const [rechazo, setRechazo] = useState<ApiError | null>(null);

  const {
    register,
    handleSubmit,
    resetField,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<IniciarSesionForm>({
    resolver: zodResolver(iniciarSesionSchema),
    defaultValues: { numeroDocumento: '', contrasena: '' },
  });

  const enviar = handleSubmit(async ({ numeroDocumento, contrasena }) => {
    setRechazo(null);
    try {
      await iniciarSesion(numeroDocumento, contrasena);
      navegar(desde ?? '/', { replace: true });
    } catch (error) {
      setRechazo(
        error instanceof ApiError
          ? error
          : new ApiError(0, 'No fue posible iniciar sesión.'),
      );
      resetField('contrasena');
      setFocus('contrasena');
    }
  });

  // HU07-E2: el backend responde el mismo 401 sea cual sea la causa
  // (contraseña, bloqueo, cuenta inactiva), así que la pantalla tampoco
  // distingue. Solo recuerda la regla del bloqueo.
  const credencialesInvalidas = rechazo?.status === 401;

  return (
    <AccesoLayout
      titulo={rechazo ? undefined : 'Salida Escolar'}
      subtitulo="I.E. Esteban Ochoa · Itagüí"
      pie={rechazo ? undefined : 'Tu rol y tus permisos los define la institución. No hay nada que elegir aquí.'}
    >
      <form className="formulario" onSubmit={enviar} noValidate>
        {rechazo && (
          <Alerta nivel="advertencia" titulo={rechazo.message}>
            {credencialesInvalidas &&
              'Tras cinco intentos fallidos bloqueamos el acceso durante 15 minutos.'}
          </Alerta>
        )}
        <Campo
          etiqueta="Documento o usuario institucional"
          ayuda={rechazo ? undefined : 'Los acudientes ingresan con su número de documento.'}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          invalido={credencialesInvalidas}
          error={errors.numeroDocumento?.message}
          {...register('numeroDocumento')}
        />
        <Campo
          etiqueta="Contraseña"
          type="password"
          autoComplete="current-password"
          invalido={credencialesInvalidas}
          error={errors.contrasena?.message}
          {...register('contrasena')}
        />
        <button className="boton boton--primario" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Ingresando…' : 'Ingresar'}
        </button>
        <Link className="boton boton--terciario" to="/recuperar-contrasena">
          ¿Olvidaste tu contraseña?
        </Link>
      </form>
    </AccesoLayout>
  );
}
