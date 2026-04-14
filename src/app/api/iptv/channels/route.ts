import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')
  const password = searchParams.get('password')
  const portal_url = searchParams.get('portal_url')

  if (!username || !password || !portal_url) {
    return NextResponse.json(
      { error: 'Missing required credentials' },
      { status: 400 }
    )
  }

  try {
    // Evita la barra final redundante si la tiene
    const cleanPortalUrl = portal_url.endsWith('/') 
      ? portal_url.slice(0, -1) 
      : portal_url;

    const proxyUrl = `${cleanPortalUrl}/player_api.php?username=${username}&password=${password}&action=get_live_streams`

    const response = await fetch(proxyUrl)
    
    if (!response.ok) {
      throw new Error(`IPTV server responded with ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("API Proxy Error:", error.message)
    return NextResponse.json(
      { error: 'Internal Server Error or Upstream failure' },
      { status: 500 }
    )
  }
}
