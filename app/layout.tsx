import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Roam",
  description: "Turn your notes into a trip you can see — with places, photos, maps, and weather.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${dmSerif.variable} antialiased flex flex-col min-h-screen`}
      >
        <ThemeProvider>
          <Header />
          <div className="flex-1">{children}</div>
          <footer className="text-center text-xs text-muted-foreground py-4 border-t space-y-1">
            <p className="font-medium">Made for explorers. © {new Date().getFullYear()} Roam.</p>
            <p>
              Geocoding ©{" "}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                OpenStreetMap
              </a>{" "}
              · Images from Wikipedia
            </p>
          </footer>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
