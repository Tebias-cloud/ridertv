import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rider IPTV",
  description: "Plataforma de streaming ultra-rápida",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

import { SpatialNavProvider } from '@/components/layout/SpatialNavProvider'
import { AppInitializer } from '@/components/layout/AppInitializer'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} h-full antialiased dark`}
    >
      <head>
        {/* NUCLEAR FIX 2.1: Aggressive Prefetch Killer Script */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            // 1. Patch Fetch y XHR para interceptar peticiones programáticas
            var originalFetch = window.fetch;
            window.fetch = function(input, init) {
              var url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
              if (url.includes('_rsc') || url.includes('.txt')) {
                return Promise.resolve(new Response('', { status: 200, statusText: 'OK' }));
              }
              return originalFetch.apply(this, arguments);
            };

            var originalXHR = window.XMLHttpRequest.prototype.open;
            window.XMLHttpRequest.prototype.open = function(method, url) {
              if (url && (url.includes('_rsc') || url.includes('.txt'))) {
                this.abort();
                return;
              }
              return originalXHR.apply(this, arguments);
            };

            // 2. Patch document.createElement para bloquear la creación de <link rel="prefetch">
            var originalCreateElement = document.createElement;
            document.createElement = function(tagName) {
              var el = originalCreateElement.apply(document, arguments);
              if (tagName.toLowerCase() === 'link') {
                var originalSetAttribute = el.setAttribute;
                el.setAttribute = function(name, value) {
                  if (name === 'rel' && (value === 'prefetch' || value === 'next-prefetch')) {
                    // Bloqueamos el prefetch
                    return;
                  }
                  if (name === 'href' && (value.includes('_rsc') || value.includes('.txt'))) {
                    // Bloqueamos el destino del prefetch
                    return;
                  }
                  originalSetAttribute.apply(el, arguments);
                };
              }
              return el;
            };

            // 3. MutationObserver para eliminar cualquier prefetch que se cuele en el DOM
            var observer = new MutationObserver(function(mutations) {
              mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                  if (node.tagName && node.tagName.toUpperCase() === 'LINK' && (node.rel === 'prefetch' || node.rel === 'next-prefetch' || node.as === 'fetch')) {
                    if (node.href && (node.href.includes('_rsc') || node.href.includes('.txt'))) {
                       console.log('🚫 [Interceptor] Bloqueado prefetch de: ' + node.href);
                       node.href = '#'; 
                       node.remove();
                    }
                  }
                });
              });
            });
            
            // Observar todo el documento para máxima seguridad
            observer.observe(document, { childList: true, subtree: true });

            console.log('⚡ [Nuclear Fix 2.1] Aggressive Prefetch Killer Active');
          })();
        `}} />
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
      </head>
      <body className="min-h-screen bg-black flex flex-col overflow-hidden">
        <AppInitializer>
          <SpatialNavProvider>
            {children}
          </SpatialNavProvider>
        </AppInitializer>
      </body>
    </html>
  );
}
