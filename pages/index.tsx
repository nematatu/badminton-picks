import { useState } from "react";
import { Link } from "@void/react";
import CollectionEditor from "../src/components/CollectionEditor";
import CollectionPreview from "../src/components/CollectionPreview";
import type { Props } from "./index.server";

export default function HomePage({ newId, myCollections, recentCollections }: Props) {
  const [showMine, setShowMine] = useState(false);
  const visible = showMine ? myCollections : recentCollections;
  return (
    <div className="home">
      <CollectionEditor initialData={{ id: newId }} submitUrl="/new" submitLabel="共有する" />
      <section className="community" aria-label="公開された選集">
        <header className="home-toolbar">
          <div className="collection-tabs" role="group" aria-label="表示する選集">
            <button type="button" aria-pressed={!showMine} onClick={() => setShowMine(false)}>
              みんなの選集
            </button>
            <button type="button" aria-pressed={showMine} onClick={() => setShowMine(true)}>
              自分の選集
            </button>
          </div>
        </header>
        {visible.length ? (
          <div className="collections-grid">
            {visible.map((collection) => (
              <Link href={`/c/${collection.id}`} className="collection-card" key={collection.id}>
                <CollectionPreview
                  items={collection.items}
                  title={collection.title}
                  authorName={collection.authorName}
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">
            <p>
              {showMine
                ? "このブラウザで作成した選集はありません。"
                : "まだ公開された選集はありません。"}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
