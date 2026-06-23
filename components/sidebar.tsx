"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./sidebar-context";
import { ThemeToggle } from "./theme-toggle";
import {
  LayoutDashboard, Users, Megaphone, TrendingUp, Settings, X, Search, BookUser, Kanban, Zap, MessageSquare, UsersRound, CalendarDays, Wifi, ShieldOff, BarChart2, List, LifeBuoy, ChevronLeft, ChevronRight,
} from "lucide-react";

const ACCENT = "#00CFFF";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
  exact?: boolean;
  sub?: boolean;
  divider?: boolean;
};

const navItems: NavItem[] = [
  { label: "Visão Geral",  href: "/dashboard",               icon: LayoutDashboard, exact: true  },
  { label: "Prospecção",   href: "/dashboard/prospeccao",    icon: Search, exact: true  },
  // ── Automação ──
  { label: "Automatizar",  href: "/dashboard/prospeccao/automatizar",            icon: Zap,          divider: true },
  { label: "Chat ao Vivo", href: "/dashboard/prospeccao/automatizar/chat",       icon: MessageSquare, sub: true },
  { label: "Grupos",       href: "/dashboard/grupos",                             icon: UsersRound,    sub: true },
  { label: "Instâncias",   href: "/dashboard/prospeccao/automatizar/instancias", icon: Wifi,          sub: true },
  { label: "Blacklist",    href: "/dashboard/blacklist",                          icon: ShieldOff,     sub: true },
  { label: "Sequências",   href: "/dashboard/prospeccao/automatizar/sequencias", icon: List,          sub: true },
  // ── Vendas ──
  { label: "Pipeline",     href: "/dashboard/pipeline",   icon: BarChart2 },
  { label: "CRM",          href: "/dashboard/crm",        icon: BookUser  },
  { label: "Kanban",       href: "/dashboard/kanban",     icon: Kanban    },
  // ── Gestão ──
  { label: "Clientes",     href: "/dashboard/clientes",   icon: Users     },
  { label: "Financeiro",   href: "/dashboard/financeiro", icon: TrendingUp },
  { label: "Anúncios",     href: "/dashboard/anuncios",   icon: Megaphone  },
  { label: "Agenda",       href: "/dashboard/agenda",     icon: CalendarDays },
  { label: "Suporte",      href: "/dashboard/suporte",    icon: LifeBuoy   },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { open, close, collapsed, toggleCollapse } = useSidebar();

  const inner = (
    <aside style={{
      width: collapsed ? "64px" : "240px",
      minWidth: collapsed ? "64px" : "240px",
      background: "var(--up-sidebar)",
      borderRight: `1px solid var(--up-border)`,
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      zIndex: 40,
      transition: "width 0.2s ease, min-width 0.2s ease, background 0.2s, border-color 0.2s",
      overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? "24px 0 20px" : "24px 24px 20px", borderBottom: `1px solid var(--up-border)`, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", transition: "padding 0.2s ease" }}>
        {!collapsed && (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/upflu-logo.png" alt="UPFLU" style={{ height: "28px", width: "auto", objectFit: "contain" }} />
            <p style={{ fontSize: "10px", fontWeight: "400", color: "var(--up-text-label)", margin: "8px 0 0", letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Admin Panel
            </p>
          </div>
        )}
        {collapsed && (
          <div style={{ width: "32px", height: "32px", background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.18)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", color: ACCENT, flexShrink: 0 }}>
            U
          </div>
        )}
        <button
          className="sidebar-close-btn"
          onClick={close}
          style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--up-text-label)", display: "none", padding: "4px" }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: collapsed ? "16px 8px" : "20px 12px", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto", overflowX: "hidden" }}>
        {navItems.map((item, idx) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const prevItem = navItems[idx - 1];
          const showDivider = item.divider && !collapsed && prevItem;

          return (
            <div key={item.href}>
              {/* Divider label before "Automatizar" group */}
              {showDivider && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "10px 12px 6px", opacity: 0.45 }}>
                  <div style={{ flex: 1, height: "1px", background: "var(--up-border)" }} />
                  <span style={{ fontSize: "9px", fontWeight: "600", color: "var(--up-text-label)", letterSpacing: "0.18em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Automação</span>
                  <div style={{ flex: 1, height: "1px", background: "var(--up-border)" }} />
                </div>
              )}

              {item.disabled ? (
                <div
                  title={collapsed ? item.label : undefined}
                  style={{ display: "flex", alignItems: "center", gap: "10px", padding: collapsed ? "10px 0" : "10px 12px", borderRadius: "6px", cursor: "not-allowed", opacity: 0.35, justifyContent: collapsed ? "center" : "flex-start" }}
                >
                  <item.icon size={16} color="var(--up-text-muted)" strokeWidth={1.5} />
                  {!collapsed && (
                    <>
                      <span style={{ fontSize: "13px", fontWeight: "400", color: "var(--up-text-muted)", flex: 1 }}>{item.label}</span>
                      <span style={{ fontSize: "8px", fontWeight: "600", color: ACCENT, background: "rgba(0,207,255,0.08)", border: `1px solid rgba(0,207,255,0.18)`, padding: "2px 6px", borderRadius: "3px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Em breve
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  onClick={close}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: collapsed ? "0" : "10px",
                    padding: collapsed ? "10px 0" : item.sub ? "8px 12px 8px 28px" : "10px 12px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    background: isActive ? "var(--up-nav-active)" : "transparent",
                    borderLeft: isActive && !collapsed ? `2px solid ${ACCENT}` : "2px solid transparent",
                    transition: "background 0.15s",
                    justifyContent: collapsed ? "center" : "flex-start",
                    marginTop: item.sub && !collapsed ? "-1px" : "0",
                    position: "relative",
                  }}
                  className={!isActive ? "nav-link-hover" : ""}
                >
                  <item.icon
                    size={item.sub && !collapsed ? 13 : 16}
                    color={isActive ? ACCENT : item.sub && !collapsed ? "var(--up-text-dim)" : "var(--up-text-muted)"}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  {!collapsed && (
                    <span style={{ fontSize: item.sub ? "12px" : "13px", fontWeight: isActive ? "600" : "400", color: isActive ? ACCENT : item.sub ? "var(--up-text-dim)" : "var(--up-text-muted)" }}>
                      {item.label}
                    </span>
                  )}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: collapsed ? "12px 8px" : "12px", borderTop: `1px solid var(--up-border)`, display: "flex", flexDirection: "column", gap: "2px" }}>
        {(() => {
          const isActive = pathname === "/dashboard/configuracoes";
          return (
            <Link
              href="/dashboard/configuracoes"
              onClick={close}
              title={collapsed ? "Configurações" : undefined}
              className={!isActive ? "nav-link-hover" : ""}
              style={{ display: "flex", alignItems: "center", gap: collapsed ? "0" : "10px", padding: collapsed ? "10px 0" : "10px 12px", borderRadius: "6px", textDecoration: "none", background: isActive ? "var(--up-nav-active)" : "transparent", borderLeft: isActive && !collapsed ? `2px solid ${ACCENT}` : "2px solid transparent", transition: "background 0.15s", justifyContent: collapsed ? "center" : "flex-start" }}
            >
              <Settings size={16} color={isActive ? ACCENT : "var(--up-text-muted)"} strokeWidth={isActive ? 2 : 1.5} />
              {!collapsed && <span style={{ fontSize: "13px", fontWeight: isActive ? "600" : "400", color: isActive ? ACCENT : "var(--up-text-muted)" }}>Configurações</span>}
            </Link>
          );
        })()}

        {/* Collapse toggle — desktop only */}
        <button
          className="sidebar-collapse-btn"
          onClick={toggleCollapse}
          title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          style={{ display: "flex", alignItems: "center", gap: collapsed ? "0" : "10px", padding: collapsed ? "10px 0" : "10px 12px", borderRadius: "6px", background: "transparent", border: "none", cursor: "pointer", color: "var(--up-text-label)", justifyContent: collapsed ? "center" : "flex-start", width: "100%", transition: "background 0.15s", fontFamily: "inherit" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--up-nav-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {collapsed ? <ChevronRight size={16} strokeWidth={1.5} /> : <><ChevronLeft size={16} strokeWidth={1.5} /><span style={{ fontSize: "13px" }}>Recolher</span></>}
        </button>

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
          .sidebar-desktop.sidebar-open { transform: translateX(0); }
          .sidebar-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 49; }
          .sidebar-close-btn { display: flex !important; }
          .sidebar-collapse-btn { display: none !important; }
        }
      `}</style>

      {open && <div className="sidebar-overlay" onClick={close} />}
      <div className={`sidebar-desktop${open ? " sidebar-open" : ""}`}>
        {inner}
      </div>
    </>
  );
}
