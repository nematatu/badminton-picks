import type { ReactNode } from "react";
import type { PickItem } from "../../db/schema";
import { VideoImage } from "./CollectionPreview";

export default function MatchInfo({ item, children }: { item: PickItem; children?: ReactNode }) {
  const parts = item.title.split("|").map((part) => part.trim());
  const hasPlayers = parts.length > 1 && /vs\./i.test(parts[1]);
  const title = hasPlayers ? parts[1] : item.title;
  const subtitle = hasPlayers ? [parts[0], ...parts.slice(2)].join(" / ") : item.author;
  const url = `https://www.youtube.com/watch?v=${item.videoId}`;
  return <>
    <a className="match-thumbnail" href={url} target="_blank" rel="noreferrer" aria-label={`${item.title}をYouTubeで見る`}>
      <VideoImage videoId={item.videoId} title={item.title} />
    </a>
    <div className="match-info">
      <a className="match-title" href={url} target="_blank" rel="noreferrer" title={item.title}>{title}</a>
      <p className="match-subtitle" title={item.author}>{subtitle}</p>
      {children}
    </div>
  </>;
}
