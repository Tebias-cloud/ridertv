import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing target URL' }, { status: 400 });
  }

  try {
    // Only allow IPTV provider domain for security
    const allowedHost = 'poraquivamosentrando.vip';
    const urlObj = new URL(targetUrl);
    
    if (urlObj.hostname !== allowedHost) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json({ 
        error: `IPTV Provider returned ${response.status}`,
        details: await response.text()
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[IPTV Proxy Error]:', error);
    return NextResponse.json({ error: 'Failed to fetch from IPTV provider', details: error.message }, { status: 500 });
  }
}
