/** Formatos de presentación de la ficha (Figma 49:155, 49:245). */

const ZONA = 'America/Bogota';

/** `1090447112` → `1.090.447.112`; un documento con letras queda igual. */
export function formatearDocumento(numero: string): string {
  return /^\d+$/.test(numero) ? numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : numero;
}

/** Celular colombiano `3004128850` → `300 412 88 50`; otro formato queda igual. */
export function formatearTelefono(telefono: string): string {
  const digitos = telefono.replace(/\D/g, '');
  if (digitos.length !== 10) return telefono;
  return `${digitos.slice(0, 3)} ${digitos.slice(3, 6)} ${digitos.slice(6, 8)} ${digitos.slice(8)}`;
}

/** Iniciales para el «Avatar»: primera letra de nombres y de apellidos. */
export function iniciales(nombres: string, apellidos: string): string {
  const letra = (s: string) => s.trim().charAt(0);
  return `${letra(nombres)}${letra(apellidos)}`.toLocaleUpperCase('es-CO');
}

/** Años cumplidos a partir de `AAAA-MM-DD`. */
export function edad(fechaNacimiento: string, hoy = new Date()): number {
  const [a, m, d] = fechaNacimiento.split('-').map(Number);
  let anos = hoy.getFullYear() - a;
  const mes = hoy.getMonth() + 1;
  if (mes < m || (mes === m && hoy.getDate() < d)) anos -= 1;
  return anos;
}

/**
 * Fecha de un asiento del historial: «Hace un momento» si fue hace menos de
 * dos minutos; si no, «03 feb · 08:10» (con el año si no es el actual).
 */
export function fechaAsiento(iso: string, ahora = new Date()): string {
  const fecha = new Date(iso);
  if (ahora.getTime() - fecha.getTime() < 2 * 60_000) return 'Hace un momento';
  const partes = (opciones: Intl.DateTimeFormatOptions, f: Date) =>
    Object.fromEntries(
      new Intl.DateTimeFormat('es-CO', { timeZone: ZONA, ...opciones })
        .formatToParts(f)
        .map((p) => [p.type, p.value]),
    );
  const p = partes(
    { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' },
    fecha,
  );
  const anoActual = partes({ year: 'numeric' }, ahora).year;
  const mes = p.month.replace('.', '');
  const ano = p.year === anoActual ? '' : ` ${p.year}`;
  return `${p.day} ${mes}${ano} · ${p.hour}:${p.minute}`;
}
