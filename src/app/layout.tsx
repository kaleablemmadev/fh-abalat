// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const notoSansEthiopic = localFont({
  src: "../assets/fonts/NotoSansEthiopic-VariableFont_wdth,wght.ttf",
  variable: "--font-ethiopic",
  display: "swap",
});

import AppLayout from "@/src/components/layout/AppLayout";

export const metadata: Metadata = {
  title: "Abalat — Attendance",
  description: "Attendance and Member Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${notoSansEthiopic.variable}`}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}