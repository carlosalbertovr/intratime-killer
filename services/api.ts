// Cliente API para Intratime
import { 
  LoginRequest, 
  LoginResponse, 
  Usuario, 
  Fichaje, 
  HistorialDia,
  IntratimeClocking,
  INOUT_TYPE 
} from '@/types/intratime';

// Datos mock para desarrollo
export const mockUsuario: Usuario = {
  id: '1',
  usuario: 'demo',
  nombre: 'Juan',
  apellidos: 'Pérez García',
  email: 'juan.perez@empresa.com',
  jornadaSemanal: 40,
};

// Simular delay de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Datos mock del historial
const generarHistorialMock = (mesAno: string): HistorialDia[] => {
  const [ano, mes] = mesAno.split('-').map(Number);
  const diasEnMes = new Date(ano, mes, 0).getDate();
  const historial: HistorialDia[] = [];

  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fecha = new Date(ano, mes - 1, dia);
    const diaSemana = fecha.getDay();
    
    // Solo días laborables (lunes a viernes)
    if (diaSemana >= 1 && diaSemana <= 5) {
      // Simular que algunos días tienen fichajes
      const tieneFichajes = Math.random() > 0.3;
      
      if (tieneFichajes) {
        const esViernes = diaSemana === 5;
        const horas = esViernes ? 6 : 8;
        
        historial.push({
          fecha: `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
          fichajes: [
            {
              fecha: `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
              horaEntrada: '09:00',
              horaSalidaComida: esViernes ? undefined : '14:00',
              horaEntradaComida: esViernes ? undefined : '15:00',
              horaSalida: esViernes ? '15:00' : '18:00',
              tipoAccion: 'in',
            }
          ],
          totalHoras: horas,
        });
      }
    }
  }

  return historial;
};

class IntratimeAPI {
  private baseURL: string = 'https://newapi.intratime.es';
  private token: string | null = null;

