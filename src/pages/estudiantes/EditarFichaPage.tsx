import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm, type Path } from 'react-hook-form';
import { Link, useParams } from 'react-router';
import { estudiantesApi } from '../../api/estudiantes';
import {
  PARENTESCOS,
  TIPOS_DOCUMENTO,
  type AcudienteFicha,
  type ActualizarAcudienteBody,
  type ActualizarEstudianteBody,
  type FichaEstudiante,
} from '../../api/tipos';
import { Alerta } from '../../components/Alerta';
import { Campo, CampoSelector } from '../../components/Campo';
import { Cargando } from '../../components/Cargando';
import { useEncabezado } from '../../components/encabezado';
import { aplicarErroresDelServidor, resumenErrores } from '../../estudiantes/errores';
import { editarFichaSchema, type EditarFichaForm } from '../../estudiantes/esquemas';
import { ESTADO_ESTUDIANTE, ESTADO_VINCULO } from '../../estudiantes/etiquetas';
import { fechaAsiento, formatearDocumento, formatearTelefono } from '../../estudiantes/formato';
import { useFicha } from '../../estudiantes/useFicha';

type CampoFicha = Path<EditarFichaForm>;

const CAMPOS_ESTUDIANTE = ['nombres', 'apellidos', 'fechaNacimiento', 'grupoId', 'estado'] as const;
const CAMPOS_ACUDIENTE = ['correo', 'telefono', 'parentesco', 'estado'] as const;
const CAMPOS: CampoFicha[] = [
  ...CAMPOS_ESTUDIANTE.map((c) => `estudiante.${c}` as const),
  ...CAMPOS_ACUDIENTE.map((c) => `acudiente.${c}` as const),
];

const ETIQUETA: Record<CampoFicha, string> = {
  estudiante: 'Estudiante',
  'estudiante.nombres': 'Nombres',
  'estudiante.apellidos': 'Apellidos',
  'estudiante.fechaNacimiento': 'Fecha de nacimiento',
  'estudiante.grupoId': 'Grupo',
  'estudiante.estado': 'Estado del estudiante',
  acudiente: 'Acudiente',
  'acudiente.correo': 'Correo',
  'acudiente.telefono': 'Teléfono de contacto',
  'acudiente.parentesco': 'Parentesco',
  'acudiente.estado': 'Estado del acudiente',
};

function valoresDe(ficha: FichaEstudiante, titular: AcudienteFicha | undefined): EditarFichaForm {
  return {
    estudiante: {
      nombres: ficha.nombres,
      apellidos: ficha.apellidos,
      fechaNacimiento: ficha.fechaNacimiento ?? '',
      grupoId: ficha.grupo?.id ?? '',
      estado: ficha.estado,
    },
    acudiente: {
      correo: titular?.correo ?? '',
      telefono: titular?.telefono ?? '',
      parentesco: titular?.parentesco ?? 'OTRO',
      estado: titular?.estado ?? 'ACTIVO',
    },
  };
}

/** Cómo se lee un valor en el historial («300 412 88 50 → 301 220 77 41»). */
function legible(campo: CampoFicha, valor: string, grupos: Map<string, string>): string {
  if (!valor) return 'sin dato';
  switch (campo) {
    case 'acudiente.telefono':
      return formatearTelefono(valor);
    case 'acudiente.parentesco':
      return PARENTESCOS[valor as keyof typeof PARENTESCOS] ?? valor;
    case 'estudiante.grupoId':
      return grupos.get(valor) ?? valor;
    case 'estudiante.estado':
      return ESTADO_ESTUDIANTE[valor as keyof typeof ESTADO_ESTUDIANTE] ?? valor;
    case 'acudiente.estado':
      return ESTADO_VINCULO[valor as keyof typeof ESTADO_VINCULO] ?? valor;
    default:
      return valor;
  }
}

interface Cambio {
  campo: CampoFicha;
  antes: string;
  despues: string;
}

