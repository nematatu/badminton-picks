import type { ReactNode } from "react";
import { Link } from "@void/react";
import "./app.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return <div className="site-shell">
    <a className="skip-link" href="#main">操作画面へ移動</a>
    <header className="site-header"><div className="header-container">
      <Link href="/" className="brand" aria-label="RALLY PICKS ホーム">RALLY PICKS</Link>
      <nav aria-label="メイン"><Link href="/" className="nav-link">みんなの選集</Link></nav>
    </div></header>
    <main id="main" className="site-main">{children}</main>
  </div>;
}
