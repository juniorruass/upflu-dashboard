"use client";

import { useState } from "react";
import { Carousel } from "@/types";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PendingCard, ApprovedCard, DeclinedRow } from "@/components/carousel-card";

type Tab = "pending" | "approved" | "declined";

interface ContentTabsProps {
  initialPending: Carousel[];
  initialApproved: Carousel[];
  initialDeclined: Carousel[];
}

export default function ContentTabs({
  initialPending,
  initialApproved,
  initialDeclined,
}: ContentTabsProps) {
  const [tab, setTab] = useState<Tab>("pending");
  const [pending, setPending] = useState<Carousel[]>(initialPending);
  const [approved, setApproved] = useState<Carousel[]>(initialApproved);
  const [declined, setDeclined] = useState<Carousel[]>(initialDeclined);
  const [generating, setGenerating] = useState(false);

  function handleApproved(updatedCarousel: Carousel) {
    setPending((prev) => prev.filter((c) => c.id !== updatedCarousel.id));
    setApproved((prev) => [updatedCarousel, ...prev]);
  }

  function handleDeclined(declinedId: string) {
    const found = pending.find((c) => c.id === declinedId);
    if (found) {
      setPending((prev) => prev.filter((c) => c.id !== declinedId));
      setDeclined((prev) => [
        { ...found, status: "declined", declined_at: new Date().toISOString(), slides: [] },
        ...prev,
      ]);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/carousels/generate", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao gerar carrossel.");
        return;
      }
      const newCarousel = await res.json();
      setPending((prev) => [newCarousel, ...prev]);
      setTab("pending");
      toast.success("Carrossel gerado com sucesso!");
    } catch {
      toast.error("Erro de conexão ao gerar carrossel.");
    } finally {
      setGenerating(false);
    }
  }

  const tabs: { key: Tab; label: string; count: number; color: string }[] = [
    { key: "pending", label: "Pendentes", count: pending.length, color: "#F59E0B" },
    { key: "approved", label: "Aprovados", count: approved.length, color: "#00C896" },
    { key: "declined", label: "Recusados", count: declined.length, color: "#EF4444" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      {/* Toolbar */}
      <div
        style={{
          padding: "20px 32px",
          borderBottom: "1px solid #2A2A2A",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          background: "#111111",
        }}
      >
        <div style={{ display: "flex", gap: "4px" }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: tab === t.key ? "1px solid #2A2A2A" : "1px solid transparent",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: tab === t.key ? "600" : "500",
                background: tab === t.key ? "#1A1A1A" : "transparent",
                color: tab === t.key ? t.color : "#888888",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.15s",
              }}
            >
              {t.label}
              <span
                style={{
                  fontSize: "11px",
                  padding: "1px 7px",
                  borderRadius: "10px",
                  background: tab === t.key ? "rgba(0,0,0,0.3)" : "#1A1A1A",
                  color: tab === t.key ? t.color : "#888888",
                  fontWeight: "600",
                }}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        <div
          title={pending.length > 0 ? "Aprove ou recuse o carrossel atual primeiro" : undefined}
          style={{ display: "inline-flex" }}
        >
          <button
            onClick={handleGenerate}
            disabled={generating || pending.length > 0}
            style={{
              padding: "9px 18px",
              background: generating || pending.length > 0 ? "#00A07A" : "#00C896",
              border: "none",
              borderRadius: "8px",
              cursor: generating || pending.length > 0 ? "not-allowed" : "pointer",
              fontSize: "13px",
              fontWeight: "600",
              color: "#0D0D0D",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              transition: "background 0.15s",
              opacity: pending.length > 0 && !generating ? 0.6 : 1,
              pointerEvents: pending.length > 0 && !generating ? "none" : "auto",
            }}
          >
            {generating ? (
              <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Sparkles size={15} />
            )}
            {generating ? "Gerando..." : "Gerar agora"}
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div
        style={{ flex: 1, overflowY: "auto", padding: "32px" }}
        className="scrollbar-thin"
      >
        {tab === "pending" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "680px", margin: "0 auto" }}>
            {pending.length === 0 ? (
              <EmptyState icon="⏳" title="Nenhum carrossel pendente" desc='Clique em "Gerar agora" para criar um novo carrossel.' />
            ) : (
              pending.map((carousel) => (
                <PendingCard key={carousel.id} carousel={carousel} onApproved={handleApproved} onDeclined={handleDeclined} />
              ))
            )}
          </div>
        )}

        {tab === "approved" && (
          <>
            {approved.length === 0 ? (
              <EmptyState icon="✅" title="Nenhum carrossel aprovado ainda" desc="Aprove carrosséis na aba Pendentes para vê-los aqui." />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", maxWidth: "1200px" }}>
                {approved.map((carousel) => (
                  <ApprovedCard key={carousel.id} carousel={carousel} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "declined" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "800px", margin: "0 auto" }}>
            {declined.length === 0 ? (
              <EmptyState icon="🗂️" title="Nenhum carrossel recusado" desc="Carrosséis recusados aparecem aqui como histórico." />
            ) : (
              declined.map((carousel) => (
                <DeclinedRow key={carousel.id} carousel={carousel} />
              ))
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 24px",
        textAlign: "center",
        color: "#888888",
      }}
    >
      <span style={{ fontSize: "40px", marginBottom: "16px" }}>{icon}</span>
      <p style={{ fontSize: "16px", fontWeight: "600", color: "#F5F5F5", margin: "0 0 8px" }}>{title}</p>
      <p style={{ fontSize: "14px", margin: 0, maxWidth: "320px" }}>{desc}</p>
    </div>
  );
}