/** «Editar ficha» del estudiante y su acudiente titular. */
export function EditarFichaPage() {
  const { uuid = '' } = useParams();
  useEncabezado({ titulo: 'Editar ficha', volverA: `/estudiantes/${uuid}`, sinNavegacion: true });
  const ficha = useFicha(uuid);

  if (ficha.isPending) return <Cargando />;
  if (!ficha.data) return <Alerta nivel="advertencia" titulo={ficha.error.message} />;
  return <FormularioFicha ficha={ficha.data} />;
}

/**
 * Formulario de la plantilla «Cambio guardado y auditado» (Figma 49:225,
 * HU01-E3). No hay frame para los datos del estudiante: siguen la misma
 * plantilla. El historial se arma con lo que trae la ficha, porque el backend
 * no expone la auditoría.
 */
function FormularioFicha({ ficha }: { ficha: FichaEstudiante }) {
  const queryClient = useQueryClient();
  const grupos = useQuery({ queryKey: ['grupos'], queryFn: estudiantesApi.grupos });
  const nombresGrupo = new Map(grupos.data?.map((g) => [g.id, g.nombre]) ?? []);
  if (ficha.grupo) nombresGrupo.set(ficha.grupo.id, ficha.grupo.nombre);
  const titular = ficha.acudientes.find((a) => a.titular);

  const [guardado, setGuardado] = useState<Cambio[] | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    getValues,
    formState: { errors, dirtyFields, isDirty, isSubmitting },
  } = useForm<EditarFichaForm>({
    resolver: zodResolver(editarFichaSchema),
    defaultValues: valoresDe(ficha, titular),
  });

  const sucio = (c: CampoFicha) => {
    const [seccion, campo] = c.split('.') as ['estudiante' | 'acudiente', string];
    return Boolean((dirtyFields[seccion] as Record<string, boolean> | undefined)?.[campo]);
  };

  const enviar = handleSubmit(async (f) => {
    setErrorGeneral(null);
    const antes = valoresDe(ficha, titular);
    const cambiados = CAMPOS.filter(sucio);

    if (ficha.fechaNacimiento && !f.estudiante.fechaNacimiento) {
      setError('estudiante.fechaNacimiento', {
        message: 'Escribe la fecha de nacimiento: no se puede dejar vacía.',
      });
      return;
    }

    const cuerpoEstudiante: ActualizarEstudianteBody = {};
    for (const c of CAMPOS_ESTUDIANTE) {
      if (!sucio(`estudiante.${c}`)) continue;
      const v = f.estudiante[c].trim();
      if (c === 'grupoId') cuerpoEstudiante.grupoId = Number(v);
      else if (c === 'estado') cuerpoEstudiante.estado = f.estudiante.estado;
      else cuerpoEstudiante[c] = v;
    }
    const cuerpoAcudiente: ActualizarAcudienteBody = {};
    for (const c of CAMPOS_ACUDIENTE) {
      if (!sucio(`acudiente.${c}`)) continue;
      if (c === 'telefono') cuerpoAcudiente.telefono = f.acudiente.telefono.trim() || null;
      else if (c === 'correo') cuerpoAcudiente.correo = f.acudiente.correo.trim().toLowerCase();
      else if (c === 'parentesco') cuerpoAcudiente.parentesco = f.acudiente.parentesco;
      else cuerpoAcudiente.estado = f.acudiente.estado;
    }

    let actual = ficha;
    // Se guarda por partes: si la segunda falla, la primera ya quedó en firme.
    try {
      if (Object.keys(cuerpoEstudiante).length > 0) {
        actual = await estudiantesApi.actualizar(ficha.uuid, cuerpoEstudiante);
        queryClient.setQueryData(['estudiante', ficha.uuid], actual);
      }
    } catch (error) {
      setErrorGeneral(aplicarErroresDelServidor(error, setError, CAMPOS, 'estudiante.'));
      return;
    }
    try {
      if (titular && Object.keys(cuerpoAcudiente).length > 0) {
        actual = await estudiantesApi.actualizarAcudiente(ficha.uuid, titular.uuid, cuerpoAcudiente);
        queryClient.setQueryData(['estudiante', ficha.uuid], actual);
      }
    } catch (error) {
      const mensaje = aplicarErroresDelServidor(error, setError, CAMPOS, 'acudiente.');
      if (actual !== ficha) {
        // Los datos del estudiante sí quedaron: el formulario parte de ahí.
        const valores = getValues();
        reset({ ...valoresDe(actual, titular), acudiente: valores.acudiente }, { keepErrors: true });
      }
      setErrorGeneral(mensaje);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['estudiantes'] });
    const despues = valoresDe(actual, actual.acudientes.find((a) => a.titular));
    const valor = (v: EditarFichaForm, c: CampoFicha) => {
      const [s, k] = c.split('.') as ['estudiante' | 'acudiente', string];
      return String((v[s] as Record<string, string>)[k] ?? '');
    };
    setGuardado(cambiados.map((c) => ({ campo: c, antes: valor(antes, c), despues: valor(despues, c) })));
    reset(despues);
  });

  const nuevoGuardado = (c: CampoFicha) => Boolean(guardado?.some((g) => g.campo === c) && !sucio(c));
  const { total: pendientes } = resumenErrores(errors);

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      {guardado && !isDirty && (
        <Alerta nivel="exito" titulo="Cambios guardados a tu nombre" />
      )}
      {errorGeneral && <Alerta nivel="advertencia" titulo={errorGeneral} />}

      <fieldset className="seccion-formulario">
        <legend className="eyebrow">Datos del estudiante</legend>
        <Campo
          etiqueta={`Documento · ${TIPOS_DOCUMENTO[ficha.tipoDocumento]}`}
          value={formatearDocumento(ficha.numeroDocumento)}
          disabled
          readOnly
        />
        <Campo
          etiqueta="Nombres *"
          autoComplete="off"
          valido={nuevoGuardado('estudiante.nombres')}
          error={errors.estudiante?.nombres?.message}
          {...register('estudiante.nombres')}
        />
        <Campo
          etiqueta="Apellidos *"
          autoComplete="off"
          valido={nuevoGuardado('estudiante.apellidos')}
          error={errors.estudiante?.apellidos?.message}
          {...register('estudiante.apellidos')}
        />
        <Campo
          etiqueta="Fecha de nacimiento"
          type="date"
          valido={nuevoGuardado('estudiante.fechaNacimiento')}
          error={errors.estudiante?.fechaNacimiento?.message}
          {...register('estudiante.fechaNacimiento')}
        />
        <CampoSelector
          etiqueta="Grupo *"
          vacio={ficha.grupo ? undefined : 'Selecciona el grupo'}
          valido={nuevoGuardado('estudiante.grupoId')}
          error={errors.estudiante?.grupoId?.message}
          {...register('estudiante.grupoId')}
        >
          {[...nombresGrupo].map(([id, nombre]) => (
            <option key={id} value={id}>
              {nombre}
            </option>
          ))}
        </CampoSelector>
        <CampoSelector
          etiqueta="Estado del estudiante"
          ayuda="Un estudiante no se elimina: se marca como retirado."
          valido={nuevoGuardado('estudiante.estado')}
          error={errors.estudiante?.estado?.message}
          {...register('estudiante.estado')}
        >
          <option value="ACTIVO">{ESTADO_ESTUDIANTE.ACTIVO}</option>
          <option value="RETIRADO">{ESTADO_ESTUDIANTE.RETIRADO}</option>
        </CampoSelector>
      </fieldset>

      {titular && (
        <fieldset className="seccion-formulario">
          <legend className="eyebrow">
            Acudiente titular · {titular.nombres} {titular.apellidos}
          </legend>
          <Campo
            etiqueta="Correo *"
            type="email"
            autoCapitalize="none"
            spellCheck={false}
            ayuda={
              titular.estadoCuenta === 'PENDIENTE_ACTIVACION'
                ? 'La cuenta aún no está activa: si cambias el correo, enviamos un nuevo enlace.'
                : undefined
            }
            valido={nuevoGuardado('acudiente.correo')}
            error={errors.acudiente?.correo?.message}
            {...register('acudiente.correo')}
          />
          <Campo
            etiqueta="Teléfono de contacto"
            type="tel"
            inputMode="tel"
            valido={nuevoGuardado('acudiente.telefono')}
            error={errors.acudiente?.telefono?.message}
            {...register('acudiente.telefono')}
          />
          <CampoSelector
            etiqueta="Parentesco"
            valido={nuevoGuardado('acudiente.parentesco')}
            error={errors.acudiente?.parentesco?.message}
            {...register('acudiente.parentesco')}
          >
            {Object.entries(PARENTESCOS).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </CampoSelector>
          <CampoSelector
            etiqueta="Estado del acudiente"
            valido={nuevoGuardado('acudiente.estado')}
            error={errors.acudiente?.estado?.message}
            {...register('acudiente.estado')}
          >
            <option value="ACTIVO">{ESTADO_VINCULO.ACTIVO}</option>
            <option value="INACTIVO">{ESTADO_VINCULO.INACTIVO}</option>
          </CampoSelector>
        </fieldset>
      )}

      {isDirty ? (
        <button
          type="submit"
          className={`boton boton--primario${pendientes > 0 ? ' boton--deshabilitado' : ''}`}
          aria-disabled={pendientes > 0 || undefined}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
        </button>
      ) : (
        <Link className="boton boton--secundario" to={`/estudiantes/${ficha.uuid}`}>
          Volver a la ficha
        </Link>
      )}

      <Historial
        ficha={ficha}
        cambios={guardado}
        legible={(c, v) => legible(c, v, nombresGrupo)}
      />
    </form>
  );
}

