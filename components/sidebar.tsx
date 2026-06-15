"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./sidebar-context";
import { ThemeToggle } from "./theme-toggle";
import {
  LayoutDashboard, Users, Megaphone, TrendingUp, Settings, X, Search, BookUser, Kanban, Zap, MessageSquare, UsersRound, CalendarDays, Wifi, ShieldOff, BarChart2, List, LifeBuoy,
} from "lucide-react";

const ACCENT = "#00CFFF";

const navItems = [
  { label: "Visão Geral",  href: "/dashboard",               icon: LayoutDashboard, disabled: false, exact: true  },
  { label: "Prospecção",   href: "/dashboard/prospeccao",             icon: Search, disabled: false, exact: true  },
  { label: "Automatizar",  href: "/dashboard/prospeccao/automatizar",            icon: Zap,          disabled: false, exact: true  },
  { label: "Chat ao Vivo", href: "/dashboard/prospeccao/automatizar/chat",       icon: MessageSquare, disabled: false, exact: false, sub: true },
  { label: "Grupos",       href: "/dashboard/grupos",                             icon: UsersRound,    disabled: false, exact: false, sub: true },
  { label: "Instâncias",   href: "/dashboard/prospeccao/automatizar/instancias", icon: Wifi,          disabled: false, exact: false, sub: true },
  { label: "Blacklist",    href: "/dashboard/blacklist",                          icon: ShieldOff,     disabled: false, exact: false, sub: true },
  { label: "Sequências",   href: "/dashboard/prospeccao/automatizar/sequencias",  icon: List,          disabled: false, exact: false, sub: true },
  { label: "Pipeline",     href: "/dashboard/pipeline",      icon: BarChart2,       disabled: false, exact: false },
  { label: "CRM",          href: "/dashboard/crm",           icon: BookUser,        disabled: false, exact: false },
  { label: "Kanban",       href: "/dashboard/kanban",        icon: Kanban,          disabled: false, exact: false },
  { label: "Clientes",     href: "/dashboard/clientes",      icon: Users,           disabled: false, exact: false },
  { label: "Financeiro",   href: "/dashboard/financeiro",    icon: TrendingUp,      disabled: false, exact: false },
  { label: "Anúncios",     href: "/dashboard/anuncios",      icon: Megaphone,       disabled: false, exact: false },
  { label: "Agenda",       href: "/dashboard/agenda",        icon: CalendarDays,    disabled: false, exact: false },
  { label: "Suporte",      href: "/dashboard/suporte",       icon: LifeBuoy,        disabled: false, exact: false },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { open, close } = useSidebar();

  const inner = (
    <aside style={{
      width: "240px", minWidth: "240px", background: "var(--up-sidebar)",
      borderRight: `1px solid var(--up-border)`, height: "100vh",
      display: "flex", flexDirection: "column", zIndex: 40,
      transition: "background 0.2s, border-color 0.2s",
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 24px 20px", borderBottom: `1px solid var(--up-border)`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/upflu-logo.png" alt="UPFLU" style={{ height: "28px", width: "auto", objectFit: "contain" }} />
          <p style={{ fontSize: "10px", fontWeight: "400", color: "var(--up-text-label)", marginTop: "8px", letterSpacing: "0.18em", textTransform: "uppercase", margin: "8px 0 0" }}>
            Admin Panel
          </p>
        </div>
        <button className="sidebar-close-btn" onClick={close} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--up-text-label)", display: "none", padding: "4px" }}>
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "20px 12px", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          if (item.disabled) {
            return (
              <div key={item.href} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "6px", cursor: "not-allowed", opacity: 0.35 }}>
                <item.icon size={16} color="var(--up-text-muted)" strokeWidth={1.5} />
                <span style={{ fontSize: "13px", fontWeight: "400", color: "var(--up-text-muted)", flex: 1 }}>{item.label}</span>
                <span style={{ fontSize: "8px", fontWeight: "600", color: ACCENT, background: "rgba(0,207,255,0.08)", border: `1px solid rgba(0,207,255,0.18)`, padding: "2px 6px", borderRadius: "3px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Em breve
                </span>
              </div>
            );
          }
          return (
            <Link key={item.href} href={item.href} onClick={close}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 12px", borderRadius: "6px", textDecoration: "none",
                background: isActive ? "var(--up-nav-active)" : "transparent",
                borderLeft: isActive ? `2px solid ${ACCENT}` : "2px solid transparent",
                paddingLeft: (item as { sub?: boolean }).sub ? "28px" : "10px",
                transition: "background 0.15s",
                marginTop: (item as { sub?: boolean }).sub ? "-1px" : "0",
              }}
              className={!isActive ? "nav-link-hover" : ""}>
              <item.icon size={(item as { sub?: boolean }).sub ? 13 : 16} color={isActive ? ACCENT : (item as { sub?: boolean }).sub ? "var(--up-text-dim)" : "var(--up-text-muted)"} strokeWidth={isActive ? 2 : 1.5} />
              <span style={{ fontSize: (item as { sub?: boolean }).sub ? "12px" : "13px", fontWeight: isActive ? "600" : "400", color: isActive ? ACCENT : (item as { sub?: boolean }).sub ? "var(--up-text-dim)" : "var(--up-text-muted)" }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px", borderTop: `1px solid var(--up-border)` }}>
        {(() => {
          const isActive = pathname === "/dashboard/configuracoes";
          return (
            <Link href="/dashboard/configuracoes" onClick={close} className={!isActive ? "nav-link-hover" : ""}
              style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "6px", textDecoration: "none", background: isActive ? "var(--up-nav-active)" : "transparent", borderLeft: isActive ? `2px solid ${ACCENT}` : "2px solid transparent", transition: "background 0.15s" }}>
              <Settings size={16} color={isActive ? ACCENT : "var(--up-text-muted)"} strokeWidth={isActive ? 2 : 1.5} />
              <span style={{ fontSize: "13px", fontWeight: isActive ? "600" : "400", color: isActive ? ACCENT : "var(--up-text-muted)" }}>Configurações</span>
            </Link>
          );
        })()}
        <ThemeToggle />
      </div>
    </aside>
  );

  return (
    <>
      <style>{`
        .nav-link-hover:hover { background: var(--up-nav-hover) !important; }

        /* Desktop */
        .sidebar-desktop { display: flex; position: fixed; top: 0; left: 0; height: 100vh; }
        .sidebar-overlay { display: none; }

        /* Mobile */
        @media (max-width: 768px) {
          .sidebar-desktop {
            position: fixed; top: 0; left: 0; height: 100vh;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            z-index: 50;
          }
          .sidebar-desktop.sidebar-open {
            transform: translateX(0);
          }
          .sidebar-overlay {
            display: block;
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.6);
            z-index: 49;
          }
          .sidebar-close-btn { display: flex !important; }
        }
      `}</style>

      {open && <div className="sidebar-overlay" onClick={close} />}
      <div className={`sidebar-desktop${open ? " sidebar-open" : ""}`}>
        {inner}
      </div>
    </>
  );
}
