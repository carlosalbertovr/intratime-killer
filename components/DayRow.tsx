"use client";

import { Clock, CheckCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DiaSemana, HistorialDia, INOUT_TYPE } from "@/types/intratime";
import { cn } from "@/lib/utils";

type CampoHorario = 'horaEntrada' | 'horaSalidaComida' | 'horaEntradaComida' | 'horaSalida';

interface DayRowProps {
  dia: DiaSemana;
  onChange: (dia: DiaSemana) => void;
  errores?: Set<CampoHorario>;
  esFestivo?: boolean;
  nombreFestivo?: string;
  historialDia?: HistorialDia;
}

// Extraer horas de los fichajes existentes
const extraerHorasFichajes = (historial?: HistorialDia) => {
  if (!historial?.fichajes?.length) return null;
  
  const fichajes = historial.fichajes;
  let entrada = '';
  let salida = '';
  let pausaComida = '';
  let regresoComida = '';
  
  fichajes.forEach(f => {
    // Cada fichaje tiene la hora en el campo correspondiente a su tipo
    switch (f.tipoAccion) {
      case 'in':
        entrada = f.horaEntrada || '';
        break;
      case 'out':
        salida = f.horaSalida || '';
        break;
      case 'pause':
        pausaComida = f.horaSalidaComida || '';
        break;
      case 'resume':
        regresoComida = f.horaEntradaComida || '';
        break;
    }
  });
  
  return { entrada, salida, pausaComida, regresoComida };
};

// Detectar si el día está en progreso (tiene entrada pero no salida)
const detectarEnProgreso = (historial?: HistorialDia): boolean => {
  if (!historial?.fichajes?.length) return false;
  
  const tieneEntrada = historial.fichajes.some(f => f.tipoAccion === 'in');
  const tieneSalida = historial.fichajes.some(f => f.tipoAccion === 'out');
  
  return tieneEntrada && !tieneSalida;
};

// Calcular horas trabajadas hasta el momento (para días en progreso)
const calcularHorasEnProgreso = (historial?: HistorialDia): number => {
  if (!historial?.fichajes?.length) return 0;
  
  const horasFichadas = extraerHorasFichajes(historial);
  if (!horasFichadas || !horasFichadas.entrada) return 0;
  
  const ahora = new Date();
  const horaActualMinutos = ahora.getHours() * 60 + ahora.getMinutes();
  
  const [horaE, minE] = horasFichadas.entrada.split(':').map(Number);
  const entradaMinutos = horaE * 60 + minE;
  
  let minutosTrabajados = 0;
  
  // Caso 1: Solo entrada - calcular desde entrada hasta ahora
  if (!horasFichadas.pausaComida && !horasFichadas.regresoComida) {
    minutosTrabajados = horaActualMinutos - entradaMinutos;
  }
  // Caso 2: Entrada + Pausa (sin regreso) - calcular desde entrada hasta pausa
  else if (horasFichadas.pausaComida && !horasFichadas.regresoComida) {
    const [horaP, minP] = horasFichadas.pausaComida.split(':').map(Number);
    const pausaMinutos = horaP * 60 + minP;
    minutosTrabajados = pausaMinutos - entradaMinutos;
  }
  // Caso 3: Entrada + Pausa + Regreso - calcular desde entrada hasta pausa + desde regreso hasta ahora
  else if (horasFichadas.pausaComida && horasFichadas.regresoComida) {
    const [horaP, minP] = horasFichadas.pausaComida.split(':').map(Number);
    const pausaMinutos = horaP * 60 + minP;
    const [horaR, minR] = horasFichadas.regresoComida.split(':').map(Number);
    const regresoMinutos = horaR * 60 + minR;
    
    minutosTrabajados = (pausaMinutos - entradaMinutos) + (horaActualMinutos - regresoMinutos);
  }
  
  return Math.max(0, minutosTrabajados / 60);
};

