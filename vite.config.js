import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Share-preview tags need an absolute URL. Set VITE_SITE_URL to your final domain.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const site = (
    env.VITE_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    process.env.CF_PAGES_URL ||
    "http://localhost:5173"
  ).replace(/\/$/, "");
  return {
    plugins: [react(), { name: "site-url", transformIndexHtml: (html) => html.replaceAll("__SITE_URL__", site) }],
  };
});
