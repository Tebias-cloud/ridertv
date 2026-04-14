# 🔴🔵 Rider TV - Plataforma IPTV Premium

Bienvenido al ecosistema **Rider TV**, un cliente Web de Alto Rendimiento para conexiones IPTV y Xtream Codes, estructurado sobre Next.js 14 y Supabase.

## 🚀 Tecnologías Principales

- **Frontend:** Next.js 14 (App Router), React, TailwindCSS, TypeScript.
- **Backend & Auth:** Supabase Auth (Cifrado Militar HLS), Supabase Database (Profiles & External Accounts).
- **Rendimiento:** Optimización de Motor en Cliente (Map/Hash `O(N)` para evitar cuellos de botella en Smart TVs de bajo nivel).
- **Reproducción HLS:** Integración de HLS.js con soporte proxy para sortear restricciones CORS en navegadores.

## 📺 Características

- **Panel Administrativo Maestro:** Gestión de perfiles de usuario, modificación del tiempo de vida, cambio de contraseña web forzada, y edición bidireccional en caliente de Credenciales IPTVs y Portales.
- **Catálogo Inmersivo UI/UX:** Interfaz fluida estilo "Netflix", con fondos difuminados, arte flotante 3D y extracción asíncrona ("Stealth Fetch") de Metadatos profundos por película.
- **Rendimiento Smart TV:** Uso minimizado de la memoria y control por teclado/D-Pad (`ArrowKeys`, `Enter`, `Escape`) habilitado para compatibilidad plena con la flecha direccional de televisores inteligentes.
- **Buscador Universal:** Filtrado de +50k elementos y eliminación algorítmica garantizada de contenido SFW para familias.

## 🔧 Configuración para Desarrollo

Para ejecutar en local, asegúrate de tener las siguientes variables de entorno en tu `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key # (Solo para Server Actions Administrativas)
```

Luego arranca el entorno local:
```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000)

## 🌎 Despliegue Público a Vercel

Soporte `Edge Functions` listo. Recomendado integrar directo a [Vercel](https://vercel.com/new).

---
© 2026 Plataforma Rider TV. Streaming sin límites.
