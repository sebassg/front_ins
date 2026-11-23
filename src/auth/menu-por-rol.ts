import type { Rol } from '../api/tipos';

export interface DestinoMenu {
  ruta: string;
  etiqueta: string;
  icono: string;
  /** Historia que implementa la sección; sin ella, es una sección pendiente. */
  historia?: string;
}

/**
 * «Navegación inferior» (Figma 10:81): un menú por rol, de 3 a 4 destinos.
 * HU12-E1: cada persona ve solo las funciones de su rol; lo prohibido no se
 * muestra en gris, directamente no está.
 *
 * Los tres menús salen del diseño; el de ADMINISTRATIVO es el de la
 * plantilla HU01 (38:15). Su destino principal es el listado de estudiantes.
 */
export const MENU_POR_ROL: Record<Rol, DestinoMenu[]> = {
  ACUDIENTE: [
    { ruta: '/', etiqueta: 'Inicio', icono: '⌂' },
    { ruta: '/pase', etiqueta: 'Mi pase', icono: '◫', historia: 'HU02' },
    { ruta: '/autorizar', etiqueta: 'Autorizar', icono: '✎', historia: 'HU03' },
    { ruta: '/mas', etiqueta: 'Más', icono: '☰' },
  ],
  DOCENTE: [
    { ruta: '/', etiqueta: 'Escanear', icono: '⊡', historia: 'HU04' },
    { ruta: '/grupo', etiqueta: 'Mi grupo', icono: '⊞', historia: 'HU04' },
    { ruta: '/hora-salida', etiqueta: 'Hora salida', icono: '◷', historia: 'HU09' },
    { ruta: '/mas', etiqueta: 'Más', icono: '☰' },
  ],
  ADMINISTRATIVO: [
    { ruta: '/estudiantes', etiqueta: 'Estudiantes', icono: '⊞' },
    { ruta: '/cuentas', etiqueta: 'Cuentas', icono: '⊕', historia: 'HU12' },
    { ruta: '/mas', etiqueta: 'Más', icono: '☰' },
  ],
};
