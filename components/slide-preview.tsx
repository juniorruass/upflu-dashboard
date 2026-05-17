"use client";

export default function SlidePreview({ htmlContent }: { htmlContent: string }) {
  return (
    <div
      style={{
        width: "270px",
        height: "337px",
        overflow: "hidden",
        borderRadius: "8px",
        flexShrink: 0,
        background: "#0D0D0D",
        border: "1px solid #2A2A2A",
      }}
    >
      <iframe
        srcDoc={htmlContent}
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
        title="slide preview"
        sandbox="allow-same-origin"
      />
    </div>
  );
}
