import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";

// Share-preview tags need an absolute URL. Set VITE_SITE_URL to your final domain.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const site = (
    env.VITE_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    process.env.CF_PAGES_URL ||
    "http://localhost:5173"
  ).replace(/\/$/, "");
  // Uses your public/og.png or public/og.jpg (png wins if both exist).
  const og = ["og.png", "og.jpg", "og.jpeg"].find((f) => fs.existsSync(`public/${f}`)) || "og.png";
  return {
    plugins: [react(), { name: "site-url", transformIndexHtml: (html) => html.replaceAll("__SITE_URL__", site).replaceAll("__OG_FILE__", og) }],
  };
});
