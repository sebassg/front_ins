import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth/auth-context';
import { MENU_POR_ROL } from '../auth/menu-por-rol';

/**
 * Marco de la app con sesión (Figma 35:608 / 35:643): «Barra superior» con
 * el nombre de la persona y «Navegación inferior» según su rol.
 */
export function AppLayout() {
  const { usuario } = useAuth();
  const ubicacion = useLocation();
  const navegar = useNavigate();
  if (!usuario) return null;
  const menu = MENU_POR_ROL[usuario.rol];
  const enInicio = ubicacion.pathname === '/';

  return (
    <div className="app">
      <header className="barra">
        {/* En el inicio no hay a dónde volver: el botón solo aparece en las secciones. */}
        {!enInicio && (
          <button
            type="button"
            className="barra__atras"
            onClick={() => navegar('/')}
            aria-label="Volver al inicio"
          >
            ←
          </button>
        )}
        <p className="barra__titulo t-h3">
          {usuario.nombres} {usuario.apellidos}
        </p>
      </header>
      <main className="app__cuerpo">
        <Outlet />
      </main>
      <nav className="navegacion" aria-label="Menú principal">
        {menu.map((destino) => (
          <NavLink key={destino.ruta} to={destino.ruta} end className="navegacion__item">
            <span className="navegacion__icono" aria-hidden="true">
              {destino.icono}
            </span>
            <span className="t-etiqueta">{destino.etiqueta}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
