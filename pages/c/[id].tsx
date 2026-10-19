import { useState } from "react";
import { Link } from "@void/react";
import { VideoImage } from "../../src/components/CollectionPreview";
import CopyButton from "../../src/components/CopyButton";
import type { Props } from "./[id].server";

export default function CollectionDetailPage({ collection, pageUrl }: Props) {
  const [feedback, setFeedback] = useState("");
  const { id, title, authorName, items, isOwner, revision } = collection;
  const tweetText = `${title}\n選者: ${authorName}\n#私を構成するバドミントン試合`;
  const tweetUrl = `https://x.com/intent/post?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(pageUrl)}`;

  async function share() {
    if (!navigator.share) {
      setFeedback("この端末ではリンクのコピーをご利用ください。");
      return;
    }
    try {
      await navigator.share({ title, url: pageUrl });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setFeedback("共有できませんでした。リンクのコピーをお試しください。");
    }
  }

  return (
    <div className="detail">
      <header className="detail-head">
        <h1>{title}</h1>
        <p className="muted">{authorName}</p>
      </header>
      <ol className="match-board" aria-label="選ばれた試合">
        {items.map((item) => (
          <li className="board-cell" key={item.videoId}>
            <a
              className="board-tile"
              href={`https://www.youtube.com/watch?v=${item.videoId}`}
              target="_blank"
              rel="noreferrer"
              aria-label={`${item.title}をYouTubeで見る`}
              title={item.title}
            >
              <VideoImage videoId={item.videoId} title={item.title} />
              <span className="tile-edit" aria-hidden="true">
                YouTubeで見る ↗
              </span>
            </a>
          </li>
        ))}
        {Array.from({ length: 9 - items.length }, (_, index) => (
          <li key={`empty-${index}`} className="board-cell ghost-tile" aria-hidden="true" />
        ))}
      </ol>
      <div className="detail-actions">
        <CopyButton value={pageUrl} />
        {isOwner && (
          <Link className="btn" href={`/c/${id}/edit`}>
            編集する
          </Link>
        )}
        <details className="share-menu">
          <summary className="btn" aria-label="その他の共有方法">
            その他
          </summary>
          <div className="share-options">
            <button type="button" onClick={share}>
              端末で共有
            </button>
            <a href={tweetUrl} target="_blank" rel="noreferrer">
              Xで共有
            </a>
            <a href={`/og/${id}?v=${revision}&download=1`} download={`rally-picks-${id}.png`}>
              画像を保存
            </a>
          </div>
        </details>
      </div>
      {feedback && (
        <p className="muted" role="status">
          {feedback}
        </p>
      )}
      {items.some((item) => item.note) && (
        <details className="disclosure collection-notes">
          <summary>選んだ理由を読む</summary>
          <div>
            {items
              .filter((item) => item.note)
              .map((item) => (
                <div className="collection-note" key={item.videoId}>
                  <a
                    href={`https://www.youtube.com/watch?v=${item.videoId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.title}
                  </a>
                  <p>{item.note}</p>
                </div>
              ))}
          </div>
        </details>
      )}
    </div>
  );
}
