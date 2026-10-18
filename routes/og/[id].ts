import { createElement as h } from "react";
import { defineHandler } from "void";
import { loadCollection } from "../../src/lib/collection.server";
import satori from "satori/standalone";
import { Resvg } from "@resvg/resvg-wasm";
import { initEngine } from "../../src/lib/og-engine";

let fontData: ArrayBuffer | undefined;
async function font() {
  if (fontData) return fontData;
  try {
    const css = await fetch("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&display=swap", { signal: AbortSignal.timeout(4000) });
    if (!css.ok) return null;
    const url = (await css.text()).match(/src: url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/)?.[1];
    if (!url) return null;
    const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) return null;
    fontData = await response.arrayBuffer();
    return fontData;
  } catch { return null; }
}

async function thumbnail(videoId: string) {
  if (!/^[\w-]{11}$/.test(videoId)) return null;
  try {
    const response = await fetch(`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`, { signal: AbortSignal.timeout(4000), redirect: "manual" });
    if (!response.ok || !response.headers.get("content-type")?.startsWith("image/jpeg")) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length > 500_000) return null;
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return `data:image/jpeg;base64,${btoa(binary)}`;
  } catch { return null; }
}

export const GET = defineHandler(async (c) => {
  const id = c.req.param("id");
  if (!id) return c.text("Not found", 404);
  const col = await loadCollection(id);
  if (!col) return c.text("Not found", 404);
  const cache = await caches.open("rally-picks-og-v2");
  const key = new Request(new URL(`/og/${id}?v=${col.revision}`, c.req.url));
  const cached = await cache.match(key);
  let response: Response;
  if (cached) response = cached;
  else {
    await initEngine();
    const items = col.items.slice(0, 9);
    const [fontBuffer, ...images] = await Promise.all([font(), ...items.map((item) => thumbnail(item.videoId))]);
    const columns = items.length <= 2 ? items.length : 3;
    const rows = Math.ceil(items.length / columns);
    const width = (1136 - (columns - 1) * 8) / columns;
    const height = (420 - (rows - 1) * 8) / rows;
    const cells = images.map((src, index) => h("div", { key: index, style: {
      display: "flex", width, height, position: "relative", background: "#e7eae7", overflow: "hidden", alignItems: "center", justifyContent: "center",
    } }, src ? h("img", { src, width, height, style: { objectFit: "contain" } }) : (
      fontBuffer ? h("div", { style: { fontSize: 16, color: "#626862" } }, "画像を取得できません") : null
    )));
    const element = h("div", { style: { display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: 32,
      background: "#ffffff", color: "#242624", fontFamily: "Noto Sans JP", justifyContent: "space-between" } },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", height: 38, borderBottom: "1px solid #dfe2df", paddingBottom: 12 } },
        fontBuffer && h("div", { style: { fontSize: 20, color: "#bd322e", fontWeight: 700 } }, "RALLY PICKS"),
        fontBuffer && h("div", { style: { fontSize: 16, color: "#626862" } }, `${items.length}試合`)),
      fontBuffer && h("div", { style: { display: "flex", height: 54, alignItems: "center", fontSize: 26, fontWeight: 700, overflow: "hidden" } }, col.title.slice(0, 42)),
      h("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, width: 1136, height: 420 } }, ...cells),
      fontBuffer && h("div", { style: { display: "flex", alignItems: "center", fontSize: 14, color: "#626862", height: 24 } }, `選者 ${col.authorName}`),
    );
    const svg = await satori(element, { width: 1200, height: 630,
      fonts: fontBuffer ? [{ name: "Noto Sans JP", data: fontBuffer, weight: 700 }] : [],
    });
    const renderer = new Resvg(svg);
    try {
      const png = renderer.render();
      try {
        response = new Response(new Uint8Array(png.asPng()), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=300" } });
      } finally { png.free(); }
    } finally { renderer.free(); }
    c.executionCtx.waitUntil(cache.put(key, response.clone()));
  }
  if (c.req.query("download") === "1") {
    response = new Response(response.body, response);
    response.headers.set("Content-Disposition", `attachment; filename="rally-picks-${id.replace(/[^\w-]/g, "")}.png"`);
  }
  return response;
});
