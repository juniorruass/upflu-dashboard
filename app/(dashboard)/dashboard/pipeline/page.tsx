"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/header";
import { RefreshCw, Phone, MapPin, MessageSquare, ChevronRight, X, Check, Calendar } from "lucide-react";
import { scoreLabel } from "@/lib/lead-scoring";

const ACCENT = "#00CFFF";

type Prospect = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  cidade: string | null;
  tipo: string | null;
  status: string;
  anotacoes: string | null;
  cnpj: string | null;
  followup_enviado: boolean | null;
  whatsapp_enviado_at: string | null;
  score: number;
  created_at: string;
};

const STATUS_STEPS = [
  { id: "followup",  label: "Follow-up",       color: "#FF9500" },
  { id: "respondeu", label: "Respondeu",        color: "#00CFFF" },
  { id: "reuniao",   label: "Reunião",          color: "#a064ff" },
  { id: "proposta",  label: "Proposta",         color: "#3b82f6" },
  { id: "fechado",   label: "Fechado",          color: "#22c55e" },
];

export default function PipelinePage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Prospect | null>(null);
  const [editNota, setEditNota] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/pipeline");
    const data = await res.json();
    setProspects(data.prospects ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function updateStatus(id: string, status: string) {
    await fetch("/api/pipeline", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setProspects((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
    if (selected?.id === id) setSelected((s) => s ? { ...s, status } : null);
  }

  async function saveNota(id: string) {
    await fetch("/api/pipeline", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, anotacoes: editNota }),
    });
    setProspects((prev) => prev.map((p) => p.id === id ? { ...p, anotacoes: editNota } : p));
    setSelected((s) => s ? { ...s, anotacoes: editNota } : null);
  }

  const byStatus = STATUS_STEPS.map((s) => ({
    ...s,
    items: prospects.filter((p) => p.status === s.id),
  }));

  return (
    <>
      <Header title="Pipeline" />

      <style>{`
        .pipe-wrap { padding: 24px 32px 32px; flex: 1; overflow: hidden; display: flex; flex-direction: column; }
        .pipe-cols { display: flex; gap: 12px; overflow-x: auto; flex: 1; padding-bottom: 12px; }
        .pipe-col { min-width: 240px; max-width: 240px; background: var(--up-bg); border: 1px solid var(--up-border); border-radius: 10px; overflow: hidden; display: flex; flex-direction: column; }
        .pipe-col-header { padding: 12px 14px; border-bottom: 1px solid var(--up-border); display: flex; align-items: center; justify-content: space-between; }
        .pipe-cards { flex: 1; padding: 8px; display: flex; flex-direction: column; gap: 6px; overflow-y: auto; max-height: calc(100vh - 280px); }
        .pipe-card { background: #161616; border: 1px solid var(--up-border); border-radius: 7px; padding: 11px; cursor: pointer; transition: border-color 0.15s; }
        .pipe-card:hover { border-color: rgba(255,255,255,0.15); }
        .detail-panel { position: fixed; top: 0; right: 0; width: 360px; height: 100vh; background: var(--up-card); border-left: 1px solid var(--up-border); z-index: 100; display: flex; flex-direction: column; }
        @media (max-width: 768px) { .pipe-wrap { padding: 16px; } .detail-panel { width: 100%; } }
      `}</style>

      <div className="pipe-wrap">
        <div style={{ marginBottom: "20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <p style={{ fontSize: "11px", color: ACCENT, letterSpacing: "0.22em", textTransform: "uppercase", margin: "0 0 4px" }}>Prospecção</p>
            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "var(--up-text)", margin: 0, letterSpacing: "-0.02em" }}>Pipeline</h2>
            <p style={{ fontSize: "13px", color: "var(--up-text-dim)", margin: "6px 0 0" }}>{prospects.length} lead{prospects.length !== 1 ? "s" : ""} no funil</p>
          </div>
          <button onClick={fetchData} style={{ background: "transparent", border: `1px solid var(--up-border)`, borderRadius: "6px", padding: "8px 12px", cursor: "pointer", color: "var(--up-text-dim)", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
            <RefreshCw size={13} /> Atualizar
          </button>
        </div>

        {loading ? (
          <div style={{ color: "var(--up-text-dim)", fontSize: "13px" }}>Carregando...</div>
        ) : (
          <div className="pipe-cols">
            {byStatus.map((col) => (
              <div key={col.id} className="pipe-col">
                <div className="pipe-col-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: col.color }} />
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--up-text)" }}>{col.label}</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--up-text-dim)", background: "var(--up-card)", padding: "2px 7px", borderRadius: "10px" }}>{col.items.length}</span>
                </div>
                <div className="pipe-cards">
                  {col.items.length === 0 ? (
                    <div style={{ padding: "12px", fontSize: "11px", color: "#333", textAlign: "center" }}>Vazio</div>
                  ) : col.items.map((p) => (
                    <ProspectCard key={p.id} prospect={p} onSelect={() => { setSelected(p); setEditNota(p.anotacoes ?? ""); }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="detail-panel">
          <div style={{ padding: "18px 20px", borderBottom: `1px solid var(--up-border)`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "10px", color: "var(--up-text-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "2px" }}>
                {STATUS_STEPS.find((s) => s.id === selected.status)?.label}
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "var(--up-text)", margin: 0 }}>{selected.nome}</h3>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--up-text-dim)" }}>
              <X size={18} />
            </button>
          </div>

          <ProspectDetail
            prospect={selected}
            editNota={editNota}
            setEditNota={setEditNota}
            onUpdateStatus={updateStatus}
            onSaveNota={saveNota}
          />
        </div>
      )}
    </>
  );
}

function ProspectCard({ prospect, onSelect }: { prospect: Prospect; onSelect: () => void }) {
  const sl = scoreLabel(prospect.score);
  return (
    <div className="pipe-card" onClick={onSelect}>
      <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--up-text)", marginBottom: "5px", lineHeight: 1.3 }}>{prospect.nome}</div>
      {prospect.cidade && (
        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
          <MapPin size={10} color="#555" />
          <span style={{ fontSize: "11px", color: "var(--up-text-dim)" }}>{prospect.cidade.split(",")[0]}</span>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
        <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 7px", borderRadius: "4px", background: `${sl.color}18`, color: sl.color }}>
          {sl.label} {prospect.score}
        </span>
        {prospect.anotacoes && <MessageSquare size={10} color="#444" />}
        {prospect.telefone && <Phone size={10} color="#444" />}
      </div>
    </div>
  );
}

function ProspectDetail({ prospect, editNota, setEditNota, onUpdateStatus, onSaveNota }: {
  prospect: Prospect;
  editNota: string;
  setEditNota: (v: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onSaveNota: (id: string) => void;
}) {
  const sl = scoreLabel(prospect.score);
  const BORDER_INNER = "var(--up-border)";

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "6px", background: `${sl.color}18`, color: sl.color }}>
          {sl.label} — Score {prospect.score}/100
        </span>
      </div>

      {prospect.telefone && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <Phone size={13} color="#555" />
          <span style={{ fontSize: "13px", color: "#ccc" }}>{prospect.telefone}</span>
        </div>
      )}
      {prospect.cidade && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <MapPin size={13} color="#555" />
          <span style={{ fontSize: "13px", color: "#ccc" }}>{prospect.cidade}</span>
        </div>
      )}

      <div style={{ marginBottom: "18px" }}>
        <p style={{ fontSize: "10px", color: "var(--up-text-dim)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>Mover para</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {STATUS_STEPS.filter((s) => s.id !== prospect.status).map((s) => (
            <button key={s.id} onClick={() => onUpdateStatus(prospect.id, s.id)} style={{ background: `${s.color}12`, border: `1px solid ${s.color}40`, borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: "11px", fontWeight: "600", color: s.color }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {prospect.telefone && (
        <a href={`https://wa.me/${prospect.telefone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "6px", padding: "9px 12px", textDecoration: "none", marginBottom: "18px" }}>
          <Phone size={13} color="#22c55e" />
          <span style={{ fontSize: "12px", color: "#22c55e", fontWeight: "600" }}>Abrir no WhatsApp</span>
          <ChevronRight size={13} color="#22c55e" style={{ marginLeft: "auto" }} />
        </a>
      )}

      <div>
        <p style={{ fontSize: "10px", color: "var(--up-text-dim)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px" }}>Anotações</p>
        <textarea
          value={editNota}
          onChange={(e) => setEditNota(e.target.value)}
          rows={5}
          placeholder="Registre o que conversaram, próximos passos..."
          style={{ width: "100%", background: "var(--up-bg)", border: `1px solid ${BORDER_INNER}`, borderRadius: "7px", padding: "10px", fontSize: "13px", color: "#ccc", outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }}
        />
        <button onClick={() => onSaveNota(prospect.id)} style={{ marginTop: "6px", width: "100%", background: ACCENT, border: "none", borderRadius: "6px", padding: "9px", fontSize: "12px", fontWeight: "600", color: "#000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          <Check size={13} /> Salvar
        </button>
      </div>

      {prospect.whatsapp_enviado_at && (
        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${BORDER_INNER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#444" }}>
            <Calendar size={11} />
            Contatado em {new Date(prospect.whatsapp_enviado_at).toLocaleDateString("pt-BR")}
          </div>
        </div>
      )}
    </div>
  );
}
