import { Carousel } from "@/types";

export interface DownloadProgress {
  current: number;
  total: number;
  status: "rendering" | "zipping" | "done";
}

function buildSrcDoc(htmlContent: string): string {
  // Wrap the slide HTML in a minimal full document so the body is clean
  // and fonts/@import load correctly inside the iframe
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  html, body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    width: 1080px;
    height: 1350px;
    background: transparent;
  }
</style>
</head>
<body>
${htmlContent}
</body>
</html>`;
}

function waitForIframeLoad(iframe: HTMLIFrameElement): Promise<void> {
  return new Promise((resolve) => {
    if (iframe.contentDocument?.readyState === "complete") {
      resolve();
    } else {
      iframe.addEventListener("load", () => resolve(), { once: true });
    }
  });
}

async function waitForFonts(iframe: HTMLIFrameElement): Promise<void> {
  try {
    // Access fonts API inside the iframe context
    const iframeDoc = iframe.contentDocument;
    if (iframeDoc && "fonts" in iframeDoc) {
      await (iframeDoc as Document & { fonts: FontFaceSet }).fonts.ready;
    }
  } catch {
    // Fallback: just wait a fixed delay for fonts to render
  }
  // Extra rendering buffer (handles CSS animations and late paints)
  await new Promise((resolve) => setTimeout(resolve, 400));
}

export async function downloadCarouselAsZip(
  carousel: Carousel,
  onProgress?: (p: DownloadProgress) => void
): Promise<void> {
  const slides = carousel.slides ?? [];
  if (slides.length === 0) throw new Error("Nenhum slide encontrado.");

  const html2canvas = (await import("html2canvas")).default;
  const JSZip = (await import("jszip")).default;

  const zip = new JSZip();
  const postNum = carousel.post_number
    ? String(carousel.post_number).padStart(3, "0")
    : "rascunho";

  for (let i = 0; i < slides.length; i++) {
    onProgress?.({ current: i + 1, total: slides.length, status: "rendering" });

    const slide = slides[i];

    // 1. Create a hidden iframe with the slide HTML
    const iframe = document.createElement("iframe");
    iframe.style.cssText = [
      "position:fixed",
      "top:-9999px",
      "left:-9999px",
      "width:1080px",
      "height:1350px",
      "border:none",
      "pointer-events:none",
      "visibility:hidden",
    ].join(";");
    iframe.srcdoc = buildSrcDoc(slide.html_content);
    document.body.appendChild(iframe);

    try {
      // 2. Wait for iframe to fully load (HTML parsed + subresources)
      await waitForIframeLoad(iframe);

      // 3. Wait for Google Fonts (@import) to load inside the iframe
      await waitForFonts(iframe);

      // 4. Capture the iframe body with html2canvas
      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc?.body) {
        throw new Error(`Não foi possível acessar o conteúdo do slide ${i + 1}`);
      }

      const canvas = await html2canvas(iframeDoc.body, {
        width: 1080,
        height: 1350,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#0E1116",
        logging: false,
      } as Parameters<typeof html2canvas>[1]);

      // 5. Convert canvas to PNG blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error(`Falha ao criar PNG para slide ${i + 1}`))),
          "image/png",
          1.0
        );
      });

      // 6. Add to ZIP — naming: slide-01.png, slide-02.png, …
      const filename = `slide-${String(i + 1).padStart(2, "0")}.png`;
      zip.file(filename, blob);
    } finally {
      document.body.removeChild(iframe);
    }
  }

  // Add caption as a text file
  if (carousel.caption) {
    zip.file("caption.txt", carousel.caption);
  }

  onProgress?.({ current: slides.length, total: slides.length, status: "zipping" });

  // 7. Generate and trigger download
  const zipBlob = await zip.generateAsync({ type: "blob" });

  onProgress?.({ current: slides.length, total: slides.length, status: "done" });

  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `upflu-post-${postNum}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
