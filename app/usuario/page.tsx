"use client";

import { useState, useEffect } from "react";
import { User, Mail, Briefcase, Clock, Save, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Usuario } from "@/types/intratime";
import { api, mockUsuario } from "@/services/api";

export default function ConfiguracionUsuarioPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [jornadaSemanal, setJornadaSemanal] = useState(40);
  const [jornadaOriginal, setJornadaOriginal] = useState(40);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar información del usuario
  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        const datos = await api.getUserInfo();
        setUsuario(datos);
        setJornadaSemanal(datos.jornadaSemanal);
        setJornadaOriginal(datos.jornadaSemanal);
      } catch {
        setUsuario(mockUsuario);
        setJornadaSemanal(mockUsuario.jornadaSemanal);
        setJornadaOriginal(mockUsuario.jornadaSemanal);
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarUsuario();
  }, []);

  // Restablecer valores
  const restablecer = () => {
    setJornadaSemanal(jornadaOriginal);
  };

  // Guardar cambios
  const guardarCambios = async () => {
    setIsSaving(true);
    
    try {
      await api.updateJornadaSemanal(jornadaSemanal);
      setJornadaOriginal(jornadaSemanal);
      toast.success('Configuración guardada', {
        description: `Tu jornada semanal se ha actualizado a ${jornadaSemanal} horas`,
      });
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error al guardar';
      toast.error('Error al guardar', { description: mensaje });
    } finally {
      setIsSaving(false);
    }
  };

  const hayCambios = jornadaSemanal !== jornadaOriginal;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-orange-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="size-6 text-orange-600" />
              <div>
                <CardTitle className="text-2xl">Configuración de Usuario</CardTitle>
                <CardDescription>
                  Gestiona tu información personal y preferencias
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Información Personal */}
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Briefcase className="size-5 text-gray-600" />
                Información Personal
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="usuario">Usuario</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="usuario"
                      type="text"
                      value={usuario?.usuario || ''}
                      disabled
                      className="bg-gray-50 pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={usuario?.email || ''}
                      disabled
                      className="bg-gray-50 pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombreCompleto">Nombre completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="nombreCompleto"
                    type="text"
                    value={`${usuario?.nombre || ''} ${usuario?.apellidos || ''}`}
                    disabled
                    className="bg-gray-50 pl-10"
                  />
                </div>
              </div>
            </section>

            <hr className="border-gray-200" />

            {/* Configuración de Jornada */}
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Clock className="size-5 text-gray-600" />
                Configuración de Jornada
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="jornadaSemanal">Horas semanales de trabajo</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="jornadaSemanal"
                    type="number"
                    min={1}
                    max={60}
                    step={0.5}
                    value={40}
                    disabled
                    className="w-32 bg-gray-50"
                  />
                  <span className="text-sm text-gray-500">horas/semana</span>
                </div>
                <p className="text-sm text-gray-500">
                  La jornada laboral está fijada en 40 horas semanales.
                </p>
              </div>
            </section>

            {/* Botones de acción */}
            <div className="flex justify-between gap-4 pt-4">
              <Button
                variant="outline"
                onClick={restablecer}
                disabled={!hayCambios || isSaving}
              >
                <RotateCcw className="size-4" />
                Restablecer
              </Button>
              
              <Button
                onClick={guardarCambios}
                disabled={!hayCambios || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
