"use client";

import { useState } from "react";
import { ZoomIn, X, ChevronLeft, ChevronRight } from "lucide-react";

interface SlidePreviewProps {
  htmlContent: string;
  scale?: number;
  /* pass all slides + index to enable in-modal navigation */
  allSlides?: string[];
  slideIndex?: number;
}

export default function SlidePreview({
  htmlContent,
  scale = 0.25,
  allSlides,
  slideIndex = 0,
}: SlidePreviewProps) {
  const [open, setOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(slideIndex);

  const w = Math.round(1080 * scale);
  const h = Math.round(1350 * scale);
  const slides = allSlides ?? [htmlContent];
  const total = slides.length;

  function openModal() {
    setModalIndex(slideIndex);
    setOpen(true);
  }

  return (
    <>
      {/* Thumbnail */}
      <div
        onClick={openModal}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#C4A042")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
        style={{
          width: `${w}px`,
          height: `${h}px`,
          overflow: "hidden",
          borderRadius: "10px",
          flexShrink: 0,
          background: "#0D0D0D",
          border: "1px solid #2A2A2A",
          cursor: "zoom-in",
          position: "relative",
          transition: "border-color 0.15s",
        }}
      >
        <iframe
          srcDoc={htmlContent}
          style={{
            width: "1080px",
            height: "1350px",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            border: "none",
            pointerEvents: "none",
            display: "block",
          }}
          scrolling="no"
          title="slide preview"
          sandbox="allow-same-origin"
        />
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            right: "8px",
            background: "rgba(0,0,0,0.72)",
            border: "1px solid rgba(196,160,66,0.35)",
            borderRadius: "6px",
            padding: "4px 8px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "11px",
            color: "#C4A042",
            backdropFilter: "blur(4px)",
          }}
        >
          <ZoomIn size={11} />
          Ver maior
        </div>
      </div>

      {/* Full-size modal */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.93)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          {/* Close */}
          <button
            onClick={() => setOpen(false)}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "#1A1A1A",
              border: "1px solid #2A2A2A",
              borderRadius: "8px",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#F5F5F5",
              zIndex: 10,
            }}
          >
            <X size={18} />
          </button>

          {/* Prev */}
          {total > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setModalIndex((i) => Math.max(0, i - 1)); }}
              disabled={modalIndex === 0}
              style={{
                position: "absolute",
                left: "20px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "#1A1A1A",
                border: "1px solid #2A2A2A",
                borderRadius: "10px",
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: modalIndex === 0 ? "not-allowed" : "pointer",
                opacity: modalIndex === 0 ? 0.3 : 1,
                color: "#F5F5F5",
                zIndex: 10,
              }}
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Slide */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "486px",
              height: "607px",
              overflow: "hidden",
              borderRadius: "14px",
              background: "#0D0D0D",
              border: "2px solid rgba(196,160,66,0.3)",
              boxShadow: "0 32px 100px rgba(0,0,0,0.85)",
              flexShrink: 0,
            }}
          >
            <iframe
              srcDoc={slides[modalIndex]}
              style={{
                width: "1080px",
                height: "1350px",
                transform: "scale(0.45)",
                transformOrigin: "top left",
                border: "none",
                pointerEvents: "none",
                display: "block",
              }}
              scrolling="no"
              title="slide modal"
              sandbox="allow-same-origin"
            />
          </div>

          {/* Next */}
          {total > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setModalIndex((i) => Math.min(total - 1, i + 1)); }}
              disabled={modalIndex === total - 1}
              style={{
                position: "absolute",
                right: "20px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "#1A1A1A",
                border: "1px solid #2A2A2A",
                borderRadius: "10px",
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: modalIndex === total - 1 ? "not-allowed" : "pointer",
                opacity: modalIndex === total - 1 ? 0.3 : 1,
                color: "#F5F5F5",
                zIndex: 10,
              }}
            >
              <ChevronRight size={22} />
            </button>
          )}

          {/* Counter + dots */}
          <div
            style={{
              position: "absolute",
              bottom: "24px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: 0 }}>
              {modalIndex + 1} / {total}
            </p>
            {total > 1 && (
              <div style={{ display: "flex", gap: "6px" }}>
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setModalIndex(i)}
                    style={{
                      width: i === modalIndex ? "24px" : "7px",
                      height: "7px",
                      borderRadius: "4px",
                      background: i === modalIndex ? "#C4A042" : "rgba(255,255,255,0.2)",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      transition: "all 0.2s",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
