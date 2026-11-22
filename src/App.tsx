import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { ApiError } from './api/client';
import { AuthProvider } from './auth/AuthProvider';
import { RutaProtegida, RutaSoloAnonimo } from './auth/RutaProtegida';
import { FijarContrasenaPage } from './pages/FijarContrasenaPage';
import { IniciarSesionPage } from './pages/IniciarSesionPage';
import { AppLayout } from './components/AppLayout';
import { InicioPage } from './pages/InicioPage';
import { MasPage } from './pages/MasPage';
import { SeccionPendientePage } from './pages/SeccionPendientePage';
import { SolicitarEnlacePage } from './pages/SolicitarEnlacePage';

function crearQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Un 4xx no mejora reintentando; un fallo de red, sí.
        retry: (intentos, error) =>
          intentos < 2 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
        refetchOnWindowFocus: false,
      },
    },
  });
}

export function App() {
  const [queryClient] = useState(crearQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Rutas />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export function Rutas() {
  return (
    <Routes>
      <Route element={<RutaSoloAnonimo />}>
        <Route path="/iniciar-sesion" element={<IniciarSesionPage />} />
        <Route
          path="/recuperar-contrasena"
          element={<SolicitarEnlacePage variante="recuperar" />}
        />
        <Route
          path="/reenviar-activacion"
          element={<SolicitarEnlacePage variante="activar" />}
        />
      </Route>
      {/* Los enlaces del correo abren aunque haya otra sesión en el equipo. */}
      <Route
        path="/restablecer-contrasena"
        element={<FijarContrasenaPage variante="restablecer" />}
      />
      <Route path="/activar-cuenta" element={<FijarContrasenaPage variante="activar" />} />
      <Route element={<RutaProtegida />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<InicioPage />} />
          <Route path="/mas" element={<MasPage />} />
          <Route path="/:seccion" element={<SeccionPendientePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
