import { useState } from "react";
import { Link } from "@void/react";
import { ShuttlecockIcon, PlayIcon, ExternalLinkIcon } from "../../src/components/Icons";
import type { Props } from "./[id].server";

export default function CollectionDetailPage({ collection }: Props) {
  const [copied, setCopied] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  if (!collection) {
    return (
      <div className="empty-state card">
        <h2>選集が見つかりませんでした</h2>
        <p className="text-muted">すでに削除されたか、URLが正しくない可能性があります。</p>
        <Link href="/" className="btn btn-primary mt-4">トップへもどる</Link>
      </div>
    );
  }

  const { id, title, authorName, items, createdAt, isOwner } = collection;
  const pageUrl = typeof window !== "undefined" ? window.location.href : `https://rally-picks.void.cloud/c/${id}`;

  const tweetText = `『${title}』選者: ${authorName}\n\n私を構成するバドミントンの試合はこちら！\n${pageUrl}\n#私を構成するバドミントン試合 #RallyPicks`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  }

  async function handleNativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: `『${title}』選者: ${authorName} | 私を構成するバドミントン試合`,
          url: pageUrl,
        });
      } catch {}
    }
  }

  const canNativeShare = typeof navigator !== "undefined" && Boolean(navigator.share);

  return (
    <div className="detail-container">
      {/* Top back link */}
      <div className="detail-nav">
        <Link href="/" className="back-link">
          ← みんなの選集へもどる
        </Link>
      </div>

      {/* Main Collection Header Card */}
      <section className="detail-header-card card">
        <div className="detail-meta-top">
          <span className="badge badge-primary">{items.length} 試合セレクト</span>
          <span className="detail-date text-muted text-xs">
            {createdAt ? new Date(createdAt).toLocaleDateString("ja-JP") : ""}
          </span>
        </div>

        <h1 className="detail-title">{title}</h1>

        <div className="detail-author-row">
          <div className="author-avatar text-muted" aria-hidden="true">
            <ShuttlecockIcon style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <div className="author-label text-muted text-xs">選者</div>
            <div className="author-name font-semibold">{authorName}</div>
          </div>
        </div>

        {/* Share Action Bar */}
        <div className="share-bar">
          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-x-share"
          >
            <span className="x-icon">𝕏</span> でシェアする
          </a>

          {canNativeShare && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleNativeShare}
            >
              共有する
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCopy}
          >
            {copied ? "✓ コピーしました" : "リンクをコピー"}
          </button>

          {isOwner && (
            <div className="owner-actions">
              <Link href={`/c/${id}/edit`} className="btn btn-secondary btn-sm">
                編集する
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Matches List */}
      <section className="matches-section">
        <div className="matches-section-header">
          <h2 className="section-title">収録されている試合</h2>
          <span className="text-muted text-xs">画像タップで動画を再生できます</span>
        </div>

        <div className="matches-list">
          {items.map((item, idx) => {
            const isPlaying = playingVideoId === item.videoId;

            return (
              <article key={item.videoId} className="match-card card">
                <div className="match-number">#{idx + 1}</div>

                {/* Media area: Embed player or Thumbnail with play button */}
                <div className="match-media">
                  {isPlaying ? (
                    <div className="iframe-wrapper">
                      <iframe
                        src={`https://www.youtube.com/embed/${item.videoId}?autoplay=1`}
                        title={item.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div
                      className="match-thumb-interactive"
                      onClick={() => setPlayingVideoId(item.videoId)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setPlayingVideoId(item.videoId);
                        }
                      }}
                      aria-label={`${item.title} を再生`}
                    >
                      <img
                        src={`https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`}
                        alt={item.title}
                        className="match-thumb-img"
                        loading="lazy"
                      />
                      <div className="play-overlay">
                        <div className="play-btn-circle" aria-hidden="true">
                          <PlayIcon style={{ width: 18, height: 18 }} />
                        </div>
                        <span className="play-text">ここで再生</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content area */}
                <div className="match-content">
                  <div className="match-info">
                    <span className="match-channel text-muted text-xs">{item.author}</span>
                    <h3 className="match-title">{item.title}</h3>
                  </div>

                  {item.note && (
                    <blockquote className="match-note">
                      <p className="note-text">{item.note}</p>
                    </blockquote>
                  )}

                  <div className="match-links">
                    <a
                      href={`https://www.youtube.com/watch?v=${item.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="yt-external-link"
                    >
                      YouTubeで開く <ExternalLinkIcon />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bottom-cta card">
        <h3>あなたも「私を構成する試合」を選びませんか？</h3>
        <p className="text-muted text-sm">
          バドミントンファンそれぞれに、忘れられない1戦があります。あなたのフェイバリットを教えてください。
        </p>
        <Link href="/new" className="btn btn-primary mt-3">
          選集をつくる
        </Link>
      </section>
    </div>
  );
}
