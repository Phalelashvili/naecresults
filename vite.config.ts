import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Hosts allowed to reach the dev/preview server (custom domain + Vercel).
  server: { allowedHosts: ["naec.spartacus.dev", "naecresults.vercel.app"] },
  preview: { allowedHosts: ["naec.spartacus.dev", "naecresults.vercel.app"] },
});
