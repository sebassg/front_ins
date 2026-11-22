import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { NOMBRE_ROL } from '../api/tipos';
import { useAuth } from '../auth/auth-context';
import { Alerta } from '../components/Alerta';
import { Cargando } from '../components/Cargando';

/** «Más»: el perfil que devuelve GET usuarios/yo y el cierre de sesión. */
export function MasPage() {
  const { cerrarSesion } = useAuth();
  const perfil = useQuery({ queryKey: ['perfil'], queryFn: authApi.perfil });

  return (
    <>
      <section className="tarjeta">
        <p className="tarjeta__titulo">Mi cuenta</p>
        {perfil.isPending && <Cargando />}
        {perfil.isError && <Alerta nivel="advertencia" titulo={perfil.error.message} />}
        {perfil.data && (
          <dl className="datos">
            <dt>Nombre</dt>
            <dd>
              {perfil.data.nombres} {perfil.data.apellidos}
            </dd>
            <dt>Documento</dt>
            <dd>
              {perfil.data.tipoDocumento} {perfil.data.numeroDocumento}
            </dd>
            <dt>Rol</dt>
            <dd>{NOMBRE_ROL[perfil.data.rol]}</dd>
            {perfil.data.correo && (
              <>
                <dt>Correo</dt>
                <dd>{perfil.data.correo}</dd>
              </>
            )}
          </dl>
        )}
      </section>
      <button className="boton boton--secundario" type="button" onClick={() => void cerrarSesion()}>
        Cerrar sesión
      </button>
    </>
  );
}
