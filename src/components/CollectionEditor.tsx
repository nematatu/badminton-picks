import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "@void/react";
import type { PickItem } from "../../db/schema";
import MatchInfo from "./MatchInfo";
import ActionMenu from "./ActionMenu";
import { MAX_PICKS, errorSchema, resultSchema } from "../lib/collection";
import { youTubeMetaSchema } from "../lib/youtube";

type Phase = "idle" | "fetching" | "saving" | "deleting";

function NoteInput({ item, index, onChange }: { item: PickItem; index: number; onChange: (value: string) => void }) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!textarea.current) return;
    textarea.current.style.height = "auto";
    textarea.current.style.height = `${textarea.current.scrollHeight}px`;
  }, [item.note]);
  return <textarea ref={textarea} className="note-input" value={item.note || ""} maxLength={240} rows={1}
    aria-label={`${index + 1}試合目のひとこと`} placeholder="ひとこと（任意）" onChange={(event) => onChange(event.target.value)} />;
}

export default function CollectionEditor({ initialData, submitUrl, submitLabel, isEdit = false }: {
  initialData: { id: string; title?: string; authorName?: string; items?: PickItem[]; revision?: number };
  submitUrl: string; submitLabel: string; isEdit?: boolean;
}) {
  const router = useRouter();
  const initialTitle = initialData.title || "";
  const initialAutoTitle = `私を構成するバドミントンの${initialData.items?.length || 0}試合`;
  const [customTitle, setCustomTitle] = useState(initialTitle === initialAutoTitle ? "" : initialTitle);
  const [authorName, setAuthorName] = useState(initialData.authorName === "匿名" ? "" : initialData.authorName || "");
  const [items, setItems] = useState<PickItem[]>(initialData.items || []);
  const [inputUrl, setInputUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [urlError, setUrlError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [message, setMessage] = useState("");
  const [removed, setRemoved] = useState<{ item: PickItem; index: number } | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const draggedId = useRef<string | null>(null);
  const urlInput = useRef<HTMLInputElement>(null);
  const [dirty, setDirty] = useState(false);
  const busy = phase !== "idle";
  const title = customTitle.trim() || `私を構成するバドミントンの${items.length}試合`;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    const guardLink = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest("a");
      if (!link || link.target === "_blank" || link.hasAttribute("download") || link.hash) return;
      if (!window.confirm("保存していない変更があります。保存せずに移動しますか？")) {
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

  async function addVideo() {
    if (busy || !inputUrl.trim() || (items.length >= MAX_PICKS && !replacingId)) return;
    setPhase("fetching"); setUrlError(""); setMessage("");
    try {
      const response = await fetch(`/api/youtube?url=${encodeURIComponent(inputUrl.trim())}`);
      const data: unknown = await response.json();
      const meta = youTubeMetaSchema.safeParse(data);
      if (!response.ok || !meta.success) {
        setUrlError(errorSchema.safeParse(data).data?.error || "動画情報を取得できませんでした。"); return;
      }
      if (items.some((item) => item.videoId === meta.data.videoId && item.videoId !== replacingId)) {
        setUrlError("この試合はすでに追加されています。"); return;
      }
      setItems((current) => replacingId ? current.map((item) => item.videoId === replacingId
        ? { ...meta.data, note: item.note } : item) : [...current, { ...meta.data, note: "" }]);
      setInputUrl(""); setReplacingId(null); setDirty(true);
      setMessage(replacingId ? "試合を入れ替えました。" : "試合を追加しました。");
      requestAnimationFrame(() => urlInput.current?.focus());
    } catch { setUrlError("通信できませんでした。URLを残していますので、もう一度お試しください。"); }
    finally { setPhase("idle"); }
  }

  function move(from: number, to: number) {
    if (busy || from === to || to < 0 || to >= items.length) return;
    setItems((current) => {
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setDirty(true); setMessage(`${to + 1}番目へ移動しました。`);
    requestAnimationFrame(() => document.getElementById(`grip-${items[from].videoId}`)?.focus());
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy || !items.length) return;
    setPhase("saving"); setSaveError("");
    try {
      const response = await fetch(submitUrl, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...initialData, title, authorName, items }),
      });
      const data: unknown = await response.json();
      const result = resultSchema.safeParse(data);
      if (!response.ok || !result.success) {
        setSaveError(errorSchema.safeParse(data).data?.error || "保存できませんでした。入力内容はこの画面に残っています。"); return;
      }
      setDirty(false);
      router.flush(result.data.location);
      await router.visit(result.data.location);
    } catch { setSaveError("保存できませんでした。入力内容はこの画面に残っています。通信を確認して再試行してください。"); }
    finally { setPhase("idle"); }
  }

  async function deleteCollection() {
    if (busy || !window.confirm("この選集を削除しますか？公開ページと共有画像が見られなくなります。この操作は取り消せません。")) return;
    setPhase("deleting"); setSaveError("");
    try {
      const response = await fetch(`/c/${initialData.id}/edit?delete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revision: initialData.revision }) });
      const data: unknown = await response.json();
      const result = resultSchema.safeParse(data);
      if (!response.ok || !result.success) { setSaveError(errorSchema.safeParse(data).data?.error || "削除できませんでした。"); return; }
      setDirty(false);
      router.flush(result.data.location);
      await router.visit(result.data.location);
    } catch { setSaveError("通信できませんでした。もう一度お試しください。"); }
    finally { setPhase("idle"); }
  }

  return <div className="editor-container">
    <div className="workspace-heading"><h1>{isEdit ? "選集を編集" : "好きな試合を選ぶ"}</h1><span className="workspace-state">{phase === "saving" ? "保存中…" : dirty ? "未保存" : isEdit ? "保存済み" : "新しい選集"}</span></div>
    <form onSubmit={save}>
      <fieldset disabled={phase === "saving" || phase === "deleting"} className="editor-fields">
        <div className="url-form">
          <label className="field-label" htmlFor="youtube-url">{replacingId ? "入れ替える試合のURL" : "YouTubeのURL"}</label>
          <div className="url-input-row"><input id="youtube-url" ref={urlInput} type="text" inputMode="url" autoCapitalize="none"
            autoComplete="off" spellCheck={false} className="text-input" value={inputUrl}
            onChange={(event) => setInputUrl(event.target.value)} placeholder="https://youtu.be/…"
            onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing) { event.preventDefault(); void addVideo(); } }}
            disabled={phase === "fetching" || (items.length >= MAX_PICKS && !replacingId)} aria-describedby="url-feedback" />
            <button type="button" className="btn btn-add" onClick={addVideo} disabled={busy || !inputUrl.trim() || (items.length >= MAX_PICKS && !replacingId)}>
              {phase === "fetching" ? "取得中…" : replacingId ? "入れ替え" : "追加"}</button></div>
          {replacingId && <button type="button" className="text-button" disabled={busy} onClick={() => { setReplacingId(null); setInputUrl(""); setUrlError(""); }}>入れ替えをやめる</button>}
          <div id="url-feedback">{urlError && <p className="error-message" role="alert">{urlError}</p>}</div>
          <p className="status-message" role="status">{message || (items.length >= MAX_PICKS ? "9試合まで選べます。" : "")}</p>
        </div>
        {removed && <div className="undo-notice" role="status"><span>試合を外しました。</span><button type="button" className="text-button"
          disabled={items.length >= MAX_PICKS || busy || items.some((item) => item.videoId === removed.item.videoId)} onClick={() => {
            setItems((current) => [...current.slice(0, removed.index), removed.item, ...current.slice(removed.index)]);
            setRemoved(null); setDirty(true);
          }}>元に戻す</button></div>}
        {!items.length && <p className="empty-picks">URLを貼ると、ここに試合が並びます。</p>}
        <ol className="picks-list editor-picks" aria-label="選んだ試合">{items.map((item, index) => <li key={item.videoId} className={`pick-row${dragOver === item.videoId ? " drag-over" : ""}`}
          onDragOver={(event) => { if (!busy && draggedId.current) { event.preventDefault(); setDragOver(item.videoId); } }}
          onDrop={(event) => {
            if (!draggedId.current) return;
            event.preventDefault();
            const from = items.findIndex((pick) => pick.videoId === draggedId.current);
            if (from >= 0) move(from, index);
            draggedId.current = null; setDragOver(null);
          }}>
          <button type="button" id={`grip-${item.videoId}`} className="drag-handle" draggable={!busy} disabled={busy}
            aria-label={`${index + 1}試合目を並び替え`} title="ドラッグ、または上下キーで並び替え"
            onDragStart={(event) => { draggedId.current = item.videoId; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", item.videoId); }}
            onDragEnd={() => { draggedId.current = null; setDragOver(null); }}
            onKeyDown={(event) => { if (event.key === "ArrowUp" || event.key === "ArrowDown") { event.preventDefault(); move(index, index + (event.key === "ArrowUp" ? -1 : 1)); } }}>
            <svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor" aria-hidden="true"><circle cx="4" cy="4" r="1" /><circle cx="8" cy="4" r="1" /><circle cx="4" cy="9" r="1" /><circle cx="8" cy="9" r="1" /><circle cx="4" cy="14" r="1" /><circle cx="8" cy="14" r="1" /></svg>
          </button>
          <MatchInfo item={item}><NoteInput item={item} index={index} onChange={(value) => {
            setItems((current) => current.map((pick) => pick.videoId === item.videoId ? { ...pick, note: value } : pick)); setDirty(true);
          }} /></MatchInfo>
          <ActionMenu label={`${index + 1}試合目の操作`}>
            <button type="button" disabled={busy || index === 0} onClick={() => move(index, index - 1)}>上へ</button>
            <button type="button" disabled={busy || index === items.length - 1} onClick={() => move(index, index + 1)}>下へ</button>
            <button type="button" disabled={busy} onClick={() => { setReplacingId(item.videoId); setInputUrl(""); setUrlError(""); urlInput.current?.focus(); }}>URLを入れ替える</button>
            <button type="button" className="remove-action" disabled={busy} onClick={() => {
              setRemoved({ item, index }); setItems((current) => current.filter((pick) => pick.videoId !== item.videoId));
              if (replacingId === item.videoId) { setReplacingId(null); setInputUrl(""); } setDirty(true);
            }}>外す</button>
          </ActionMenu>
        </li>)}</ol>
        <details className="metadata-settings"><summary>名前・タイトルを変更</summary><div className="metadata-fields">
          <label className="field-group"><span className="field-label">選集のタイトル</span><input className="text-input" value={customTitle} maxLength={80} placeholder={title} onChange={(event) => { setCustomTitle(event.target.value); setDirty(true); }} /></label>
          <label className="field-group"><span className="field-label">名前（任意）</span><input className="text-input" value={authorName} maxLength={40} placeholder="未入力なら匿名" onChange={(event) => { setAuthorName(event.target.value); setDirty(true); }} /></label>
        </div></details>
        {saveError && <p className="error-message" role="alert">{saveError}</p>}
        <div className="editor-actions"><span className="pick-count">{items.length} / {MAX_PICKS}試合</span><button className="btn btn-primary" type="submit" disabled={busy || !items.length}>{phase === "saving" ? "保存中…" : submitLabel}</button></div>
        <details className="privacy-note"><summary>公開・編集について</summary><p>共有すると誰でも見られます。編集・削除はこのブラウザから行えます。Cookieを消すと再編集できません。</p></details>
        {isEdit && <details className="delete-settings"><summary>選集を削除</summary><p>公開ページと共有画像が見られなくなります。</p><button type="button" className="text-button remove-action" disabled={busy} onClick={deleteCollection}>{phase === "deleting" ? "削除中…" : "この選集を削除する"}</button></details>}
      </fieldset>
    </form>
  </div>;
}
