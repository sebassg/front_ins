import type { ReactNode } from 'react';

const ICONO = { advertencia: '▲', critica: '⊘', exito: '✓' } as const;

/**
 * Componente «Alerta» (Figma 10:22). Toda advertencia ofrece una vía alterna;
 * la crítica es para lo que no tiene salida sin coordinación.
 */
export function Alerta({
  nivel,
  titulo,
  children,
}: {
  nivel: keyof typeof ICONO;
  titulo: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`alerta alerta--${nivel}`}
      role={nivel === 'exito' ? 'status' : 'alert'}
    >
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
