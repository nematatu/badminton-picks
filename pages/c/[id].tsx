import { useState } from "react";
import { Link } from "@void/react";
import { VideoImage } from "../../src/components/CollectionPreview";
import type { Props } from "./[id].server";

export default function CollectionDetailPage({ collection, pageUrl }: Props) {
  const [feedback, setFeedback] = useState("");
  const { id, title, authorName, items, isOwner, revision } = collection;
  const tweetUrl = `https://x.com/intent/post?text=${encodeURIComponent(`${title}\n選者 ${authorName}\n#私を構成するバドミントン試合`)}&url=${encodeURIComponent(pageUrl)}`;

  async function copy() {
    try { await navigator.clipboard.writeText(pageUrl); setFeedback("リンクをコピーしました。"); }
    catch { setFeedback(`コピーできませんでした。このURLをご利用ください。 ${pageUrl}`); }
  }
  async function share() {
    if (!navigator.share) { await copy(); return; }
    try { await navigator.share({ title, url: pageUrl }); }
    catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setFeedback("共有できませんでした。「リンクをコピー」をお試しください。"); }
  }

  return <div className="detail-container">
    <Link href="/" className="back-link">みんなの選集へ</Link>
    <header className="detail-heading"><h1>{title}</h1>
      <p className="detail-meta">選者 {authorName}　·　{items.length}試合</p>
      <div className="share-bar"><button className="btn btn-primary" onClick={share}>選集を共有</button>
        <button className="btn" onClick={copy}>リンクをコピー</button>
        <a className="btn" href={`/og/${id}?v=${revision}&download=1`} download={`rally-picks-${id}.png`}>画像を保存</a>
        {isOwner && <Link className="btn owner-action" href={`/c/${id}/edit`}>編集する</Link>}</div>
      <p role="status" className="share-feedback">{feedback}</p>
      <a className="text-link" href={tweetUrl} target="_blank" rel="noreferrer">Xで共有する</a>
    </header>
    <div className="section-header"><h2>選んだ試合</h2><span>YouTubeで見る</span></div>
    <ol className="matches-list">{items.map((item, index) => <li className="match-row" key={item.videoId}>
      <span className="pick-order">{index + 1}</span>
      <a href={`https://www.youtube.com/watch?v=${item.videoId}`} className="match-media" target="_blank" rel="noreferrer" aria-label={`${item.title}をYouTubeで見る`}>
        <VideoImage videoId={item.videoId} title={item.title} /></a>
      <div className="match-content"><h3>{item.title}</h3><p>{item.author}</p>
        {item.note && <p className="match-note">{item.note}</p>}
        <a className="text-link" href={`https://www.youtube.com/watch?v=${item.videoId}`} target="_blank" rel="noreferrer">YouTubeで見る</a></div>
    </li>)}</ol>
  </div>;
}
