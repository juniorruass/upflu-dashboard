"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase";
import { useSidebar } from "./sidebar-context";

const GOLD = "#BEA06A";
const BORDER = "rgba(255,255,255,0.07)";

export default function Header({ title }: { title: string }) {
  const [pendingCount, setPendingCount] = useState(0);
  const { toggle } = useSidebar();

  useEffect(() => {
    const supabase = createBrowserClient();
    async function fetchPending() {
      const { count } = await supabase
        .from("carousels")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      setPendingCount(count ?? 0);
    }
    fetchPending();
    const channel = supabase
      .channel("pending-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "carousels" }, () => fetchPending())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <>
      <style>{`
        .header-user-name { display: block; }
        .header-pending { display: inline-flex; }
        @media (max-width: 480px) {
          .header-user-name { display: none; }
        }
      `}</style>
      <header style={{
        height: "60px", background: "#080808", borderBottom: `1px solid ${BORDER}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", position: "sticky", top: 0, zIndex: 30,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Hamburger — mobile only */}
          <button
            className="header-menu-btn"
            onClick={toggle}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9A9288", display: "none", padding: "4px", alignItems: "center", justifyContent: "center" }}
          >
            <Menu size={20} />
          </button>
          <h1 style={{ fontSize: "15px", fontWeight: "500", color: "#F0EDE8", margin: 0, letterSpacing: "0.01em" }}>
            {title}
          </h1>
          {pendingCount > 0 && (
            <span className="header-pending" style={{
              fontSize: "10px", fontWeight: "600", color: GOLD,
              background: "rgba(190,160,106,0.1)", border: `1px solid rgba(190,160,106,0.2)`,
              padding: "2px 8px", borderRadius: "20px", letterSpacing: "0.04em",
            }}>
              {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "1px", height: "20px", background: BORDER }} />
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "32px", height: "32px", background: "rgba(190,160,106,0.10)", border: `1px solid rgba(190,160,106,0.20)`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "600", color: GOLD, flexShrink: 0 }}>
              JR
            </div>
            <div className="header-user-name">
              <p style={{ fontSize: "13px", fontWeight: "500", color: "#F0EDE8", margin: 0, lineHeight: 1.2 }}>Junior</p>
              <p style={{ fontSize: "11px", color: "#777068", margin: 0, lineHeight: 1.2 }}>Admin</p>
            </div>
          </div>
        </div>
      </header>

      <style>{`
        @media (max-width: 768px) {
          .header-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
