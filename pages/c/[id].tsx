import { useState } from "react";
import { Link } from "@void/react";
import MatchInfo from "../../src/components/MatchInfo";
import CopyButton from "../../src/components/CopyButton";
import ActionMenu from "../../src/components/ActionMenu";
import type { Props } from "./[id].server";

export default function CollectionDetailPage({ collection, pageUrl }: Props) {
  const [feedback, setFeedback] = useState("");
  const { id, title, authorName, items, isOwner, revision } = collection;
  const tweetUrl = `https://x.com/intent/post?text=${encodeURIComponent(`${title}\n選者 ${authorName}\n#私を構成するバドミントン試合`)}&url=${encodeURIComponent(pageUrl)}`;

  async function share() {
    if (!navigator.share) { setFeedback("このブラウザでは、リンクのコピーをご利用ください。"); return; }
    try { await navigator.share({ title, url: pageUrl }); }
    catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setFeedback("共有できませんでした。リンクのコピーをお試しください。");
    }
  }

  return <div className="detail-container">
    <header className="detail-heading"><h1>{title}</h1><p className="detail-meta">{authorName} · {items.length}試合</p></header>
    <div className="detail-actions">
      <CopyButton value={pageUrl} />
      {isOwner && <Link className="btn" href={`/c/${id}/edit`}>編集する</Link>}
      <ActionMenu label="その他の共有方法">
        <button type="button" onClick={share}>端末の共有を開く</button>
        <a href={tweetUrl} target="_blank" rel="noreferrer">Xで共有する</a>
        <a href={`/og/${id}?v=${revision}&download=1`} download={`rally-picks-${id}.png`}>画像を保存</a>
      </ActionMenu>
    </div>
    {feedback && <p role="status" className="status-message">{feedback}</p>}
    <ol className="picks-list public-picks">{items.map((item, index) => <li className="pick-row" key={item.videoId}>
      <span className="pick-number" aria-label={`${index + 1}試合目`}>{index + 1}</span>
      <MatchInfo item={item}>{item.note && <p className="match-note">{item.note}</p>}</MatchInfo>
    </li>)}</ol>
  </div>;
}
