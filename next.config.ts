import type { NextConfig } from "next";

// GitHub Pages -projektisivu tarjoillaan alipolusta (/kerhon-arkisto/).
// basePath asetetaan vain CI:ssä (GITHUB_PAGES=true), jotta paikallinen
// dev ja build toimivat ilman alipolkua.
const basePath = process.env.GITHUB_PAGES === "true" ? "/kerhon-arkisto" : undefined;

const nextConfig: NextConfig = {
  // Staattinen export (out/) GitHub Pagesia varten.
  output: "export",
  // Jokaiselle reitille oma kansio + index.html, jotta /reitti/ toimii Pagesissa.
  trailingSlash: true,
  // Pages ei aja Next-kuvaoptimointia; sivu käyttää tavallisia <img>-elementtejä.
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath,
};

export default nextConfig;
