"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Carousel } from "@/types";
import { downloadCarouselAsZip, type DownloadProgress } from "@/lib/download";
import DownloadModal from "@/components/download-modal";

export default function DownloadButton({ carousel }: { carousel: Carousel }) {
  const [progress, setProgress] = useState<DownloadProgress | null>(null);

  async function handleDownload() {
    setProgress({ current: 0, total: carousel.slides?.length ?? 0, status: "rendering" });
    try {
      await downloadCarouselAsZip(carousel, (p) => setProgress(p));
      toast.success("Download pronto!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar ZIP.");
    } finally {
      setTimeout(() => setProgress(null), 800);
    }
  }

  const isDownloading = progress !== null;

  return (
    <>
      <DownloadModal progress={progress} />
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        style={{
          flex: 1,
          padding: "9px 0",
          background: "#00C896",
          border: "none",
          borderRadius: "7px",
          fontSize: "12px",
          fontWeight: "600",
          color: "#0D0D0D",
          cursor: isDownloading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "5px",
          opacity: isDownloading ? 0.7 : 1,
        }}
      >
        {isDownloading ? (
          <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
        ) : (
          <Download size={13} />
        )}
        Baixar
      </button>
    </>
  );
}
