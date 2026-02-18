"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format, addWeeks, subWeeks, startOfWeek, addDays, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarCheck, Send, Loader2, ChevronLeft, ChevronRight, Clock, AlertCircle, RotateCcw, CalendarDays, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { DayRow } from "@/components/DayRow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DiaSemana, Fichaje, HistorialDia } from "@/types/intratime";
import { api } from "@/services/api";
import { isBankHoliday, getBankHolidayName, getBankHolidaysInRange, BankHoliday } from "@/lib/holidays";

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

// Horarios por defecto
const HORARIOS_DEFECTO = {
  lunesAJueves: {
    horaEntrada: '09:00',
    horaSalidaComida: '14:00',
    horaEntradaComida: '15:00',
    horaSalida: '18:30',
  },
  viernes: {
    horaEntrada: '09:00',
    horaSalidaComida: '',
    horaEntradaComida: '',
    horaSalida: '15:00',
  },
};

// Calcular horas trabajadas
const calcularHorasTrabajadas = (dia: DiaSemana): number => {
  if (!dia.horaEntrada || !dia.horaSalida) return 0;
  
  const [horaE, minE] = dia.horaEntrada.split(':').map(Number);
  const [horaS, minS] = dia.horaSalida.split(':').map(Number);
  let totalMinutos = (horaS * 60 + minS) - (horaE * 60 + minE);
  
  // Restar pausa de comida si existen ambos valores
  if (dia.horaSalidaComida && dia.horaEntradaComida) {
    const [horaSC, minSC] = dia.horaSalidaComida.split(':').map(Number);
    const [horaEC, minEC] = dia.horaEntradaComida.split(':').map(Number);
    const pausaMinutos = (horaEC * 60 + minEC) - (horaSC * 60 + minSC);
    totalMinutos -= pausaMinutos;
  }
  
  return Math.max(0, totalMinutos / 60);
};

// Generar días de la semana
const generarDiasSemana = (fechaInicio: Date): DiaSemana[] => {
  return DIAS_SEMANA.map((nombreDia, index) => {
    const fecha = addDays(fechaInicio, index);
    const esViernes = index === 4;
    const horario = esViernes ? HORARIOS_DEFECTO.viernes : HORARIOS_DEFECTO.lunesAJueves;
    
    const dia: DiaSemana = {
      dia: nombreDia,
      fecha: format(fecha, 'yyyy-MM-dd'),
      horaEntrada: horario.horaEntrada,
      horaSalidaComida: horario.horaSalidaComida,
      horaEntradaComida: horario.horaEntradaComida,
      horaSalida: horario.horaSalida,
      comidaHabilitada: !esViernes,
      horasTrabajadas: 0,
    };
    
    dia.horasTrabajadas = calcularHorasTrabajadas(dia);
    return dia;
  });
};

