import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { DEFAULT_THEME, THEME_IDS, THEME_STORAGE_KEY } from "@/lib/themes";

// Asetetaan tallennettu teema ennen ensimmäistä maalausta (estää välähdyksen).
const themeInitScript = `(function(){try{var k=${JSON.stringify(
  THEME_STORAGE_KEY,
)};var v=${JSON.stringify(
  THEME_IDS,
)};var t=localStorage.getItem(k);if(v.indexOf(t)<0){t=${JSON.stringify(
  DEFAULT_THEME,
)};}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

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
    "Kaveriporukan anime- ja elokuva-arvioiden arkisto: arvostelut, Best character -äänet ja tilastot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fi"
      data-theme={DEFAULT_THEME}
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
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
          className="mx-auto w-full max-w-[1640px] flex-1 px-5 pb-12 pt-4 focus:outline-none sm:px-8 lg:px-12"
        >
          {children}
        </main>
        <footer className="border-t border-line">
          <div className="mx-auto w-full max-w-[1640px] px-5 py-6 text-sm font-medium text-muted sm:px-8 lg:px-12">
            Kerhon Arkisto — kaveriporukan arvioarkisto.
          </div>
        </footer>
      </body>
    </html>
  );
}
