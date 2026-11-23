import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth/auth-context';
import { MENU_POR_ROL } from '../auth/menu-por-rol';
import { EncabezadoContexto, type Encabezado } from './encabezado';

/**
 * Marco de la app con sesión (Figma 35:608 / 35:643): «Barra superior» y
 * «Navegación inferior» según el rol. Cada pantalla puede cambiar el título,
 * el destino de «←» y ocultar la navegación con `useEncabezado`.
 */
export function AppLayout() {
  const { usuario } = useAuth();
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const [encabezado, setEncabezado] = useState<Encabezado | null>(null);
  if (!usuario) return null;
  const menu = MENU_POR_ROL[usuario.rol];
  const enInicio = ubicacion.pathname === '/';
  // En el inicio no hay a dónde volver: el botón solo aparece en las secciones.
  const volverA = encabezado?.volverA ?? (enInicio ? undefined : '/');
  const titulo = encabezado?.titulo ?? `${usuario.nombres} ${usuario.apellidos}`;

  return (
    <EncabezadoContexto value={setEncabezado}>
      <div className="app">
        <header className="barra">
          {volverA && (
            <button
              type="button"
              className="barra__atras"
              onClick={() => navegar(volverA)}
              aria-label="Volver"
            >
              ←
            </button>
          )}
          <p className="barra__titulo t-h3">{titulo}</p>
        </header>
        <main className={`app__cuerpo${encabezado?.pleno ? ' app__cuerpo--pleno' : ''}`}>
          <Outlet />
        </main>
        {!encabezado?.sinNavegacion && (
          <nav className="navegacion" aria-label="Menú principal">
            {menu.map((destino) => (
              <NavLink
                key={destino.ruta}
                to={destino.ruta}
                end={destino.ruta === '/'}
                className="navegacion__item"
              >
                <span className="navegacion__icono" aria-hidden="true">
                  {destino.icono}
                </span>
                <span className="t-etiqueta">{destino.etiqueta}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </EncabezadoContexto>
  );
}
