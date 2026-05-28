import { Carousel } from "@/types";

export interface DownloadProgress {
  current: number;
  total: number;
  status: "rendering" | "zipping" | "done";
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Pre-fetch external images and replace with base64 data URLs so html2canvas
// can render them inside a sandboxed iframe without cross-origin issues.
async function inlineExternalImages(html: string): Promise<string> {
  const urlPattern = /https:\/\/images\.unsplash\.com\/[^'")\s]+/g;
  const matched = html.match(urlPattern) ?? [];
  const urls = Array.from(new Set(matched));
  if (urls.length === 0) return html;

  const pairs = await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url, { mode: "cors" });
        const blob = await res.blob();
        const dataUrl = await blobToDataUrl(blob);
        return [url, dataUrl] as const;
      } catch {
        return [url, url] as const;
      }
    })
  );

  let result = html;
  for (const [url, dataUrl] of pairs) {
    result = result.split(url).join(dataUrl);
  }
  return result;
}

function buildSrcDoc(htmlContent: string): string {
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

async function waitForRender(iframe: HTMLIFrameElement): Promise<void> {
  try {
    const iframeDoc = iframe.contentDocument;
    if (iframeDoc && "fonts" in iframeDoc) {
      await (iframeDoc as Document & { fonts: FontFaceSet }).fonts.ready;
    }
  } catch {
    // ignore
  }
  // Buffer for fonts + CSS paint (Google Fonts pode demorar um pouco)
  await new Promise((resolve) => setTimeout(resolve, 2500));
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

    // Pre-fetch Unsplash photos as base64 so the iframe doesn't need external requests
    const inlinedHtml = await inlineExternalImages(slide.html_content);

    const iframe = document.createElement("iframe");
    iframe.style.cssText = [
      "position:fixed",
      "top:0",
      "left:0",
      "width:1080px",
      "height:1350px",
      "border:none",
      "pointer-events:none",
      "opacity:0",
      "z-index:-9999",
    ].join(";");
    iframe.srcdoc = buildSrcDoc(inlinedHtml);
    document.body.appendChild(iframe);

    try {
      await waitForIframeLoad(iframe);
      await waitForRender(iframe);

      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc?.body) {
        throw new Error(`Não foi possível acessar o conteúdo do slide ${i + 1}`);
      }

      const canvas = await html2canvas(iframeDoc.body, {
        width: 1080,
        height: 1350,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#0D0D0D",
        logging: false,
      } as Parameters<typeof html2canvas>[1]);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error(`Falha ao criar PNG para slide ${i + 1}`))),
          "image/png",
          1.0
        );
      });

      const filename = `slide-${String(i + 1).padStart(2, "0")}.png`;
      zip.file(filename, blob);
    } finally {
      document.body.removeChild(iframe);
    }
  }

  if (carousel.caption) {
    zip.file("caption.txt", carousel.caption);
  }

  onProgress?.({ current: slides.length, total: slides.length, status: "zipping" });

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
