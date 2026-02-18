// Tipos TypeScript para la API de Intratime

export interface Usuario {
  id: string;
  usuario: string;
  nombre: string;
  apellidos: string;
  email: string;
  jornadaSemanal: number;
  token?: string;
}

export interface LoginRequest {
  user: string;
  pin: string;
}

export interface LoginResponse {
  USER_TOKEN: string;
  USER_ID: string;
  USER_ACTION: string;
}

export interface Fichaje {
  id?: string;
  fecha: string; // YYYY-MM-DD
  horaEntrada: string; // HH:mm
  horaSalidaComida?: string;
  horaEntradaComida?: string;
  horaSalida: string;
  tipoAccion: 'in' | 'out' | 'pause' | 'resume';
}

export interface DiaSemana {
  dia: string; // 'Lunes', 'Martes', etc.
  fecha: string; // YYYY-MM-DD
  horaEntrada: string;
  horaSalidaComida?: string;
  horaEntradaComida?: string;
  horaSalida: string;
  comidaHabilitada: boolean;
  horasTrabajadas: number;
  esDescanso?: boolean; // Vacaciones o festivo
}

export interface ConfiguracionSemanal {
  semanaInicio: string;
  dias: DiaSemana[];
  totalHorasSemana: number;
}

export interface HistorialDia {
  fecha: string;
  fichajes: Fichaje[];
  totalHoras: number;
}

// Respuesta de la API de Intratime para clockings
export interface IntratimeClocking {
  INOUT_ID: number;
  INOUT_USER_ID: number;
  INOUT_TYPE: number; // 0=entrada, 1=pausa, 2=vuelta, 3=salida
  INOUT_DATE: string; // "2019-03-06 09:18:16"
  INOUT_SOURCE: number;
  INOUT_COORDINATES: string;
  INOUT_USE_SERVER_TIME: number;
  INOUT_PROJECT_ID: number | null;
  INOUT_WORKCENTER_ID?: number;
  INOUT_CLIENT_ID?: number | null;
}

// Tipo de fichaje según Intratime (valores reales de la API)
export const INOUT_TYPE = {
  ENTRADA: 0,
  SALIDA: 1,
  PAUSA: 2,
  VUELTA: 3,
} as const;

// Tipos para el estado de autenticación
export interface AuthState {
  usuario: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
}
