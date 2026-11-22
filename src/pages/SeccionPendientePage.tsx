import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../auth/auth-context';
import { MENU_POR_ROL } from '../auth/menu-por-rol';

/** Secciones del menú cuyas historias aún no están en el backend. */
export function SeccionPendientePage() {
  const { usuario } = useAuth();
  const { pathname } = useLocation();
  const destino = usuario && MENU_POR_ROL[usuario.rol].find((d) => d.ruta === pathname);
  // Una ruta que no está en el menú del rol no existe para esa persona (HU12-E1).
  if (!destino) return <Navigate to="/" replace />;

  return (
    <section className="tarjeta">
      <h1 className="t-h3">{destino.etiqueta}</h1>
      <p className="t-pequeno t-suave">Esta sección llega con {destino.historia}.</p>
    </section>
  );
}
