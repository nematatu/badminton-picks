import { useState, type FormEvent } from "react";
import { Link, useRouter } from "@void/react";
import { ShuttlecockIcon } from "./Icons";
import type { PickItem } from "../../db/schema";

export interface EditorProps {
  initialData?: {
    id?: string;
    title?: string;
    authorName?: string;
    items?: PickItem[];
  };
  submitUrl: string;
  submitMethod?: "POST" | "PUT";
  submitLabel?: string;
  isEdit?: boolean;
}

export default function CollectionEditor({
  initialData,
  submitUrl,
  submitMethod = "POST",
  submitLabel = "選集を公開する",
  isEdit = false,
}: EditorProps) {
  const router = useRouter();

  const [id] = useState(initialData?.id || "");
  const [title, setTitle] = useState(initialData?.title || "私を構成するバドミントンの3試合");
  const [authorName, setAuthorName] = useState(initialData?.authorName || "");
  const [items, setItems] = useState<PickItem[]>(initialData?.items || []);

  const [inputUrl, setInputUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Add YouTube video via /api/youtube
  async function handleAddVideo() {
    if (!inputUrl.trim()) return;
    setUrlError(null);
    setIsFetching(true);

    try {
      const res = await fetch(`/api/youtube?url=${encodeURIComponent(inputUrl.trim())}`);
      const data = (await res.json()) as { error?: string; videoId: string; title: string; author: string };

      if (!res.ok) {
        setUrlError(data.error || "動画情報を取得できませんでした");
        setIsFetching(false);
        return;
      }

      if (items.some((it) => it.videoId === data.videoId)) {
        setUrlError("この試合はすでに追加されています");
        setIsFetching(false);
        return;
      }

      if (items.length >= 9) {
        setUrlError("追加できるのは最大9試合までです");
        setIsFetching(false);
        return;
      }

      setItems([
        ...items,
        {
          videoId: data.videoId,
          title: data.title,
          author: data.author,
          note: "",
        },
      ]);
      setInputUrl("");
    } catch {
      setUrlError("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setIsFetching(false);
    }
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const newItems = [...items];
    const temp = newItems[index - 1];
    newItems[index - 1] = newItems[index];
    newItems[index] = temp;
    setItems(newItems);
  }

  function handleMoveDown(index: number) {
    if (index === items.length - 1) return;
    const newItems = [...items];
    const temp = newItems[index + 1];
    newItems[index + 1] = newItems[index];
    newItems[index] = temp;
    setItems(newItems);
  }

  function handleRemove(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function handleNoteChange(index: number, note: string) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], note };
    setItems(newItems);
  }

  function handleTitleChange(index: number, newTitle: string) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], title: newTitle };
    setItems(newItems);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      setSubmitError("少なくとも1試合動画を追加してください。");
      return;
    }
    if (!title.trim()) {
      setSubmitError("選集のタイトルを入力してください。");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        id,
        title: title.trim(),
        authorName: (authorName.trim() || "匿名プレイヤー").slice(0, 50),
        items,
      };

      const res = await fetch(submitUrl, {
        method: submitMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setSubmitError(data.error || "保存に失敗しました。もう一度お試しください。");
        setIsSubmitting(false);
        return;
      }

      // If redirected to /c/:id
      if (res.redirected) {
        window.location.href = res.url;
        return;
      }

      const redirectHeader = res.headers.get("Location");
      if (redirectHeader) {
        window.location.href = redirectHeader;
        return;
      }

      // Default navigate to collection page
      window.location.href = `/c/${id}`;
    } catch {
      setSubmitError("エラーが発生しました。通信環境を確認してください。");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="editor-container">
      <div className="editor-nav">
        <Link href={isEdit ? `/c/${id}` : "/"} className="back-link">
          ← {isEdit ? "選集詳細へもどる" : "トップへもどる"}
        </Link>
      </div>

      <div className="editor-header">
        <h1 className="editor-title">{isEdit ? "選集を編集する" : "好きな試合を選ぶ"}</h1>
        <p className="editor-subtitle">
          YouTubeの試合URLを貼り付けて試合を追加し、見どころを添えて公開できます。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="editor-form">
        {/* Meta settings */}
        <div className="editor-card card">
          <div className="field-group">
            <label className="field-label" htmlFor="col-title">
              選集のタイトル <span className="required">必須</span>
            </label>
            <input
              id="col-title"
              type="text"
              className="text-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 私を構成するバドミントンの3試合"
              maxLength={80}
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="col-author">
              選者のお名前 / ニックネーム
            </label>
            <input
              id="col-author"
              type="text"
              className="text-input"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="例: たかし（バド歴8年）"
              maxLength={40}
            />
          </div>
        </div>

        {/* Add video section */}
        <div className="editor-card card">
          <h2 className="card-section-title">試合（YouTube動画）を追加する</h2>
          <p className="text-muted text-sm mb-3">
            公式大会や感動した試合のYouTube URLを入力してください（3〜4試合がおすすめ）。
          </p>

          <div className="url-input-row">
            <input
              type="url"
              className="text-input url-input"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddVideo();
                }
              }}
              placeholder="https://www.youtube.com/watch?v=..."
              disabled={isFetching || items.length >= 9}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddVideo}
              disabled={isFetching || !inputUrl.trim() || items.length >= 9}
            >
              {isFetching ? "取得中..." : "追加"}
            </button>
          </div>

          {urlError && <div className="alert-error mt-2">{urlError}</div>}
        </div>

        {/* Picked items list */}
        <div className="editor-card card">
          <div className="items-header">
            <h2 className="card-section-title">
              選んだ試合リスト ({items.length} / 9)
            </h2>
            {items.length > 0 && (
              <span className="text-muted text-xs">↑↓ボタンで並び順を変更できます</span>
            )}
          </div>

          {items.length === 0 ? (
            <div className="empty-picks">
              <span className="empty-icon text-muted" aria-hidden="true">
                <ShuttlecockIcon style={{ width: 36, height: 36 }} />
              </span>
              <p className="text-muted text-sm">
                まだ試合が追加されていません。上の入力欄にYouTubeのURLを貼って「追加」してください。
              </p>
            </div>
          ) : (
            <div className="picks-list">
              {items.map((item, index) => (
                <div key={item.videoId} className="pick-item-card">
                  <div className="pick-thumb-col">
                    <img
                      src={`https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`}
                      alt={item.title}
                      className="pick-thumb"
                    />
                    <div className="order-badge">#{index + 1}</div>
                  </div>

                  <div className="pick-detail-col">
                    <input
                      type="text"
                      className="text-input pick-title-input"
                      value={item.title}
                      onChange={(e) => handleTitleChange(index, e.target.value)}
                      placeholder="試合のタイトル"
                      maxLength={120}
                    />
                    <span className="text-muted text-xs channel-name">
                      {item.author}
                    </span>

                    <textarea
                      className="text-area note-input"
                      value={item.note || ""}
                      onChange={(e) => handleNoteChange(index, e.target.value)}
                      placeholder="ひとこと・選んだ理由（例: 第3ゲームのデュースの緊張感がたまらない。人生のベストゲーム）"
                      rows={2}
                      maxLength={240}
                    />
                  </div>

                  <div className="pick-actions-col">
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      title="上へ移動"
                      aria-label="上へ移動"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === items.length - 1}
                      title="下へ移動"
                      aria-label="下へ移動"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      className="btn-icon btn-icon-delete"
                      onClick={() => handleRemove(index)}
                      title="削除"
                      aria-label="削除"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        {submitError && <div className="alert-error">{submitError}</div>}

        <div className="submit-box">
          <p className="device-notice text-muted text-xs">
            ※ この端末のブラウザからいつでも再編集・削除できます（アカウント登録不要）。
          </p>
          <button
            type="submit"
            className="btn btn-primary btn-lg submit-btn"
            disabled={isSubmitting || items.length === 0}
          >
            {isSubmitting ? "保存中..." : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
