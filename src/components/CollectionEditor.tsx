import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "@void/react";
import type { PickItem } from "../../db/schema";
import { VideoImage } from "./CollectionPreview";
import VideoDialog from "./VideoDialog";
import { MAX_PICKS, errorSchema, resultSchema } from "../lib/collection";
import { boardSlots, placeItem, positionedItems } from "../lib/board";

type Phase = "idle" | "saving" | "deleting";
type Selection = { slot: number };

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
  const [items, setItems] = useState<PickItem[]>(positionedItems(initialData.items || []));
  const [phase, setPhase] = useState<Phase>("idle");
  const [saveError, setSaveError] = useState("");
  const [message, setMessage] = useState("");
  const [removed, setRemoved] = useState<PickItem | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const draggedSlot = useRef<number | null>(null);
  const [dirty, setDirty] = useState(false);

  const slots = boardSlots(items);
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
    const item = slots[from];
    if (busy || !item || from === to || to < 0 || to >= MAX_PICKS) return;
    setItems((current) => placeItem(current, item, from, to));
    setDirty(true);
    setMessage(`${to + 1}番のマスに移動しました。`);
    requestAnimationFrame(() => document.getElementById(`slot-${initialData.id}-${to}`)?.focus());
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

  const selectedItem = selection ? slots[selection.slot] : undefined;

  return (
    <div className="editor">
      <form onSubmit={save}>
        <fieldset disabled={busy} className="fieldset">
          <header className="canvas-heading">
            <h1>私を構成するバドミントンの試合</h1>
            <p>マスを選んで、YouTubeのURLを貼るだけ。</p>
          </header>
          <section className="board-section" aria-label="試合を選ぶ">
            <div className="board-progress">
              <p><span>選んだ試合</span><strong>{items.length} / {MAX_PICKS}</strong></p>
              <progress value={items.length} max={MAX_PICKS} aria-label="選んだ試合数" />
            </div>
            <p className="board-help">マスを押して追加・編集 · ドラッグで入れ替え</p>
            <div className="share-canvas">
              <ol className="match-board" aria-label="選んだ試合">
                {slots.map((item, slot) => (
                  <li
                    key={slot}
                    data-slot={slot}
                    className={dragOver === slot ? "board-cell is-over" : "board-cell"}
                    onDragOver={(event) => {
                      if (!busy && draggedSlot.current !== null) {
                        event.preventDefault();
                        setDragOver(slot);
                      }
                    }}
                    onDrop={(event) => {
                      if (draggedSlot.current === null) return;
                      event.preventDefault();
                      move(draggedSlot.current, slot);
                      draggedSlot.current = null;
                      setDragOver(null);
                    }}
                  >
                    <button
                      type="button"
                      id={`slot-${initialData.id}-${slot}`}
                      className={item ? "board-tile" : "add-tile"}
                      draggable={Boolean(item) && !busy}
                      disabled={busy}
                      title={item?.title}
                      aria-label={item ? `${slot + 1}番の試合を編集。${item.title}` : `${slot + 1}番のマスに試合を追加`}
                      onClick={() => setSelection({ slot })}
                      onDragStart={(event) => {
                        if (!item) return;
                        draggedSlot.current = slot;
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", String(slot));
                      }}
                      onDragEnd={() => {
                        draggedSlot.current = null;
                        setDragOver(null);
                      }}
                      onKeyDown={(event) => {
                        const offsets: Record<string, number> = {
                          ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3,
                        };
                        const offset = offsets[event.key];
                        if (item && offset !== undefined) {
                          event.preventDefault();
                          move(slot, slot + offset);
                        }
                      }}
                    >
                      {item ? <>
                        <VideoImage videoId={item.videoId} title={item.title} />
                        <span className="tile-title" aria-hidden="true">{item.title}</span>
                      </> : <span className="slot-number" aria-hidden="true">{slot + 1}</span>}
                    </button>
                  </li>
                ))}
              </ol>
            </div>

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
                    items.some((item) => item.videoId === removed.videoId) ||
                    Boolean(slots[removed.slot ?? 0])
                  }
                  onClick={() => {
                    setItems((current) => positionedItems([...current, removed]));
                    setRemoved(null);
                    setDirty(true);
                  }}
                >
                  元に戻す
                </button>
              </div>
            )}
          </section>
          <div className="publish-fields">
            <label className="field author-field">
              名前（任意）
              <input type="text" value={authorName} maxLength={40} placeholder="匿名"
                onChange={(event) => { setAuthorName(event.target.value); setDirty(true); }} />
            </label>
            <details className="disclosure title-setting">
              <summary>タイトルを変更</summary>
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
              </div>
            </details>
            {saveError && (
              <p className="error" role="alert">
                {saveError}
              </p>
            )}
            <div className="save-bar">
              <button className="btn btn-primary" type="submit"
                disabled={busy || Boolean(selection) || !items.length}>
                {phase === "saving" ? "保存中…" : submitLabel}
              </button>
              <span className="muted">{dirty ? "共有すると変更が保存されます" : "1試合から共有できます"}</span>
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
          </div>
        </fieldset>
      </form>
      {selection && (
        <VideoDialog
          item={selectedItem}
          slot={selection.slot}
          existingIds={items.map((item) => item.videoId)}
          onClose={() => setSelection(null)}
          onRemove={() => {
            if (!selectedItem) return;
            setRemoved(selectedItem);
            setItems((current) => current.filter((item) => item.videoId !== selectedItem.videoId));
            setSelection(null);
            setDirty(true);
          }}
          onApply={(item, position) => {
            setItems((current) => placeItem(current, item, selection.slot, position));
            setSelection(null);
            setDirty(true);
            setMessage(selectedItem ? "試合を変更しました。" : "試合を追加しました。");
          }}
        />
      )}
    </div>
  );
}
