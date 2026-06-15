import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages tarjoaa staattiset reitit hakemistoina (esim. /tilastot/),
  // joten generoidaan jokaiselle reitille oma kansio + index.html.
  trailingSlash: true,
};

export default nextConfig;
