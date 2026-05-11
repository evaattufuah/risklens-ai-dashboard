import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Tell Next.js NOT to webpack-bundle these packages.
  // They will be required at runtime via Node.js require() instead,
  // which means pdfjs-dist can find its worker files normally.
  serverExternalPackages: [
    "pdfjs-dist",
    "canvas",
    "tesseract.js",
    "pdf-parse",
  ],
};

export default nextConfig;
