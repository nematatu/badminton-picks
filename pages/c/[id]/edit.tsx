import { useState } from "react";
import CollectionEditor from "../../../src/components/CollectionEditor";
import type { Props } from "./edit.server";

export default function EditPage({ collection }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!collection) {
    return (
      <div className="empty-state card">
        <h2>選集が見つかりませんでした</h2>
      </div>
    );
  }

  async function handleDelete() {
    if (!window.confirm("本当にこの選集を削除しますか？この操作は取り消せません。")) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/c/${collection.id}/edit?delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revision: collection.revision }),
      });

      if (!res.ok) {
        setDeleteError("削除に失敗しました。");
        setIsDeleting(false);
        return;
      }

      window.location.href = "/";
    } catch {
      setDeleteError("通信エラーが発生しました。");
      setIsDeleting(false);
    }
  }

  return (
    <div className="edit-page-wrap">
      <CollectionEditor
        initialData={collection}
        submitUrl={`/c/${collection.id}/edit?update`}
        submitLabel="変更を保存する"
        isEdit={true}
      />

      <div className="danger-zone-wrap">
        <div className="danger-zone card">
          <div className="danger-zone-text">
            <h3 className="danger-title">この選集を削除する</h3>
            <p className="text-muted text-xs">
              公開ページと共有画像のURLが無効になります。この操作は取り消せません。
            </p>
          </div>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "削除中..." : "選集を削除"}
          </button>
        </div>
        {deleteError && <div className="alert-error mt-2">{deleteError}</div>}
      </div>
    </div>
  );
}
