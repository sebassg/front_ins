import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm, type Path } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { estudiantesApi } from '../../api/estudiantes';
import { PARENTESCOS, TIPOS_DOCUMENTO, type RegistrarEstudianteBody } from '../../api/tipos';
import { Alerta } from '../../components/Alerta';
import { Campo, CampoSelector } from '../../components/Campo';
import { useEncabezado } from '../../components/encabezado';
import { aplicarErroresDelServidor, resumenErrores } from '../../estudiantes/errores';
import {
  registrarEstudianteSchema,
  type RegistrarEstudianteForm,
} from '../../estudiantes/esquemas';

/** Lo que la ficha muestra al llegar desde el registro. */
export interface EstadoRegistro {
  registro: 'CREADA' | 'REUTILIZADA';
  correo: string;
}

const CAMPOS: Path<RegistrarEstudianteForm>[] = [
  'tipoDocumento',
  'numeroDocumento',
  'nombres',
  'apellidos',
  'fechaNacimiento',
  'grupoId',
  'acudiente.tipoDocumento',
  'acudiente.numeroDocumento',
  'acudiente.nombres',
  'acudiente.apellidos',
  'acudiente.correo',
  'acudiente.telefono',
  'acudiente.parentesco',
  'autorizacionTratamientoDatos',
];

const VACIO: RegistrarEstudianteForm = {
  tipoDocumento: 'RC',
  numeroDocumento: '',
  nombres: '',
  apellidos: '',
  fechaNacimiento: '',
  grupoId: '',
  acudiente: {
    tipoDocumento: 'CC',
    numeroDocumento: '',
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    parentesco: '' as never,
  },
  autorizacionTratamientoDatos: false,
};

function cuerpoDeRegistro(f: RegistrarEstudianteForm): RegistrarEstudianteBody {
  const recortar = (s: string) => s.trim();
  return {
    tipoDocumento: f.tipoDocumento,
    numeroDocumento: recortar(f.numeroDocumento),
    nombres: recortar(f.nombres),
    apellidos: recortar(f.apellidos),
    fechaNacimiento: f.fechaNacimiento || undefined,
    grupoId: Number(f.grupoId),
    acudiente: {
      tipoDocumento: f.acudiente.tipoDocumento,
      numeroDocumento: recortar(f.acudiente.numeroDocumento),
      nombres: recortar(f.acudiente.nombres),
      apellidos: recortar(f.acudiente.apellidos),
      correo: recortar(f.acudiente.correo).toLowerCase(),
      telefono: recortar(f.acudiente.telefono) || undefined,
      parentesco: f.acudiente.parentesco,
    },
    autorizacionTratamientoDatos: true,
  };
}

const opciones = (mapa: Record<string, string>) =>
  Object.entries(mapa).map(([valor, texto]) => (
    <option key={valor} value={valor}>
      {texto}
    </option>
  ));

/**
 * «Registrar estudiante» (Figma 49:83) y «Validación y duplicidad» (49:127),
 * HU01-E1/E2. Además de lo que muestra la plantilla, el backend exige nombres
 * y apellidos por separado, el correo y el parentesco del acudiente, y la
 * autorización de tratamiento de datos explícita (Ley 1581 de 2012).
 */
