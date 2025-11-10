import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plataforma Manus",
  description: "IA para gerenciar seu Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
