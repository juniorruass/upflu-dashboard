"use client";

export default function OfflinePage() {
  return (
    <div style={{
      minHeight: "100vh", background: "var(--up-bg)", color: "var(--up-text)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", fontFamily: "var(--font-outfit, sans-serif)",
      gap: "16px", textAlign: "center", padding: "24px",
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/upflu-logo.png" alt="UPFLU" style={{ height: "32px", opacity: 0.6 }} />
      <h1 style={{ fontSize: "20px", fontWeight: "700", margin: 0 }}>Sem conexão</h1>
      <p style={{ fontSize: "14px", color: "var(--up-text-label)", margin: 0, maxWidth: "280px" }}>
        Você está offline. Conecte à internet e tente novamente.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: "8px", background: "#00CFFF", color: "#080808",
          border: "none", borderRadius: "10px", padding: "10px 24px",
          fontSize: "13px", fontWeight: "700", cursor: "pointer",
        }}
      >
        Tentar novamente
      </button>
    </div>
  );
}
