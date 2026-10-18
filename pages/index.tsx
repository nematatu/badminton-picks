import { useState } from "react";
import { Link } from "@void/react";
import CollectionPreview from "../src/components/CollectionPreview";
import type { Props, CollectionSummary } from "./index.server";

function Gallery({ collections }: { collections: CollectionSummary[] }) {
  return <div className="collections-grid">{collections.map((col) => (
    <Link href={`/c/${col.id}`} className="collection-link" key={col.id}>
      <CollectionPreview items={col.items} title={col.title} authorName={col.authorName} />
    </Link>
  ))}</div>;
}

export default function HomePage({ myCollections, recentCollections }: Props) {
  const [showMine, setShowMine] = useState(false);
  const visible = showMine ? myCollections : recentCollections;
  return <div className="home-container">
    <div className="page-intro">
      <h1>私を構成する<br />バドミントンの試合。</h1>
      <div className="intro-aside"><p>YouTubeから選んで、ひとこと添えて。<br />好きな試合を、あなたの選集に。</p>
        <Link href="/new" className="btn btn-primary">自分の選集をつくる</Link></div>
    </div>
    <section className="section">
      <div className="section-header"><div className="collection-filters" role="group" aria-label="表示する選集">
        <button type="button" aria-pressed={!showMine} onClick={() => setShowMine(false)}>みんなの選集</button>
        <button type="button" aria-pressed={showMine} onClick={() => setShowMine(true)}>自分の選集</button>
      </div><span>{showMine ? "このブラウザで作成" : "新着順"}</span></div>
      <h2 className="sr-only">{showMine ? "自分の選集" : "みんなの選集"}</h2>
      {visible.length ? <Gallery collections={visible} /> : (
        <div className="empty-state"><h3>{showMine ? "このブラウザの選集はまだありません。" : "最初の選集をつくりませんか。"}</h3>
          <p>好きな試合のYouTube URLを、ひとつから。</p>
          <Link href="/new" className="text-link">試合を選ぶ</Link></div>
      )}
    </section>
  </div>;
}
