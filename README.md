# badminton-picks

バドミントンの好きな試合を共有するアプリの開発用リポジトリです。
現在は [Void](https://void.cloud/guide/quickstart) の公式スターターのみです。
YouTube連携、投稿のCRUD、共有ページ、OGP、PWAは未実装です。

## ローカルで起動する

Node.js 24.21.0以上とnpmを使用します。

```sh
npm ci
npm run dev
```

表示されたローカルURLを開きます。標準ポートは `http://localhost:5173` です。
公式スターターのメッセージ一覧と追加フォームが表示されます。
`/api/hello` でサンプルAPIを確認できます。

構成はVoid、Vite+、React、TypeScript、D1です。
開発用データベースはローカルで動作します。
サンプルデータを投入する場合は `npx void db seed` を実行します。
このコマンドはローカルデータベースをリセットします。

## 検証する

```sh
npm run typecheck
npm run build
```

## 編集する

- `pages/index.tsx` にサンプル画面があります。
- `pages/index.server.ts` にデータ取得とフォーム処理があります。
- `routes/api/hello.ts` にサンプルAPIがあります。
- `db/schema.ts` にメッセージテーブルの定義があります。
- `db/migrations/` に生成済みマイグレーションがあります。

スキーマを変更した場合は `npx void db generate` でマイグレーションを生成します。
生成内容を確認してからコミットしてください。

Cloudflareへのデプロイ設定、ログイン、本番リソースの作成は行っていません。
起動とビルドだけではデプロイされません。
