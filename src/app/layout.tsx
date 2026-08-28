import type { Metadata } from "next";
import { IBM_Plex_Mono, Work_Sans } from "next/font/google";
import "./globals.css";

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "namber · welzijn portaal",
  description: "Pulse over welzijn op het werk — proof of concept",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="nl" className={`${workSans.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