export function DayRow({ dia, onChange, errores, esFestivo, nombreFestivo, historialDia }: DayRowProps) {
  const tieneError = (campo: CampoHorario) => errores?.has(campo) ?? false;
  const esDescansoOFestivo = dia.esDescanso || esFestivo;
  
  // Extraer datos de fichajes existentes
  const horasFichadas = extraerHorasFichajes(historialDia);
  const yaFichado = !!horasFichadas;
  const enProgreso = detectarEnProgreso(historialDia);
  const esBloqueado = esDescansoOFestivo || yaFichado;
  const handleTimeChange = (
    campo: 'horaEntrada' | 'horaSalidaComida' | 'horaEntradaComida' | 'horaSalida',
    valor: string
  ) => {
    onChange({
      ...dia,
      [campo]: valor,
    });
  };

  const handleDescansoChange = (checked: boolean) => {
    onChange({
      ...dia,
      esDescanso: checked,
      // Si es descanso, cuenta como 8 horas
      horasTrabajadas: checked ? 8 : calcularHoras(),
    });
  };

  const calcularHoras = (): number => {
    if (!dia.horaEntrada || !dia.horaSalida) return 0;
    
    const [horaE, minE] = dia.horaEntrada.split(':').map(Number);
    const [horaS, minS] = dia.horaSalida.split(':').map(Number);
    let totalMinutos = (horaS * 60 + minS) - (horaE * 60 + minE);
    
    if (dia.horaSalidaComida && dia.horaEntradaComida) {
      const [horaSC, minSC] = dia.horaSalidaComida.split(':').map(Number);
      const [horaEC, minEC] = dia.horaEntradaComida.split(':').map(Number);
      const pausaMinutos = (horaEC * 60 + minEC) - (horaSC * 60 + minSC);
      totalMinutos -= pausaMinutos;
    }
    
    return Math.max(0, totalMinutos / 60);
  };

  const formatearHoras = (horas: number): string => {
    const horasEnteras = Math.floor(horas);
    const minutos = Math.round((horas - horasEnteras) * 60);
    return `${horasEnteras}h${String(minutos).padStart(2, '0')}m`;
  };

  return (
    <Card className={cn(
      "border-l-4 py-4 transition-colors",
      enProgreso
        ? "border-l-amber-500 bg-amber-50"
        : yaFichado
          ? "border-l-green-500 bg-green-50"
          : esFestivo 
            ? "border-l-blue-500 bg-blue-50"
            : dia.esDescanso 
              ? "border-l-gray-400 bg-gray-100" 
              : "border-l-orange-500"
    )}>
      <div className="grid gap-4 px-4 md:grid-cols-6 md:gap-4 md:px-6">
        {/* Información del día */}
        <div className="flex flex-col justify-center">
          <h3 className={cn(
            "text-lg font-semibold",
            enProgreso ? "text-amber-700" : yaFichado ? "text-green-700" : esFestivo ? "text-blue-700" : dia.esDescanso ? "text-gray-500" : "text-gray-900"
          )}>{dia.dia}</h3>
          <p className="text-sm text-gray-500">{dia.fecha}</p>
          {esFestivo && nombreFestivo && (
            <p className="text-xs font-medium text-blue-600">{nombreFestivo}</p>
          )}
          {enProgreso && (
            <p className="flex items-center gap-1 text-xs font-medium text-amber-600">
              <Loader2 className="size-3 animate-spin" />
              En progreso
            </p>
          )}
          {yaFichado && !enProgreso && (
            <p className="flex items-center gap-1 text-xs font-medium text-green-600">
              <CheckCircle className="size-3" />
              Completado
            </p>
          )}
          <div className={cn(
            "mt-1 flex items-center gap-1 text-sm font-medium",
            enProgreso ? "text-amber-600" : yaFichado ? "text-green-600" : esFestivo ? "text-blue-600" : dia.esDescanso ? "text-gray-500" : "text-orange-600"
          )}>
            <Clock className="size-4" />
            {formatearHoras(
              esDescansoOFestivo 
                ? 8 
                : enProgreso 
                  ? calcularHorasEnProgreso(historialDia)
                  : (historialDia?.totalHoras || dia.horasTrabajadas)
            )}
          </div>
        </div>

        {/* Inputs de tiempo */}
        <div className="space-y-1.5">
          <Label htmlFor={`entrada-${dia.fecha}`} className={cn(
            "text-xs",
            tieneError('horaEntrada') ? "text-red-500" : "text-gray-500"
          )}>
            Entrada
          </Label>
          <Input
            id={`entrada-${dia.fecha}`}
            type="time"
            value={yaFichado ? (horasFichadas?.entrada || '') : (esDescansoOFestivo ? '' : dia.horaEntrada)}
            onChange={(e) => handleTimeChange('horaEntrada', e.target.value)}
            disabled={esBloqueado}
            className={cn(
              "bg-gray-50", 
              esBloqueado && (enProgreso ? "bg-amber-100 opacity-75" : yaFichado ? "bg-green-100 opacity-75" : "opacity-50"),
              tieneError('horaEntrada') && "border-red-500 bg-red-50 text-red-700"
            )}
            placeholder="--:--"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`pausa-${dia.fecha}`} className={cn(
            "text-xs",
            tieneError('horaSalidaComida') ? "text-red-500" : "text-gray-500"
          )}>
            Pausa Comida
          </Label>
          <Input
            id={`pausa-${dia.fecha}`}
            type="time"
            value={yaFichado ? (horasFichadas?.pausaComida || '') : (esDescansoOFestivo ? '' : (dia.horaSalidaComida || ''))}
            onChange={(e) => handleTimeChange('horaSalidaComida', e.target.value)}
            disabled={esBloqueado}
            className={cn(
              "bg-gray-50", 
              esBloqueado && (enProgreso ? "bg-amber-100 opacity-75" : yaFichado ? "bg-green-100 opacity-75" : "opacity-50"),
              tieneError('horaSalidaComida') && "border-red-500 bg-red-50 text-red-700"
            )}
            placeholder="--:--"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`regreso-${dia.fecha}`} className={cn(
            "text-xs",
            tieneError('horaEntradaComida') ? "text-red-500" : "text-gray-500"
          )}>
            Regreso Comida
          </Label>
          <Input
            id={`regreso-${dia.fecha}`}
            type="time"
            value={yaFichado ? (horasFichadas?.regresoComida || '') : (esDescansoOFestivo ? '' : (dia.horaEntradaComida || ''))}
            onChange={(e) => handleTimeChange('horaEntradaComida', e.target.value)}
            disabled={esBloqueado}
            className={cn(
              "bg-gray-50", 
              esBloqueado && (enProgreso ? "bg-amber-100 opacity-75" : yaFichado ? "bg-green-100 opacity-75" : "opacity-50"),
              tieneError('horaEntradaComida') && "border-red-500 bg-red-50 text-red-700"
            )}
            placeholder="--:--"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`salida-${dia.fecha}`} className={cn(
            "text-xs",
            tieneError('horaSalida') ? "text-red-500" : "text-gray-500"
          )}>
            Salida
          </Label>
          <Input
            id={`salida-${dia.fecha}`}
            type="time"
            value={yaFichado ? (horasFichadas?.salida || '') : (esDescansoOFestivo ? '' : dia.horaSalida)}
            onChange={(e) => handleTimeChange('horaSalida', e.target.value)}
            disabled={esBloqueado}
            className={cn(
              "bg-gray-50", 
              esBloqueado && (enProgreso ? "bg-amber-100 opacity-75" : yaFichado ? "bg-green-100 opacity-75" : "opacity-50"),
              tieneError('horaSalida') && "border-red-500 bg-red-50 text-red-700"
            )}
            placeholder="--:--"
          />
        </div>

        {/* Switch de descanso */}
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">
            {enProgreso ? "Estado" : yaFichado ? "Fichado" : esFestivo ? "Festivo" : "Descanso"}
          </Label>
          <div className="flex h-9 items-center gap-2">
            <Switch
              checked={esBloqueado || false}
              onCheckedChange={handleDescansoChange}
              disabled={esFestivo || yaFichado}
              className={cn(
                "scale-125",
                enProgreso
                  ? "data-[state=checked]:bg-amber-500"
                  : yaFichado
                    ? "data-[state=checked]:bg-green-500"
                    : esFestivo 
                      ? "data-[state=checked]:bg-blue-500" 
                      : "data-[state=checked]:bg-orange-500"
              )}
            />
            <span className={cn(
              "text-sm",
              esBloqueado ? (enProgreso ? "text-amber-600 font-medium" : yaFichado ? "text-green-600 font-medium" : esFestivo ? "text-blue-600 font-medium" : "text-gray-600 font-medium") : "text-gray-400"
            )}>
              {enProgreso ? "⏳" : yaFichado ? "✓" : esFestivo ? "Sí" : (dia.esDescanso ? "Sí" : "No")}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
