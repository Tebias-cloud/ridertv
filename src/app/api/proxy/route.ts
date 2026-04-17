import { NextRequest, NextResponse } from 'next/server';

/**
 * API Proxy for IPTV Metadata
 * This bypasses CORS and Mixed Content restrictions on Web.
 * It also injects the standard VLC User-Agent to avoid provider blocking.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    console.log(`📡 [Proxy] Forwarding to: ${targetUrl}`);
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
        'Accept': '*/*',
        'Connection': 'keep-alive',
      },
      // Desactivar cache para asegurar datos frescos del proveedor
      cache: 'no-store'
    });

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('❌ [Proxy] Error:', error.message);
    return NextResponse.json({ 
      error: 'Failed to fetch from IPTV provider',
      details: error.message 
    }, { status: 502 });
  }
}
