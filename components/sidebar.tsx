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
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Visão Geral",
    href: "/dashboard",
    icon: LayoutDashboard,
    disabled: false,
    exact: true,
  },
  {
    label: "Conteúdo",
    href: "/dashboard/conteudo",
    icon: Images,
    disabled: false,
    exact: false,
  },
  {
    label: "Clientes",
    href: "/dashboard/clientes",
    icon: Users,
    disabled: true,
    exact: false,
  },
  {
    label: "Propostas",
    href: "/dashboard/propostas",
    icon: FileText,
    disabled: true,
    exact: false,
  },
  {
    label: "Anúncios",
    href: "/dashboard/anuncios",
    icon: Megaphone,
    disabled: true,
    exact: false,
  },
  {
    label: "Relatórios",
    href: "/dashboard/relatorios",
    icon: BarChart2,
    disabled: true,
    exact: false,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <style>{`
        .upflu-sidebar { width: 240px; min-width: 240px; }
        .upflu-sidebar-text { display: block; }
        .upflu-sidebar-logo-text { display: flex; }
        .upflu-sidebar-badge { display: inline-flex; }
        @media (max-width: 768px) {
          .upflu-sidebar { width: 64px; min-width: 64px; }
          .upflu-sidebar-text { display: none; }
          .upflu-sidebar-logo-text { display: none; }
          .upflu-sidebar-badge { display: none; }
        }
      `}</style>
    <aside
      className="upflu-sidebar"
      style={{
        background: "#161616",
        borderRight: "1px solid #2A2A2A",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        display: "flex",
        flexDirection: "column",
        zIndex: 40,
        transition: "width 0.2s ease",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "28px 24px 24px",
          borderBottom: "1px solid #2A2A2A",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "#00C896",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={18} color="#0D0D0D" strokeWidth={2.5} />
          </div>
          <span
            className="upflu-sidebar-logo-text"
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "#F5F5F5",
              letterSpacing: "-0.5px",
            }}
          >
            UP<span style={{ color: "#00C896" }}>FLU</span>
          </span>
        </div>
        <p
          className="upflu-sidebar-text"
          style={{
            fontSize: "11px",
            color: "#888888",
            marginTop: "6px",
            marginLeft: "42px",
          }}
        >
          Content Dashboard
        </p>
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          padding: "16px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          overflowY: "auto",
        }}
        className="scrollbar-thin"
      >
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          if (item.disabled) {
            return (
              <div
                key={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  cursor: "not-allowed",
                  opacity: 0.4,
                }}
              >
                <item.icon size={18} color="#888888" />
                <span
                  className="upflu-sidebar-text"
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#888888",
                    flex: 1,
                  }}
                >
                  {item.label}
                </span>
                <span
                  className="upflu-sidebar-badge"
                  style={{
                    fontSize: "9px",
                    fontWeight: "600",
                    color: "#00C896",
                    background: "rgba(0,200,150,0.1)",
                    border: "1px solid rgba(0,200,150,0.2)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    letterSpacing: "0.5px",
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
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "8px",
                textDecoration: "none",
                background: isActive ? "#00C896" : "transparent",
                transition: "background 0.15s ease",
              }}
              className={cn(!isActive && "hover:bg-[#252525]")}
            >
              <item.icon
                size={18}
                color={isActive ? "#0D0D0D" : "#888888"}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className="upflu-sidebar-text"
                style={{
                  fontSize: "14px",
                  fontWeight: isActive ? "600" : "500",
                  color: isActive ? "#0D0D0D" : "#F5F5F5",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer — Settings */}
      <div style={{ padding: "12px", borderTop: "1px solid #2A2A2A" }}>
        <Link
          href="/dashboard/configuracoes"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 12px",
            borderRadius: "8px",
            textDecoration: "none",
            background: pathname === "/dashboard/configuracoes" ? "#00C896" : "transparent",
            transition: "background 0.15s",
          }}
          className={cn(pathname !== "/dashboard/configuracoes" && "hover:bg-[#252525]")}
        >
          <Settings
            size={18}
            color={pathname === "/dashboard/configuracoes" ? "#0D0D0D" : "#888888"}
            strokeWidth={pathname === "/dashboard/configuracoes" ? 2.5 : 2}
          />
          <span
            className="upflu-sidebar-text"
            style={{
              fontSize: "14px",
              fontWeight: "500",
              color: pathname === "/dashboard/configuracoes" ? "#0D0D0D" : "#888888",
            }}
          >
            Configurações
          </span>
        </Link>
      </div>
    </aside>
    </>
  );
}
