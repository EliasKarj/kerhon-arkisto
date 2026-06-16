import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // V2: palvelinrenderöinti Vercelissä (ei staattista exportia, ei basePathia).
  // Sivu käyttää tavallisia <img>-elementtejä, joten kuvaoptimointi pois.
  images: { unoptimized: true },
};

export default nextConfig;
