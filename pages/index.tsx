import { Link } from "@void/react";
import { ShuttlecockIcon } from "../src/components/Icons";
import type { Props, CollectionSummary } from "./index.server";

function CollectionCard({ col }: { col: CollectionSummary }) {
  const previews = col.items.slice(0, 3);

  return (
    <Link href={`/c/${col.id}`} className="collection-card card">
      <div className="card-thumbnails">
        {previews.map((item, idx) => (
          <div key={idx} className="thumb-wrap">
            <img
              src={`https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`}
              alt={item.title}
              loading="lazy"
            />
          </div>
        ))}
      </div>
      <div className="card-body">
        <div className="card-meta">
          <span className="badge">{col.itemCount} 試合</span>
          <span className="author">選者: {col.authorName}</span>
        </div>
        <h3 className="card-title">{col.title}</h3>
        {col.isOwner && <span className="owner-tag">あなたが作成</span>}
      </div>
    </Link>
  );
}

export default function HomePage({ myCollections, recentCollections }: Props) {
  return (
    <div className="home-container">
      {/* Introduction Hero */}
      <section className="intro-section">
        <div className="intro-content">
          <div className="intro-badge">
            <ShuttlecockIcon style={{ width: 14, height: 14 }} /> バドミントン名試合キュレーション
          </div>
          <h1 className="intro-heading">あなたを構成する、<br />バドミントンの3試合。</h1>
          <p className="intro-desc">
            鳥肌が立ったあのラリー、心を奮い立たせてくれたあの激闘。
            YouTubeの試合動画を選んで、あなただけの選集カードを作ってシェアしませんか？
          </p>
          <div className="intro-actions">
            <Link href="/new" className="btn btn-primary btn-lg">
              選集をつくる（3分で完成）
            </Link>
          </div>
        </div>
      </section>

      {/* User's own collections (if any) */}
      {myCollections.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">あなたが作成した選集</h2>
          </div>
          <div className="collections-grid">
            {myCollections.map((col) => (
              <CollectionCard key={col.id} col={col} />
            ))}
          </div>
        </section>
      )}

      {/* Recent collections */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">みんなの選集</h2>
          <span className="text-muted text-sm">{recentCollections.length} 件の選集</span>
        </div>

        {recentCollections.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon text-muted">
              <ShuttlecockIcon style={{ width: 40, height: 40 }} />
            </div>
            <h3>まだ選集がありません</h3>
            <p className="text-muted text-sm">
              最初の選集を作ってみませんか？好きな試合のYouTube URLを貼るだけで完成します。
            </p>
            <Link href="/new" className="btn btn-primary mt-4">
              最初の選集をつくる
            </Link>
          </div>
        ) : (
          <div className="collections-grid">
            {recentCollections.map((col) => (
              <CollectionCard key={col.id} col={col} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
