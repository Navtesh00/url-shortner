import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  // the repo root has its own lockfile, so pin the project root explicitly
  turbopack: {
    root: process.cwd(),
  },

  // The API has no CORS setup, so every request from the browser is proxied
  // through this origin instead of calling the backend cross-origin.
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
