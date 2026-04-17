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
        {/* NUCLEAR FIX 2.0: Prefetch Killer Script */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var originalFetch = window.fetch;
            window.fetch = function(input, init) {
              if (typeof input === 'string' && (input.includes('_rsc') || input.endsWith('.txt'))) {
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
            console.log('⚡ [Nuclear Fix] Prefetch Killer Active');
          })();
        `}} />
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
      </head>
      <body className="min-h-full flex flex-col">
        <SpatialNavProvider>
          {children}
        </SpatialNavProvider>
      </body>
    </html>
  );
}
