import { Navigate, Outlet, useLocation } from 'react-router';
import { Cargando } from '../components/Cargando';
import { useAuth } from './auth-context';

/** Deja pasar solo con sesión; si no, va al login y recuerda a dónde iba. */
export function RutaProtegida() {
  const { estado } = useAuth();
  const ubicacion = useLocation();
  if (estado === 'cargando') return <Cargando />;
  if (estado === 'anonimo') {
    return <Navigate to="/iniciar-sesion" replace state={{ desde: ubicacion }} />;
  }
  return <Outlet />;
}

/** Las pantallas de acceso no tienen sentido con la sesión abierta. */
export function RutaSoloAnonimo() {
  const { estado } = useAuth();
  if (estado === 'cargando') return <Cargando />;
  if (estado === 'autenticado') return <Navigate to="/" replace />;
  return <Outlet />;
}
