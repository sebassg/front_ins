import type { ReactNode, Ref } from 'react';

const ICONO = { info: 'ⓘ', advertencia: '▲', critica: '⊘', exito: '✓' } as const;

/**
 * Componente «Alerta» (Figma 10:22), cuatro niveles. Toda advertencia ofrece
 * una vía alterna; la crítica es para lo que no tiene salida sin coordinación.
 */
export function Alerta({
  nivel,
  titulo,
  children,
  ref,
}: {
  nivel: keyof typeof ICONO;
  titulo: string;
  children?: ReactNode;
  /** Para llevar el foco a la alerta (p. ej. tras una validación fallida). */
  ref?: Ref<HTMLDivElement>;
}) {
  // La información no interrumpe: no se anuncia como alerta.
  const rol = nivel === 'info' ? undefined : nivel === 'exito' ? 'status' : 'alert';
  return (
    <div ref={ref} tabIndex={ref ? -1 : undefined} className={`alerta alerta--${nivel}`} role={rol}>
      <p className="alerta__icono" aria-hidden="true">
        {ICONO[nivel]}
      </p>
      <div className="alerta__texto">
        <p className="alerta__titulo">{titulo}</p>
        {children && <div className="alerta__detalle">{children}</div>}
      </div>
    </div>
  );
}
