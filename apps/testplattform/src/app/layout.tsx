import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";
import { Playfair_Display, Inter } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Ziegler Treuhand — Testplattform",
  description: "Prototyp fuer das neue Auktions-Tool",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}

