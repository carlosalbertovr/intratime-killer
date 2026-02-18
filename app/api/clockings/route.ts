import { NextRequest, NextResponse } from 'next/server';

// Proxy para obtener los fichajes del usuario desde Intratime
const INTRATIME_API_URL = 'https://newapi.intratime.es';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = request.headers.get('token');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido' },
        { status: 401 }
      );
    }

    // Construir parámetros de query
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const type = searchParams.get('type') || '0,1,2,3'; // Todos los tipos por defecto

    if (!from) {
      return NextResponse.json(
        { error: 'Parámetro "from" es requerido' },
        { status: 400 }
      );
    }

    // Construir URL con parámetros
    const params = new URLSearchParams();
    params.append('from', from);
    if (to) params.append('to', to);
    params.append('type', type);

    const url = `${INTRATIME_API_URL}/api/user/clockings?${params.toString()}`;

    // Hacer petición a la API de Intratime
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.apiintratime.v1+json',
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        'token': token,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Error al obtener fichajes' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en proxy de clockings:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Crear fichaje
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('token');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido' },
        { status: 401 }
      );
    }

    const body = await request.formData();
    const url = `${INTRATIME_API_URL}/api/user/clocking`;

    // Hacer petición a la API de Intratime
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.apiintratime.v1+json',
        'token': token,
      },
      body: body,
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: errorData || 'Error al crear fichaje' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en proxy de creación de clockings:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
