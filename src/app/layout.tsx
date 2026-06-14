import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Kerhon Arkisto",
    template: "%s · Kerhon Arkisto",
  },
  description:
    "Kaveriporukan anime- ja elokuva-arvioiden arkisto: arvostelut, best girl/boy -äänet ja tilastot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#sisalto"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-foreground focus:px-3 focus:py-2 focus:text-background focus:shadow-lg"
        >
          Siirry sisältöön
        </a>
        <SiteHeader />
        <main
          id="sisalto"
          tabIndex={-1}
          className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 focus:outline-none sm:px-6"
        >
          {children}
        </main>
        <footer className="border-t border-black/10 dark:border-white/10">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 text-sm text-foreground/60 sm:px-6">
            Kerhon Arkisto — kaveriporukan arvioarkisto.
          </div>
        </footer>
      </body>
    </html>
  );
}
