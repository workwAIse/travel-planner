import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Serif_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/layout/header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Travel Planner",
  description: "Turn your notes into a trip you can see — with places, photos, maps, and weather.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${dmSerif.variable} antialiased flex flex-col min-h-screen`}
      >
        <Header />
        <div className="flex-1">{children}</div>
        <footer className="text-center text-xs text-muted-foreground py-3 border-t">
          Geocoding ©{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            OpenStreetMap
          </a>{" "}
          contributors · Place images from Wikipedia
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
