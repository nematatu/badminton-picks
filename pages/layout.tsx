import type { ReactNode } from "react";
import { Link } from "@void/react";
import { ShuttlecockIcon, PlusIcon } from "../src/components/Icons";
import "./app.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-container">
          <Link href="/" className="brand">
            <span className="brand-icon" aria-hidden="true">
              <ShuttlecockIcon />
            </span>
            <div>
              <span className="brand-title">RALLY PICKS</span>
              <span className="brand-subtitle">私を構成するバドミントンの試合</span>
            </div>
          </Link>
          <nav>
            <Link href="/new" className="header-cta">
              <PlusIcon /> 選集をつくる
            </Link>
          </nav>
        </div>
      </header>

      <main className="site-main">{children}</main>

      <footer className="site-footer">
        <div className="footer-inner">
          <p className="font-semibold">RALLY PICKS - Badminton Match Picks</p>
          <p className="text-muted text-xs">
            心に残る名ラリー・魂が震えた1戦を、YouTubeリンクで集めて共有する場所。
          </p>
        </div>
      </footer>
    </div>
  );
}
