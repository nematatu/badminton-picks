import type { ReactNode } from "react";
import { Link } from "@void/react";
import "./app.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        本文へスキップ
      </a>
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Rally Picks ホーム">
          RALLY PICKS
        </Link>
        <Link href="/" className="nav-link">
          みんなの選集
        </Link>
      </header>
      <main id="main">{children}</main>
    </div>
  );
}
