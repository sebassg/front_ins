import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { authApi } from '../api/auth';
import { ApiError } from '../api/client';
import { documentoSchema, type DocumentoForm } from '../auth/esquemas';
import { AccesoLayout, PantallaEstado } from '../components/AccesoLayout';
import { Alerta } from '../components/Alerta';
import { Campo } from '../components/Campo';

const VARIANTES = {
  recuperar: {
    titulo: 'Recuperar contraseña',
    descripcion:
      'Te enviaremos un enlace al correo registrado en la institución. Vence en 30 minutos y solo sirve una vez.',
    enviar: authApi.recuperarContrasena,
    alterna: { a: '/reenviar-activacion', texto: '¿Aún no activas tu cuenta?' },
  },
  activar: {
    titulo: 'Activar mi cuenta',
    descripcion:
      'Te enviaremos un enlace al correo registrado en la institución para que definas tu contraseña.',
    enviar: authApi.reenviarActivacion,
    alterna: { a: '/recuperar-contrasena', texto: '¿Olvidaste tu contraseña?' },
  },
} as const;

/**
 * HU07-E3 y reenvío de la activación. No hay frame en Figma: sigue el
 * lenguaje de «Acceso único». El backend responde lo mismo exista o no el
 * documento, y la pantalla tampoco lo distingue.
 */
export function SolicitarEnlacePage({ variante }: { variante: keyof typeof VARIANTES }) {
  const { titulo, descripcion, enviar, alterna } = VARIANTES[variante];
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DocumentoForm>({
    resolver: zodResolver(documentoSchema),
    defaultValues: { numeroDocumento: '' },
  });

  const alEnviar = handleSubmit(async ({ numeroDocumento }) => {
    setErrorServidor(null);
    try {
      const respuesta = await enviar(numeroDocumento);
      setMensaje(respuesta.mensaje);
    } catch (error) {
      setErrorServidor(
        error instanceof ApiError ? error.message : 'No fue posible enviar el enlace.',
      );
    }
  });

  if (mensaje) {
    return (
      <PantallaEstado
        senal="✉"
        tono="exito"
        titulo="Revisa tu correo"
        accion={
          <Link className="boton boton--secundario" to="/iniciar-sesion">
            Volver al inicio de sesión
          </Link>
        }
      >
        {mensaje}
      </PantallaEstado>
    );
  }

  return (
    <AccesoLayout titulo={titulo} subtitulo={descripcion}>
      <form className="formulario" onSubmit={alEnviar} noValidate>
        {errorServidor && <Alerta nivel="advertencia" titulo={errorServidor} />}
        <Campo
          etiqueta="Documento o usuario institucional"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          error={errors.numeroDocumento?.message}
          {...register('numeroDocumento')}
        />
        <button className="boton boton--primario" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando…' : 'Enviar enlace'}
        </button>
        <Link className="boton boton--terciario" to="/iniciar-sesion">
          Volver al inicio de sesión
        </Link>
        <Link className="boton boton--terciario" to={alterna.a}>
          {alterna.texto}
        </Link>
      </form>
    </AccesoLayout>
  );
}
