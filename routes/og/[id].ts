import { defineHandler } from "void";
import { db, eq } from "void/db";
import { collections } from "@schema";
import satori, { init } from "satori/standalone";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
// @ts-ignore
import yogaWasm from "satori/yoga.wasm?module";
// @ts-ignore
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm?module";

let ready: Promise<void> | null = null;
function ensureEngine() {
  ready ??= Promise.all([init(yogaWasm), initWasm(resvgWasm)]).then(() => {});
  return ready;
}

let cachedFont: ArrayBuffer | null = null;
async function getFont(): Promise<ArrayBuffer> {
  if (cachedFont) return cachedFont;
  // Fetch a subset of Noto Sans JP for Japanese text support
  const css = await (
    await fetch("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&display=swap")
  ).text();
  const fontUrl = css.match(/src: url\((.+?)\)/)?.[1];
  if (!fontUrl) throw new Error("Font URL not found");
  cachedFont = await (await fetch(fontUrl)).arrayBuffer();
  return cachedFont;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function fetchThumbnailDataUri(videoId: string): Promise<string> {
  try {
    const url = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    const res = await fetch(url);
    if (res.ok) {
      const buf = await res.arrayBuffer();
      return `data:image/jpeg;base64,${bufferToBase64(buf)}`;
    }
  } catch {}
  // 1x1 transparent pixel fallback
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
}

export const GET = defineHandler(async (c) => {
  const id = c.req.param("id");
  if (!id) return c.text("Not found", 404);

  const [col] = await db.select().from(collections).where(eq(collections.id, id));
  if (!col) return c.text("Not found", 404);

  await ensureEngine();
  let font: ArrayBuffer;
  try {
    font = await getFont();
  } catch {
    // If external font fails, minimal fallback
    font = new ArrayBuffer(0);
  }

  const items = (col.items || []).slice(0, 4);
  const thumbnails = await Promise.all(items.map((it) => fetchThumbnailDataUri(it.videoId)));

  const count = items.length;

  // Build grid of thumbnails
  const cards = items.map((item, idx) => ({
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        flex: 1,
        height: count <= 2 ? "420px" : "360px",
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "#161d19",
        border: "1px solid rgba(255,255,255,0.12)",
        position: "relative",
      },
      children: [
        {
          type: "img",
          props: {
            src: thumbnails[idx],
            style: {
              width: "100%",
              height: count <= 2 ? "320px" : "260px",
              objectFit: "cover",
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              padding: "12px 16px",
              justifyContent: "center",
              flex: 1,
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    color: "#ffffff",
                    fontSize: count <= 2 ? "20px" : "17px",
                    fontWeight: 700,
                    lineHeight: 1.3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  },
                  children: item.title,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    color: "#8da094",
                    fontSize: "14px",
                    marginTop: "4px",
                  },
                  children: item.author,
                },
              },
            ],
          },
        },
      ],
    },
  }));

  const element = {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: "#0b120e",
        padding: "36px 44px",
        fontFamily: "Noto Sans JP, sans-serif",
        justifyContent: "space-between",
      },
      children: [
        // Header
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              paddingBottom: "18px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          color: "#30ba78",
                          fontSize: "15px",
                          fontWeight: 700,
                          letterSpacing: "1.5px",
                          marginBottom: "4px",
                        },
                        children: "BADMINTON PICKS",
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          color: "#f5f7f5",
                          fontSize: "30px",
                          fontWeight: 700,
                          letterSpacing: "-0.5px",
                        },
                        children: col.title,
                      },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    color: "#a4b5aa",
                    fontSize: "18px",
                  },
                  children: `選者: ${col.authorName}`,
                },
              },
            ],
          },
        },
        // Match Cards Row
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              gap: "20px",
              marginTop: "20px",
              marginBottom: "20px",
              width: "100%",
            },
            children: cards,
          },
        },
        // Footer
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              paddingTop: "14px",
              color: "#5b6d61",
              fontSize: "14px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: { display: "flex", alignItems: "center", gap: "8px" },
                  children: "私を構成するバドミントンの試合 | RALLY PICKS",
                },
              },
              {
                type: "div",
                props: {
                  children: `${count} 試合セレクト`,
                },
              },
            ],
          },
        },
      ],
    },
  };

  const svg = await satori(element as any, {
    width: 1200,
    height: 630,
    fonts: [{ name: "Noto Sans JP", data: font, weight: 700 }],
  });

  const png = new Resvg(svg).render().asPng();

  return new Response(png as unknown as BodyInit, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
});
