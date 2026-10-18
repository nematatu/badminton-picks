import { defineConfig } from "void/config";

export default defineConfig({
  worker: {
    compatibility_date: "2026-10-12",
  },
  head: {
    htmlAttrs: { lang: "ja" },
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#bd322e" },
    ],
    link: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
    ],
  },
});
