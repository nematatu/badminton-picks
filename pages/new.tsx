import CollectionEditor from "../src/components/CollectionEditor";
import type { Props } from "./new.server";

export default function NewPage({ newId }: Props) {
  return (
    <CollectionEditor
      initialData={{ id: newId }}
      submitUrl="/new"
      submitMethod="POST"
      submitLabel="選集を公開する"
      isEdit={false}
    />
  );
}
