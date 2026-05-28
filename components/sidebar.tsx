"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./sidebar-context";
import {
  LayoutDashboard, Images, Users, FileText, Megaphone, BarChart2, TrendingUp, Settings, X, Search, BookUser, Kanban, ListChecks,
} from "lucide-react";

const ACCENT = "#00CFFF";
const BORDER = "rgba(255,255,255,0.07)";

const navItems = [
  { label: "Visão Geral",  href: "/dashboard",               icon: LayoutDashboard, disabled: false, exact: true  },
  { label: "Prospecção",   href: "/dashboard/prospeccao",    icon: Search,          disabled: false, exact: false },
  { label: "CRM",          href: "/dashboard/crm",           icon: BookUser,        disabled: false, exact: false },
  { label: "Kanban",       href: "/dashboard/kanban",        icon: Kanban,          disabled: false, exact: false },
  { label: "Onboarding",   href: "/dashboard/onboarding",   icon: ListChecks,      disabled: false, exact: false },
  { label: "Conteúdo",     href: "/dashboard/conteudo",      icon: Images,          disabled: false, exact: false },
  { label: "Clientes",     href: "/dashboard/clientes",      icon: Users,           disabled: false, exact: false },
  { label: "Financeiro",   href: "/dashboard/financeiro",    icon: TrendingUp,      disabled: false, exact: false },
  { label: "Propostas",    href: "/dashboard/propostas",     icon: FileText,        disabled: false, exact: false },
  { label: "Anúncios",     href: "/dashboard/anuncios",      icon: Megaphone,       disabled: false, exact: false },
  { label: "Relatórios",   href: "/dashboard/relatorios",    icon: BarChart2,       disabled: true,  exact: false },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { open, close } = useSidebar();

  const inner = (
    <aside style={{
      width: "240px", minWidth: "240px", background: "#080808",
      borderRight: `1px solid ${BORDER}`, height: "100vh",
      display: "flex", flexDirection: "column", zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 24px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/upflu-logo.png" alt="UPFLU" style={{ height: "28px", width: "auto", objectFit: "contain" }} />
          <p style={{ fontSize: "10px", fontWeight: "400", color: "#777068", marginTop: "8px", letterSpacing: "0.18em", textTransform: "uppercase", margin: "8px 0 0" }}>
            Admin Panel
          </p>
        </div>
        <button className="sidebar-close-btn" onClick={close} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#777068", display: "none", padding: "4px" }}>
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "20px 12px", display: "flex", flexDirection: "column", gap: "2px" }}>
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          if (item.disabled) {
            return (
              <div key={item.href} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "6px", cursor: "not-allowed", opacity: 0.35 }}>
                <item.icon size={16} color="#9A9288" strokeWidth={1.5} />
                <span style={{ fontSize: "13px", fontWeight: "400", color: "#9A9288", flex: 1 }}>{item.label}</span>
                <span style={{ fontSize: "8px", fontWeight: "600", color: ACCENT, background: "rgba(0,207,255,0.08)", border: `1px solid rgba(0,207,255,0.18)`, padding: "2px 6px", borderRadius: "3px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Em breve
                </span>
              </div>
            );
          }
          return (
            <Link key={item.href} href={item.href} onClick={close}
              style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "6px", textDecoration: "none", background: isActive ? "rgba(0,207,255,0.07)" : "transparent", borderLeft: isActive ? `2px solid ${ACCENT}` : "2px solid transparent", paddingLeft: "10px", transition: "background 0.15s" }}
              className={!isActive ? "nav-link-hover" : ""}>
              <item.icon size={16} color={isActive ? ACCENT : "#9A9288"} strokeWidth={isActive ? 2 : 1.5} />
              <span style={{ fontSize: "13px", fontWeight: isActive ? "600" : "400", color: isActive ? ACCENT : "#9A9288" }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px", borderTop: `1px solid ${BORDER}` }}>
        {(() => {
          const isActive = pathname === "/dashboard/configuracoes";
          return (
            <Link href="/dashboard/configuracoes" onClick={close} className={!isActive ? "nav-link-hover" : ""}
              style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "6px", textDecoration: "none", background: isActive ? "rgba(0,207,255,0.07)" : "transparent", borderLeft: isActive ? `2px solid ${ACCENT}` : "2px solid transparent", transition: "background 0.15s" }}>
              <Settings size={16} color={isActive ? ACCENT : "#9A9288"} strokeWidth={isActive ? 2 : 1.5} />
              <span style={{ fontSize: "13px", fontWeight: isActive ? "600" : "400", color: isActive ? ACCENT : "#9A9288" }}>Configurações</span>
            </Link>
          );
        })()}
      </div>
    </aside>
  );

  return (
    <>
      <style>{`
        .nav-link-hover:hover { background: rgba(255,255,255,0.03) !important; }

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
