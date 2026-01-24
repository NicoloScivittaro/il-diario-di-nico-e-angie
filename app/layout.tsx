import type { Metadata, Viewport } from "next";
import { Inter, Caveat } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans"
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-handwritten",
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "Il Nostro Amore",
  description: "Il diario condiviso di Nico & Angie",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Amore ❤️",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#f43f5e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Often desired for app-like feel
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className={`${caveat.variable} ${inter.variable}`}>
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