/** «Historial de auditoría» (49:245), con los datos de la ficha. */
function Historial({
  ficha,
  cambios,
  legible,
}: {
  ficha: FichaEstudiante;
  cambios: Cambio[] | null;
  legible: (c: CampoFicha, v: string) => string;
}) {
  const titular = ficha.acudientes.find((a) => a.titular);
  const asientos: { fecha: string; titulo: string; detalle: string }[] = [];

  if (ficha.actualizadoPor) {
    const quien = `${ficha.actualizadoPor} (Personal administrativo)`;
    const detalle = cambios?.length
      ? cambios
          .map((c) => `${ETIQUETA[c.campo]}: ${legible(c.campo, c.antes)} → ${legible(c.campo, c.despues)}`)
          .join(' · ')
      : null;
    asientos.push({
      fecha: ficha.actualizadoEn,
      titulo:
        cambios?.length === 1
          ? `Cambio en ${ETIQUETA[cambios[0].campo].toLowerCase()}`
          : 'Ficha actualizada',
      detalle: detalle ? `${quien} · ${detalle}` : quien,
    });
  }
  const autorizacion = ficha.autorizacionDatos
    ? ` · Autorización de tratamiento de datos registrada (aviso ${ficha.autorizacionDatos.versionAviso}).`
    : '';
  asientos.push({
    fecha: ficha.creadoEn,
    titulo: 'Estudiante registrado',
    detalle: `Acudiente titular: ${titular ? `${titular.nombres} ${titular.apellidos}` : 'sin asignar'}${autorizacion}`,
  });

  return (
    <section className="tarjeta historial" aria-labelledby="historial-titulo">
      <h2 id="historial-titulo" className="t-etiqueta t-sutil">
        HISTORIAL DE AUDITORÍA
      </h2>
      <ol className="historial__lista">
        {asientos.map((a) => (
          <li key={a.titulo + a.fecha} className="asiento">
            <span className="asiento__punto" aria-hidden="true" />
            <div className="asiento__texto">
              <p className="t-etiqueta t-sutil">{fechaAsiento(a.fecha)}</p>
              <p className="t-pequeno asiento__titulo">{a.titulo}</p>
              <p className="t-pequeno t-suave">{a.detalle}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
