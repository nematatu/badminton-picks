import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const base = process.env.SMOKE_URL || 'http://localhost:5173';
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname)) {
  throw new Error('ローカル環境専用の検証です。');
}
const start = await fetch(`${base}/new`);
const cookie = start.headers.get('set-cookie')?.split(';')[0];
assert.ok(cookie, '作成者Cookieが設定される');
const id = (await start.text()).match(/"newId":"([\w-]+)"/)?.[1];
assert.ok(id, '作成用IDが発行される');
const headers = { 'Content-Type': 'application/json', Cookie: cookie, Origin: base };
const send = (url, body, customHeaders = headers) => fetch(`${base}${url}`, {
  method: 'POST', headers: customHeaders, body: JSON.stringify(body),
});
const video = await fetch(`${base}/api/youtube?url=${encodeURIComponent('https://youtu.be/tj0U9gt4bVQ')}`);
assert.equal(video.status, 200, '実際のYouTube情報を取得する');
const meta = await video.json();
assert.equal(meta.author, 'BWF TV');
assert.equal((await fetch(`${base}/api/youtube?url=https://example.com/`)).status, 400);
const body = { id, title: '動作確認専用。検証後に自動削除', authorName: '自動検証', items: [{ ...meta, note: '入力保持の確認' }] };
assert.equal((await send('/new', { ...body, items: [] })).status, 422, '無効な保存を成功扱いしない');
assert.equal((await send('/new', body, { ...headers, Origin: 'https://example.com' })).status, 403, '別originの書込みを拒否');
let revision = 1;
let created = false;
try {
  const creation = await send('/new', body);
  assert.equal(creation.status, 200, `作成できる: ${await creation.text()}`);
  created = true;
  assert.equal((await send('/new', body)).status, 200, '同じ作成の再送が成功する');
  const page = await fetch(`${base}/c/${id}`);
  const html = await page.text();
  assert.ok(html.includes(`property="og:image"`), 'SSRでOG画像を出力する');
  assert.ok(html.includes(`${base}/og/${id}?v=1`), '実際のoriginを使う');
  assert.ok(!html.includes('ownerHash'), '所有者ハッシュを公開しない');
  assert.equal((await fetch(`${base}/c/${id}/edit`)).status, 403, '別ブラウザからの編集を拒否');
  assert.equal((await send(`/c/${id}/edit?update`, { ...body, revision }, { 'Content-Type': 'application/json' })).status, 403);
  assert.equal((await send(`/c/${id}/edit?update`, { ...body, revision, items: [{ ...meta, note: 'a'.repeat(241) }] })).status, 422);
  const sparse = [{ ...meta, note: '9番の位置を保持', slot: 8 }];
  assert.equal((await send(`/c/${id}/edit?update`, { ...body, revision, items: sparse })).status, 200, '空きを残して9番に保存できる');
  revision = 2;
  const sparseHtml = await (await fetch(`${base}/c/${id}`)).text();
  assert.ok(sparseHtml.includes('"slot":8'), '公開データが9番の位置を保持する');
  assert.match(sparseHtml, /data-slot="8"><a[^>]+class="board-tile"/, '公開画面の9番に動画リンクを置く');
  assert.match(sparseHtml, /data-slot="0"><span class="empty-tile"/, '1番は空きのまま残す');
  const ownedHtml = await (await fetch(`${base}/c/${id}/edit`, { headers: { Cookie: cookie } })).text();
  assert.ok(ownedHtml.includes('"slot":8'), '編集画面を再読込みしても位置を保持する');
  assert.equal((await send(`/c/${id}/edit?update`, { ...body, revision, items: [{ ...meta, slot: 9 }] })).status, 422, '10番の位置を拒否する');
  assert.equal((await send(`/c/${id}/edit?update`, { ...body, revision, items: [sparse[0], { ...meta, videoId: '_KWU0t7ODPE', slot: 8 }] })).status, 422, '位置の重複を拒否する');
  const sparseImage = await fetch(`${base}/og/${id}?v=${revision}`);
  assert.equal(sparseImage.status, 200, '空き位置を含むPNGを生成する');
  const sparsePng = Buffer.from(await sparseImage.arrayBuffer());
  assert.equal(sparsePng.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(sparsePng.readUInt32BE(16), 1200);
  assert.equal(sparsePng.readUInt32BE(20), 630);
  if (process.env.SMOKE_SPARSE_PNG) await writeFile(process.env.SMOKE_SPARSE_PNG, sparsePng);
  const ids = ['tj0U9gt4bVQ', '_KWU0t7ODPE', 'Bzdhx0V25rI', ...Array.from({ length: 6 }, (_, i) => `qa00000000${i}`)];
  const items = ids.map((videoId, index) => ({ videoId, title: `画像配置の検証 ${index + 1}`, author: '自動検証', note: '' }));
  assert.equal((await send(`/c/${id}/edit?update`, { ...body, revision, items })).status, 200, '9試合を保存できる');
  revision = 3;
  assert.equal((await send(`/c/${id}/edit?update`, { ...body, revision: 1 })).status, 409, '古い画面からの上書きを拒否');
  assert.equal((await send(`/c/${id}/edit?delete`, { revision: 1 })).status, 409, '古い画面からの削除を拒否');
  const image = await fetch(`${base}/og/${id}?v=${revision}&download=1`);
  assert.equal(image.status, 200, '9試合のPNGを生成する');
  assert.equal(image.headers.get('content-type'), 'image/png');
  assert.ok(image.headers.get('content-disposition')?.includes('attachment'));
  const png = Buffer.from(await image.arrayBuffer());
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  if (process.env.SMOKE_PNG) await writeFile(process.env.SMOKE_PNG, png);
} finally {
  if (created) {
    const current = await fetch(`${base}/c/${id}/edit`, { headers: { Cookie: cookie } });
    const latest = Number((await current.text()).match(/"revision":(\d+)/)?.[1]);
    assert.ok(Number.isInteger(latest) && latest > 0, '検証データの最新revisionを取得する');
    const deleted = await send(`/c/${id}/edit?delete`, { revision: latest });
    assert.equal(deleted.status, 200, '検証専用データを削除する');
  }
}
assert.equal((await fetch(`${base}/c/${id}`)).status, 404);
assert.equal((await fetch(`${base}/og/${id}?v=${revision}`)).status, 404, '削除後はキャッシュ済み画像も返さない');
console.log('PASS: YouTube取得・入力拒否・作成再送・所有権・競合・SSR・空き位置保持・9試合PNG・削除後404');