export function RegistrarEstudiantePage() {
  useEncabezado({ titulo: 'Nuevo estudiante', volverA: '/estudiantes', sinNavegacion: true });
  const navegar = useNavigate();
  const queryClient = useQueryClient();
  const grupos = useQuery({ queryKey: ['grupos'], queryFn: estudiantesApi.grupos });
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitted },
  } = useForm<RegistrarEstudianteForm>({
    resolver: zodResolver(registrarEstudianteSchema),
    defaultValues: VACIO,
  });

  const registro = useMutation({ mutationFn: estudiantesApi.registrar });

  const enviar = handleSubmit(async (formulario) => {
    setErrorGeneral(null);
    const cuerpo = cuerpoDeRegistro(formulario);
    try {
      const { ficha, cuentaAcudiente } = await registro.mutateAsync(cuerpo);
      queryClient.setQueryData(['estudiante', ficha.uuid], ficha);
      await queryClient.invalidateQueries({ queryKey: ['estudiantes'] });
      const estado: EstadoRegistro = { registro: cuentaAcudiente, correo: cuerpo.acudiente.correo };
      navegar(`/estudiantes/${ficha.uuid}`, { replace: true, state: estado });
    } catch (error) {
      setErrorGeneral(aplicarErroresDelServidor(error, setError, CAMPOS));
    }
  });

  const { total: pendientes, delServidor } = resumenErrores(errors);
  const enviando = registro.isPending;

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      {isSubmitted && pendientes > 0 && (
        <Alerta
          nivel="advertencia"
          titulo={
            delServidor > 0
              ? `Hay ${pendientes === 1 ? '1 dato' : `${pendientes} datos`} por corregir`
              : pendientes === 1
                ? 'Falta 1 dato por diligenciar'
                : `Faltan ${pendientes} datos por diligenciar`
          }
        >
          {pendientes === 1 ? 'Está resaltado abajo.' : 'Están resaltados abajo.'}
        </Alerta>
      )}
      {errorGeneral && <Alerta nivel="advertencia" titulo={errorGeneral} />}

      <fieldset className="seccion-formulario">
        <legend className="eyebrow">Datos del estudiante</legend>
        <CampoSelector
          etiqueta="Tipo de documento *"
          error={errors.tipoDocumento?.message}
          {...register('tipoDocumento')}
        >
          {opciones(TIPOS_DOCUMENTO)}
        </CampoSelector>
        <Campo
          etiqueta="Nombres *"
          autoComplete="off"
          error={errors.nombres?.message}
          {...register('nombres')}
        />
        <Campo
          etiqueta="Apellidos *"
          autoComplete="off"
          error={errors.apellidos?.message}
          {...register('apellidos')}
        />
        <Campo
          etiqueta="Número de documento *"
          inputMode="numeric"
          autoComplete="off"
          error={errors.numeroDocumento?.message}
          {...register('numeroDocumento')}
        />
        <Campo
          etiqueta="Fecha de nacimiento"
          type="date"
          error={errors.fechaNacimiento?.message}
          {...register('fechaNacimiento')}
        />
        <CampoSelector
          etiqueta="Grupo *"
          vacio={grupos.isPending ? 'Cargando grupos…' : 'Selecciona el grupo'}
          error={
            errors.grupoId?.message ??
            (grupos.isError ? 'No pudimos cargar los grupos. Recarga la página.' : undefined)
          }
          {...register('grupoId')}
        >
          {grupos.data?.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nombre}
            </option>
          ))}
        </CampoSelector>
      </fieldset>

      <fieldset className="seccion-formulario">
        <legend className="eyebrow">Acudiente titular</legend>
        <Campo
          etiqueta="Nombres *"
          autoComplete="off"
          error={errors.acudiente?.nombres?.message}
          {...register('acudiente.nombres')}
        />
        <Campo
          etiqueta="Apellidos *"
          autoComplete="off"
          error={errors.acudiente?.apellidos?.message}
          {...register('acudiente.apellidos')}
        />
        <CampoSelector
          etiqueta="Tipo de documento *"
          error={errors.acudiente?.tipoDocumento?.message}
          {...register('acudiente.tipoDocumento')}
        >
          {opciones(TIPOS_DOCUMENTO)}
        </CampoSelector>
        <Campo
          etiqueta="Documento *"
          inputMode="numeric"
          autoComplete="off"
          error={errors.acudiente?.numeroDocumento?.message}
          {...register('acudiente.numeroDocumento')}
        />
        <CampoSelector
          etiqueta="Parentesco *"
          vacio="Selecciona el parentesco"
          error={errors.acudiente?.parentesco?.message}
          {...register('acudiente.parentesco')}
        >
          {opciones(PARENTESCOS)}
        </CampoSelector>
        <Campo
          etiqueta="Correo *"
          type="email"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          ayuda={errors.acudiente?.correo ? undefined : 'Allí recibirá el enlace para activar su cuenta.'}
          error={errors.acudiente?.correo?.message}
          {...register('acudiente.correo')}
        />
        <Campo
          etiqueta="Teléfono"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          error={errors.acudiente?.telefono?.message}
          {...register('acudiente.telefono')}
        />
      </fieldset>

      <Alerta nivel="info" titulo="Autorización de tratamiento de datos">
        Requerida por la Ley 1581 de 2012 para registrar datos de un menor.
        <label
          className={`casilla${errors.autorizacionTratamientoDatos ? ' casilla--error' : ''}`}
        >
          <input
            type="checkbox"
            aria-invalid={errors.autorizacionTratamientoDatos ? true : undefined}
            {...register('autorizacionTratamientoDatos')}
          />
          El acudiente autorizó el tratamiento de los datos del menor *
        </label>
        {errors.autorizacionTratamientoDatos && (
          <p className="campo__error">{errors.autorizacionTratamientoDatos.message}</p>
        )}
      </Alerta>

      {/* «Deshabilitado» es un tipo de botón (8:42): visible y apagado mientras haya errores. */}
      <button
        type="submit"
        className={`boton boton--primario${pendientes > 0 ? ' boton--deshabilitado' : ''}`}
        aria-disabled={pendientes > 0 || undefined}
        disabled={enviando}
      >
        {enviando ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  );
}
