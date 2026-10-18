import CollectionEditor from "../../../src/components/CollectionEditor";
import type { Props } from "./edit.server";

export default function EditPage({ collection }: Props) {
  return <CollectionEditor initialData={collection} submitUrl={`/c/${collection.id}/edit?update`} submitLabel="変更を保存" isEdit />;
}
