import type { ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { PARENTESCOS, type AcudienteFicha } from '../../api/tipos';
import { Alerta } from '../../components/Alerta';
import { Avatar } from '../../components/Avatar';
import { BadgeEstado } from '../../components/BadgeEstado';
import { Cargando } from '../../components/Cargando';
import { useEncabezado } from '../../components/encabezado';
import { badgeEstudiante } from '../../estudiantes/etiquetas';
import { edad, formatearDocumento, formatearTelefono, iniciales } from '../../estudiantes/formato';
import { useFicha } from '../../estudiantes/useFicha';
import type { EstadoRegistro } from './RegistrarEstudiantePage';

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="dato">
      <dt>{etiqueta}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** Estado de la cuenta o del vínculo que vale la pena señalar en la ficha. */
function BadgeAcudiente({ acudiente }: { acudiente: AcudienteFicha }) {
  if (acudiente.estado === 'INACTIVO') return <BadgeEstado estado="usado" texto="Inactiva" />;
  if (acudiente.estadoCuenta === 'PENDIENTE_ACTIVACION') {
    return <BadgeEstado estado="pendiente" texto="Sin activar" />;
  }
  if (acudiente.estadoCuenta === 'INACTIVO') {
    return <BadgeEstado estado="bloqueado" texto="Cuenta inactiva" />;
  }
  return null;
}

/** «Ficha del estudiante» (Figma 49:155, HU01-E3). */
export function FichaEstudiantePage() {
  const { uuid = '' } = useParams();
  const registro = useLocation().state as EstadoRegistro | null;
  const ficha = useFicha(uuid);
  const nombre = ficha.data ? `${ficha.data.nombres} ${ficha.data.apellidos}` : 'Estudiante';
  useEncabezado({ titulo: nombre, volverA: '/estudiantes' });

  if (ficha.isPending) return <Cargando />;
  if (!ficha.data) {
    return (
      <>
        <Alerta nivel="advertencia" titulo={ficha.error.message}>
          Búscalo de nuevo en el listado.
        </Alerta>
        <Link className="boton boton--secundario" to="/estudiantes">
          Ir al listado
        </Link>
      </>
    );
  }

  const e = ficha.data;
  const titular = e.acudientes.find((a) => a.titular);
  const detalle = [e.grupo?.nombre ?? 'Sin grupo', e.fechaNacimiento && `${edad(e.fechaNacimiento)} años`]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      {registro && (
        <Alerta nivel="exito" titulo="Estudiante registrado">
          {registro.registro === 'CREADA'
            ? `Enviamos el enlace de activación a ${registro.correo}.`
            : 'El acudiente ya tenía cuenta: quedó vinculado con este estudiante.'}
        </Alerta>
      )}

      <section className="tarjeta ficha" aria-label="Identidad">
        <div className="ficha__fila">
          <Avatar iniciales={iniciales(e.nombres, e.apellidos)} tamano={56} />
          <div className="ficha__info">
            <h1 className="t-h2">{nombre}</h1>
            <p className="t-pequeno t-suave">{detalle}</p>
          </div>
        </div>
        <hr className="separador" />
        <dl className="lista-datos">
          <Dato etiqueta="Documento">{formatearDocumento(e.numeroDocumento)}</Dato>
          <Dato etiqueta="Estado">
            <BadgeEstado {...badgeEstudiante(e.estado, 'ficha')} />
          </Dato>
        </dl>
      </section>

      <h2 className="eyebrow">Acudiente titular</h2>
      {titular ? (
        <section className="tarjeta ficha" aria-label="Acudiente titular">
          <div className="ficha__fila">
            <Avatar iniciales={iniciales(titular.nombres, titular.apellidos)} tipo="accion" />
            <div className="ficha__info">
              <p className="tarjeta__titulo">
                {titular.nombres} {titular.apellidos}
              </p>
              <p className="t-pequeno t-suave">{PARENTESCOS[titular.parentesco]}</p>
            </div>
            <BadgeAcudiente acudiente={titular} />
          </div>
          <hr className="separador" />
          <dl className="lista-datos">
            <Dato etiqueta="Documento">{formatearDocumento(titular.numeroDocumento)}</Dato>
            <Dato etiqueta="Teléfono">
              {titular.telefono ? formatearTelefono(titular.telefono) : '—'}
            </Dato>
            <Dato etiqueta="Correo">{titular.correo ?? '—'}</Dato>
          </dl>
        </section>
      ) : (
        <p className="tarjeta t-pequeno t-suave">Este estudiante no tiene acudiente titular.</p>
      )}

      {/* Terceros autorizados llega con HU03: la tarjeta se muestra, sin enlace. */}
      <section className="tarjeta" aria-label="Terceros autorizados">
        <div className="tarjeta__fila">
          <div className="ficha__info">
            <p className="tarjeta__titulo">Terceros autorizados</p>
            <p className="t-pequeno t-suave">Disponible con HU03</p>
          </div>
          <span className="tarjeta__chevron" aria-hidden="true">
            ›
          </span>
        </div>
      </section>

      <div className="espaciador" />
      <Link className="boton boton--secundario" to={`/estudiantes/${e.uuid}/editar`}>
        Editar ficha
      </Link>
    </>
  );
}
