import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from '../api/client';

/**
 * Lleva los errores del backend a sus campos: los de negocio traen `campo`
 * (p. ej. `acudiente.numeroDocumento`) y los de validación llegan como
 * `"ruta: mensaje"`. Devuelve lo que no tiene campo, para mostrarlo en una
 * alerta; `null` si todo quedó junto a su campo.
 */
export function aplicarErroresDelServidor<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  campos: readonly Path<T>[],
  /** Prefijo de la ruta en el formulario (p. ej. `acudiente.`). */
  prefijo = '',
): string | null {
  if (!(error instanceof ApiError)) return 'No fue posible guardar. Inténtalo de nuevo.';
  if (error.status === 0 || error.status >= 500 || error.status === 429) return error.message;

  const pares: [string, string][] = error.campo
    ? [[error.campo, error.message]]
    : error.mensajes.flatMap((m) => {
        const i = m.indexOf(': ');
        return i > 0 ? [[m.slice(0, i), m.slice(i + 2)] as [string, string]] : [];
      });

  let asignados = 0;
  for (const [ruta, mensaje] of pares) {
    const campo = `${prefijo}${ruta}` as Path<T>;
    if (!campos.includes(campo)) continue;
    setError(campo, { type: 'server', message: mensaje }, { shouldFocus: asignados === 0 });
    asignados += 1;
  }
  return asignados > 0 ? null : error.message;
}

/** Cuántos campos tienen error (también en objetos anidados) y cuántos vienen del backend. */
export function resumenErrores(errores: object): { total: number; delServidor: number } {
  return Object.values(errores).reduce<{ total: number; delServidor: number }>(
    (acc, e) => {
      if (!e || typeof e !== 'object') return acc;
      if ('message' in e && 'type' in e) {
        return { total: acc.total + 1, delServidor: acc.delServidor + (e.type === 'server' ? 1 : 0) };
      }
      const anidado = resumenErrores(e);
      return { total: acc.total + anidado.total, delServidor: acc.delServidor + anidado.delServidor };
    },
    { total: 0, delServidor: 0 },
  );
}
