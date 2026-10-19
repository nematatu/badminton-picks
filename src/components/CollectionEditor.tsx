import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "@void/react";
import type { PickItem } from "../../db/schema";
import { VideoImage } from "./CollectionPreview";
import VideoDialog from "./VideoDialog";
import { MAX_PICKS, errorSchema, resultSchema } from "../lib/collection";

type Phase = "idle" | "saving" | "deleting";
type Selection = { kind: "add" } | { kind: "edit"; videoId: string };

export default function CollectionEditor({
  initialData,
  submitUrl,
  submitLabel,
  isEdit = false,
}: {
  initialData: {
    id: string;
    title?: string;
    authorName?: string;
    items?: PickItem[];
    revision?: number;
  };
  submitUrl: string;
  submitLabel: string;
  isEdit?: boolean;
}) {
  const router = useRouter();
  const initialTitle = initialData.title || "";
  const autoTitle = `私を構成するバドミントンの${initialData.items?.length || 0}試合`;
  const [customTitle, setCustomTitle] = useState(initialTitle === autoTitle ? "" : initialTitle);
  const [authorName, setAuthorName] = useState(
    initialData.authorName === "匿名" ? "" : initialData.authorName || "",
  );
  const [items, setItems] = useState<PickItem[]>(initialData.items || []);
  const [phase, setPhase] = useState<Phase>("idle");
  const [saveError, setSaveError] = useState("");
  const [message, setMessage] = useState("");
  const [removed, setRemoved] = useState<{ item: PickItem; index: number } | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const draggedId = useRef<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const busy = phase !== "idle";
  const title = customTitle.trim() || `私を構成するバドミントンの${items.length}試合`;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    const guardLink = (event: MouseEvent) => {
      if (
        !(event.target instanceof Element) ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = event.target.closest("a");
      if (!link || link.target === "_blank" || link.hasAttribute("download") || link.hash) return;
      if (!window.confirm("保存していない変更があります。移動しますか？")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", guardLink, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", guardLink, true);
    };
  }, [dirty]);

  function move(from: number, to: number) {
    if (busy || from === to || to < 0 || to >= items.length) return;
    setItems((current) => {
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setDirty(true);
    setMessage(`${to + 1}番目に並び替えました。`);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy || !items.length) return;
    setPhase("saving");
    setSaveError("");
    try {
      const response = await fetch(submitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...initialData, title, authorName, items }),
      });
      const data: unknown = await response.json();
      const result = resultSchema.safeParse(data);
      if (!response.ok || !result.success) {
        setSaveError(
          errorSchema.safeParse(data).data?.error || "保存できませんでした。再試行してください。",
        );
        return;
      }
      setDirty(false);
      router.flush(result.data.location);
      await router.visit(result.data.location);
    } catch {
      setSaveError("通信できませんでした。入力内容は残っています。再試行してください。");
    } finally {
      setPhase("idle");
    }
  }

  async function deleteCollection() {
    if (
      !window.confirm(
        "この選集を削除しますか？公開ページと共有画像が見られなくなります。この操作は取り消せません。",
      )
    )
      return;
    setPhase("deleting");
    setSaveError("");
    try {
      const response = await fetch(`/c/${initialData.id}/edit?delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revision: initialData.revision }),
      });
      const data: unknown = await response.json();
      const result = resultSchema.safeParse(data);
      if (!response.ok || !result.success) {
        setSaveError(errorSchema.safeParse(data).data?.error || "削除できませんでした。");
        return;
      }
      setDirty(false);
      router.flush(result.data.location);
      await router.visit(result.data.location);
    } catch {
      setSaveError("通信エラーにより削除できませんでした。");
    } finally {
      setPhase("idle");
    }
  }

  const selectedIndex =
    selection?.kind === "edit" ? items.findIndex((item) => item.videoId === selection.videoId) : -1;
  const selectedItem = selectedIndex >= 0 ? items[selectedIndex] : undefined;

  return (
    <div className="editor">
      <form onSubmit={save}>
        <fieldset disabled={busy} className="fieldset">
          <header className="board-toolbar">
            <h1>{isEdit ? "試合を編集" : "好きな試合を選ぶ"}</h1>
            <span className="counter">
              {items.length} / {MAX_PICKS}
            </span>
          </header>
          <ol className="match-board" aria-label="選んだ試合">
            {items.map((item, index) => (
              <li
                key={item.videoId}
                className={dragOver === item.videoId ? "board-cell is-over" : "board-cell"}
                onDragOver={(event) => {
                  if (!busy && draggedId.current) {
                    event.preventDefault();
                    setDragOver(item.videoId);
                  }
                }}
                onDrop={(event) => {
                  if (!draggedId.current) return;
                  event.preventDefault();
                  const from = items.findIndex((pick) => pick.videoId === draggedId.current);
                  if (from >= 0) move(from, index);
                  draggedId.current = null;
                  setDragOver(null);
                }}
              >
                <button
                  type="button"
                  className="board-tile"
                  draggable={!busy}
                  disabled={busy}
                  title={item.title}
                  aria-label={`${index + 1}試合目を編集。${item.title}`}
                  onClick={() => setSelection({ kind: "edit", videoId: item.videoId })}
                  onDragStart={(event) => {
                    draggedId.current = item.videoId;
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", item.videoId);
                  }}
                  onDragEnd={() => {
                    draggedId.current = null;
                    setDragOver(null);
                  }}
                  onKeyDown={(event) => {
                    const offsets: Record<string, number> = {
                      ArrowLeft: -1,
                      ArrowRight: 1,
                      ArrowUp: -3,
                      ArrowDown: 3,
                    };
                    const offset = offsets[event.key];
                    if (offset !== undefined) {
                      event.preventDefault();
                      move(index, index + offset);
                    }
                  }}
                >
                  <VideoImage videoId={item.videoId} title={item.title} />
                  <span className="tile-edit" aria-hidden="true">
                    編集
                  </span>
                </button>
              </li>
            ))}
            {items.length < MAX_PICKS && (
              <li className="board-cell">
                <button
                  type="button"
                  className="add-tile"
                  onClick={() => setSelection({ kind: "add" })}
                  aria-label="YouTubeの試合を追加"
                >
                  <span aria-hidden="true">＋</span>
                  <span>試合を追加</span>
                </button>
              </li>
            )}
            {Array.from({ length: Math.max(0, MAX_PICKS - items.length - 1) }, (_, index) => (
              <li key={`empty-${index}`} className="board-cell ghost-tile" aria-hidden="true" />
            ))}
          </ol>
          <p className="board-help">
            {items.length
              ? "画像を押すと編集・入れ替え。ドラッグで並び替え。"
              : "＋からYouTubeの試合URLを追加できます。1試合から共有できます。"}
          </p>
          {message && (
            <p className="sr-only" role="status">
              {message}
            </p>
          )}
          {removed && (
            <div className="undo-bar" role="status">
              <span>試合を外しました。</span>
              <button
                type="button"
                className="text-button"
                disabled={
                  busy ||
                  items.length >= MAX_PICKS ||
                  items.some((item) => item.videoId === removed.item.videoId)
                }
                onClick={() => {
                  setItems((current) => [
                    ...current.slice(0, removed.index),
                    removed.item,
                    ...current.slice(removed.index),
                  ]);
                  setRemoved(null);
                  setDirty(true);
                }}
              >
                元に戻す
              </button>
            </div>
          )}
          <details className="disclosure">
            <summary>タイトル・名前を変更</summary>
            <div className="settings-fields">
              <label className="field">
                タイトル
                <input
                  type="text"
                  value={customTitle}
                  maxLength={80}
                  placeholder={title}
                  onChange={(event) => {
                    setCustomTitle(event.target.value);
                    setDirty(true);
                  }}
                />
              </label>
              <label className="field">
                名前（任意）
                <input
                  type="text"
                  value={authorName}
                  maxLength={40}
                  placeholder="匿名"
                  onChange={(event) => {
                    setAuthorName(event.target.value);
                    setDirty(true);
                  }}
                />
              </label>
            </div>
          </details>
          {saveError && (
            <p className="error" role="alert">
              {saveError}
            </p>
          )}
          <div className="save-bar">
            <span className="muted">
              {dirty ? "変更はまだ保存されていません" : "共有すると誰でも見られます"}
            </span>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={busy || Boolean(selection) || !items.length}
            >
              {phase === "saving" ? "保存中…" : submitLabel}
            </button>
          </div>
          <details className="disclosure owner-info">
            <summary>編集について</summary>
            <p>作成したブラウザから編集できます。Cookieを削除すると編集できなくなります。</p>
          </details>
          {isEdit && (
            <details className="disclosure">
              <summary>この選集を削除</summary>
              <div className="danger-body">
                <p>公開ページと共有画像が見られなくなります。この操作は取り消せません。</p>
                <button
                  type="button"
                  className="text-button danger"
                  disabled={busy}
                  onClick={deleteCollection}
                >
                  {phase === "deleting" ? "削除中…" : "削除する"}
                </button>
              </div>
            </details>
          )}
        </fieldset>
      </form>
      {selection && (
        <VideoDialog
          item={selectedItem}
          index={selectedIndex}
          count={items.length}
          existingIds={items.map((item) => item.videoId)}
          onClose={() => setSelection(null)}
          onRemove={() => {
            if (!selectedItem) return;
            setRemoved({ item: selectedItem, index: selectedIndex });
            setItems((current) => current.filter((item) => item.videoId !== selectedItem.videoId));
            setSelection(null);
            setDirty(true);
          }}
          onApply={(item, position) => {
            setItems((current) => {
              if (selection.kind === "add") return [...current, item];
              const next = current.filter((pick) => pick.videoId !== selection.videoId);
              next.splice(position, 0, item);
              return next;
            });
            setSelection(null);
            setDirty(true);
            setMessage(selection.kind === "edit" ? "試合を変更しました。" : "試合を追加しました。");
          }}
        />
      )}
    </div>
  );
}
