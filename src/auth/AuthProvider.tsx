import { useQueryClient } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { authApi } from '../api/auth';
import { registrarManejadorSesion, renovarSesion } from '../api/client';
import {
  borrarSesion,
  guardarSesion,
  leerSesion,
  type UsuarioSesion,
} from '../api/sesion-storage';
import { AuthContext, type AuthContexto, type EstadoSesion } from './auth-context';

/**
 * Dueño de la sesión. El access token vive solo en memoria; el refresh token
 * y el usuario, en localStorage, para sobrevivir a una recarga.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  // La sesión guardada se lee una sola vez, al montar.
  const [inicial] = useState(leerSesion);
  const accessToken = useRef<string | null>(null);
  const refreshToken = useRef<string | null>(inicial?.refreshToken ?? null);
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(inicial?.usuario ?? null);
  const [estado, setEstado] = useState<EstadoSesion>(inicial ? 'cargando' : 'anonimo');

  const limpiar = useCallback(() => {
    accessToken.current = null;
    refreshToken.current = null;
    borrarSesion();
    setUsuario(null);
    setEstado('anonimo');
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    registrarManejadorSesion({
      accessToken: () => accessToken.current,
      refreshToken: () => refreshToken.current,
      alRenovar: (tokens) => {
        accessToken.current = tokens.accessToken;
        refreshToken.current = tokens.refreshToken;
        const guardada = leerSesion();
        if (guardada) guardarSesion({ ...guardada, refreshToken: tokens.refreshToken });
      },
      alExpirar: limpiar,
    });
    return () => registrarManejadorSesion(null);
  }, [limpiar]);

  // Al recargar con una sesión guardada, se obtiene un access token nuevo.
  useEffect(() => {
    if (!inicial) return;
    let vigente = true;
    void renovarSesion().then(() => {
      // Si el servidor rechazó el token, alExpirar ya dejó el estado en
      // 'anonimo'. Sin red, se conserva la sesión y se reintenta luego.
      if (vigente && refreshToken.current) setEstado('autenticado');
    });
    return () => {
      vigente = false;
    };
  }, [inicial]);

  const iniciarSesion = useCallback(
    async (numeroDocumento: string, contrasena: string) => {
      const sesion = await authApi.iniciarSesion(numeroDocumento, contrasena);
      accessToken.current = sesion.accessToken;
      refreshToken.current = sesion.refreshToken;
      guardarSesion({ refreshToken: sesion.refreshToken, usuario: sesion.usuario });
      setUsuario(sesion.usuario);
      setEstado('autenticado');
    },
    [],
  );

  const cerrarSesion = useCallback(async () => {
    const token = refreshToken.current;
    limpiar();
    // Se cierra localmente aunque el servidor no responda.
    if (token) await authApi.cerrarSesion(token).catch(() => undefined);
  }, [limpiar]);

  const valor = useMemo<AuthContexto>(
    () => ({ estado, usuario, iniciarSesion, cerrarSesion }),
    [estado, usuario, iniciarSesion, cerrarSesion],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
