"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Usuario } from "@/types/intratime";
import { api } from "@/services/api";

interface AuthContextType {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: string, pin: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Rutas públicas que no requieren autenticación
const RUTAS_PUBLICAS = ['/'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Verificar autenticación al cargar
  useEffect(() => {
    const verificarAuth = async () => {
      const token = api.getToken();
      
      if (token) {
        try {
          const user = await api.getUserInfo();
          setUsuario(user);
        } catch {
          api.logout();
        }
      }
      
      setIsLoading(false);
    };

    verificarAuth();
  }, []);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!isLoading) {
      const esRutaPublica = RUTAS_PUBLICAS.includes(pathname);
      const token = api.getToken();
      
      if (!token && !esRutaPublica) {
        router.push('/');
      } else if (token && pathname === '/') {
        router.push('/semana');
      }
    }
  }, [isLoading, pathname, router]);

  const login = async (user: string, pin: string) => {
    await api.login({ user, pin });
    const userData = await api.getUserInfo();
    setUsuario(userData);
  };

  const logout = () => {
    api.logout();
    setUsuario(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isAuthenticated: !!api.getToken(),
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
