import { createContext, useContext, useEffect } from 'react';

/** Lo que cada pantalla le pide a la «Barra superior» y a la navegación. */
export interface Encabezado {
  /** Título de la barra; por defecto, el nombre de quien inició sesión. */
  titulo?: string;
  /** A dónde lleva «←»; por defecto, al inicio (no aparece en `/` ni con `''`). */
  volverA?: string;
  /** Los formularios ocupan la pantalla sin «Navegación inferior». */
  sinNavegacion?: boolean;
  /** El cuerpo va sin márgenes, para listas de borde a borde (49:21). */
  pleno?: boolean;
}

export const EncabezadoContexto = createContext<(e: Encabezado | null) => void>(() => {});

/** Configura la barra mientras la pantalla está montada. */
export function useEncabezado({ titulo, volverA, sinNavegacion, pleno }: Encabezado) {
  const fijar = useContext(EncabezadoContexto);
  useEffect(() => {
    fijar({ titulo, volverA, sinNavegacion, pleno });
    return () => fijar(null);
  }, [fijar, titulo, volverA, sinNavegacion, pleno]);
}
