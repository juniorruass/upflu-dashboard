"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const [pendingCount, setPendingCount] = useState(0);

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

    // Realtime subscription
    const channel = supabase
      .channel("pending-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "carousels" },
        () => fetchPending()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <header
      style={{
        height: "64px",
        background: "#111111",
        borderBottom: "1px solid #2A2A2A",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Page title */}
      <h1
        style={{
          fontSize: "18px",
          fontWeight: "600",
          color: "#F5F5F5",
          margin: 0,
        }}
      >
        {title}
      </h1>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* Notifications */}
        <button
          style={{
            position: "relative",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px",
          }}
          className="hover:bg-[#252525]"
          title={pendingCount > 0 ? `${pendingCount} carrossel(s) pendente(s)` : "Sem pendências"}
        >
          <Bell size={20} color="#888888" />
          {pendingCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "4px",
                right: "4px",
                width: "16px",
                height: "16px",
                background: "#00C896",
                borderRadius: "50%",
                fontSize: "9px",
                fontWeight: "700",
                color: "#0D0D0D",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #111111",
              }}
            >
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div
          style={{
            width: "1px",
            height: "24px",
            background: "#2A2A2A",
          }}
        />

        {/* User avatar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "linear-gradient(135deg, #00C896 0%, #00A07A 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: "700",
              color: "#0D0D0D",
              flexShrink: 0,
            }}
          >
            JR
          </div>
          <div>
            <p
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#F5F5F5",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Junior
            </p>
            <p
              style={{
                fontSize: "11px",
                color: "#888888",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Admin
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
