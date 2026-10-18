import { useState } from "react";
import type { PickItem } from "../../db/schema";

export function VideoImage({ videoId, title }: Pick<PickItem, "videoId" | "title">) {
  const [failed, setFailed] = useState(false);
  return failed ? <span className="image-unavailable">画像を表示できません</span> : (
    <img src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`} alt={title}
      loading="lazy" onError={() => setFailed(true)} onLoad={(event) => { if (event.currentTarget.naturalWidth <= 120) setFailed(true); }} />
  );
}

export default function CollectionPreview({ items, title, authorName }: {
  items: PickItem[]; title: string; authorName: string;
}) {
  return <div className="collection-preview">
    <div className={`mosaic mosaic-${Math.min(items.length, 3)}`}>
      {items.length ? items.map((item) => <div className="mosaic-cell" key={item.videoId}>
        <VideoImage videoId={item.videoId} title={item.title} />
      </div>) : <div className="preview-empty">選んだ試合がここに並びます</div>}
    </div>
    <div className="preview-caption">
      <h3>{title || "私を構成するバドミントンの試合"}</h3>
      <p>{authorName || "匿名"}<span>{items.length}試合</span></p>
    </div>
  </div>;
}
