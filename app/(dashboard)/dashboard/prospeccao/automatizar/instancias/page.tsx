"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/header";
import { Plus, RefreshCw, Wifi, WifiOff, Trash2, X, QrCode, Copy, Check } from "lucide-react";

const ACCENT = "#00CFFF";

type Instance = {
  name: string;
  connectionStatus: string;
  ownerJid?: string;
  profileName?: string;
  profilePicUrl?: string;
};

type QRData = { base64?: string; code?: string };

export default function InstanciasPage() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState<{ instance: string; data: QRData } | null>(null);
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loadingQr, setLoadingQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchInstances = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/evolution");
    const data = await res.json();
    setInstances(data.instances ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInstances();
    const interval = setInterval(fetchInstances, 10000);
    return () => clearInterval(interval);
  }, [fetchInstances]);

  async function connect(name: string) {
    setLoadingQr(name);
    const res = await fetch(`/api/evolution?action=connect&instance=${encodeURIComponent(name)}`);
    const data = await res.json();
    setLoadingQr(null);
    if (data.base64 || data.code || data.qrcode) {
      const qr: QRData = data.base64 ? data : (data.qrcode ?? data);
      setQrModal({ instance: name, data: qr });
    }
  }

  async function disconnect(name: string) {
    await fetch("/api/evolution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "disconnect", instance: name }),
    });
    fetchInstances();
  }

  async function deleteInstance(name: string) {
    if (!confirm(`Excluir instância "${name}"? Isso desconecta o número permanentemente.`)) return;
    await fetch("/api/evolution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", instance: name }),
    });
    fetchInstances();
  }

  async function createInstance() {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/evolution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", instanceName: newName.trim() }),
    });
    const data = await res.json();
    setCreating(false);
    setShowCreate(false);
    setNewName("");
    // Se já veio QR na criação, abre o modal
    if (data.qrcode?.base64 || data.qrcode?.code) {
      setQrModal({ instance: newName.trim(), data: data.qrcode });
    }
    fetchInstances();
  }

  const connected = instances.filter((i) => i.connectionStatus === "open");
  const disconnected = instances.filter((i) => i.connectionStatus !== "open");

  return (
    <>
      <Header title="Instâncias" />

      <style>{`
        .inst-wrap { padding: 24px 32px 32px; flex: 1; }
        .inst-card { background: var(--up-bg); border: 1px solid var(--up-border); border-radius: 10px; padding: 18px 20px; display: flex; align-items: center; gap: 14px; margin-bottom: 10px; }
        .inst-avatar { width: 42px; height: 42px; border-radius: 50%; background: var(--up-card); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
        .inst-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .qr-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .qr-panel { background: var(--up-card); border: 1px solid var(--up-border); border-radius: 14px; padding: 28px; width: 100%; max-width: 360px; text-align: center; }
        .qr-image { background: #fff; border-radius: 10px; padding: 12px; display: inline-block; margin: 16px 0; }
        .btn-primary { background: ${ACCENT}; border: none; border-radius: 6px; padding: 9px 18px; font-size: 13px; font-weight: 600; color: #000; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .btn-ghost { background: transparent; border: 1px solid var(--up-border); border-radius: 6px; padding: 8px 14px; font-size: 12px; color: #555; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: color 0.15s; }
        .btn-ghost:hover { color: #aaa; }
        .btn-danger { background: transparent; border: 1px solid rgba(239,68,68,0.25); border-radius: 6px; padding: 8px 10px; cursor: pointer; color: #ef4444; display: flex; align-items: center; }
        @media (max-width: 768px) { .inst-wrap { padding: 16px; } }
      `}</style>

      <div className="inst-wrap">
        {/* Cabeçalho */}
        <div style={{ marginBottom: "28px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <p style={{ fontSize: "11px", color: ACCENT, letterSpacing: "0.22em", textTransform: "uppercase", margin: "0 0 4px" }}>WhatsApp</p>
            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "var(--up-text)", margin: 0, letterSpacing: "-0.02em" }}>Instâncias</h2>
            <p style={{ fontSize: "13px", color: "var(--up-text-dim)", margin: "6px 0 0" }}>
              {connected.length} conectada{connected.length !== 1 ? "s" : ""} · {instances.length} total
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={fetchInstances} className="btn-ghost">
              <RefreshCw size={13} /> Atualizar
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={14} /> Nova instância
            </button>
          </div>
        </div>

        {/* Create input inline */}
        {showCreate && (
          <div style={{ background: "var(--up-bg)", border: `1px solid ${ACCENT}`, borderRadius: "10px", padding: "16px 20px", marginBottom: "16px", display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") createInstance(); if (e.key === "Escape") setShowCreate(false); }}
              placeholder="Nome da instância (ex: UPFLU-VENDAS)"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "13px", color: "var(--up-text)" }}
            />
            <button onClick={createInstance} disabled={creating} className="btn-primary" style={{ opacity: creating ? 0.6 : 1 }}>
              {creating ? "Criando..." : "Criar"}
            </button>
            <button onClick={() => setShowCreate(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--up-text-dim)" }}>
              <X size={16} />
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ color: "var(--up-text-dim)", fontSize: "13px", padding: "20px 0" }}>Carregando instâncias...</div>
        ) : instances.length === 0 ? (
          <div style={{ background: "var(--up-bg)", border: `1px solid var(--up-border)`, borderRadius: "10px", padding: "40px", textAlign: "center" }}>
            <p style={{ color: "var(--up-text-dim)", fontSize: "13px", margin: "0 0 16px" }}>Nenhuma instância cadastrada</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ margin: "0 auto" }}>
              <Plus size={14} /> Criar primeira instância
            </button>
          </div>
        ) : (
          <>
            {/* Conectadas */}
            {connected.length > 0 && (
              <>
                <p style={{ fontSize: "10px", color: "var(--up-text-dim)", textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 10px" }}>Conectadas</p>
                {connected.map((inst) => (
                  <InstanceCard
                    key={inst.name}
                    inst={inst}
                    onConnect={() => connect(inst.name)}
                    onDisconnect={() => disconnect(inst.name)}
                    onDelete={() => deleteInstance(inst.name)}
                    loadingQr={loadingQr === inst.name}
                  />
                ))}
              </>
            )}

            {/* Desconectadas */}
            {disconnected.length > 0 && (
              <>
                <p style={{ fontSize: "10px", color: "var(--up-text-dim)", textTransform: "uppercase", letterSpacing: "0.14em", margin: `${connected.length > 0 ? "24px" : "0"} 0 10px` }}>Desconectadas</p>
                {disconnected.map((inst) => (
                  <InstanceCard
                    key={inst.name}
                    inst={inst}
                    onConnect={() => connect(inst.name)}
                    onDisconnect={() => disconnect(inst.name)}
                    onDelete={() => deleteInstance(inst.name)}
                    loadingQr={loadingQr === inst.name}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* QR Code Modal */}
      {qrModal && (
        <div className="qr-overlay" onClick={(e) => { if (e.target === e.currentTarget) setQrModal(null); }}>
          <div className="qr-panel">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div>
                <p style={{ fontSize: "11px", color: "var(--up-text-dim)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Conectar instância</p>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "var(--up-text)", margin: 0 }}>{qrModal.instance}</h3>
              </div>
              <button onClick={() => setQrModal(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--up-text-dim)" }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "12px", color: "var(--up-text-dim)", margin: "0 0 4px" }}>
              Abra o WhatsApp → Dispositivos conectados → Conectar dispositivo
            </p>

            {qrModal.data.base64 ? (
              <div className="qr-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrModal.data.base64.startsWith("data:") ? qrModal.data.base64 : `data:image/png;base64,${qrModal.data.base64}`}
                  alt="QR Code"
                  style={{ width: "240px", height: "240px", display: "block" }}
                />
              </div>
            ) : (
              <div style={{ background: "var(--up-card)", borderRadius: "8px", padding: "16px", margin: "16px 0", display: "flex", alignItems: "center", gap: "10px" }}>
                <QrCode size={20} color="#555" />
                <span style={{ fontSize: "12px", color: "var(--up-text-dim)", wordBreak: "break-all", textAlign: "left", flex: 1 }}>{qrModal.data.code}</span>
              </div>
            )}

            {qrModal.data.code && (
              <button
                onClick={() => { navigator.clipboard.writeText(qrModal.data.code!); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="btn-ghost"
                style={{ margin: "0 auto", justifyContent: "center" }}
              >
                {copied ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
                {copied ? "Copiado!" : "Copiar código"}
              </button>
            )}

            <div style={{ marginTop: "20px", display: "flex", gap: "8px" }}>
              <button
                onClick={() => connect(qrModal.instance)}
                className="btn-ghost"
                style={{ flex: 1, justifyContent: "center" }}
              >
                <RefreshCw size={13} /> Novo QR
              </button>
              <button onClick={() => { setQrModal(null); fetchInstances(); }} className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                <Check size={13} /> Conectei
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InstanceCard({
  inst, onConnect, onDisconnect, onDelete, loadingQr,
}: {
  inst: Instance;
  onConnect: () => void;
  onDisconnect: () => void;
  onDelete: () => void;
  loadingQr: boolean;
}) {
  const isConnected = inst.connectionStatus === "open";

  return (
    <div className="inst-card">
      <div className="inst-avatar">
        {inst.profilePicUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={inst.profilePicUrl} alt={inst.name} />
        ) : (
          isConnected ? <Wifi size={18} color="#22c55e" /> : <WifiOff size={18} color="#444" />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--up-text)" }}>{inst.name}</span>
          <span style={{
            fontSize: "10px", fontWeight: "600", padding: "2px 8px", borderRadius: "10px",
            background: isConnected ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)",
            color: isConnected ? "#22c55e" : "#555",
          }}>
            {isConnected ? "Conectado" : inst.connectionStatus}
          </span>
        </div>
        {inst.profileName && (
          <p style={{ fontSize: "12px", color: "var(--up-text-dim)", margin: "2px 0 0" }}>{inst.profileName}</p>
        )}
        {inst.ownerJid && (
          <p style={{ fontSize: "11px", color: "#444", margin: "1px 0 0" }}>
            {inst.ownerJid.replace("@s.whatsapp.net", "").replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, "+$1 ($2) $3-$4")}
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        {isConnected ? (
          <button onClick={onDisconnect} className="btn-ghost" style={{ color: "#FF9500", borderColor: "rgba(255,149,0,0.25)" }}>
            <WifiOff size={13} /> Desconectar
          </button>
        ) : (
          <button onClick={onConnect} disabled={loadingQr} className="btn-primary" style={{ opacity: loadingQr ? 0.6 : 1 }}>
            <QrCode size={13} /> {loadingQr ? "Gerando..." : "Conectar"}
          </button>
        )}
        <button onClick={onDelete} className="btn-danger">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
