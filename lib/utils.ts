import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convertir horas decimales a formato HHhMMm
export function formatearHoras(horasDecimales: number): string {
  const horas = Math.floor(horasDecimales);
  const minutos = Math.round((horasDecimales - horas) * 60);
  return `${horas}h${String(minutos).padStart(2, '0')}m`;
}
