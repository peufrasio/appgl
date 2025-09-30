import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gravação do EP - Apaixonado Como Nunca | Gabriel Lima",
  description: "Você é nosso convidado especial para a gravação do EP 'Apaixonado Como Nunca' de Gabriel Lima. Uma tarde à beira-mar com muita música e emoção.",
  keywords: "Gabriel Lima, EP, Apaixonado Como Nunca, música, evento, Natal, RN",
  authors: [{ name: "Gabriel Lima" }],
  openGraph: {
    title: "Gravação do EP - Apaixonado Como Nunca",
    description: "Uma tarde à beira-mar com muita música, emoção e participações especiais",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gravação do EP - Apaixonado Como Nunca",
    description: "Uma tarde à beira-mar com muita música, emoção e participações especiais",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#dc2626',
              color: 'white',
              border: 'none',
            },
          }}
        />
      </body>
    </html>
  );
}