  constructor() {
    // Recuperar token de localStorage si existe
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('intratime_token');
    }
  }

  setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('intratime_token', token);
    }
  }

  clearToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('intratime_token');
      localStorage.removeItem('intratime_user');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  // Headers requeridos por la API de Intratime
  private getIntratimeHeaders(includeToken: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.apiintratime.v1+json',
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
    };
    
    if (includeToken && this.token) {
      headers['token'] = this.token;
    }
    
    return headers;
  }

  private async request<T>(
    endpoint: string, 
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        ...this.getIntratimeHeaders(true),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error en la petición');
    }

    return response.json();
  }

  // Login usando la API real de Intratime (a través del proxy de Next.js)
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Modo desarrollo: aceptar credenciales demo
    if (credentials.user === 'demo' && credentials.pin === '1234') {
      await delay(800);
      const response: LoginResponse = {
        USER_TOKEN: 'mock-token-' + Date.now(),
        USER_ID: '1',
        USER_ACTION: 'login',
      };
      
      this.setToken(response.USER_TOKEN);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('intratime_user', JSON.stringify(mockUsuario));
      }
      
      return response;
    }

    // Usar el proxy de Next.js para evitar CORS
    try {
      const formData = new FormData();
      formData.append('user', credentials.user);
      formData.append('pin', credentials.pin);

      // Llamar al proxy local en lugar de la API de Intratime directamente
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error de login:', errorData);
        throw new Error(errorData.error || 'Usuario o contraseña incorrectos');
      }

      const data = await response.json();
      
      // Guardar token del usuario
      this.setToken(data.USER_TOKEN);
      
      // Guardar información del usuario
      const usuario: Usuario = {
        id: String(data.USER_ID),
        usuario: data.USER_USERNAME || credentials.user,
        nombre: data.USER_NAME?.split(' ')[0] || '',
        apellidos: data.USER_NAME?.split(' ').slice(1).join(' ') || '',
        email: data.USER_EMAIL || credentials.user,
        jornadaSemanal: data.USER_WORKING_TIME || 40,
        token: data.USER_TOKEN,
      };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('intratime_user', JSON.stringify(usuario));
      }

      return {
        USER_TOKEN: data.USER_TOKEN,
        USER_ID: String(data.USER_ID),
        USER_ACTION: 'login',
      };
    } catch (error) {
      console.error('Error en login:', error);
      throw new Error('Usuario o contraseña incorrectos');
    }
  }

  async getUserInfo(): Promise<Usuario> {
    await delay(300);

    // Recuperar de localStorage si existe
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('intratime_user');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
    }

    return mockUsuario;
  }

  async updateJornadaSemanal(horas: number): Promise<void> {
    await delay(500);

    // Actualizar en localStorage
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('intratime_user');
      if (storedUser) {
        const usuario = JSON.parse(storedUser);
        usuario.jornadaSemanal = horas;
        localStorage.setItem('intratime_user', JSON.stringify(usuario));
      }
    }
  }

  // Añadir variación aleatoria a la hora: ±5 minutos y segundos aleatorios
  private addRandomDeviation(fecha: string, hora: string): string {
    // Parsear fecha y hora
    const [year, month, day] = fecha.split('-').map(Number);
    const [hours, minutes] = hora.split(':').map(Number);
    
    // Crear fecha base
    const date = new Date(year, month - 1, day, hours, minutes, 0);
    
    // Añadir desviación aleatoria: -5 a +5 minutos
    const minutesDeviation = Math.floor(Math.random() * 11) - 5; // -5 a +5
    date.setMinutes(date.getMinutes() + minutesDeviation);
    
    // Añadir segundos aleatorios: 0 a 59
    const randomSeconds = Math.floor(Math.random() * 60);
    date.setSeconds(randomSeconds);
    
    // Formatear como "YYYY-MM-DD HH:mm:ss"
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  }

  async crearFichajes(fichajes: Fichaje[]): Promise<void> {
    if (!this.token) {
      throw new Error('No hay sesión activa');
    }

    // Si es modo demo, solo mostrar en consola
    if (this.token.startsWith('mock-token')) {
      await delay(1000);
      console.log('Fichajes a crear (modo demo):', fichajes);
      return;
    }

    try {
      // Procesar cada fichaje individualmente
      for (const fichaje of fichajes) {
        // Determinar el tipo de acción según el campo que tenga valor
        let userAction: string;
        let timestamp: string;
        
        if (fichaje.horaEntrada && fichaje.tipoAccion === 'in') {
          userAction = '0'; // Entrada
          timestamp = this.addRandomDeviation(fichaje.fecha, fichaje.horaEntrada);
        } else if (fichaje.horaSalidaComida && fichaje.tipoAccion === 'pause') {
          userAction = '2'; // Pausa
          timestamp = this.addRandomDeviation(fichaje.fecha, fichaje.horaSalidaComida);
        } else if (fichaje.horaEntradaComida && fichaje.tipoAccion === 'resume') {
          userAction = '3'; // Vuelta
          timestamp = this.addRandomDeviation(fichaje.fecha, fichaje.horaEntradaComida);
        } else if (fichaje.horaSalida && fichaje.tipoAccion === 'out') {
          userAction = '1'; // Salida
          timestamp = this.addRandomDeviation(fichaje.fecha, fichaje.horaSalida);
        } else {
          console.warn('Fichaje sin tipo de acción válido:', fichaje);
          continue;
        }

        // Crear FormData según la API de Intratime
        const formData = new FormData();
        formData.append('user_action', userAction);
        formData.append('user_timestamp', timestamp);
        formData.append('user_use_server_time', 'false');
        
        // Coordenadas GPS opcionales (se pueden dejar vacías o configurar por defecto)
        // formData.append('user_gps_coordinates', '42.8157447,-1.7200615,12');
        
        // Proyecto opcional
        formData.append('user_project', '');
        
        // Gasto opcional
        formData.append('expense_amount', '0');

        // Mostrar en consola lo que se enviaría
        console.log('====================================');
        console.log('POST https://newapi.intratime.es/api/user/clocking');
        console.log('Headers:', {
          'Accept': 'application/vnd.apiintratime.v1+json',
          'token': this.token,
        });
        console.log('Body (FormData):');
        console.log('  user_action:', userAction, `(${['Entrada', 'Salida', 'Pausa', 'Vuelta'][parseInt(userAction)]})`);
        console.log('  user_timestamp:', timestamp);
        console.log('  user_use_server_time:', 'false');
        console.log('  user_project:', '');
        console.log('  expense_amount:', '0');
        console.log('====================================');

        // Llamada real a la API a través del proxy local
        const response = await fetch('/api/clockings', {
          method: 'POST',
          headers: {
            'token': this.token,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Error al crear fichaje:', errorData);
          throw new Error(`Error al crear fichaje ${userAction} para ${fichaje.fecha}: ${errorData}`);
        }

        const data = await response.json();
        console.log('Fichaje creado exitosamente:', data);

        // Delay entre fichajes para no saturar la API
        await delay(500);
      }

      console.log(`✅ Se procesaron ${fichajes.length} fichajes correctamente`);
    } catch (error) {
      console.error('Error al crear fichajes:', error);
      throw error;
    }
  }

  // Obtener fichajes reales de Intratime
  async getClockings(from: string, to?: string): Promise<IntratimeClocking[]> {
    if (!this.token) {
      throw new Error('No hay sesión activa');
    }

    // Si es modo demo, devolver datos mock
    if (this.token.startsWith('mock-token')) {
      return [];
    }

    try {
      const params = new URLSearchParams();
      params.append('from', from);
      if (to) params.append('to', to);
      params.append('type', '0,1,2,3');

      const response = await fetch(`/api/clockings?${params.toString()}`, {
        method: 'GET',
        headers: {
          'token': this.token,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener fichajes');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener clockings:', error);
      throw error;
    }
  }

  // Obtener historial agrupado por día
  async getHistorial(mesAno: string): Promise<HistorialDia[]> {
    // Si es modo demo, devolver datos mock
    if (this.token?.startsWith('mock-token')) {
      await delay(500);
      return generarHistorialMock(mesAno);
    }

    try {
      // Calcular fechas del mes
      const [ano, mes] = mesAno.split('-').map(Number);
      const primerDia = `${mesAno}-01 00:00:00`;
      const ultimoDia = new Date(ano, mes, 0).getDate();
      const ultimaFecha = `${mesAno}-${String(ultimoDia).padStart(2, '0')} 23:59:59`;

      // Obtener fichajes del mes
      const clockings = await this.getClockings(primerDia, ultimaFecha);

      // Agrupar fichajes por día
      const fichajesPorDia: Map<string, IntratimeClocking[]> = new Map();
      
      for (const clocking of clockings) {
        const fecha = clocking.INOUT_DATE.split(' ')[0]; // Extraer solo la fecha
        if (!fichajesPorDia.has(fecha)) {
          fichajesPorDia.set(fecha, []);
        }
        fichajesPorDia.get(fecha)!.push(clocking);
      }

      // Convertir a formato HistorialDia
      const historial: HistorialDia[] = [];
      
      for (const [fecha, clockingsDia] of fichajesPorDia) {
        // Ordenar por hora
        clockingsDia.sort((a, b) => 
          new Date(a.INOUT_DATE).getTime() - new Date(b.INOUT_DATE).getTime()
        );

        // Calcular horas trabajadas: (Salida - Entrada) - (Vuelta - Pausa)
        let horaEntrada: Date | null = null;
        let horaSalida: Date | null = null;
        let horaPausa: Date | null = null;
        let horaVuelta: Date | null = null;

        for (const clocking of clockingsDia) {
          const hora = new Date(clocking.INOUT_DATE);
          
          // Usar el primer fichaje de entrada y el último de salida
          if (clocking.INOUT_TYPE === INOUT_TYPE.ENTRADA) {
            if (!horaEntrada || hora < horaEntrada) horaEntrada = hora;
          } else if (clocking.INOUT_TYPE === INOUT_TYPE.PAUSA) {
            horaPausa = hora;
          } else if (clocking.INOUT_TYPE === INOUT_TYPE.VUELTA) {
            horaVuelta = hora;
          } else if (clocking.INOUT_TYPE === INOUT_TYPE.SALIDA) {
            if (!horaSalida || hora > horaSalida) horaSalida = hora;
          }
        }

        // Calcular tiempo total
        let totalMinutos = 0;
        
        if (horaEntrada && horaSalida) {
          // Tiempo total desde entrada hasta salida
          totalMinutos = (horaSalida.getTime() - horaEntrada.getTime()) / (1000 * 60);
          
          // Restar tiempo de pausa SOLO si existen ambos: pausa y vuelta
          if (horaPausa && horaVuelta) {
            const tiempoPausa = (horaVuelta.getTime() - horaPausa.getTime()) / (1000 * 60);
            totalMinutos -= tiempoPausa;
          }
        }
        
        // Asegurar que no sea negativo
        totalMinutos = Math.max(0, totalMinutos);

        // Convertir fichajes al formato interno
        const fichajes: Fichaje[] = clockingsDia.map(c => {
          const hora = c.INOUT_DATE.split(' ')[1].substring(0, 5); // HH:mm
          let tipoAccion: 'in' | 'out' | 'pause' | 'resume' = 'in';
          
          switch (c.INOUT_TYPE) {
            case INOUT_TYPE.ENTRADA: tipoAccion = 'in'; break;
            case INOUT_TYPE.PAUSA: tipoAccion = 'pause'; break;
            case INOUT_TYPE.VUELTA: tipoAccion = 'resume'; break;
            case INOUT_TYPE.SALIDA: tipoAccion = 'out'; break;
          }

          return {
            id: String(c.INOUT_ID),
            fecha: fecha,
            horaEntrada: tipoAccion === 'in' ? hora : '',
            horaSalidaComida: tipoAccion === 'pause' ? hora : '',
            horaEntradaComida: tipoAccion === 'resume' ? hora : '',
            horaSalida: tipoAccion === 'out' ? hora : '',
            tipoAccion,
          };
        });

        historial.push({
          fecha,
          fichajes,
          totalHoras: Math.round((totalMinutos / 60) * 100) / 100,
        });
      }

      // Ordenar por fecha descendente
      historial.sort((a, b) => b.fecha.localeCompare(a.fecha));

      return historial;
    } catch (error) {
      console.error('Error al obtener historial:', error);
      // Fallback a datos mock en caso de error
      return generarHistorialMock(mesAno);
    }
  }

  logout(): void {
    this.clearToken();
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const api = new IntratimeAPI();
