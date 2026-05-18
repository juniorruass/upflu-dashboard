"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Images,
  Users,
  FileText,
  Megaphone,
  BarChart2,
  Settings,
} from "lucide-react";

const GOLD = "#BEA06A";
const BORDER = "rgba(255,255,255,0.07)";

const navItems = [
  { label: "Visão Geral", href: "/dashboard", icon: LayoutDashboard, disabled: false, exact: true },
  { label: "Conteúdo", href: "/dashboard/conteudo", icon: Images, disabled: true, exact: false },
  { label: "Clientes", href: "/dashboard/clientes", icon: Users, disabled: true, exact: false },
  { label: "Propostas", href: "/dashboard/propostas", icon: FileText, disabled: true, exact: false },
  { label: "Anúncios", href: "/dashboard/anuncios", icon: Megaphone, disabled: true, exact: false },
  { label: "Relatórios", href: "/dashboard/relatorios", icon: BarChart2, disabled: true, exact: false },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <style>{`
        .upflu-sidebar { width: 240px; min-width: 240px; }
        .upflu-sidebar-text { display: block; }
        .upflu-sidebar-logo-sub { display: block; }
        .upflu-sidebar-badge { display: inline-flex; }
        @media (max-width: 768px) {
          .upflu-sidebar { width: 56px; min-width: 56px; }
          .upflu-sidebar-text { display: none; }
          .upflu-sidebar-logo-sub { display: none; }
          .upflu-sidebar-badge { display: none; }
        }
        .nav-link-hover:hover { background: rgba(255,255,255,0.03) !important; }
      `}</style>

      <aside
        className="upflu-sidebar"
        style={{
          background: "#080808",
          borderRight: `1px solid ${BORDER}`,
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          display: "flex",
          flexDirection: "column",
          zIndex: 40,
        }}
      >
        {/* Logo */}
        <div style={{ padding: "32px 24px 28px", borderBottom: `1px solid ${BORDER}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/upflu-logo.png" alt="UPFLU" style={{ height: "32px", width: "auto", objectFit: "contain" }} />
          <p
            className="upflu-sidebar-logo-sub"
            style={{
              fontSize: "10px",
              fontWeight: "400",
              color: "#777068",
              marginTop: "10px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Admin Panel
          </p>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "20px 12px", display: "flex", flexDirection: "column", gap: "2px" }}>
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

            if (item.disabled) {
              return (
                <div
                  key={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    cursor: "not-allowed",
                    opacity: 0.35,
                  }}
                >
                  <item.icon size={16} color="#9A9288" strokeWidth={1.5} />
                  <span className="upflu-sidebar-text" style={{ fontSize: "13px", fontWeight: "400", color: "#9A9288", flex: 1 }}>
                    {item.label}
                  </span>
                  <span
                    className="upflu-sidebar-badge"
                    style={{
                      fontSize: "8px",
                      fontWeight: "600",
                      color: GOLD,
                      background: "rgba(190,160,106,0.08)",
                      border: `1px solid rgba(190,160,106,0.18)`,
                      padding: "2px 6px",
                      borderRadius: "3px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Em breve
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={!isActive ? "nav-link-hover" : ""}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  background: isActive ? "rgba(190,160,106,0.07)" : "transparent",
                  borderLeft: isActive ? `2px solid ${GOLD}` : "2px solid transparent",
                  paddingLeft: "10px",
                  transition: "background 0.15s",
                }}
              >
                <item.icon
                  size={16}
                  color={isActive ? GOLD : "#9A9288"}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <span
                  className="upflu-sidebar-text"
                  style={{
                    fontSize: "13px",
                    fontWeight: isActive ? "600" : "400",
                    color: isActive ? GOLD : "#9A9288",
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer — Settings */}
        <div style={{ padding: "12px", borderTop: `1px solid ${BORDER}` }}>
          {(() => {
            const isActive = pathname === "/dashboard/configuracoes";
            return (
              <Link
                href="/dashboard/configuracoes"
                className={!isActive ? "nav-link-hover" : ""}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  background: isActive ? "rgba(190,160,106,0.07)" : "transparent",
                  borderLeft: isActive ? `2px solid ${GOLD}` : "2px solid transparent",
                  transition: "background 0.15s",
                }}
              >
                <Settings size={16} color={isActive ? GOLD : "#9A9288"} strokeWidth={isActive ? 2 : 1.5} />
                <span
                  className="upflu-sidebar-text"
                  style={{ fontSize: "13px", fontWeight: isActive ? "600" : "400", color: isActive ? GOLD : "#9A9288" }}
                >
                  Configurações
                </span>
              </Link>
            );
          })()}
        </div>
      </aside>
    </>
  );
}
