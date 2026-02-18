import bankHolidays2026 from '@/data/bank-holidays-2026.json';

export interface BankHoliday {
  date: string;
  name: string;
}

// Obtener todos los festivos
export const getBankHolidays = (): BankHoliday[] => {
  return bankHolidays2026.holidays;
};

// Verificar si una fecha es festivo
export const isBankHoliday = (fecha: string): boolean => {
  return bankHolidays2026.holidays.some(h => h.date === fecha);
};

// Obtener el nombre del festivo para una fecha
export const getBankHolidayName = (fecha: string): string | null => {
  const holiday = bankHolidays2026.holidays.find(h => h.date === fecha);
  return holiday ? holiday.name : null;
};

// Obtener festivos dentro de un rango de fechas
export const getBankHolidaysInRange = (fechaInicio: string, fechaFin: string): BankHoliday[] => {
  return bankHolidays2026.holidays.filter(h => h.date >= fechaInicio && h.date <= fechaFin);
};
