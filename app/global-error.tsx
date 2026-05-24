"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body style={{ margin: 0, background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", color: "#F0EDE8" }}>
          <p style={{ fontSize: "14px", color: "#777068" }}>Algo deu errado.</p>
          <button onClick={reset} style={{ fontSize: "13px", padding: "8px 20px", borderRadius: "6px", border: "1px solid rgba(0,207,255,0.3)", background: "rgba(0,207,255,0.08)", color: "#00CFFF", cursor: "pointer" }}>
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
