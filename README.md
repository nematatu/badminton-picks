# RALLY PICKS (私を構成するバドミントンの試合)

YouTubeの動画URLから好きなバドミントン試合を選び、ひとことメモを添えて「私を構成する試合」カードとして共有できるWebアプリケーションです。

## 主な機能

- **YouTube URL からの試合追加**: 公式大会や感動した試合のURLを貼るだけで、タイトル・サムネイル・チャンネル名を即座に取得
- **インタラクティブな選集編集**: 上下移動ボタンによる並び替え、ひとことメモの追加、削除
- **美しい OGP 画像の動的生成**: 選んだ試合のサムネイルを並べた1200×630のPNG画像をCloudflare Workers上で動的レンダリング（Satori + Resvg-wasm）
- **SNS シェア**: 𝕏 (Twitter) へのワンクリック投稿、リンクコピー、Web Share API 対応
- **アカウント不要の所有者管理**: 端末CookieのSHA-256ハッシュによるシームレスな編集・削除権限管理
- **モバイルファースト & PWA**: スマートフォンでの片手操作に最適化したUI、ホーム画面追加に対応

## 技術スタック

- **フレームワーク**: [Void](https://void.cloud) (Vite+ / Cloudflare Workers)
- **UI**: React 19, TypeScript
- **データベース**: Cloudflare D1 (SQLite) + Drizzle ORM
- **画像生成**: Satori (0.30.0) + @resvg/resvg-wasm

## ローカルでの起動方法

```sh
npm install
npm run dev
```

ブラウザで表示されたURL（通常 `http://localhost:5173`）を開きます。

### データベースのマイグレーションとシード

```sh
npx void db migrate
npx void db seed
```

### 型チェックとビルド

```sh
npm run typecheck
npm run build
```
