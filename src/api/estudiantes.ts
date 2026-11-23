import { peticion } from './client';
import type {
  ActualizarAcudienteBody,
  ActualizarEstudianteBody,
  EstudianteRegistrado,
  FichaEstudiante,
  Grupo,
  PaginaEstudiantes,
  RegistrarEstudianteBody,
} from './tipos';

/** Endpoints de back_ins/src/modules/estudiantes (HU01, personal administrativo). */

export const POR_PAGINA = 20;

export const estudiantesApi = {
  grupos: () => peticion<Grupo[]>('/grupos'),

  buscar: ({ buscar, pagina }: { buscar: string; pagina: number }, signal?: AbortSignal) => {
    const query = new URLSearchParams({ pagina: String(pagina), porPagina: String(POR_PAGINA) });
    if (buscar) query.set('buscar', buscar);
    return peticion<PaginaEstudiantes>(`/estudiantes?${query}`, { signal });
  },

  registrar: (body: RegistrarEstudianteBody) =>
    peticion<EstudianteRegistrado>('/estudiantes', { method: 'POST', body }),

  ficha: (uuid: string, signal?: AbortSignal) =>
    peticion<FichaEstudiante>(`/estudiantes/${encodeURIComponent(uuid)}`, { signal }),

  actualizar: (uuid: string, body: ActualizarEstudianteBody) =>
    peticion<FichaEstudiante>(`/estudiantes/${encodeURIComponent(uuid)}`, {
      method: 'PATCH',
      body,
    }),

  actualizarAcudiente: (uuid: string, uuidAcudiente: string, body: ActualizarAcudienteBody) =>
    peticion<FichaEstudiante>(
      `/estudiantes/${encodeURIComponent(uuid)}/acudientes/${encodeURIComponent(uuidAcudiente)}`,
      { method: 'PATCH', body },
    ),
};
