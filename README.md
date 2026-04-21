# Rider TV Admin Portal

![Rider TV](https://img.shields.io/badge/RIDER-TV-blue?style=for-the-badge&logo=appletv&logoColor=white&labelColor=red)

A high-performance, administrative hub for the Rider TV ecosystem. Designed for speed, security, and universal compatibility across all devices, including mobile Safari.

## 🚀 Tehnologies

- **Frontend**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 (Alpha)
- **Backend**: Supabase (Auth & Database)
- **Compatibility**: Hardened for Safari/WebKit (iPhone 11 support)

## ✨ Key Features

- **Premium Branding**: Authentic RIDER TV blue/red aesthetic.
- **Robust Auth**: Hardened authentication flow resistant to browser security blocks.
- **Responsive Dashboard**: Fully functional on desktop and mobile devices.
- **Real-time Sync**: Direct integration with the Rider TV Native Android application.

## 🛠️ Configuration

The project is optimized to run on Vercel with zero-configuration required.

### Local Setup

1. Clone the repository.
2. Install dependencies: `npm install`.
3. Set environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   ```
4. Run development server: `npm run dev`.

## 📱 Mobile Compatibility

This portal has been specifically engineered to bypass the strict security heuristics of older iOS devices (iPhone 11+). All interactive elements use hardened pointer events to ensure responsiveness even under low-performance or high-security browser profiles.

---
© 2025 Rider TV Premium Services.
