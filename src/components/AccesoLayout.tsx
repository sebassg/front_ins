import type { ReactNode } from 'react';

/**
 * Cuerpo de las pantallas de acceso (Figma 35:580): la marca, el título, el
 * contenido arriba y una nota al pie empujada por el espaciador.
 */
export function AccesoLayout({
  titulo,
  subtitulo,
  pie,
  children,
}: {
  titulo?: string;
  subtitulo?: string;
  pie?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="acceso">
      <div className="marca" aria-hidden="true">
        EO
      </div>
      {titulo && (
        <header className="acceso__titulo">
          <h1 className="t-h1">{titulo}</h1>
          {subtitulo && <p className="t-pequeno t-suave">{subtitulo}</p>}
        </header>
      )}
      {children}
      <div className="acceso__espaciador" />
      {pie && <p className="acceso__pie t-pequeno t-sutil">{pie}</p>}
    </main>
  );
}

/**
 * Pantalla de estado (Figma 35:707 / 35:724): señal circular, título,
 * explicación y una sola acción abajo.
 */
export function PantallaEstado({
  senal,
  tono,
  titulo,
  children,
  accion,
}: {
  senal: string;
  tono: 'exito' | 'critico';
  titulo: string;
  children: ReactNode;
  accion: ReactNode;
}) {
  return (
    <main className="acceso acceso--estado">
      <div className={`senal senal--${tono}`} aria-hidden="true">
        {senal}
      </div>
      <div className="acceso__titulo" role="status">
        <h1 className="t-h1">{titulo}</h1>
        <p className="t-pequeno t-suave">{children}</p>
      </div>
      <div className="acceso__espaciador" />
      {accion}
    </main>
  );
}
