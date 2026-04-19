# 🔴🔵 Rider TV - Ecosistema IPTV & Centro de Migración

> [!WARNING]
> **ESTADO DEL PROYECTO: TRANSICIÓN A NATIVO**
> Este repositorio contiene la implementación Web/Capacitor (JS) actual de Rider TV. Debido a limitaciones de rendimiento en hardware de Smart TV de bajo costo y la complejidad de la gestión de foco (Spatial Navigation) en React, este stack ha sido declarado **inestable** y está en proceso de migración hacia **Android Nativo (Kotlin)**.

---

## 🏛️ Arquitectura Actual (Legacy)

El sistema opera bajo un modelo híbrido diseñado para despliegue en Vercel y empaquetado mediante Capacitor para Android.

### 🧩 Componentes Core
- **Framework:** Next.js 15+ (App Router).
- **Control de Foco:** `spatial-navigation-js` integrado mediante Hooks personalizados para manejar el D-Pad de televisores.
- **Data Layer:** Supabase (Auth, Profiles, External Accounts).
- **IPTV Core:** Proxy de servidor para inyección de Headers y bypass de CORS en proveedores Xtream Codes.

### 🛠️ Sistema de Construcción Dual (`toggle-server.js`)
El proyecto utiliza un script de pre-procesamiento para alternar entre modos:
- **`npm run dev` / `npm run start`**: Habilita `/api` y `/admin` moviendo carpetas desde `src/server-only`.
- **`npm run build:mobile`**: Deshabilita rutas de servidor para generar un export estático compatible con Capacitor y Android Assets.

---

## 🎯 Hoja de Ruta de Migración (Destino: Android Kotlin)

La meta es replicar la experiencia premium de Rider TV en un entorno 100% nativo para garantizar fluidez de 60 FPS y estabilidad total.

### 🎨 Paridad Visual (Android UI)
Se deben mantener los siguientes pilares estéticos en la versión Kotlin:
- **Dynamic Backgrounds:** Fondos difuminados (Blur) basados en el arte del contenido seleccionado.
- **3D Floating Cards:** Animaciones de escala y elevación al recibir el foco.
- **Premium Glassmorphism:** Menús laterales translúcidos y overlays de información.

### ⚙️ Paridad Funcional
1. **Stealth Fetch:** Implementar la lógica de extracción asíncrona de metadatos profundos (Cast, Sinopsis, Tráileres).
2. **Xtream Engine:** Portar la lógica de `proxy/route.ts` (Headers de VLC, User-Agents específicos) al cliente nativo usando **Retrofit** u **OkHttp**.
3. **Spatial Nav:** Sustituir la lógica de JS por la gestión nativa de `Focusables` de Android TV.

---

## 🔧 Configuración para Desarrollo de Sostenimiento

Mientras la migración nativa está en curso, estas son las instrucciones para mantener la versión actual:

### Variables de Entorno
Crea un `.env.local` con:
```bash
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### Comandos de Ejecución
```bash
# Servidor de Desarrollo (Web)
npm run dev

# Compilación para Android (Capacitor)
npm run build:mobile
```

---

## 📄 Notas de Auditoría Técnica
- **Punto de Dolor 1:** La hidratación de React causa "Jank" en el movimiento del foco inicial en hardware Mediatek de Smart TVs.
- **Punto de Dolor 2:** Los bloqueos de CORS de los proveedores IPTV requieren el proxy de Vercel, el cual es ineficiente para streaming masivo. La versión Kotlin debe manejar esto mediante manejo de cabeceras crudas en el socket.
- **Punto de Dolor 3:** Memoria persistente; Capacitor consume ~150MB adicionales comparado con una solución Kotlin pura.

---
© 2026 Plataforma Rider TV. Construyendo el futuro del Streaming Nativo.
