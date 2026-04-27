import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "Aletheia AI - Forensic Observability",
  description:
    "Build, orchestrate, and deploy intelligent AI agent workflows with Aletheia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="font-[var(--font-inter)] antialiased tracking-tight">
        {children}
      </body>
    </html>
  );
}
