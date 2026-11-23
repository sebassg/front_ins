import type { FichaEstudiante } from '../api/tipos';

export const grupos = [
  { id: '1', nombre: 'Transición A', jornada: 'MANANA', horaSalida: '12:00' },
  { id: '2', nombre: 'Transición B', jornada: 'MANANA', horaSalida: '12:00' },
];

export const UUID = '7d3c1f9e-2b8a-4c6d-9e1f-0a2b3c4d5e6f';
export const UUID_ACUDIENTE = '1a2b3c4d-5e6f-4a8b-9c0d-1e2f3a4b5c6d';

export const ficha: FichaEstudiante = {
  uuid: UUID,
  tipoDocumento: 'RC',
  numeroDocumento: '1090447112',
  nombres: 'Sofía',
  apellidos: 'Ramírez Gómez',
  fechaNacimiento: '2021-04-15',
  estado: 'ACTIVO',
  grupo: { id: '1', nombre: 'Transición A', jornada: 'MANANA', horaSalida: '12:00' },
  acudientes: [
    {
      uuid: UUID_ACUDIENTE,
      tipoDocumento: 'CC',
      numeroDocumento: '1094887213',
      nombres: 'Marta L.',
      apellidos: 'Gómez Peláez',
      correo: 'marta.gomez@correo.com',
      telefono: '3004128850',
      parentesco: 'MADRE',
      titular: true,
      estado: 'ACTIVO',
      estadoCuenta: 'ACTIVO',
    },
  ],
  autorizacionDatos: {
    otorgadoEn: '2026-02-03T13:10:00.000Z',
    otorgadoPor: 'Marta L. Gómez Peláez',
    versionAviso: '2026-11',
    revocadoEn: null,
  },
  creadoEn: '2026-02-03T13:10:00.000Z',
  actualizadoEn: '2026-02-03T13:10:00.000Z',
  actualizadoPor: null,
};
