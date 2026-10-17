import { defineSeed } from "void/seed";

export default defineSeed<typeof import("./schema")>(async ({ db, schema }) => {
  await db.insert(schema.collections).values([
    {
      id: "legend-matches",
      title: "私を構成するバドミントンの3試合",
      authorName: "編集部おすすめ",
      ownerHash: "seed-owner-hash",
      revision: 1,
      items: [
        {
          videoId: "m2XUaX8P5a0",
          title: "Men's Singles Badminton Final - London 2012 Olympics | Lin Dan vs Lee Chong Wei",
          author: "Olympics",
          note: "史上最高峰のラリーの応酬。緊迫感が尋常じゃない永遠のクラシック。",
        },
        {
          videoId: "X8v1-pQ8aCY",
          title: "Women's Doubles Gold Medal Match - Badminton Rio 2016 Olympics | Takahashi / Matsutomo vs Pedersen / Rytter Juhl",
          author: "Olympics",
          note: "第3ゲーム16-19からの大逆転。日本バドミントン史上初の金メダル。",
        },
        {
          videoId: "VwQh05lF_e4",
          title: "Final | MS | Kento MOMOTA (JPN) [1] vs Anders ANTONSEN (DEN) | BWF 2019",
          author: "BWF TV",
          note: "精密機械のようなコントロールと圧倒的なディフェンス。",
        },
      ],
    },
  ]);
});
