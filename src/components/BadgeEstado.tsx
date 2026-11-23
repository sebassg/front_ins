const VARIANTE = {
  vigente: { icono: '✓', texto: 'Vigente' },
  entregado: { icono: '✓', texto: 'Entregado' },
  presente: { icono: '●', texto: 'Presente' },
  pendiente: { icono: '◷', texto: 'Pendiente' },
  usado: { icono: '⊘', texto: 'Usado' },
  vencido: { icono: '▲', texto: 'Vencido' },
  bloqueado: { icono: '▲', texto: 'Bloqueado' },
  restriccion: { icono: '⛔', texto: 'Restricción' },
} as const;

export type VarianteBadge = keyof typeof VARIANTE;

/**
 * «Badge de estado» (Figma 8:67): color + icono + palabra, siempre los tres.
 * Restricción es el único de fondo pleno: no informa, detiene.
 */
export function BadgeEstado({ estado, texto }: { estado: VarianteBadge; texto?: string }) {
  const v = VARIANTE[estado];
  return (
    <span className={`badge badge--${estado}`}>
      <span className="badge__icono" aria-hidden="true">
        {v.icono}
      </span>
      <span className="badge__texto">{texto ?? v.texto}</span>
    </span>
  );
}
