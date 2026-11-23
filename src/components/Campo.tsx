import { useId, useState, type ComponentProps, type ReactNode } from 'react';

interface Estado {
  etiqueta: string;
  /** Texto de ayuda bajo el campo (p. ej. "Los acudientes ingresan con…"). */
  ayuda?: string;
  /** Mensaje de error junto al campo: dice qué hacer, no qué falló. */
  error?: string;
  /** Marca el campo en error sin mensaje propio (el mensaje va en una alerta). */
  invalido?: boolean;
  /** Estado «Válido» (borde verde); con texto, lo muestra bajo el campo. */
  valido?: boolean | string;
}

/** Clases, ids y descripción accesible comunes a los campos (Figma 8:90). */
function useCampo({ ayuda, error, invalido, valido }: Estado, deshabilitado?: boolean) {
  const id = useId();
  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  const idValido = `${id}-valido`;
  const enError = Boolean(error) || Boolean(invalido);
  const mensajeValido = !enError && typeof valido === 'string' ? valido : undefined;
  const clase = [
    'campo',
    enError && 'campo--error',
    !enError && valido && 'campo--valido',
    deshabilitado && 'campo--deshabilitado',
  ]
    .filter(Boolean)
    .join(' ');
  const descripcion = [error && idError, mensajeValido && idValido, ayuda && idAyuda]
    .filter(Boolean)
    .join(' ');
  return { id, idAyuda, idError, idValido, enError, mensajeValido, clase, descripcion };
}

function Mensajes({
  error,
  ayuda,
  mensajeValido,
  ids,
}: {
  error?: string;
  ayuda?: string;
  mensajeValido?: string;
  ids: { idError: string; idAyuda: string; idValido: string };
}) {
  return (
    <>
      {error && (
        <p id={ids.idError} className="campo__error">
          {error}
        </p>
      )}
      {mensajeValido && (
        <p id={ids.idValido} className="campo__valido">
          ✓ {mensajeValido}
        </p>
      )}
      {ayuda && (
        <p id={ids.idAyuda} className="campo__ayuda">
          {ayuda}
        </p>
      )}
    </>
  );
}

type PropsCampo = ComponentProps<'input'> & Estado;

/**
 * Componente «Campo» (Figma 8:90): etiqueta siempre visible arriba, nunca
 * placeholder haciendo de etiqueta. Estados Normal, Foco, Error, Válido y
 * Deshabilitado.
 */
export function Campo({ etiqueta, ayuda, error, invalido, valido, type, ref, ...input }: PropsCampo) {
  const c = useCampo({ etiqueta, ayuda, error, invalido, valido }, input.disabled);
  const esContrasena = type === 'password';
  const [visible, setVisible] = useState(false);

  return (
    <div className={c.clase}>
      <label className="campo__etiqueta" htmlFor={c.id}>
        {etiqueta}
      </label>
      <div className="campo__caja">
        <input
          id={c.id}
          ref={ref}
          type={esContrasena && visible ? 'text' : type}
          aria-invalid={c.enError || undefined}
          aria-describedby={c.descripcion || undefined}
          {...input}
        />
        {esContrasena && (
          <button
            type="button"
            className="campo__ver"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
          >
            {visible ? 'Ocultar' : 'Ver'}
          </button>
        )}
      </div>
      <Mensajes error={error} ayuda={ayuda} mensajeValido={c.mensajeValido} ids={c} />
    </div>
  );
}

type PropsSelector = ComponentProps<'select'> &
  Estado & {
    /** Opción vacía inicial («Selecciona…»); sin ella, se elige la primera. */
    vacio?: string;
    children: ReactNode;
  };

/** «Campo» con lista de opciones: misma caja, un `<select>` nativo dentro. */
export function CampoSelector({
  etiqueta,
  ayuda,
  error,
  invalido,
  valido,
  vacio,
  children,
  ref,
  ...select
}: PropsSelector) {
  const c = useCampo({ etiqueta, ayuda, error, invalido, valido }, select.disabled);
  return (
    <div className={c.clase}>
      <label className="campo__etiqueta" htmlFor={c.id}>
        {etiqueta}
      </label>
      <div className="campo__caja campo__caja--selector">
        <select
          id={c.id}
          ref={ref}
          aria-invalid={c.enError || undefined}
          aria-describedby={c.descripcion || undefined}
          {...select}
        >
          {vacio !== undefined && <option value="">{vacio}</option>}
          {children}
        </select>
      </div>
      <Mensajes error={error} ayuda={ayuda} mensajeValido={c.mensajeValido} ids={c} />
    </div>
  );
}
