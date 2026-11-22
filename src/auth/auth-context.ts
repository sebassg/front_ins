import { createContext, useContext } from 'react';
import type { UsuarioSesion } from '../api/sesion-storage';

export type EstadoSesion = 'cargando' | 'anonimo' | 'autenticado';

export interface AuthContexto {
  estado: EstadoSesion;
  usuario: UsuarioSesion | null;
  iniciarSesion: (numeroDocumento: string, contrasena: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

export const AuthContext = createContext<AuthContexto | null>(null);

export function useAuth(): AuthContexto {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return contexto;
}
