import { Navigate, Outlet } from 'react-router';
import type { Rol } from '../api/tipos';
import { useAuth } from './auth-context';

/**
 * HU12-E1: una función de otro rol no existe para esa persona. El backend la
 * rechaza igual (403); aquí ni siquiera se muestra.
 */
export function RutaPorRol({ roles }: { roles: Rol[] }) {
  const { usuario } = useAuth();
  if (!usuario || !roles.includes(usuario.rol)) return <Navigate to="/" replace />;
  return <Outlet />;
}
