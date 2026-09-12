"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const COLLAPSE_STORAGE_KEY = "katalagge-rail-collapsed";

type RailStore = { id: string; name: string };

function initialsFor(name: string): string {
  const words = name.replace(/^Franquia\s+/i, "").trim().split(/\s+/);
  return words
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function Rail({ groupName, stores }: { groupName: string; stores: RailStore[] }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [lojasOpen, setLojasOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true");
    } catch {
      // localStorage unavailable (private mode, blocked) — default expanded
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <aside className="rail" data-collapsed={collapsed}>
      <div className="rail-group">
        <div className="rail-mark">{initialsFor(groupName)}</div>
        <div className="rail-group-text">
          <div className="rail-group-name">{groupName}</div>
          <div className="rail-group-sub">
            {stores.length} loja{stores.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>
      <div className="rail-divider" />

      <nav className="rail-nav">
        <Link href="/dashboard" className={`rail-nav-item ${pathname === "/dashboard" ? "is-active" : ""}`}>
          <svg viewBox="0 0 20 20">
            <rect x="2.5" y="2.5" width="6" height="6" rx="1.3" />
            <rect x="11.5" y="2.5" width="6" height="6" rx="1.3" />
            <rect x="2.5" y="11.5" width="6" height="6" rx="1.3" />
            <rect x="11.5" y="11.5" width="6" height="6" rx="1.3" />
          </svg>
          <span className="rail-nav-label">Visão do grupo</span>
        </Link>

        <div className={`rail-accordion ${lojasOpen ? "is-open" : ""}`}>
          <button type="button" className="rail-nav-item rail-accordion-toggle" onClick={() => setLojasOpen((o) => !o)}>
            <svg viewBox="0 0 20 20">
              <path d="M2.5 8.5V16h15V8.5" />
              <path d="M1.5 4.5h17l1 4h-19l1-4z" />
              <path d="M8 16v-4.5h4V16" />
            </svg>
            <span className="rail-nav-label">Lojas</span>
            <span className="rail-nav-meta">{stores.length}</span>
            <span className="rail-chevron">⌄</span>
          </button>
          {lojasOpen && (
            <div className="rail-lojas-sub">
              {stores.length === 0 ? (
                <span className="rail-loja-more">Nenhuma loja ainda</span>
              ) : (
                stores.map((s) => (
                  <span className="rail-loja-row" key={s.id}>
                    <span className="rail-dot" />
                    <span className="truncate">{s.name}</span>
                  </span>
                ))
              )}
            </div>
          )}
        </div>

        <span className="rail-nav-item is-disabled">
          <svg viewBox="0 0 20 20">
            <path d="M10 3l8.5 14.5h-17L10 3z" />
            <line x1="10" y1="8.5" x2="10" y2="12" />
            <circle cx="10" cy="14.5" r=".6" fill="currentColor" stroke="none" />
          </svg>
          <span className="rail-nav-label">Inconsistências</span>
          <span className="rail-nav-soon">em breve</span>
        </span>

        <span className="rail-nav-item is-disabled">
          <svg viewBox="0 0 20 20">
            <line x1="4" y1="16" x2="4" y2="10" />
            <line x1="10" y1="16" x2="10" y2="6" />
            <line x1="16" y1="16" x2="16" y2="12" />
          </svg>
          <span className="rail-nav-label">Relatório</span>
          <span className="rail-nav-soon">em breve</span>
        </span>

        <div className="rail-divider rail-divider-tight" />

        <span className="rail-nav-item is-disabled">
          <svg viewBox="0 0 20 20">
            <path d="M10 13V4" />
            <path d="M6 8l4-4 4 4" />
            <path d="M3 16h14" />
          </svg>
          <span className="rail-nav-label">Enviar planilha</span>
          <span className="rail-nav-soon">em breve</span>
        </span>

        <span className="rail-nav-item is-disabled">
          <svg viewBox="0 0 20 20">
            <circle cx="5" cy="10" r="2.6" />
            <circle cx="15" cy="10" r="2.6" />
            <line x1="7.6" y1="10" x2="12.4" y2="10" />
          </svg>
          <span className="rail-nav-label">Fontes de dados</span>
          <span className="rail-nav-soon">em breve</span>
        </span>

        <Link
          href="/dashboard/pessoas"
          className={`rail-nav-item ${pathname === "/dashboard/pessoas" ? "is-active" : ""}`}
        >
          <svg viewBox="0 0 20 20">
            <circle cx="7.2" cy="7" r="2.7" />
            <path d="M2 16c0-2.8 2.3-4.5 5.2-4.5S12.4 13.2 12.4 16" />
            <circle cx="14.5" cy="7.5" r="2.1" />
            <path d="M13.2 11.7c2.3.3 3.8 1.8 3.8 4.3" />
          </svg>
          <span className="rail-nav-label">Pessoas</span>
        </Link>

        <span className="rail-nav-item is-disabled">
          <svg viewBox="0 0 20 20">
            <rect x="2" y="5" width="16" height="11" rx="2" />
            <line x1="2" y1="9" x2="18" y2="9" />
          </svg>
          <span className="rail-nav-label">Faturas</span>
          <span className="rail-nav-soon">em breve</span>
        </span>
      </nav>

      <div className="rail-foot">
        <button
          className="rail-collapse-toggle"
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? "Expandir menu" : "Reduzir menu"}
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>
    </aside>
  );
}
