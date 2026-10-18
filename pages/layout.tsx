import type { ReactNode } from "react";
import { Link } from "@void/react";
import "./app.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return <div className="site-shell">
    <a className="skip-link" href="#main">本文へ移動</a>
    <header className="site-header"><div className="header-container">
      <Link href="/" className="brand" aria-label="RALLY PICKS ホーム">
        <svg width="28" height="34" viewBox="0 0 28 34" fill="none" aria-hidden="true">
          <rect x="2" y="2" width="24" height="30" stroke="currentColor" strokeWidth="1.5" />
          <path d="M2 17H26M5 2V32M23 2V32M2 11H26M2 23H26M14 2V11M14 23V32" stroke="currentColor" />
        </svg><span>RALLY PICKS</span>
      </Link>
      <nav aria-label="メイン"><Link href="/" className="nav-link">みんなの選集</Link>
        <Link href="/new" className="btn btn-primary">選集をつくる</Link></nav>
    </div></header>
    <main id="main" className="site-main">{children}</main>
    <footer className="site-footer"><span>RALLY PICKS</span><p>好きな試合を、選んで共有。</p></footer>
  </div>;
}
