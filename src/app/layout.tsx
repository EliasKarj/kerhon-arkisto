import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
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
      className={`${spaceGrotesk.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#sisalto"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border-2 focus:border-foreground focus:bg-accent focus:px-3 focus:py-2 focus:font-semibold focus:text-background"
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
        <footer className="border-t-2 border-foreground">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 text-sm font-medium uppercase tracking-wide text-muted sm:px-6">
            Kerhon Arkisto — kaveriporukan arvioarkisto.
          </div>
        </footer>
      </body>
    </html>
  );
}