export default function ConfiguracionSemanalPage() {
  const [semanaActual, setSemanaActual] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [dias, setDias] = useState<DiaSemana[]>([]);
  const [jornadaSemanal, setJornadaSemanal] = useState(40);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historialSemana, setHistorialSemana] = useState<Record<string, HistorialDia>>({});
  const [isLoadingFichajes, setIsLoadingFichajes] = useState(false);

  // Función para cargar fichajes existentes
  const cargarFichajesExistentes = useCallback(async () => {
    setIsLoadingFichajes(true);
    try {
      // Obtener el mes de la semana actual
      const mesAno = format(semanaActual, 'yyyy-MM');
      const historial = await api.getHistorial(mesAno);
      
      // Crear un mapa de fechas con sus datos completos de fichajes
      const historialMap: Record<string, HistorialDia> = {};
      historial.forEach((dia: HistorialDia) => {
        if (dia.fichajes && dia.fichajes.length > 0) {
          historialMap[dia.fecha] = dia;
        }
      });
      
      setHistorialSemana(historialMap);
    } catch (error) {
      console.error('Error al cargar fichajes existentes:', error);
      setHistorialSemana({});
    } finally {
      setIsLoadingFichajes(false);
    }
  }, [semanaActual]);

  // Inicializar días de la semana
  useEffect(() => {
    setDias(generarDiasSemana(semanaActual));
  }, [semanaActual]);

  // Cargar fichajes existentes para la semana
  useEffect(() => {
    cargarFichajesExistentes();
  }, [cargarFichajesExistentes]);

  // Cargar configuración del usuario
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const usuario = await api.getUserInfo();
        setJornadaSemanal(usuario.jornadaSemanal);
      } catch {
        // Usar valor por defecto
      }
    };
    cargarConfiguracion();
  }, []);

  // Cambiar semana
  const semanaAnterior = () => {
    setSemanaActual(subWeeks(semanaActual, 1));
  };

  const semanaSiguiente = () => {
    setSemanaActual(addWeeks(semanaActual, 1));
  };

  // Reiniciar a valores por defecto
  const reiniciarValores = () => {
    setDias(generarDiasSemana(semanaActual));
    toast.success('Valores reiniciados', {
      description: 'Se han restaurado los horarios por defecto',
    });
  };

  // Actualizar día
  const actualizarDia = useCallback((diaActualizado: DiaSemana) => {
    setDias(prevDias => 
      prevDias.map(dia => {
        if (dia.fecha === diaActualizado.fecha) {
          const nuevoDia = {
            ...diaActualizado,
            // Si es descanso, cuenta como 8 horas, si no, calcula normalmente
            horasTrabajadas: diaActualizado.esDescanso ? 8 : calcularHorasTrabajadas(diaActualizado),
          };
          return nuevoDia;
        }
        return dia;
      })
    );
  }, []);

  // Calcular horas en progreso para un día
  const calcularHorasEnProgreso = (historial: HistorialDia): number => {
    if (!historial?.fichajes?.length) return 0;
    
    // Extraer horas de los fichajes
    let entrada = '';
    let pausaComida = '';
    let regresoComida = '';
    
    historial.fichajes.forEach(f => {
      switch (f.tipoAccion) {
        case 'in':
          entrada = f.horaEntrada || '';
          break;
        case 'pause':
          pausaComida = f.horaSalidaComida || '';
          break;
        case 'resume':
          regresoComida = f.horaEntradaComida || '';
          break;
      }
    });
    
    if (!entrada) return 0;
    
    const ahora = new Date();
    const horaActualMinutos = ahora.getHours() * 60 + ahora.getMinutes();
    
    const [horaE, minE] = entrada.split(':').map(Number);
    const entradaMinutos = horaE * 60 + minE;
    
    let minutosTrabajados = 0;
    
    // Caso 1: Solo entrada
    if (!pausaComida && !regresoComida) {
      minutosTrabajados = horaActualMinutos - entradaMinutos;
    }
    // Caso 2: Entrada + Pausa (sin regreso)
    else if (pausaComida && !regresoComida) {
      const [horaP, minP] = pausaComida.split(':').map(Number);
      const pausaMinutos = horaP * 60 + minP;
      minutosTrabajados = pausaMinutos - entradaMinutos;
    }
    // Caso 3: Entrada + Pausa + Regreso
    else if (pausaComida && regresoComida) {
      const [horaP, minP] = pausaComida.split(':').map(Number);
      const pausaMinutos = horaP * 60 + minP;
      const [horaR, minR] = regresoComida.split(':').map(Number);
      const regresoMinutos = horaR * 60 + minR;
      
      minutosTrabajados = (pausaMinutos - entradaMinutos) + (horaActualMinutos - regresoMinutos);
    }
    
    return Math.max(0, minutosTrabajados / 60);
  };

  // Detectar si un día está en progreso
  const esDiaEnProgreso = (historial?: HistorialDia): boolean => {
    if (!historial?.fichajes?.length) return false;
    const tieneEntrada = historial.fichajes.some(f => f.tipoAccion === 'in');
    const tieneSalida = historial.fichajes.some(f => f.tipoAccion === 'out');
    return tieneEntrada && !tieneSalida;
  };

  // Calcular total de horas
  const totalHoras = dias.reduce((total, dia) => {
    // Si es festivo, sumar 8 horas
    if (isBankHoliday(dia.fecha)) {
      return total + 8;
    }
    // Si tiene fichajes en el historial
    if (historialSemana[dia.fecha]) {
      // Si está en progreso, calcular horas hasta ahora
      if (esDiaEnProgreso(historialSemana[dia.fecha])) {
        return total + calcularHorasEnProgreso(historialSemana[dia.fecha]);
      }
      // Si está completado, usar las horas reales fichadas
      return total + historialSemana[dia.fecha].totalHoras;
    }
    // Si no, usar las horas calculadas de la configuración
    return total + dia.horasTrabajadas;
  }, 0);
  const diferencia = totalHoras - jornadaSemanal;

  // Convertir horas decimales a formato HHhMMm
  const formatearHorasHHMM = (horasDecimales: number): string => {
    const horas = Math.floor(horasDecimales);
    const minutos = Math.round((horasDecimales - horas) * 60);
    return `${horas}h${minutos.toString().padStart(2, '0')}m`;
  };

  // Detectar si toda la semana está completada (todos los días tienen fichajes completos)
  const semanaCompletada = useMemo(() => {
    return dias.every(dia => {
      // Si es festivo o descanso, cuenta como completado
      if (isBankHoliday(dia.fecha) || dia.esDescanso) return true;
      // Si tiene fichajes y tiene salida, está completado
      const historial = historialSemana[dia.fecha];
      if (!historial) return false;
      return historial.fichajes.some(f => f.tipoAccion === 'out');
    });
  }, [dias, historialSemana]);

  // Obtener festivos de la semana
  const festivosDeLaSemana = useMemo((): BankHoliday[] => {
    if (dias.length === 0) return [];
    const fechaInicio = dias[0].fecha;
    const fechaFin = dias[dias.length - 1].fecha;
    return getBankHolidaysInRange(fechaInicio, fechaFin);
  }, [dias]);

  // Tipo para errores por campo
  type CampoHorario = 'horaEntrada' | 'horaSalidaComida' | 'horaEntradaComida' | 'horaSalida';
  type ErroresPorDia = Record<string, Set<CampoHorario>>;

  // Validar horarios de cada día
  const { erroresValidacion, erroresPorDia } = useMemo(() => {
    const errores: string[] = [];
    const erroresCampos: ErroresPorDia = {};
    
    const horaAMinutos = (hora: string): number => {
      if (!hora) return -1;
      const [h, m] = hora.split(':').map(Number);
      return h * 60 + m;
    };

    const marcarError = (fecha: string, campo: CampoHorario) => {
      if (!erroresCampos[fecha]) {
        erroresCampos[fecha] = new Set();
      }
      erroresCampos[fecha].add(campo);
    };

    dias.forEach(dia => {
      // Saltar días de descanso
      if (dia.esDescanso) return;
      
      const entrada = horaAMinutos(dia.horaEntrada);
      const pausaComida = horaAMinutos(dia.horaSalidaComida || '');
      const regresoComida = horaAMinutos(dia.horaEntradaComida || '');
      const salida = horaAMinutos(dia.horaSalida);

      // Priorizar validaciones desde el fichaje más temprano al más tarde
      // El campo que tiene la hora incorrectamente alta es el que tiene el error

      // Validar que entrada sea antes que pausa
      if (entrada >= 0 && pausaComida >= 0 && entrada >= pausaComida) {
        errores.push(`${dia.dia}: La entrada (${dia.horaEntrada}) debe ser antes que la pausa (${dia.horaSalidaComida})`);
        marcarError(dia.fecha, 'horaEntrada');
      }

      // Validar que entrada sea antes que regreso
      if (entrada >= 0 && regresoComida >= 0 && entrada >= regresoComida) {
        errores.push(`${dia.dia}: La entrada (${dia.horaEntrada}) debe ser antes que el regreso (${dia.horaEntradaComida})`);
        marcarError(dia.fecha, 'horaEntrada');
      }

      // Validar que entrada sea antes que salida
      if (entrada >= 0 && salida >= 0 && entrada >= salida) {
        errores.push(`${dia.dia}: La entrada (${dia.horaEntrada}) debe ser antes que la salida (${dia.horaSalida})`);
        marcarError(dia.fecha, 'horaEntrada');
      }

      // Validar que pausa sea antes que regreso
      if (pausaComida >= 0 && regresoComida >= 0 && pausaComida >= regresoComida) {
        errores.push(`${dia.dia}: La pausa (${dia.horaSalidaComida}) debe ser antes que el regreso (${dia.horaEntradaComida})`);
        marcarError(dia.fecha, 'horaSalidaComida');
      }

      // Validar que pausa sea antes que salida (si no hay regreso)
      if (pausaComida >= 0 && salida >= 0 && pausaComida >= salida) {
        errores.push(`${dia.dia}: La pausa (${dia.horaSalidaComida}) debe ser antes que la salida (${dia.horaSalida})`);
        marcarError(dia.fecha, 'horaSalidaComida');
      }

      // Validar que regreso sea antes que salida
      if (regresoComida >= 0 && salida >= 0 && regresoComida >= salida) {
        errores.push(`${dia.dia}: El regreso (${dia.horaEntradaComida}) debe ser antes que la salida (${dia.horaSalida})`);
        marcarError(dia.fecha, 'horaEntradaComida');
      }

      // Validar que si hay pausa debe haber regreso y viceversa
      if (pausaComida >= 0 && regresoComida < 0) {
        errores.push(`${dia.dia}: Falta la hora de regreso de comida`);
        marcarError(dia.fecha, 'horaEntradaComida');
      }
      if (regresoComida >= 0 && pausaComida < 0) {
        errores.push(`${dia.dia}: Falta la hora de pausa de comida`);
        marcarError(dia.fecha, 'horaSalidaComida');
      }
    });

    return { erroresValidacion: errores, erroresPorDia: erroresCampos };
  }, [dias]);

  const hayErrores = erroresValidacion.length > 0;

  // Fichar semana
  const ficharSemana = async () => {
    setIsSubmitting(true);
    
    try {
      // Generar fichajes para cada día
      const fichajes: Fichaje[] = dias.flatMap(dia => {
        // Saltar días de descanso, festivos
        if (dia.esDescanso || isBankHoliday(dia.fecha)) {
          return [];
        }
        
        // Si el día ya tiene CUALQUIER fichaje (completo o en progreso), no volver a fichar
        const historial = historialSemana[dia.fecha];
        if (historial && historial.fichajes && historial.fichajes.length > 0) {
          return [];
        }
        
        const fichajesDia: Fichaje[] = [];
        
        // 1. Fichaje de entrada
        if (dia.horaEntrada) {
          fichajesDia.push({
            fecha: dia.fecha,
            horaEntrada: dia.horaEntrada,
            horaSalida: '',
            tipoAccion: 'in',
          });
        }
        
        // 2. Fichaje de pausa (si existe)
        if (dia.horaSalidaComida && dia.comidaHabilitada) {
          fichajesDia.push({
            fecha: dia.fecha,
            horaEntrada: '',
            horaSalidaComida: dia.horaSalidaComida,
            horaSalida: '',
            tipoAccion: 'pause',
          });
        }
        
        // 3. Fichaje de vuelta de comida (si existe)
        if (dia.horaEntradaComida && dia.comidaHabilitada) {
          fichajesDia.push({
            fecha: dia.fecha,
            horaEntrada: '',
            horaEntradaComida: dia.horaEntradaComida,
            horaSalida: '',
            tipoAccion: 'resume',
          });
        }
        
        // 4. Fichaje de salida
        if (dia.horaSalida) {
          fichajesDia.push({
            fecha: dia.fecha,
            horaEntrada: '',
            horaSalida: dia.horaSalida,
            tipoAccion: 'out',
          });
        }
        
        return fichajesDia;
      });

      await api.crearFichajes(fichajes);
      toast.success('¡Fichajes registrados correctamente!', {
        description: `Se han registrado ${fichajes.length} fichajes para esta semana`,
      });
      
      // Recargar los fichajes para mostrar los días fichados
      await cargarFichajesExistentes();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error al registrar fichajes';
      toast.error('Error al fichar', { description: mensaje });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Cabecera */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CalendarCheck className="size-6 text-orange-600" />
              <div>
                <CardTitle className="text-2xl">Configuración Semanal</CardTitle>
                <CardDescription>
                  Configura tus horarios para la semana del{' '}
                  <span className="font-semibold text-orange-600">
                    {format(semanaActual, 'dd/MM/yyyy', { locale: es })}
                  </span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Navegación de semanas */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={semanaAnterior}>
                  <ChevronLeft className="size-4" />
                  Semana Anterior
                </Button>
                <Button variant="outline" onClick={semanaSiguiente}>
                  Semana Siguiente
                  <ChevronRight className="size-4" />
                </Button>
              </div>
              <Button variant="outline" onClick={reiniciarValores}>
                <RotateCcw className="size-4" />
                Reiniciar valores
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Días de la semana */}
        <div className="space-y-4">
          {dias.map(dia => (
            <DayRow 
              key={dia.fecha} 
              dia={dia} 
              onChange={actualizarDia}
              errores={erroresPorDia[dia.fecha]}
              esFestivo={isBankHoliday(dia.fecha)}
              nombreFestivo={getBankHolidayName(dia.fecha) || undefined}
              historialDia={historialSemana[dia.fecha]}
            />
          ))}
        </div>

        {/* Aviso de días ya fichados */}
        {Object.keys(historialSemana).filter(fecha => 
          dias.some(d => d.fecha === fecha)
        ).length > 0 && (
          <Card className="border border-gray-300 bg-gray-50/50">
            <CardContent>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <CheckCircle className="size-5" />
                <span className="font-semibold">
                  Días con fichajes ({Object.keys(historialSemana).filter(fecha => dias.some(d => d.fecha === fecha)).length})
                </span>
              </div>
              <ul className="space-y-1 text-sm text-gray-600">
                {dias.filter(d => historialSemana[d.fecha]).map((dia) => {
                  const historial = historialSemana[dia.fecha];
                  const tieneEntrada = historial.fichajes.some(f => f.tipoAccion === 'in');
                  const tieneSalida = historial.fichajes.some(f => f.tipoAccion === 'out');
                  const enProgreso = tieneEntrada && !tieneSalida;
                  
                  return (
                    <li key={dia.fecha} className="flex items-start gap-2">
                      <span className="mt-0.5">{enProgreso ? '⏳' : '✓'}</span>
                      <span>
                        <span className="font-medium">{dia.dia}</span>
                        <span className={enProgreso ? "text-amber-600" : "text-gray-500"}>
                          {' '}— {dia.fecha} ({enProgreso ? 'en progreso' : 'completado'})
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-gray-500">
                Los días ya fichados no se pueden modificar desde aquí.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Aviso de festivos de la semana */}
        {festivosDeLaSemana.length > 0 && (
          <Card className="border border-blue-300 bg-blue-50/50">
            <CardContent>
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <CalendarDays className="size-5" />
                <span className="font-semibold">Festivos de la semana ({festivosDeLaSemana.length})</span>
              </div>
              <ul className="space-y-1 text-sm text-blue-700">
                {festivosDeLaSemana.map((festivo) => (
                  <li key={festivo.date} className="flex items-start gap-2">
                    <span className="mt-0.5">🎉</span>
                    <span>
                      <span className="font-medium">{festivo.name}</span>
                      <span className="text-blue-500"> — {format(new Date(festivo.date), "EEEE d 'de' MMMM", { locale: es })}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Resumen y botón de fichar */}
        <Card className={`border ${
          hayErrores
            ? 'border-red-300 bg-red-50/50'
            : semanaCompletada
              ? 'border-green-300 bg-green-50/50'
              : diferencia === 0 
                ? 'border-green-300 bg-green-50/50' 
                : diferencia > 0 
                  ? 'border-red-300 bg-red-50/50' 
                  : 'border-orange-200 bg-orange-50/50'
        }`}>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">
                  Total de horas semanales
                </p>
                <p className={`flex items-center gap-2 text-3xl font-bold ${
                  hayErrores
                    ? 'text-red-600'
                    : semanaCompletada
                      ? 'text-green-600'
                      : diferencia === 0 
                        ? 'text-green-600' 
                        : diferencia > 0 
                          ? 'text-red-600' 
                          : 'text-orange-600'
                }`}>
                  <Clock className="size-6" />
                  {formatearHorasHHMM(totalHoras)}
                </p>
              </div>
              
              <div className="space-y-1 text-right">
                <p className="text-sm text-gray-600">
                  Jornada configurada: <span className="font-semibold">{jornadaSemanal} horas</span>
                </p>
                {semanaCompletada ? (
                  <p className="text-sm font-medium text-green-600">
                    ✓ Semana completada
                  </p>
                ) : diferencia === 0 && !hayErrores ? (
                  <p className="text-sm font-medium text-green-600">
                    ✓ ¡Perfecto! Coincide con tu jornada
                  </p>
                ) : diferencia > 0 && !hayErrores ? (
                  <p className="text-sm font-medium text-red-600">
                    ⚠ Hay {formatearHorasHHMM(diferencia)} horas extra configuradas
                  </p>
                ) : !hayErrores ? (
                  <p className="text-sm font-medium text-orange-600">
                    Faltan {formatearHorasHHMM(Math.abs(diferencia))} horas por configurar
                  </p>
                ) : null}
              </div>
            </div>

            {/* Lista de errores de validación */}
            {hayErrores && (
              <div className="mt-4 border-t border-red-200 pt-4">
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <AlertCircle className="size-5" />
                  <span className="font-semibold">Errores de configuración ({erroresValidacion.length})</span>
                </div>
                <ul className="space-y-1 text-sm text-red-600">
                  {erroresValidacion.map((error, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botón de fichar */}
        <Button
          size="lg"
          className="w-full py-6 text-lg"
          onClick={ficharSemana}
          disabled={isSubmitting || hayErrores}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Registrando fichajes...
            </>
          ) : hayErrores ? (
            <>
              <AlertCircle className="size-5" />
              Corrige los errores para fichar
            </>
          ) : (
            <>
              <Send className="size-5" />
              Fichar toda la semana
            </>
          )}
        </Button>
      </div>
    </Layout>
  );
}
