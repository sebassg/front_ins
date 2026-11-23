import { Navigate } from 'react-router';
import { NOMBRE_ROL } from '../api/tipos';
import { useAuth } from '../auth/auth-context';
import { MENU_POR_ROL } from '../auth/menu-por-rol';

/**
 * «Entrada según rol» (Figma 35:608 / 35:643). La tarjeta de «Salida de hoy»
 * y las acciones del diseño dependen de historias que el backend aún no
 * expone; por ahora la entrada confirma quién ingresó y con qué rol (HU12-E1).
 */
export function InicioPage() {
  const { usuario } = useAuth();
  if (!usuario) return null;
  // El personal administrativo entra directo a su función principal (HU01).
  if (usuario.rol === 'ADMINISTRATIVO') return <Navigate to="/estudiantes" replace />;
  const secciones = MENU_POR_ROL[usuario.rol].filter((d) => d.ruta !== '/' && d.historia);

  return (
    <>
      <section className="tarjeta tarjeta--destacada">
        <p className="t-etiqueta etiqueta-tinta">
          {NOMBRE_ROL[usuario.rol]} · I.E. Esteban Ochoa
        </p>
        <h1 className="t-h1">Hola, {usuario.nombres}</h1>
        <p className="t-pequeno t-suave">
          Ingresaste como {NOMBRE_ROL[usuario.rol].toLowerCase()}. Tu menú muestra solo las
          funciones de tu rol.
        </p>
      </section>
      {secciones.map((s) => (
        <section key={s.ruta} className="tarjeta">
          <p className="tarjeta__titulo">{s.etiqueta}</p>
          <p className="t-pequeno t-suave">Disponible con {s.historia}.</p>
        </section>
      ))}
    </>
  );
}
