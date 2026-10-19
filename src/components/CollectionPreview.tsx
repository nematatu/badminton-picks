import { useState } from "react";
import type { PickItem } from "../../db/schema";

export function VideoImage({ videoId, title }: Pick<PickItem, "videoId" | "title">) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="thumb-empty">画像を取得できません</span>;
  return (
    <img
      src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`}
      alt={title}
      loading="lazy"
      onError={() => setFailed(true)}
      onLoad={(event) => setFailed(event.currentTarget.naturalWidth <= 120)}
    />
  );
}

export default function CollectionPreview({
  items,
  title,
  authorName,
}: {
  items: PickItem[];
  title: string;
  authorName: string;
}) {
  return (
    <>
      <div className="collection-board" aria-hidden="true">
        {items.map((item) => (
          <span key={item.videoId}>
            <VideoImage videoId={item.videoId} title={item.title} />
          </span>
        ))}
        {Array.from({ length: 9 - items.length }, (_, index) => (
          <span key={`empty-${index}`} className="collection-ghost" />
        ))}
      </div>
      <div className="card-info">
        <h2>{title}</h2>
        <p>{authorName}</p>
      </div>
    </>
  );
}
