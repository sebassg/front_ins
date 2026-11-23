/**
 * «Avatar» (Figma 8:103): iniciales, nunca fotografía del menor. Una lista
 * con fotos de niños abierta frente a desconocidos es exposición innecesaria.
 */
export function Avatar({
  iniciales,
  tamano = 42,
  tipo = 'marca',
}: {
  iniciales: string;
  tamano?: 42 | 56;
  tipo?: 'marca' | 'accion' | 'critico';
}) {
  return (
    <span
      className={`avatar avatar--${tipo}${tamano === 56 ? ' avatar--56' : ''}`}
      aria-hidden="true"
    >
      {iniciales}
    </span>
  );
}
