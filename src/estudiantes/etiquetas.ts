import type { EstadoEstudiante, EstadoVinculo } from '../api/tipos';
import type { VarianteBadge } from '../components/BadgeEstado';

/** Palabra del badge según el estado (como en la plantilla: «Activa»). */
export const ESTADO_ESTUDIANTE: Record<EstadoEstudiante, string> = {
  ACTIVO: 'Activa',
  RETIRADO: 'Retirada',
};

export const ESTADO_VINCULO: Record<EstadoVinculo, string> = {
  ACTIVO: 'Activa',
  INACTIVO: 'Inactiva',
};

/** El listado (49:21) usa la variante Vigente; la ficha (49:155), Presente. */
export function badgeEstudiante(estado: EstadoEstudiante, en: 'listado' | 'ficha') {
  const variante: VarianteBadge =
    estado === 'RETIRADO' ? 'usado' : en === 'listado' ? 'vigente' : 'presente';
  return { estado: variante, texto: ESTADO_ESTUDIANTE[estado] };
}
