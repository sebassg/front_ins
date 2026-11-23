import { useQuery } from '@tanstack/react-query';
import { estudiantesApi } from '../api/estudiantes';

/** La ficha del estudiante, compartida por la ficha y su edición. */
export function useFicha(uuid: string) {
  return useQuery({
    queryKey: ['estudiante', uuid],
    queryFn: ({ signal }) => estudiantesApi.ficha(uuid, signal),
    // Registro y edición ya dejan la ficha fresca en caché: no se pide de nuevo al entrar.
    staleTime: 30_000,
  });
}
