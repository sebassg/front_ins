import { useId, useState, type ComponentProps } from 'react';

interface Props extends ComponentProps<'input'> {
  etiqueta: string;
  /** Texto de ayuda bajo el campo (p. ej. "Los acudientes ingresan con…"). */
  ayuda?: string;
  /** Mensaje de error junto al campo: dice qué hacer, no qué falló. */
  error?: string;
  /** Marca el campo en error sin mensaje propio (el mensaje va en una alerta). */
  invalido?: boolean;
}

/**
 * Componente «Campo» (Figma 8:90): etiqueta siempre visible arriba, nunca
 * placeholder haciendo de etiqueta.
 */
export function Campo({ etiqueta, ayuda, error, invalido, type, ref, ...input }: Props) {
  const id = useId();
  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  const esContrasena = type === 'password';
  const [visible, setVisible] = useState(false);
  const enError = Boolean(error) || invalido;
  const descripcion = [error && idError, ayuda && idAyuda].filter(Boolean).join(' ');

  return (
    <div className={enError ? 'campo campo--error' : 'campo'}>
      <label className="campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <div className="campo__caja">
        <input
          id={id}
          ref={ref}
          type={esContrasena && visible ? 'text' : type}
          aria-invalid={enError || undefined}
          aria-describedby={descripcion || undefined}
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
      {error && (
        <p id={idError} className="campo__error">
          {error}
        </p>
      )}
      {ayuda && (
        <p id={idAyuda} className="campo__ayuda">
          {ayuda}
        </p>
      )}
    </div>
  );
}
