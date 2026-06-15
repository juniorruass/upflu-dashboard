"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Clock, Zap, User } from "lucide-react";
import { toast } from "sonner";

interface Props {
  userEmail: string;
}

export default function SettingsForm({ userEmail }: Props) {
  const router = useRouter();
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [cronTime, setCronTime] = useState("09:00");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setAutoGenerate(data.auto_generate_enabled ?? true);
        setCronTime(data.cron_time_brt ?? "09:00");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auto_generate_enabled: autoGenerate,
          cron_time_brt: cronTime,
        }),
      });
      if (!res.ok) throw new Error("Falha ao salvar");
      toast.success("Configurações salvas!");
    } catch {
      toast.error("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const cardStyle: React.CSSProperties = {
    background: "var(--up-card)",
    border: "1px solid #2A2A2A",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    marginBottom: "16px",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--up-text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    display: "block",
    marginBottom: "16px",
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
        <Loader2 size={24} color="#888888" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Geração automática */}
      <div style={cardStyle}>
        <span style={labelStyle}>
          <Zap size={12} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
          Geração automática
        </span>

        {/* Toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <p style={{ fontSize: "14px", fontWeight: "500", color: "var(--up-text)", margin: "0 0 4px" }}>
              Gerar carrossel diariamente
            </p>
            <p style={{ fontSize: "12px", color: "var(--up-text-muted)", margin: 0 }}>
              Quando ativo, um carrossel é gerado automaticamente no horário configurado.
            </p>
          </div>
          <button
            onClick={() => setAutoGenerate((p) => !p)}
            style={{
              width: "48px",
              height: "26px",
              background: autoGenerate ? "#00C896" : "#2A2A2A",
              border: "none",
              borderRadius: "13px",
              cursor: "pointer",
              position: "relative",
              transition: "background 0.2s",
              flexShrink: 0,
              marginLeft: "16px",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "3px",
                left: autoGenerate ? "25px" : "3px",
                width: "20px",
                height: "20px",
                background: "#F5F5F5",
                borderRadius: "50%",
                transition: "left 0.2s",
                display: "block",
              }}
            />
          </button>
        </div>

        {/* Cron time */}
        <div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: "500",
              color: "var(--up-text)",
              marginBottom: "8px",
            }}
          >
            <Clock size={14} color="#888888" />
            Horário (Brasília)
          </label>
          <input
            type="time"
            value={cronTime}
            onChange={(e) => setCronTime(e.target.value)}
            style={{
              background: "var(--up-surface)",
              border: "1px solid #2A2A2A",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "14px",
              color: "var(--up-text)",
              outline: "none",
              width: "160px",
              colorScheme: "dark",
            }}
          />
          <p style={{ fontSize: "11px", color: "var(--up-text-muted)", marginTop: "6px" }}>
            Padrão: 09:00. A mudança entra em vigor na próxima execução.
          </p>
        </div>

        <div
          style={{
            marginTop: "16px",
            padding: "12px 14px",
            background: "rgba(0,200,150,0.05)",
            border: "1px solid rgba(0,200,150,0.12)",
            borderRadius: "8px",
            fontSize: "12px",
            color: "var(--up-text-muted)",
            lineHeight: 1.5,
          }}
        >
          ℹ️ O job é executado pelo Vercel Cron configurado em{" "}
          <code style={{ color: "#00C896", background: "rgba(0,200,150,0.08)", padding: "1px 5px", borderRadius: "4px" }}>
            vercel.json
          </code>
          . O horário exato do cron (UTC) deve ser ajustado no arquivo para mudar permanentemente.
        </div>
      </div>

      {/* Conta */}
      <div style={cardStyle}>
        <span style={labelStyle}>
          <User size={12} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
          Conta
        </span>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 16px",
            background: "var(--up-surface)",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, #00C896, #00A07A)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "700",
              color: "#0D0D0D",
              flexShrink: 0,
            }}
          >
            JR
          </div>
          <div>
            <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--up-text)", margin: "0 0 2px" }}>
              Junior
            </p>
            <p style={{ fontSize: "12px", color: "var(--up-text-muted)", margin: 0 }}>{userEmail}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.15)",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "500",
            color: "#EF4444",
            cursor: "pointer",
          }}
        >
          <LogOut size={15} />
          Sair da conta
        </button>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: "100%",
          padding: "13px",
          background: saving ? "#00A07A" : "#00C896",
          border: "none",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "600",
          color: "#0D0D0D",
          cursor: saving ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          transition: "background 0.15s",
        }}
      >
        {saving ? (
          <>
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            Salvando...
          </>
        ) : (
          "Salvar configurações"
        )}
      </button>

      <style>{`
        @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
      `}</style>
    </div>
  );
}
