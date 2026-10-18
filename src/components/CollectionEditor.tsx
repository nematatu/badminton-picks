import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useRouter } from "@void/react";
import type { PickItem } from "../../db/schema";
import CollectionPreview, { VideoImage } from "./CollectionPreview";
import { MAX_PICKS, errorSchema, resultSchema } from "../lib/collection";
import { youTubeMetaSchema } from "../lib/youtube";

export default function CollectionEditor({ initialData, submitUrl, submitLabel, isEdit = false }: {
  initialData: { id: string; title?: string; authorName?: string; items?: PickItem[]; revision?: number };
  submitUrl: string; submitLabel: string; isEdit?: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData.title || "私を構成するバドミントンの試合");
  const [authorName, setAuthorName] = useState(initialData.authorName || "");
  const [items, setItems] = useState<PickItem[]>(initialData.items || []);
  const [inputUrl, setInputUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [message, setMessage] = useState("");
  const [removed, setRemoved] = useState<{ item: PickItem; index: number } | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const urlInput = useRef<HTMLInputElement>(null);
  const [dirty, setDirty] = useState(false);
  const busy = pending || saving;

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
    if (busy || !inputUrl.trim()) return;
    setPending(true); setUrlError(""); setMessage("");
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
    } catch { setUrlError("通信できませんでした。URLを残していますので、もう一度お試しください。"); }
    finally { setPending(false); }
  }

  function move(index: number, offset: number) {
    setItems((current) => {
      const next = [...current];
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
      return next;
    });
    setDirty(true); setMessage(`${index + 1}番目の試合を${offset < 0 ? "上" : "下"}へ移動しました。`);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setSaving(true); setSaveError("");
    try {
      const response = await fetch(submitUrl, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...initialData, title, authorName, items }),
      });
      const data: unknown = await response.json();
      const result = resultSchema.safeParse(data);
      if (!response.ok || !result.success) {
        setSaveError(errorSchema.safeParse(data).data?.error || "保存できませんでした。入力内容はこの画面に残っています。");
        return;
      }
      setDirty(false);
      router.flush(result.data.location);
      await router.visit(result.data.location);
    } catch { setSaveError("保存できませんでした。入力内容はこの画面に残っています。通信を確認して再試行してください。"); }
    finally { setSaving(false); }
  }

  return <div className="editor-container">
    <Link href={isEdit ? `/c/${initialData.id}` : "/"} className="back-link">{isEdit ? "選集へ戻る" : "みんなの選集へ"}</Link>
    <div className="page-heading"><h1>{isEdit ? "選集を編集する" : "好きな試合を選ぶ"}</h1>
      <p>YouTubeのURLから、1〜9試合を選べます。</p></div>
    <form onSubmit={save} className="editor-layout">
      <fieldset disabled={saving} className="editor-fields">
        <section className="editor-section">
          <label className="field-label" htmlFor="youtube-url">{replacingId ? "入れ替える試合のURL" : "YouTubeの試合URL"}</label>
          <div className="url-input-row"><input id="youtube-url" ref={urlInput} type="text" inputMode="url" autoCapitalize="none"
            autoComplete="off" spellCheck={false} className="text-input" value={inputUrl}
            onChange={(event) => setInputUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=…"
            onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void addVideo(); } }}
            disabled={pending || (items.length >= MAX_PICKS && !replacingId)} aria-describedby="url-feedback" />
            <button type="button" className="btn btn-primary" onClick={addVideo}
              disabled={busy || !inputUrl.trim() || (items.length >= MAX_PICKS && !replacingId)}>
              {pending ? "取得中…" : replacingId ? "入れ替え" : "追加"}</button></div>
          {replacingId && <button type="button" className="text-link" disabled={busy} onClick={() => { setReplacingId(null); setInputUrl(""); }}>入れ替えをやめる</button>}
          <div id="url-feedback">{urlError && <p className="error-message" role="alert">{urlError}</p>}</div>
          <p className="status-message" role="status">{message || (items.length >= MAX_PICKS ? "9試合選びました。並び順やメモを整えて公開できます。" : "")}</p>
        </section>
        <section className="editor-section">
          <div className="section-header"><h2>選んだ試合</h2><span>{items.length} / {MAX_PICKS}</span></div>
          {removed && <div className="undo-notice" role="status"><span>試合を外しました。</span><button type="button" className="text-link"
            disabled={items.length >= MAX_PICKS || busy || items.some((item) => item.videoId === removed.item.videoId)} onClick={() => {
              setItems((current) => [...current.slice(0, removed.index), removed.item, ...current.slice(removed.index)]);
              setRemoved(null); setDirty(true);
            }}>取り消す</button></div>}
          {items.length === 0 ? <p className="empty-picks">URLを追加すると、ここに試合が並びます。</p> : (
            <ol className="picks-list">{items.map((item, index) => <li key={item.videoId} className="editor-pick">
              <div className="pick-summary"><span className="pick-order">{index + 1}</span>
                <div className="pick-thumbnail"><VideoImage videoId={item.videoId} title={item.title} /></div>
                <div className="pick-info"><h3>{item.title}</h3><p>{item.author}</p></div></div>
              <label className="sr-only" htmlFor={`note-${item.videoId}`}>{index + 1}試合目を選んだ理由</label>
              <textarea id={`note-${item.videoId}`} className="text-area" value={item.note || ""} maxLength={240} rows={2}
                placeholder="選んだ理由や、好きな場面（任意）" onChange={(event) => {
                  setItems((current) => current.map((pick) => pick.videoId === item.videoId ? { ...pick, note: event.target.value } : pick)); setDirty(true);
                }} />
              <div className="pick-actions"><button type="button" className="small-action" disabled={busy || index === 0} onClick={() => move(index, -1)} aria-label={`${index + 1}試合目を上へ`}>↑ 上へ</button>
                <button type="button" className="small-action" disabled={busy || index === items.length - 1} onClick={() => move(index, 1)} aria-label={`${index + 1}試合目を下へ`}>↓ 下へ</button>
                <button type="button" className="small-action" disabled={busy} onClick={() => { setReplacingId(item.videoId); setInputUrl(""); urlInput.current?.focus(); }}>入れ替え</button>
                <button type="button" className="small-action remove-action" disabled={busy} aria-label={`${index + 1}試合目を外す`} onClick={() => {
                  setRemoved({ item, index }); setItems((current) => current.filter((pick) => pick.videoId !== item.videoId));
                  if (replacingId === item.videoId) setReplacingId(null); setDirty(true);
                }}>外す</button></div>
            </li>)}</ol>
          )}
        </section>
        <section className="editor-section metadata-fields">
          <div className="field-group"><label className="field-label" htmlFor="col-title">選集のタイトル</label>
            <input id="col-title" className="text-input" value={title} maxLength={80} required onChange={(event) => { setTitle(event.target.value); setDirty(true); }} /></div>
          <div className="field-group"><label className="field-label" htmlFor="col-author">あなたの名前 <span>任意</span></label>
            <input id="col-author" className="text-input" value={authorName} maxLength={40} placeholder="ニックネーム・未入力なら匿名" onChange={(event) => { setAuthorName(event.target.value); setDirty(true); }} /></div>
        </section>
        {saveError && <p className="error-message" role="alert">{saveError}</p>}
        <div className="submit-box"><p>公開後は誰でも見られます。編集・削除はこのブラウザから。<br />Cookieを消すと、再編集できなくなります。</p>
          <button className="btn btn-primary" type="submit" disabled={busy || items.length === 0 || !title.trim()}>{saving ? "保存中…" : submitLabel}</button></div>
      </fieldset>
      <aside className="editor-preview"><h2>選集のプレビュー</h2>
        <CollectionPreview items={items} title={title} authorName={authorName} />
        <p>選んだ順に並びます。公開すると、画像付きのリンクで共有できます。</p></aside>
    </form>
  </div>;
}
