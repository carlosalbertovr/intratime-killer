import { NextRequest, NextResponse } from 'next/server';

// Proxy para evitar problemas de CORS con la API de Intratime
const INTRATIME_API_URL = 'https://newapi.intratime.es';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const user = formData.get('user') as string;
    const pin = formData.get('pin') as string;

    if (!user || !pin) {
      return NextResponse.json(
        { error: 'Usuario y PIN son requeridos' },
        { status: 400 }
      );
    }

    // Crear body como form-urlencoded
    const body = new URLSearchParams();
    body.append('user', user);
    body.append('pin', pin);

    // Hacer petición a la API de Intratime
    const response = await fetch(`${INTRATIME_API_URL}/api/user/login`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.apiintratime.v1+json',
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Error de autenticación' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en proxy de login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
