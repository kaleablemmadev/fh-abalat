// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
// Import the font from the npm package
import "@fontsource/noto-sans-ethiopic";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
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
      <body className={`${inter.variable}`}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}