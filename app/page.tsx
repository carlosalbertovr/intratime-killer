"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, LogIn, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!usuario.trim() || !contrasena.trim()) {
      toast.error("Por favor, completa todos los campos");
      return;
    }

    setIsLoading(true);

    try {
      await api.login({ user: usuario, pin: contrasena });
      toast.success("¡Bienvenido! Sesión iniciada correctamente");
      router.push("/semana");
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : "Error al iniciar sesión";
      toast.error(mensaje);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="items-center text-center">
          {/* Icono de reloj */}
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
            <Clock className="size-8 text-white" />
          </div>
          
          {/* Título con gradiente */}
          <CardTitle className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-3xl font-bold text-transparent">
            Intratime Killer
          </CardTitle>
          <CardDescription className="text-base">
            Automatiza tus fichajes laborales de forma sencilla
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usuario">Usuario</Label>
              <Input
                id="usuario"
                type="text"
                placeholder="Tu usuario de Intratime"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contrasena">Contraseña</Label>
              <Input
                id="contrasena"
                type="password"
                placeholder="Tu contraseña"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            {/* Credenciales demo */}
            <div className="rounded-lg bg-orange-50 p-3 text-center text-sm">
              <span className="font-medium text-orange-600">Demo:</span>{" "}
              <span className="text-gray-600">Usuario: </span>
              <code className="rounded bg-orange-100 px-1.5 py-0.5 font-mono text-orange-700">demo</code>
              <span className="text-gray-600">  Contraseña: </span>
              <code className="rounded bg-orange-100 px-1.5 py-0.5 font-mono text-orange-700">1234</code>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="size-5" />
                  Iniciar Sesión
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
