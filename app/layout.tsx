import type { Metadata } from "next";
import { Oswald, Open_Sans } from "next/font/google";
import "./globals.css";

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  weight: ["400", "600"],
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Calibrate — Sharpen your edge.",
  description: "Spaced repetition and clinical readiness for IONM professionals.",
};

export const viewport = {
  themeColor: "#1A252F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${oswald.variable} ${openSans.variable} font-body antialiased bg-dark text-white`}>
        {children}
      </body>
    </html>
  );
}
