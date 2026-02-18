"use client";

import { useState, useEffect } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  getDay, 
  addMonths, 
  subMonths,
  isSameDay,
  startOfWeek,
  endOfWeek
} from "date-fns";
import { es } from "date-fns/locale";
import { History, ChevronLeft, ChevronRight, LogIn, LogOut, Pause, Play, Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HistorialDia, Fichaje } from "@/types/intratime";
import { api } from "@/services/api";
import { cn, formatearHoras } from "@/lib/utils";
import { isBankHoliday, getBankHolidayName } from "@/lib/holidays";

// Calcular horas trabajadas hasta el momento (para días en progreso)
const calcularHorasEnProgreso = (fichajes: Fichaje[], horaActual: Date): number => {
  if (!fichajes || fichajes.length === 0) return 0;
  
  // Encontrar los fichajes por tipo
  const entrada = fichajes.find(f => f.tipoAccion === 'in');
  const pausa = fichajes.find(f => f.tipoAccion === 'pause');
  const regreso = fichajes.find(f => f.tipoAccion === 'resume');
  const salida = fichajes.find(f => f.tipoAccion === 'out');
  
  // Si hay salida, el día está completo - no calcular en progreso
  if (salida) return -1;
  
  // Si no hay entrada, no podemos calcular
  if (!entrada || !entrada.horaEntrada) return 0;
  
  const horaActualMinutos = horaActual.getHours() * 60 + horaActual.getMinutes();
  const [horaE, minE] = entrada.horaEntrada.split(':').map(Number);
  const entradaMinutos = horaE * 60 + minE;
  
  let minutosTrabajos = 0;
  
  // Caso 1: Solo entrada - calcular desde entrada hasta ahora
  if (!pausa && !regreso) {
    minutosTrabajos = horaActualMinutos - entradaMinutos;
  }
  // Caso 2: Entrada + Pausa (sin regreso) - calcular desde entrada hasta pausa
  else if (pausa && !regreso) {
    const [horaP, minP] = (pausa.horaSalidaComida || pausa.horaEntrada)?.split(':').map(Number) || [0, 0];
    const pausaMinutos = horaP * 60 + minP;
    minutosTrabajos = pausaMinutos - entradaMinutos;
  }
  // Caso 3: Entrada + Pausa + Regreso - calcular desde entrada hasta pausa + desde regreso hasta ahora
  else if (pausa && regreso) {
    const [horaP, minP] = (pausa.horaSalidaComida || pausa.horaEntrada)?.split(':').map(Number) || [0, 0];
    const pausaMinutos = horaP * 60 + minP;
    const [horaR, minR] = (regreso.horaEntradaComida || regreso.horaEntrada)?.split(':').map(Number) || [0, 0];
    const regresoMinutos = horaR * 60 + minR;
    
    minutosTrabajos = (pausaMinutos - entradaMinutos) + (horaActualMinutos - regresoMinutos);
  }
  
  return Math.max(0, minutosTrabajos / 60);
};

// Verificar si un día está en progreso (tiene entrada pero no salida, y es hoy)
const esDiaEnProgreso = (historial: HistorialDia | undefined, fecha: Date): boolean => {
  if (!historial || !isSameDay(fecha, new Date())) return false;
  const tieneSalida = historial.fichajes.some(f => f.tipoAccion === 'out');
  const tieneEntrada = historial.fichajes.some(f => f.tipoAccion === 'in');
  return tieneEntrada && !tieneSalida;
};

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D', 'Total'];

// Función para obtener icono y texto según tipo de fichaje
const getTipoFichaje = (tipo: string) => {
  switch (tipo) {
    case 'in':
      return { icon: LogIn, text: 'Entrada', color: 'text-green-600', order: 1 };
    case 'pause':
      return { icon: Pause, text: 'Pausa', color: 'text-orange-600', order: 2 };
    case 'resume':
      return { icon: Play, text: 'Vuelta', color: 'text-blue-600', order: 3 };
    case 'out':
      return { icon: LogOut, text: 'Salida', color: 'text-red-600', order: 4 };
    default:
      return { icon: LogIn, text: 'Fichaje', color: 'text-gray-600', order: 99 };
  }
};

// Ordenar fichajes: Entrada, Pausa, Vuelta, Salida
const ordenarFichajes = (fichajes: Fichaje[]) => {
  return [...fichajes].sort((a, b) => {
    return getTipoFichaje(a.tipoAccion).order - getTipoFichaje(b.tipoAccion).order;
  });
};

