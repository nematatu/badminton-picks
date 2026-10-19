import { useEffect, useRef, useState } from "react";
import type { PickItem } from "../../db/schema";
import { MAX_PICKS, errorSchema } from "../lib/collection";
import { extractYouTubeVideoId, youTubeMetaSchema } from "../lib/youtube";
import { VideoImage } from "./CollectionPreview";

type Lookup =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; item: PickItem }
  | { kind: "error"; message: string };

export default function VideoDialog({
  item,
  slot,
  existingIds,
  onApply,
  onRemove,
  onClose,
}: {
  item?: PickItem;
  slot: number;
  existingIds: string[];
  onApply: (item: PickItem, position: number) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const controller = useRef<AbortController | null>(null);
  const [url, setUrl] = useState(item ? `https://www.youtube.com/watch?v=${item.videoId}` : "");
  const [retry, setRetry] = useState(0);
  const [position, setPosition] = useState(slot);
  const [note, setNote] = useState(item?.note || "");
  const [lookup, setLookup] = useState<Lookup>(item ? { kind: "ready", item } : { kind: "idle" });

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const trigger = document.activeElement;
    node.showModal();
    node.querySelector<HTMLInputElement>("#video-url")?.focus();
    return () => {
      controller.current?.abort();
      node.close();
      requestAnimationFrame(() => {
        if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
      });
    };
  }, []);

  useEffect(() => {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      setLookup(
        url.trim()
          ? { kind: "error", message: "YouTubeの動画URLを入力してください。" }
          : { kind: "idle" },
      );
      return;
    }
    if (videoId === item?.videoId) {
      setLookup({ kind: "ready", item });
      return;
    }
    if (existingIds.includes(videoId)) {
      setLookup({ kind: "error", message: "この試合はすでに追加されています。" });
      return;
    }
    const request = new AbortController();
    controller.current = request;
    const timer = setTimeout(async () => {
      setLookup({ kind: "loading" });
      try {
        const response = await fetch(`/api/youtube?url=${encodeURIComponent(url.trim())}`, {
          signal: request.signal,
        });
        const data: unknown = await response.json();
        if (request.signal.aborted) return;
        const meta = youTubeMetaSchema.safeParse(data);
        if (!response.ok || !meta.success) {
          setLookup({
            kind: "error",
            message:
              errorSchema.safeParse(data).data?.error ||
              "動画を取得できませんでした。URLをご確認ください。",
          });
        } else {
          setLookup({ kind: "ready", item: { ...meta.data, note: "" } });
        }
      } catch {
        if (!request.signal.aborted)
          setLookup({ kind: "error", message: "通信できませんでした。もう一度お試しください。" });
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      request.abort();
    };
  }, [url, retry, item, existingIds]);

  return (
    <dialog
      ref={dialog}
      className="video-dialog"
      onCancel={onClose}
      aria-labelledby="video-dialog-title"
    >
      <div className="dialog-head">
        <h2 id="video-dialog-title">
          {slot + 1}番の試合{item ? "を編集" : "を追加"}
        </h2>
        <button type="button" className="close-button" onClick={onClose} aria-label="閉じる">
          ×
        </button>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (lookup.kind !== "loading") setRetry((value) => value + 1);
        }}
      >
        <label className="field" htmlFor="video-url">
          YouTubeのURL
        </label>
        <div className="url-row">
          <input
            id="video-url"
            autoFocus
            type="text"
            inputMode="url"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            value={url}
            placeholder="https://youtu.be/…"
            onChange={(event) => {
              controller.current?.abort();
              setUrl(event.target.value);
              setLookup({ kind: "idle" });
            }}
          />
        </div>
      </form>
      {lookup.kind === "loading" && (
        <p className="muted lookup-status" role="status">
          動画を取得しています…
        </p>
      )}
      {lookup.kind === "error" && (
        <div className="lookup-error">
          <p className="error" role="alert">
            {lookup.message}
          </p>
          <button
            type="button"
            className="text-button"
            onClick={() => setRetry((value) => value + 1)}
          >
            再試行
          </button>
        </div>
      )}
      {lookup.kind === "ready" && (
        <div className="video-preview">
          <div className="preview-image">
            <VideoImage videoId={lookup.item.videoId} title={lookup.item.title} />
          </div>
          <p className="preview-title">{lookup.item.title}</p>
          <p className="muted">{lookup.item.author}</p>
        </div>
      )}
      {lookup.kind !== "ready" && (
        <div className="preview-placeholder" aria-hidden="true">
          URLを貼ると、ここに試合が表示されます
        </div>
      )}
      <details className="disclosure video-settings" open={Boolean(item?.note)}>
        <summary>メモ・並び順</summary>
        <label className="field note-field">
          ひとこと（任意）
          <textarea
            value={note}
            rows={2}
            maxLength={240}
            onChange={(event) => setNote(event.target.value)}
            placeholder="この試合を選んだ理由など"
          />
        </label>
        <div className="tile-options">
          <div className="move-buttons" aria-label="並び替え">
            <span className="muted">マス {position + 1} / {MAX_PICKS}</span>
            <button
              type="button"
              className="btn"
              disabled={position === 0 || lookup.kind === "loading"}
              onClick={() => setPosition((value) => value - 1)}
            >
              前へ
            </button>
            <button
              type="button"
              className="btn"
              disabled={position === MAX_PICKS - 1 || lookup.kind === "loading"}
              onClick={() => setPosition((value) => value + 1)}
            >
              後ろへ
            </button>
          </div>
        </div>
      </details>
      {item && (
        <button
          type="button"
          className="text-button danger"
          disabled={lookup.kind === "loading"}
          onClick={onRemove}
        >
          この試合を外す
        </button>
      )}
      <div className="dialog-actions">
        <button className="btn" type="button" onClick={onClose}>
          キャンセル
        </button>
        <button
          className="btn btn-primary"
          type="button"
          disabled={lookup.kind !== "ready"}
          onClick={() => {
            if (lookup.kind === "ready") onApply({ ...lookup.item, note }, position);
          }}
        >
          {item ? "変更する" : "追加する"}
        </button>
      </div>
    </dialog>
  );
}
