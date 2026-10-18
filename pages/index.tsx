import { useState } from "react";
import { Link } from "@void/react";
import CollectionPreview from "../src/components/CollectionPreview";
import type { Props } from "./index.server";

export default function HomePage({ myCollections, recentCollections }: Props) {
  const [showMine, setShowMine] = useState(false);
  const visible = showMine ? myCollections : recentCollections;
  return <div className="home-container">
    <div className="workspace-heading"><h1>選集</h1><Link href="/new" className="btn btn-primary">選集をつくる</Link></div>
    <div className="collection-toolbar"><div className="collection-filters" role="group" aria-label="表示する選集">
      <button type="button" aria-pressed={!showMine} onClick={() => setShowMine(false)}>みんなの選集</button>
      <button type="button" aria-pressed={showMine} onClick={() => setShowMine(true)}>自分の選集</button>
    </div><span className="list-order">{showMine ? "このブラウザで作成" : "新着順"}</span></div>
    <h2 className="sr-only">{showMine ? "自分の選集" : "みんなの選集"}</h2>
    {visible.length ? <div className="collections-grid">{visible.map((collection) =>
      <Link href={`/c/${collection.id}`} className="collection-link" key={collection.id}>
        <CollectionPreview items={collection.items} title={collection.title} authorName={collection.authorName} />
      </Link>)}
    </div> : <div className="empty-state"><p>{showMine ? "このブラウザの選集はまだありません。" : "公開された選集はまだありません。"}</p><p>YouTubeのURLから、好きな試合を選べます。</p></div>}
  </div>;
}
