import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { estudiantesApi, POR_PAGINA } from '../../api/estudiantes';
import { Alerta } from '../../components/Alerta';
import { BadgeEstado } from '../../components/BadgeEstado';
import { Campo } from '../../components/Campo';
import { Cargando } from '../../components/Cargando';
import { FilaEstudiante } from '../../components/FilaEstudiante';
import { useEncabezado } from '../../components/encabezado';
import { badgeEstudiante } from '../../estudiantes/etiquetas';
import { iniciales } from '../../estudiantes/formato';

/** Espera a que la persona deje de escribir antes de buscar. */
function useDiferido(valor: string, ms = 300) {
  const [diferido, setDiferido] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setDiferido(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return diferido;
}

/** «Listado» de estudiantes (Figma 49:21, HU01-E3). */
export function EstudiantesPage() {
  useEncabezado({ titulo: 'Estudiantes', volverA: '', pleno: true });
  const [texto, setTexto] = useState('');
  const buscar = useDiferido(texto.trim());

  const consulta = useInfiniteQuery({
    queryKey: ['estudiantes', buscar],
    queryFn: ({ pageParam, signal }) => estudiantesApi.buscar({ buscar, pagina: pageParam }, signal),
    initialPageParam: 1,
    getNextPageParam: (ultima, paginas) =>
      paginas.length * POR_PAGINA < ultima.total ? paginas.length + 1 : undefined,
  });
  const estudiantes = consulta.data?.pages.flatMap((p) => p.estudiantes) ?? [];

  return (
    <>
      <search className="buscador">
        <Campo
          etiqueta="Buscar por nombre o documento"
          type="search"
          autoComplete="off"
          spellCheck={false}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
      </search>

      {consulta.isPending && <Cargando />}
      {consulta.isError && (
        <div className="lista__vacia">
          <Alerta nivel="advertencia" titulo={consulta.error.message} />
        </div>
      )}
      {consulta.isSuccess && estudiantes.length === 0 && (
        <p className="lista__vacia t-pequeno t-suave">
          {buscar ? `No hay estudiantes que coincidan con «${buscar}».` : 'Aún no hay estudiantes registrados.'}
        </p>
      )}
      {estudiantes.length > 0 && (
        <ul className="lista" aria-label="Estudiantes">
          {estudiantes.map((e) => (
            <li key={e.uuid}>
              <FilaEstudiante
                a={`/estudiantes/${e.uuid}`}
                iniciales={iniciales(e.nombres, e.apellidos)}
                nombre={`${e.nombres} ${e.apellidos}`}
                detalle={`${e.grupo ?? 'Sin grupo'} · ${e.acudienteTitular ?? 'Sin acudiente titular'}`}
                badge={<BadgeEstado {...badgeEstudiante(e.estado, 'listado')} />}
              />
            </li>
          ))}
        </ul>
      )}
      {consulta.hasNextPage && (
        <div className="lista__mas">
          <button
            type="button"
            className="boton boton--terciario"
            onClick={() => consulta.fetchNextPage()}
            disabled={consulta.isFetchingNextPage}
          >
            {consulta.isFetchingNextPage ? 'Cargando…' : 'Ver más'}
          </button>
        </div>
      )}

      <div className="espaciador" />
      {/* El diseño no trae la entrada al registro: se usa el bloque «Acción» (20:702). */}
      <div className="accion-pie">
        <Link className="boton boton--primario" to="/estudiantes/nuevo">
          Registrar estudiante
        </Link>
      </div>
    </>
  );
}
