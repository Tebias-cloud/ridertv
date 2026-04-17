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
      <head />
      <body className="min-h-full flex flex-col">
        <SpatialNavProvider>
          {children}
        </SpatialNavProvider>
      </body>
    </html>
  );
}
