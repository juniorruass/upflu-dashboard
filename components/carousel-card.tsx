"use client";

import { useState } from "react";
import { Carousel } from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  Copy,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import SlidePreview from "@/components/slide-preview";
import DownloadButton from "@/components/download-button";

// ─── Decline confirmation modal ────────────────────────────────────────────────

function DeclineModal({
  topic,
  onConfirm,
  onCancel,
  loading,
}: {
  topic: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        style={{
          background: "#1A1A1A",
          border: "1px solid #2A2A2A",
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "420px",
          width: "100%",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <X size={22} color="#EF4444" />
        </div>

        <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#F5F5F5", margin: "0 0 8px" }}>
          Recusar carrossel?
        </h3>
        <p style={{ fontSize: "14px", color: "#888888", margin: "0 0 6px", lineHeight: 1.5 }}>
          Tem certeza? Essa ação não pode ser desfeita.
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "#F5F5F5",
            margin: "0 0 28px",
            background: "#252525",
            padding: "10px 14px",
            borderRadius: "8px",
            borderLeft: "3px solid #2A2A2A",
          }}
        >
          {topic}
        </p>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1,
              padding: "11px",
              background: "#252525",
              border: "1px solid #2A2A2A",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#F5F5F5",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: "11px",
              background: "#EF4444",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
            Recusar mesmo assim
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pending Card ──────────────────────────────────────────────────────────────

export function PendingCard({
  carousel,
  onApproved,
  onDeclined,
}: {
  carousel: Carousel;
  onApproved: (updated: Carousel) => void;
  onDeclined: (declinedId: string) => void;
}) {
  const slides = carousel.slides ?? [];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [caption, setCaption] = useState(carousel.caption ?? "");
  const [loading, setLoading] = useState<"approve" | "decline" | null>(null);
  const [showModal, setShowModal] = useState(false);

  async function handleApprove() {
    setLoading("approve");
    try {
      const res = await fetch(`/api/carousels/${carousel.id}/approve`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Erro ao aprovar.");
        return;
      }
      const updated = await res.json();
      onApproved(updated);
      toast.success("Carrossel aprovado!");
    } catch {
      toast.error("Erro ao aprovar carrossel.");
    } finally {
      setLoading(null);
    }
  }

  async function handleDeclineConfirm() {
    setLoading("decline");
    try {
      const res = await fetch(`/api/carousels/${carousel.id}/decline`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Erro ao recusar.");
        return;
      }
      setShowModal(false);
      onDeclined(carousel.id);
      toast.success("Carrossel recusado.");
    } catch {
      toast.error("Erro ao recusar carrossel.");
    } finally {
      setLoading(null);
    }
  }

  const dateLabel = new Date(carousel.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      {showModal && (
        <DeclineModal
          topic={carousel.topic}
          onConfirm={handleDeclineConfirm}
          onCancel={() => setShowModal(false)}
          loading={loading === "decline"}
        />
      )}

      <div
        style={{
          background: "#1A1A1A",
          border: "1px solid #2A2A2A",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  color: "#F59E0B",
                  background: "rgba(245,158,11,0.12)",
                  border: "1px solid rgba(245,158,11,0.2)",
                  padding: "3px 10px",
                  borderRadius: "4px",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Pendente
              </span>
              <span style={{ fontSize: "12px", color: "#888888" }}>{dateLabel}</span>
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#F5F5F5", margin: 0, lineHeight: 1.3 }}>
              {carousel.topic}
            </h3>
          </div>
          <span style={{ fontSize: "12px", color: "#888888", flexShrink: 0 }}>
            {slides.length} slides
          </span>
        </div>

        {slides.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={() => setCurrentSlide((p) => Math.max(0, p - 1))}
                disabled={currentSlide === 0}
                style={{
                  width: "32px",
                  height: "32px",
                  background: "#252525",
                  border: "1px solid #2A2A2A",
                  borderRadius: "6px",
                  cursor: currentSlide === 0 ? "not-allowed" : "pointer",
                  opacity: currentSlide === 0 ? 0.4 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "#F5F5F5",
                }}
              >
                <ChevronLeft size={16} />
              </button>

              <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <div>
                  <SlidePreview htmlContent={slides[currentSlide]?.html_content ?? ""} />
                  <p style={{ textAlign: "center", fontSize: "12px", color: "#888888", margin: "8px 0 0" }}>
                    {currentSlide + 1} / {slides.length}
                  </p>
                  <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginTop: "6px" }}>
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        style={{
                          width: i === currentSlide ? "20px" : "6px",
                          height: "6px",
                          borderRadius: "3px",
                          background: i === currentSlide ? "#00C896" : "#2A2A2A",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          transition: "all 0.2s",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCurrentSlide((p) => Math.min(slides.length - 1, p + 1))}
                disabled={currentSlide === slides.length - 1}
                style={{
                  width: "32px",
                  height: "32px",
                  background: "#252525",
                  border: "1px solid #2A2A2A",
                  borderRadius: "6px",
                  cursor: currentSlide === slides.length - 1 ? "not-allowed" : "pointer",
                  opacity: currentSlide === slides.length - 1 ? 0.4 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "#F5F5F5",
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: "600",
              color: "#888888",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "8px",
            }}
          >
            Legenda Instagram
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={5}
            style={{
              width: "100%",
              background: "#252525",
              border: "1px solid #2A2A2A",
              borderRadius: "8px",
              padding: "12px 14px",
              fontSize: "13px",
              color: "#F5F5F5",
              resize: "vertical",
              outline: "none",
              lineHeight: 1.6,
              boxSizing: "border-box",
              fontFamily: "inherit",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#00C896")}
            onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
          />
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={handleApprove}
            disabled={loading !== null}
            style={{
              flex: 1,
              padding: "12px",
              background: "#00C896",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#0D0D0D",
              cursor: loading !== null ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: loading !== null ? 0.7 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {loading === "approve" ? (
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Check size={16} strokeWidth={2.5} />
            )}
            Aceitar
          </button>
          <button
            onClick={() => setShowModal(true)}
            disabled={loading !== null}
            style={{
              flex: 1,
              padding: "12px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#EF4444",
              cursor: loading !== null ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: loading !== null ? 0.7 : 1,
            }}
          >
            <X size={16} strokeWidth={2.5} />
            Recusar
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
    </>
  );
}

// ─── Approved Card ─────────────────────────────────────────────────────────────

export function ApprovedCard({ carousel }: { carousel: Carousel }) {
  const [showCaption, setShowCaption] = useState(false);
  const [caption, setCaption] = useState(carousel.caption ?? "");
  const [captionCopied, setCaptionCopied] = useState(false);
  const firstSlide = carousel.slides?.[0];

  function handleCopyCaption() {
    if (!caption) return;
    navigator.clipboard.writeText(caption);
    setCaptionCopied(true);
    setTimeout(() => setCaptionCopied(false), 2000);
  }

  return (
    <div
      style={{
        background: "#1A1A1A",
        border: "1px solid #2A2A2A",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          width: "100%",
          position: "relative",
          overflow: "hidden",
          background: "#0E1116",
          flexShrink: 0,
          paddingBottom: "125%",
        }}
      >
        {firstSlide ? (
          <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            <iframe
              srcDoc={firstSlide.html_content}
              style={{
                width: "1080px",
                height: "1350px",
                transform: "scale(0.25)",
                transformOrigin: "top left",
                border: "none",
                pointerEvents: "none",
                display: "block",
              }}
              scrolling="no"
              title={`thumbnail-${carousel.id}`}
              sandbox="allow-same-origin"
            />
          </div>
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2A2A2A",
              fontSize: "13px",
            }}
          >
            Sem preview
          </div>
        )}

        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            background: "rgba(13,13,13,0.85)",
            border: "1px solid #00C896",
            borderRadius: "6px",
            padding: "4px 10px",
            fontSize: "11px",
            fontWeight: "700",
            color: "#00C896",
            letterSpacing: "0.5px",
            backdropFilter: "blur(4px)",
          }}
        >
          POST #{String(carousel.post_number ?? 0).padStart(3, "0")}
        </div>
      </div>

      <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <p
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#F5F5F5",
              margin: "0 0 4px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.4,
            }}
          >
            {carousel.topic}
          </p>
          <p style={{ fontSize: "11px", color: "#888888", margin: 0 }}>
            Aprovado em{" "}
            {carousel.approved_at
              ? new Date(carousel.approved_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
          <DownloadButton carousel={carousel} />

          <button
            onClick={() => setShowCaption((p) => !p)}
            style={{
              flex: 1,
              padding: "9px 0",
              background: "#252525",
              border: "1px solid #2A2A2A",
              borderRadius: "7px",
              fontSize: "12px",
              fontWeight: "500",
              color: "#F5F5F5",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
            }}
          >
            {showCaption ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            Legenda
          </button>
        </div>

        {showCaption && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "10px", color: "#888888", display: "flex", alignItems: "center", gap: "4px" }}>
                <Pencil size={10} />
                Editável
              </span>
              <button
                onClick={handleCopyCaption}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "11px",
                  color: captionCopied ? "#00C896" : "#888888",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "2px 0",
                }}
              >
                <Copy size={11} />
                {captionCopied ? "Copiado!" : "Copiar"}
              </button>
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={5}
              style={{
                width: "100%",
                background: "#252525",
                border: "1px solid #2A2A2A",
                borderRadius: "7px",
                padding: "10px 12px",
                fontSize: "12px",
                color: "#F5F5F5",
                lineHeight: 1.6,
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#00C896")}
              onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
              className="scrollbar-thin"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Declined Row ──────────────────────────────────────────────────────────────

export function DeclinedRow({ carousel }: { carousel: Carousel }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 20px",
        background: "#1A1A1A",
        border: "1px solid #2A2A2A",
        borderRadius: "8px",
        gap: "16px",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "14px",
            fontWeight: "500",
            color: "#F5F5F5",
            margin: "0 0 3px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {carousel.topic}
        </p>
        <p style={{ fontSize: "12px", color: "#888888", margin: 0 }}>
          Gerado em{" "}
          {new Date(carousel.created_at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <span
          style={{
            fontSize: "10px",
            fontWeight: "600",
            color: "#EF4444",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.15)",
            padding: "3px 8px",
            borderRadius: "4px",
            display: "block",
            marginBottom: "4px",
          }}
        >
          Recusado
        </span>
        {carousel.declined_at && (
          <p style={{ fontSize: "11px", color: "#888888", margin: 0 }}>
            {new Date(carousel.declined_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        )}
      </div>
    </div>
  );
}