export default function HistorialPage() {
  const [mesActual, setMesActual] = useState(new Date());
  const [historial, setHistorial] = useState<HistorialDia[]>([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState<HistorialDia | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [horaActual, setHoraActual] = useState(new Date());

  // Actualizar hora actual cada minuto para cálculos en progreso
  useEffect(() => {
    const interval = setInterval(() => {
      setHoraActual(new Date());
    }, 60000); // Cada minuto
    return () => clearInterval(interval);
  }, []);

  // Cargar historial del mes
  useEffect(() => {
    const cargarHistorial = async () => {
      setIsLoading(true);
      try {
        const mesAno = format(mesActual, 'yyyy-MM');
        const datos = await api.getHistorial(mesAno);
        setHistorial(datos);
      } catch (error) {
        console.error('Error al cargar historial:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarHistorial();
  }, [mesActual]);

  // Navegación de meses
  const mesAnterior = () => {
    setMesActual(subMonths(mesActual, 1));
    setDiaSeleccionado(null);
  };

  const mesSiguiente = () => {
    setMesActual(addMonths(mesActual, 1));
    setDiaSeleccionado(null);
  };

  // Generar días del calendario
  const primerDiaMes = startOfMonth(mesActual);
  const ultimoDiaMes = endOfMonth(mesActual);
  const diasMes = eachDayOfInterval({ start: primerDiaMes, end: ultimoDiaMes });
  
  // Calcular offset para el primer día (lunes = 0, domingo = 6)
  const primerDiaSemana = getDay(primerDiaMes);
  const offsetDias = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

  // Buscar fichajes para un día específico
  const buscarFichajes = (fecha: Date): HistorialDia | undefined => {
    const fechaStr = format(fecha, 'yyyy-MM-dd');
    return historial.find(h => h.fecha === fechaStr);
  };

  // Obtener las horas a mostrar para un día (incluye horas en progreso)
  const obtenerHorasDia = (fecha: Date): { horas: number; enProgreso: boolean } => {
    const fichajes = buscarFichajes(fecha);
    if (!fichajes) return { horas: 0, enProgreso: false };
    
    const enProgreso = esDiaEnProgreso(fichajes, fecha);
    if (enProgreso) {
      const horasEnProgreso = calcularHorasEnProgreso(fichajes.fichajes, horaActual);
      return { horas: horasEnProgreso, enProgreso: true };
    }
    
    return { horas: fichajes.totalHoras, enProgreso: false };
  };

  // Calcular horas totales de una semana (incluyendo horas en progreso)
  const calcularHorasSemana = (inicioSemana: Date): number => {
    const finSemana = endOfWeek(inicioSemana, { weekStartsOn: 1 });
    let total = 0;
    
    const diasSemana = eachDayOfInterval({ start: inicioSemana, end: finSemana });
    diasSemana.forEach(dia => {
      const { horas } = obtenerHorasDia(dia);
      total += horas;
    });
    
    return total;
  };

  // Agrupar días por semanas para mostrar el total
  const obtenerSemanasDelMes = (): { dias: (Date | null)[]; total: number }[] => {
    const semanas: { dias: (Date | null)[]; total: number }[] = [];
    let semanaActual: (Date | null)[] = [];
    
    // Añadir espacios vacíos para el offset inicial
    for (let i = 0; i < offsetDias; i++) {
      semanaActual.push(null);
    }
    
    diasMes.forEach((dia, index) => {
      semanaActual.push(dia);
      
      // Si es domingo (fin de semana) o último día del mes
      const diaSemana = getDay(dia);
      if (diaSemana === 0 || index === diasMes.length - 1) {
        // Rellenar con nulls si la semana no está completa
        while (semanaActual.length < 7) {
          semanaActual.push(null);
        }
        
        // Calcular el total de la semana
        const primerDiaReal = semanaActual.find(d => d !== null);
        const inicioSemana = primerDiaReal ? startOfWeek(primerDiaReal, { weekStartsOn: 1 }) : null;
        const total = inicioSemana ? calcularHorasSemana(inicioSemana) : 0;
        
        semanas.push({ dias: semanaActual, total });
        semanaActual = [];
      }
    });
    
    return semanas;
  };

  const semanasDelMes = obtenerSemanasDelMes();

  // Seleccionar día
  const seleccionarDia = (fecha: Date) => {
    const fichajes = buscarFichajes(fecha);
    if (fichajes) {
      setDiaSeleccionado(fichajes);
    } else {
      setDiaSeleccionado(null);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-5xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <History className="size-6 text-orange-600" />
              <div>
                <CardTitle className="text-2xl">Historial de Fichajes</CardTitle>
                <CardDescription>
                  Consulta tus fichajes registrados mes a mes
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Navegación de meses */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={mesAnterior}>
                <ChevronLeft className="size-5" />
              </Button>
              
              <h3 className="text-xl font-semibold capitalize">
                {format(mesActual, 'MMMM yyyy', { locale: es })}
              </h3>
              
              <Button variant="ghost" size="icon" onClick={mesSiguiente}>
                <ChevronRight className="size-5" />
              </Button>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row">
              {/* Calendario */}
              <div className="flex-1">
                {/* Cabecera días de la semana */}
                <div className="mb-2 grid grid-cols-8 gap-1">
                  {DIAS_SEMANA.map((dia, index) => (
                    <div
                      key={dia}
                      className={cn(
                        "py-2 text-center text-sm font-medium",
                        index === 5 || index === 6 ? "text-gray-400" : index === 7 ? "text-orange-600" : "text-gray-600"
                      )}
                    >
                      {dia}
                    </div>
                  ))}
                </div>

                {/* Grid de días por semanas */}
                <div className="space-y-1">
                  {semanasDelMes.map((semana, semanaIndex) => (
                    <div key={semanaIndex} className="grid grid-cols-8 gap-1">
                      {/* Días de la semana */}
                      {semana.dias.map((dia, diaIndex) => {
                        if (!dia) {
                          return <div key={`empty-${semanaIndex}-${diaIndex}`} className="aspect-square" />;
                        }
                        
                        const fichajes = buscarFichajes(dia);
                        const esHoy = isSameDay(dia, new Date());
                        const diaSemana = getDay(dia);
                        const esFinDeSemana = diaSemana === 0 || diaSemana === 6;
                        const estaSeleccionado = diaSeleccionado && 
                          diaSeleccionado.fecha === format(dia, 'yyyy-MM-dd');
                        const fechaStr = format(dia, 'yyyy-MM-dd');
                        const esFestivo = isBankHoliday(fechaStr);
                        const nombreFestivo = getBankHolidayName(fechaStr);

                        const { horas: horasDia, enProgreso } = fichajes ? obtenerHorasDia(dia) : { horas: 0, enProgreso: false };

                        return (
                          <button
                            key={dia.toISOString()}
                            onClick={() => seleccionarDia(dia)}
                            disabled={isLoading}
                            title={esFestivo ? nombreFestivo || 'Festivo' : undefined}
                            className={cn(
                              "relative aspect-square flex flex-col items-center justify-center rounded-lg p-1 text-sm transition-all",
                              esFinDeSemana && "text-gray-400",
                              esHoy && "ring-2 ring-orange-500",
                              // Prioridad: seleccionado > festivo > fichajes > normal
                              estaSeleccionado 
                                ? "bg-gradient-to-br from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                                : esFestivo 
                                  ? "bg-blue-100 hover:bg-blue-200 text-blue-700"
                                  : fichajes 
                                    ? enProgreso
                                      ? "bg-yellow-100 hover:bg-yellow-200"
                                      : "bg-green-100 hover:bg-green-200" 
                                    : "hover:bg-orange-100"
                            )}
                          >
                            <span className="font-medium">{format(dia, 'd')}</span>
                            {fichajes && !esFestivo && (
                              <span className={cn(
                                "text-xs",
                                estaSeleccionado ? "text-white/90" : enProgreso ? "text-yellow-700" : "text-green-700"
                              )}>
                                {formatearHoras(horasDia)}{enProgreso && "..."}
                              </span>
                            )}
                            {esFestivo && !estaSeleccionado && (
                              <span className="text-xs">🎉</span>
                            )}
                          </button>
                        );
                      })}
                      
                      {/* Celda de total semanal */}
                      <div className={cn(
                        "flex aspect-square flex-col items-center justify-center rounded-lg text-sm",
                        semana.total > 0 ? "bg-orange-100" : "bg-gray-50"
                      )}>
                        {semana.total > 0 && (
                          <span className="font-semibold text-orange-600">
                            {formatearHoras(semana.total)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel de detalle */}
              <Card className="h-fit w-full border-orange-100 bg-orange-50/50 lg:w-72">
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="size-6 animate-spin text-orange-600" />
                    </div>
                  ) : diaSeleccionado ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-lg font-semibold capitalize text-gray-900">
                          {format(new Date(diaSeleccionado.fecha), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                        </h4>
                        {(() => {
                          const diaEnProgreso = esDiaEnProgreso(diaSeleccionado, new Date(diaSeleccionado.fecha));
                          const horasMostrar = diaEnProgreso 
                            ? calcularHorasEnProgreso(diaSeleccionado.fichajes, horaActual)
                            : diaSeleccionado.totalHoras;
                          return (
                            <p className="text-sm text-gray-500">
                              Total: <span className={cn("font-semibold", diaEnProgreso ? "text-yellow-600" : "text-orange-600")}>
                                {formatearHoras(horasMostrar)}{diaEnProgreso && " (en progreso)"}
                              </span>
                            </p>
                          );
                        })()}
                      </div>
                      
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">Fichajes del día:</h5>
                        <ul className="space-y-2">
                          {ordenarFichajes(diaSeleccionado.fichajes).map((fichaje, index) => {
                            const tipo = getTipoFichaje(fichaje.tipoAccion);
                            const Icon = tipo.icon;
                            // Obtener la hora del fichaje
                            const hora = fichaje.horaEntrada || fichaje.horaSalida || fichaje.horaSalidaComida || fichaje.horaEntradaComida || '';
                            
                            return (
                              <li 
                                key={fichaje.id || index}
                                className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm"
                              >
                                <Icon className={cn("size-4", tipo.color)} />
                                <span className={cn("text-sm font-medium", tipo.color)}>
                                  {tipo.text}
                                </span>
                                <span className="ml-auto text-sm font-mono text-gray-600">
                                  {hora}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <h4 className="font-semibold text-gray-700">Selecciona un día</h4>
                      <p className="mt-1 text-sm text-gray-500">
                        Haz clic en un día para ver los fichajes
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
