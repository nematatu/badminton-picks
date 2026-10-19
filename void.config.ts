import { defineConfig } from "void/config";

export default defineConfig({
  cloudflare: {
    name: "badminton-picks-preview",
    account_id: "b55858b0d5c41b055859b1e758ddf3a2",
    workers_dev: true,
    preview_urls: true,
    d1_databases: [
      { binding: "DB", database_name: "badminton-picks-preview-db" },
    ],
  },
  worker: {
    compatibility_date: "2026-10-12",
  },
  head: {
    htmlAttrs: { lang: "ja" },
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#f8faf8" },
    ],
    link: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
    ],
  },
});
