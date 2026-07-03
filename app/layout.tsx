import { Toaster } from "@/components/ui/sonner";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

// 1. Configuração do PWA e iOS
export const metadata: Metadata = {
  title: "MyHomeHub",
  description: "Gestão Financeira, Listas e mais",
  manifest: "/manifest.json", // Chama o arquivo do Android
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MyHomeHub",
  },
};

// 2. Definir a cor da barra de status do celular
export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link
          rel="apple-touch-icon"
          href="/apple-touch-icon.png"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash.png"
        />
      </head>
      <body className={inter.className}>
        <AppShell>{children}</AppShell>
        <Toaster theme="dark" richColors position="bottom-right" />
      </body>
    </html>
  );
}
