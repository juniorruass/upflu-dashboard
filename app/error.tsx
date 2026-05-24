"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#080808", color: "#F0EDE8", fontFamily: "inherit", gap: "16px" }}>
      <p style={{ fontSize: "14px", color: "#777068" }}>Algo deu errado.</p>
      <button onClick={reset} style={{ fontSize: "13px", padding: "8px 20px", borderRadius: "6px", border: "1px solid rgba(0,207,255,0.3)", background: "rgba(0,207,255,0.08)", color: "#00CFFF", cursor: "pointer" }}>
        Tentar novamente
      </button>
    </div>
  );
}
