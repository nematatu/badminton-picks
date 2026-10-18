import type { ReactNode } from "react";

export default function ActionMenu({ label, children }: { label: string; children: ReactNode }) {
  return <details className="action-menu" onKeyDown={(event) => {
    if (event.key === "Escape") { event.currentTarget.open = false; event.currentTarget.querySelector("summary")?.focus(); }
  }} onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
  }} onClick={(event) => {
    if (event.target instanceof Element && event.target.closest("button, a")) event.currentTarget.open = false;
  }}>
    <summary aria-label={label}><svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true"><circle cx="3" cy="9" r="1.5" /><circle cx="9" cy="9" r="1.5" /><circle cx="15" cy="9" r="1.5" /></svg></summary>
    <div className="menu-items">{children}</div>
  </details>;
}
