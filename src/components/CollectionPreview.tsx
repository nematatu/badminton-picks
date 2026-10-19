import { useState } from "react";
import type { PickItem } from "../../db/schema";
import { boardSlots } from "../lib/board";

export function VideoImage({ videoId, title }: Pick<PickItem, "videoId" | "title">) {
  const [failedVideoId, setFailedVideoId] = useState<string | null>(null);
  if (failedVideoId === videoId) return <span className="thumb-empty">画像を取得できません</span>;
  return (
    <img
      src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`}
      alt={title}
      loading="lazy"
      onError={() => setFailedVideoId(videoId)}
      onLoad={(event) => setFailedVideoId(event.currentTarget.naturalWidth <= 120 ? videoId : null)}
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
        {boardSlots(items).map((item, slot) => (
          <span key={slot} className={item ? "" : "collection-ghost"}>
            {item && <VideoImage videoId={item.videoId} title={item.title} />}
          </span>
        ))}
      </div>
      <div className="card-info">
        <h2>{title}</h2>
        <p>{authorName}</p>
      </div>
    </>
  );
}
