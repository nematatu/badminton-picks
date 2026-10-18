import { useEffect, useRef, useState } from "react";

type CopyState = "idle" | "copying" | "copied" | "error";

export default function CopyButton({ value }: { value: string }) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const label = state === "copied" ? "コピーしました" : state === "error" ? "再試行する" : "リンクをコピー";

  async function copy() {
    if (state === "copying") return;
    clearTimeout(timer.current);
    setState("copying");
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
      timer.current = setTimeout(() => setState("idle"), 2000);
    } catch { setState("error"); }
  }

  return <div className="copy-control">
    <button className="btn copy-button" type="button" onClick={copy} disabled={state === "copying"} data-copy-state={state} aria-label={label}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        {state === "copied" ? <path className="copy-check" d="m4 12 5 5L20 6" /> : <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>}
      </svg>
      <span className="copy-label" aria-hidden="true"><span className="copy-measure">リンクをコピー</span><span className="copy-measure">コピーしました</span><span className="copy-current">{label}</span></span>
    </button>
    <span className="sr-only" role="status">{state === "copied" ? "リンクをコピーしました。" : ""}</span>
    {state === "error" && <p className="copy-error" role="alert">コピーできませんでした。<a href={value}>{value}</a></p>}
  </div>;
}
