import type { NextConfig } from "next";

// ponytail: sin cacheComponents; toda pantalla depende de la sesión del usuario.
const nextConfig: NextConfig = {
  // Las pruebas E2E usan otro directorio para correr junto al servidor de desarrollo.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
