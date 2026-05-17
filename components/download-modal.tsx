"use client";

import { DownloadProgress } from "@/lib/download";

interface Props {
  progress: DownloadProgress | null;
}

export default function DownloadModal({ progress }: Props) {
  if (!progress) return null;

  const percentage =
    progress.status === "done"
      ? 100
      : progress.status === "zipping"
      ? 95
      : Math.round((progress.current / progress.total) * 90);

  const statusLabel =
    progress.status === "zipping"
      ? "Compactando arquivos..."
      : progress.status === "done"
      ? "Concluído!"
      : `Processando slide ${progress.current} de ${progress.total}`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.82)",
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          background: "#1A1A1A",
          border: "1px solid #2A2A2A",
          borderRadius: "16px",
          padding: "40px 48px",
          maxWidth: "380px",
          width: "90%",
          textAlign: "center",
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
        }}
      >
        {/* Spinner */}
        <div
          style={{
            width: "56px",
            height: "56px",
            margin: "0 auto 24px",
            position: "relative",
          }}
        >
          {/* Track */}
          <svg
            width="56"
            height="56"
            viewBox="0 0 56 56"
            style={{ position: "absolute", inset: 0 }}
          >
            <circle
              cx="28"
              cy="28"
              r="22"
              fill="none"
              stroke="#2A2A2A"
              strokeWidth="4"
            />
          </svg>
          {/* Progress arc */}
          <svg
            width="56"
            height="56"
            viewBox="0 0 56 56"
            style={{
              position: "absolute",
              inset: 0,
              transform: "rotate(-90deg)",
              transition: "stroke-dashoffset 0.4s ease",
            }}
          >
            <circle
              cx="28"
              cy="28"
              r="22"
              fill="none"
              stroke="#00C896"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 22}`}
              strokeDashoffset={`${2 * Math.PI * 22 * (1 - percentage / 100)}`}
            />
          </svg>
          {/* Percentage text */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "700",
              color: "#00C896",
            }}
          >
            {percentage}%
          </div>
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "700",
            color: "#F5F5F5",
            margin: "0 0 8px",
          }}
        >
          {progress.status === "done" ? "Download pronto!" : "Gerando arquivos..."}
        </h3>

        {/* Status */}
        <p
          style={{
            fontSize: "13px",
            color: "#888888",
            margin: "0 0 24px",
            lineHeight: 1.5,
          }}
        >
          {statusLabel}
        </p>

        {/* Progress bar */}
        <div
          style={{
            width: "100%",
            height: "4px",
            background: "#2A2A2A",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${percentage}%`,
              background: "#00C896",
              borderRadius: "2px",
              transition: "width 0.4s ease",
            }}
          />
        </div>

        {/* Slide count */}
        {progress.status === "rendering" && (
          <p
            style={{
              fontSize: "11px",
              color: "#888888",
              margin: "10px 0 0",
            }}
          >
            Slide {progress.current} / {progress.total} renderizado
          </p>
        )}

        {/* Info note */}
        <p
          style={{
            fontSize: "11px",
            color: "#888888",
            margin: "16px 0 0",
            lineHeight: 1.5,
          }}
        >
          Aguardando fontes e renderização de cada slide.
          <br />
          Não feche essa janela.
        </p>
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
