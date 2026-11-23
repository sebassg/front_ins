import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Avatar } from './Avatar';

/**
 * «Fila de estudiante» (Figma 10:94). Con restricción activa cambia la fila
 * entera —fondo y avatar—, no solo el badge: se recorre con la vista.
 */
export function FilaEstudiante({
  a,
  iniciales,
  nombre,
  detalle,
  badge,
  restriccion = false,
}: {
  a: string;
  iniciales: string;
  nombre: string;
  detalle: string;
  badge: ReactNode;
  restriccion?: boolean;
}) {
  return (
    <Link
      to={a}
      className={`fila-estudiante${restriccion ? ' fila-estudiante--restriccion' : ''}`}
    >
      <Avatar iniciales={iniciales} tipo={restriccion ? 'critico' : 'marca'} />
      <span className="fila-estudiante__info">
        <span className="fila-estudiante__nombre">{nombre}</span>
        <span className="fila-estudiante__detalle">{detalle}</span>
      </span>
      {badge}
    </Link>
  );
}
