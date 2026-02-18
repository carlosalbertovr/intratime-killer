# 🕐 Intratime Killer

Aplicación web para automatizar los fichajes laborales de forma sencilla. Permite configurar horarios semanales y registrar fichajes automáticamente en Intratime.

![Intratime Killer](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38B2AC?style=flat-square&logo=tailwind-css)

## ✨ Características

- 📅 **Configuración Semanal**: Configura tus horarios de entrada, salida y pausas para toda la semana
- 📊 **Historial de Fichajes**: Consulta tus fichajes registrados en un calendario interactivo
- ⚙️ **Configuración de Usuario**: Personaliza tu jornada laboral semanal
- 🔐 **Autenticación**: Sistema de login con credenciales de Intratime
- 📱 **Responsive**: Diseño adaptable a cualquier dispositivo

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ 
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/intratime-killer.git
cd intratime-killer

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Credenciales Demo

Para probar la aplicación sin conectar a Intratime:
- **Usuario**: `demo`
- **Contraseña**: `1234`

## 📁 Estructura del Proyecto

```
├── app/                    # Páginas de Next.js (App Router)
│   ├── page.tsx           # Login
│   ├── semana/            # Configuración semanal
│   ├── historial/         # Historial de fichajes
│   └── usuario/           # Configuración de usuario
├── components/            # Componentes React
│   ├── ui/               # Componentes shadcn/ui
│   ├── Header.tsx        # Navegación
│   ├── Layout.tsx        # Layout principal
│   └── DayRow.tsx        # Fila de día semanal
├── contexts/             # Contextos React
│   └── AuthContext.tsx   # Autenticación
├── services/             # Servicios y API
│   └── api.ts           # Cliente API Intratime
├── types/                # Tipos TypeScript
│   └── intratime.ts     # Interfaces
└── lib/                  # Utilidades
    └── utils.ts         # Helpers
```

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS v4
- **Componentes UI**: shadcn/ui
- **Iconos**: Lucide React
- **Fechas**: date-fns
- **Notificaciones**: Sonner
- **Fuentes**: Inter & Inter Tight

## 📚 API de Intratime

La aplicación está preparada para conectarse a la API de Intratime:
- Documentación: https://apidocs.intratime.es/

## 🔧 Comandos Disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Compilar para producción
npm run start    # Iniciar servidor de producción
npm run lint     # Ejecutar linter
```

## 📄 Licencia

MIT
