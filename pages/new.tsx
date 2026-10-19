import CollectionEditor from "../src/components/CollectionEditor";
import type { Props } from "./new.server";

export default function NewPage({ newId }: Props) {
  return <CollectionEditor initialData={{ id: newId }} submitUrl="/new" submitLabel="ページを作成して共有" />;
}
