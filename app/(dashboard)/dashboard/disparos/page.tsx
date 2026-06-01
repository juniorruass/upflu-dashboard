"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/header";
import {
  Send, CheckSquare, Square, Loader2, CheckCircle2, XCircle, RefreshCw, MessageCircle, Wifi, WifiOff,
} from "lucide-react";

const ACCENT = "#00CFFF";
const BORDER = "rgba(255,255,255,0.07)";

const WA_TEMPLATES: Record<string, { label: string; corpo: string }> = {
  prospeccao: {
    label: "Prospecção inicial",
    corpo: "{mensagem}",
  },
  followup: {
    label: "Follow-up",
    corpo: "Olá! Passei para ver se tiveram a oportunidade de analisar o que apresentei sobre crescimento digital.\n\nEstamos com agenda aberta para novos projetos. Faz sentido conversar esta semana?\n\nUpflu | upflu.digital",
  },
  retomada: {
    label: "Retomada de contato",
    corpo: "Olá! Sei que o momento pode não ter sido o melhor quando falamos. Surgiu uma novidade que pode fazer diferença pro seu negócio agora.\n\nValeria 5 minutos?\n\nUpflu | upflu.digital",
  },
};

const TEMPLATES: Record<string, { label: string; assunto: string; corpo: string }> = {
  prospeccao: {
    label: "Prospecção inicial",
    assunto: "Diagnóstico Digital Gratuito — {nome}",
    corpo: "{mensagem}",
  },
  followup: {
    label: "Follow-up",
    assunto: "Seguindo nossa conversa, {nome}",
    corpo: "Olá!\n\nPassei para ver se tiveram a oportunidade de analisar o que apresentei sobre crescimento digital.\n\nEstamos com agenda aberta para novos projetos este mês. Faz sentido conversarmos?\n\nUpflu | upflu.digital",
  },
  retomada: {
    label: "Retomada de contato",
    assunto: "Uma novidade para {nome}",
    corpo: "Olá!\n\nSei que o momento pode não ter sido o melhor quando falamos antes. Surgiu uma novidade que pode fazer diferença para o seu negócio agora.\n\nValeria 5 minutos para apresentar?\n\nUpflu | upflu.digital",
  },
};

const STATUS_OPTIONS = [
  { value: "todos",        label: "Todos os status" },
  { value: "potencial",   label: "Potencial"        },
  { value: "novo",        label: "Novo"             },
  { value: "contatado",   label: "Contatado"        },
  { value: "respondeu",   label: "Respondeu"        },
  { value: "sem_interesse", label: "Sem interesse"  },
];

type Prospect = {
  id: string; nome: string; email: string; telefone: string; tipo: string; cidade: string; status: string;
};

type LogEntry = {
  id: string; nome: string; email: string; assunto: string;
  template: string; status: string; sent_at: string;
};

export default function DisparosPage() {
  const [tab, setTab] = useState<"email" | "whatsapp" | "historico">("email");

  // Template
  const [templateKey, setTemplateKey] = useState("prospeccao");
  const [assunto, setAssunto] = useState(TEMPLATES.prospeccao.assunto);
  const [corpo, setCorpo] = useState(TEMPLATES.prospeccao.corpo);

  // Recipients
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loadingProspects, setLoadingProspects] = useState(false);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterTipo, setFilterTipo] = useState("todos");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  // Send email
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ sent: number; failed: number } | null>(null);

  // WhatsApp
  const [waInstanceId, setWaInstanceId]     = useState("");
  const [waToken, setWaToken]               = useState("");
  const [waTemplateKey, setWaTemplateKey]   = useState("prospeccao");
  const [waCorpo, setWaCorpo]               = useState(WA_TEMPLATES.prospeccao.corpo);
  const [waProspects, setWaProspects]       = useState<Prospect[]>([]);
  const [loadingWa, setLoadingWa]           = useState(false);
  const [waSelecionados, setWaSelecionados] = useState<Set<string>>(new Set());
  const [enviandoWa, setEnviandoWa]         = useState(false);
  const [resultadoWa, setResultadoWa]       = useState<{ sent: number; failed: number } | null>(null);
  const [zapiStatus, setZapiStatus]         = useState<"unknown" | "connected" | "disconnected">("unknown");
  const [zapiRawValue, setZapiRawValue]     = useState("");
  const [qrCodeUrl, setQrCodeUrl]           = useState("");

  // History
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchProspects = useCallback(async () => {
    setLoadingProspects(true);
    const params = new URLSearchParams();
    if (filterStatus !== "todos") params.set("status", filterStatus);
    if (filterTipo !== "todos") params.set("tipo", filterTipo);
    const res = await fetch(`/api/crm/prospects?${params}`);
    const data = await res.json();
    const comEmail = (data.prospects || []).filter((p: Prospect) => p.email);
    setProspects(comEmail);
    setSelecionados(new Set());
    setLoadingProspects(false);
  }, [filterStatus, filterTipo]);

  useEffect(() => { fetchProspects(); }, [fetchProspects]);

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    const res = await fetch("/api/disparos/historico");
    const data = await res.json();
    setLogs(data.logs || []);
    setLoadingLogs(false);
  }, []);

  const fetchWaProspects = useCallback(async () => {
    setLoadingWa(true);
    const res = await fetch("/api/crm/prospects");
    const data = await res.json();
    const comTel = (data.prospects || []).filter((p: Prospect) => p.telefone);
    setWaProspects(comTel);
    setWaSelecionados(new Set());
    setLoadingWa(false);
  }, []);

  const checkZapiStatus = useCallback(async (instanceId?: string, token?: string) => {
    const id  = instanceId || waInstanceId;
    const tok = token      || waToken;
    if (!id || !tok) return;
    setZapiStatus("unknown");
    setQrCodeUrl("");
    try {
      const params = new URLSearchParams({ instanceId: id, token: tok });
      const res  = await fetch(`/api/disparos/whatsapp?${params}`);
      const data = await res.json();
      setZapiRawValue(data.rawValue || "");
      if (data.connected) {
        setZapiStatus("connected");
        setQrCodeUrl("");
      } else {
        setZapiStatus("disconnected");
        // Proxy interno para evitar erro de autenticação no browser
        const params = new URLSearchParams({ instanceId: id, token: tok });
        setQrCodeUrl(`/api/disparos/whatsapp/qrcode?${params}`);
      }
    } catch {
      setZapiStatus("disconnected");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waInstanceId, waToken]);

  useEffect(() => {
    if (tab === "whatsapp") { fetchWaProspects(); }
    if (tab === "historico") fetchLogs();
  }, [tab, fetchLogs, fetchWaProspects, checkZapiStatus]);

  function selecionarWaTemplate(key: string) {
    setWaTemplateKey(key);
    setWaCorpo(WA_TEMPLATES[key].corpo);
    setResultadoWa(null);
  }

  function toggleWaProspect(id: string) {
    setWaSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleWaTodos() {
    setWaSelecionados(
      waSelecionados.size === waProspects.length
        ? new Set()
        : new Set(waProspects.map((p) => p.id))
    );
  }

  async function enviarWhatsApp() {
    if (!waSelecionados.size || !waInstanceId || !waToken) return;
    setEnviandoWa(true);
    setResultadoWa(null);
    try {
      const res = await fetch("/api/disparos/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectIds: Array.from(waSelecionados),
          mensagem: waCorpo,
          template: WA_TEMPLATES[waTemplateKey].label,
          instanceId: waInstanceId.trim(),
          token: waToken.trim(),
        }),
      });
      const data = await res.json();
      setResultadoWa({ sent: data.sent, failed: data.failed });
    } finally {
      setEnviandoWa(false);
    }
  }

  function selecionarTemplate(key: string) {
    setTemplateKey(key);
    setAssunto(TEMPLATES[key].assunto);
    setCorpo(TEMPLATES[key].corpo);
    setResultado(null);
  }

  function toggleProspect(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleTodos() {
    setSelecionados(
      selecionados.size === prospects.length
        ? new Set()
        : new Set(prospects.map((p) => p.id))
    );
  }

  async function enviar() {
    if (!selecionados.size) return;
    setEnviando(true);
    setResultado(null);
    try {
      const res = await fetch("/api/disparos/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectIds: Array.from(selecionados),
          assunto,
          corpo,
          template: TEMPLATES[templateKey].label,
        }),
      });
      const data = await res.json();
      setResultado({ sent: data.sent, failed: data.failed });
    } finally {
      setEnviando(false);
    }
  }

  const todosSel   = selecionados.size > 0 && selecionados.size === prospects.length;
  const watodosSel = waSelecionados.size > 0 && waSelecionados.size === waProspects.length;

  return (
    <>
      <Header title="Disparos" />

      <style>{`
        .disp-pad { padding: 40px; }
        .disp-grid { display: grid; grid-template-columns: 320px 1fr; gap: 24px; align-items: start; }
        .tab-btn { background: transparent; border: none; border-bottom: 2px solid transparent; padding: 8px 18px; font-size: 13px; color: #666; cursor: pointer; font-weight: 500; transition: all 0.15s; }
        .tab-btn.active { color: ${ACCENT}; border-bottom-color: ${ACCENT}; }
        .tab-btn:hover:not(.active) { color: #aaa; }
        .disp-table { width: 100%; border-collapse: collapse; }
        .disp-table th { font-size: 10px; font-weight: 600; color: #555; letter-spacing: 0.12em; text-transform: uppercase; padding: 10px 16px; text-align: left; border-bottom: 1px solid ${BORDER}; }
        .disp-table td { font-size: 13px; color: #ccc; padding: 10px 16px; border-bottom: 1px solid ${BORDER}; vertical-align: middle; }
        .disp-table tr:last-child td { border-bottom: none; }
        .disp-table tr:hover td { background: rgba(255,255,255,0.02); cursor: pointer; }
        .disp-input { background: #0d0d0d; border: 1px solid ${BORDER}; border-radius: 6px; padding: 9px 12px; font-size: 13px; color: #ccc; outline: none; width: 100%; box-sizing: border-box; transition: border-color 0.15s; }
        .disp-input:focus { border-color: rgba(0,207,255,0.4); }
        .disp-textarea { background: #0d0d0d; border: 1px solid ${BORDER}; border-radius: 8px; padding: 12px; font-size: 13px; color: #aaa; outline: none; width: 100%; box-sizing: border-box; font-family: inherit; line-height: 1.6; resize: vertical; min-height: 140px; transition: border-color 0.15s; }
        .disp-textarea:focus { border-color: rgba(0,207,255,0.3); }
        .disp-select { background: #1a1a1a; border: 1px solid ${BORDER}; border-radius: 6px; padding: 7px 10px; font-size: 12px; color: #ccc; outline: none; cursor: pointer; }
        .tpl-btn { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 8px; border: 1px solid ${BORDER}; cursor: pointer; background: transparent; transition: all 0.15s; width: 100%; text-align: left; margin-bottom: 8px; }
        .tpl-btn:last-child { margin-bottom: 0; }
        .tpl-btn:hover { border-color: rgba(255,255,255,0.15); }
        .tpl-btn.active { border-color: ${ACCENT}; background: rgba(0,207,255,0.06); }
        .btn-primary { background: ${ACCENT}; color: #000; border: none; border-radius: 8px; padding: 11px 20px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: opacity 0.15s; width: 100%; justify-content: center; }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-primary:hover:not(:disabled) { opacity: 0.85; }
        .panel { background: #111; border: 1px solid ${BORDER}; border-radius: 10px; padding: 20px; }
        .panel-label { font-size: 11px; font-weight: 600; color: #555; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 10px; }
        @media (max-width: 900px) { .disp-pad { padding: 20px 16px; } .disp-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="disp-pad" style={{ flex: 1 }}>

        {/* Título */}
        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "11px", fontWeight: "500", color: ACCENT, letterSpacing: "0.22em", textTransform: "uppercase", margin: "0 0 8px" }}>
            Comunicação
          </p>
          <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#F0EDE8", margin: 0, letterSpacing: "-0.02em" }}>
            Disparos de Email
          </h2>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, marginBottom: "28px" }}>
          <button className={`tab-btn${tab === "email" ? " active" : ""}`} onClick={() => setTab("email")}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Send size={13} /> Email</span>
          </button>
          <button className={`tab-btn${tab === "whatsapp" ? " active" : ""}`} onClick={() => setTab("whatsapp")}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><MessageCircle size={13} /> WhatsApp</span>
          </button>
          <button className={`tab-btn${tab === "historico" ? " active" : ""}`} onClick={() => setTab("historico")}>
            Histórico
          </button>
        </div>

        {/* ── EMAIL ── */}
        {tab === "email" && (
          <div className="disp-grid">

            {/* Esquerda: template + enviar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              <div className="panel">
                <p className="panel-label">Template</p>
                {Object.entries(TEMPLATES).map(([key, tpl]) => (
                  <button key={key} className={`tpl-btn${templateKey === key ? " active" : ""}`} onClick={() => selecionarTemplate(key)}>
                    <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: `2px solid ${templateKey === key ? ACCENT : "#444"}`, flexShrink: 0, background: templateKey === key ? ACCENT : "transparent", transition: "all 0.15s" }} />
                    <span style={{ fontSize: "13px", color: templateKey === key ? "#F0EDE8" : "#777" }}>{tpl.label}</span>
                  </button>
                ))}
              </div>

              <div className="panel">
                <p className="panel-label">Assunto</p>
                <input
                  className="disp-input"
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                  style={{ marginBottom: "16px" }}
                />
                <p className="panel-label">Corpo do email</p>
                <textarea
                  className="disp-textarea"
                  value={corpo}
                  onChange={(e) => setCorpo(e.target.value)}
                />
                <p style={{ fontSize: "11px", color: "#444", margin: "6px 0 0" }}>
                  Variáveis: <span style={{ color: "#666" }}>{"{nome}"}</span> · <span style={{ color: "#666" }}>{"{mensagem}"}</span> (mensagem gerada automaticamente)
                </p>
              </div>

              <div className="panel">
                <button className="btn-primary" onClick={enviar} disabled={enviando || selecionados.size === 0}>
                  {enviando ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  {enviando
                    ? "Enviando..."
                    : selecionados.size === 0
                    ? "Selecione destinatários"
                    : `Enviar para ${selecionados.size} prospect${selecionados.size !== 1 ? "s" : ""}`}
                </button>

                {resultado && (
                  <div style={{ marginTop: "12px", padding: "12px", background: "#0d0d0d", borderRadius: "8px", display: "flex", gap: "16px" }}>
                    <span style={{ fontSize: "13px", color: "#22c55e", display: "flex", alignItems: "center", gap: "5px" }}>
                      <CheckCircle2 size={13} /> {resultado.sent} enviados
                    </span>
                    {resultado.failed > 0 && (
                      <span style={{ fontSize: "13px", color: "#ef4444", display: "flex", alignItems: "center", gap: "5px" }}>
                        <XCircle size={13} /> {resultado.failed} falhas
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Direita: destinatários */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em" }}>Destinatários</span>
                <select className="disp-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select className="disp-select" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
                  <option value="todos">Todos os tipos</option>
                  <option value="clínica estética">Estética</option>
                  <option value="clínica odontológica">Odonto</option>
                  <option value="psicólogo">Psicólogo</option>
                  <option value="fisioterapeuta">Fisio</option>
                  <option value="nutricionista">Nutrição</option>
                </select>
                <button onClick={fetchProspects} style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "6px 10px", color: "#666", cursor: "pointer", display: "flex", alignItems: "center" }}>
                  <RefreshCw size={12} />
                </button>
                <span style={{ marginLeft: "auto", fontSize: "12px", color: "#555" }}>
                  {prospects.length} com email · <span style={{ color: selecionados.size > 0 ? ACCENT : "#555" }}>{selecionados.size} selecionados</span>
                </span>
              </div>

              <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ padding: "10px 16px", borderBottom: `1px solid ${BORDER}` }}>
                  <button onClick={toggleTodos} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", color: "#888", fontSize: "12px", padding: 0 }}>
                    {todosSel ? <CheckSquare size={14} color={ACCENT} /> : <Square size={14} color="#555" />}
                    {todosSel ? "Desmarcar todos" : `Selecionar todos (${prospects.length})`}
                  </button>
                </div>

                {loadingProspects ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#555", fontSize: "13px" }}>Carregando...</div>
                ) : prospects.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#555", fontSize: "13px" }}>
                    Nenhum prospect com email encontrado para este filtro.
                  </div>
                ) : (
                  <div style={{ maxHeight: "480px", overflowY: "auto" }}>
                    <table className="disp-table">
                      <tbody>
                        {prospects.map((p) => {
                          const sel = selecionados.has(p.id);
                          return (
                            <tr key={p.id} onClick={() => toggleProspect(p.id)}>
                              <td style={{ width: "36px", paddingRight: 0 }}>
                                {sel
                                  ? <CheckSquare size={14} color={ACCENT} />
                                  : <Square size={14} color="#444" />}
                              </td>
                              <td>
                                <div style={{ fontWeight: "500", color: sel ? "#F0EDE8" : "#ccc" }}>{p.nome}</div>
                                <div style={{ fontSize: "11px", color: "#555", marginTop: "1px" }}>{p.cidade}</div>
                              </td>
                              <td style={{ fontSize: "12px", color: "#666" }}>{p.email}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── WHATSAPP ── */}
        {tab === "whatsapp" && (
          <div className="disp-grid">
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Credenciais da instância */}
              <div className="panel">
                <p className="panel-label">Instância Z-API</p>
                <input
                  className="disp-input"
                  placeholder="Instance ID"
                  value={waInstanceId}
                  onChange={(e) => { setWaInstanceId(e.target.value); setZapiStatus("unknown"); }}
                  style={{ marginBottom: "8px", fontFamily: "monospace", fontSize: "12px" }}
                />
                <input
                  className="disp-input"
                  placeholder="Token"
                  value={waToken}
                  onChange={(e) => { setWaToken(e.target.value); setZapiStatus("unknown"); }}
                  style={{ marginBottom: "12px", fontFamily: "monospace", fontSize: "12px" }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => checkZapiStatus()}
                    disabled={!waInstanceId || !waToken}
                    style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "6px 12px", fontSize: "12px", color: "#888", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <RefreshCw size={12} /> Verificar conexão
                  </button>
                  {zapiStatus === "connected" && (
                    <span style={{ fontSize: "12px", color: "#22c55e", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Wifi size={12} /> Conectado
                    </span>
                  )}
                  {zapiStatus === "disconnected" && (
                    <span style={{ fontSize: "12px", color: "#ef4444", display: "flex", alignItems: "center", gap: "4px" }}>
                      <WifiOff size={12} /> {zapiRawValue || "Desconectado"}
                    </span>
                  )}
                  {zapiStatus === "unknown" && waInstanceId && waToken && (
                    <span style={{ fontSize: "11px", color: "#555" }}>Clique para verificar</span>
                  )}
                </div>

                {/* QR Code para conectar */}
                {zapiStatus === "disconnected" && (
                  <div style={{ marginTop: "14px" }}>
                    {qrCodeUrl && (
                      <div style={{ padding: "14px", background: "#fff", borderRadius: "10px", display: "inline-block", marginBottom: "10px" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qrCodeUrl}
                          alt="QR Code WhatsApp"
                          style={{ width: "180px", height: "180px", display: "block" }}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                        <p style={{ fontSize: "11px", color: "#555", textAlign: "center", margin: "8px 0 0" }}>
                          Escaneie com o WhatsApp
                        </p>
                      </div>
                    )}
                    <div>
                      <a
                        href="https://app.z-api.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: ACCENT, textDecoration: "none", border: `1px solid rgba(0,207,255,0.3)`, borderRadius: "6px", padding: "7px 12px" }}
                      >
                        Abrir painel Z-API →
                      </a>
                      <p style={{ fontSize: "11px", color: "#555", margin: "6px 0 0" }}>
                        No painel: clique na instância → Conectar → escaneie com WhatsApp
                      </p>
                    </div>
                  </div>
                )}

                <p style={{ fontSize: "11px", color: "#444", margin: "10px 0 0" }}>
                  Troque a instância a qualquer momento para rotacionar os disparos.
                </p>
              </div>

              {/* Templates */}
              <div className="panel">
                <p className="panel-label">Template</p>
                {Object.entries(WA_TEMPLATES).map(([key, tpl]) => (
                  <button key={key} className={`tpl-btn${waTemplateKey === key ? " active" : ""}`} onClick={() => selecionarWaTemplate(key)}>
                    <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: `2px solid ${waTemplateKey === key ? ACCENT : "#444"}`, flexShrink: 0, background: waTemplateKey === key ? ACCENT : "transparent" }} />
                    <span style={{ fontSize: "13px", color: waTemplateKey === key ? "#F0EDE8" : "#777" }}>{tpl.label}</span>
                  </button>
                ))}
              </div>

              {/* Mensagem */}
              <div className="panel">
                <p className="panel-label">Mensagem</p>
                <textarea className="disp-textarea" value={waCorpo} onChange={(e) => setWaCorpo(e.target.value)} style={{ minHeight: "160px" }} />
                <p style={{ fontSize: "11px", color: "#444", margin: "6px 0 0" }}>
                  Variáveis: <span style={{ color: "#666" }}>{"{nome}"}</span> · <span style={{ color: "#666" }}>{"{mensagem}"}</span> · <span style={{ color: "#666" }}>{"{cidade}"}</span>
                </p>
              </div>

              {/* Enviar */}
              <div className="panel">
                <button className="btn-primary" onClick={enviarWhatsApp} disabled={enviandoWa || waSelecionados.size === 0 || !waInstanceId || !waToken} style={{ background: "#25D366", color: "#fff" }}>
                  {enviandoWa ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />}
                  {enviandoWa ? "Enviando..." : !waInstanceId || !waToken ? "Preencha a instância" : waSelecionados.size === 0 ? "Selecione destinatários" : `Enviar para ${waSelecionados.size} prospect${waSelecionados.size !== 1 ? "s" : ""}`}
                </button>
                {resultadoWa && (
                  <div style={{ marginTop: "12px", padding: "12px", background: "#0d0d0d", borderRadius: "8px", display: "flex", gap: "16px" }}>
                    <span style={{ fontSize: "13px", color: "#22c55e", display: "flex", alignItems: "center", gap: "5px" }}>
                      <CheckCircle2 size={13} /> {resultadoWa.sent} enviados
                    </span>
                    {resultadoWa.failed > 0 && (
                      <span style={{ fontSize: "13px", color: "#ef4444", display: "flex", alignItems: "center", gap: "5px" }}>
                        <XCircle size={13} /> {resultadoWa.failed} falhas
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Destinatários WA */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em" }}>Destinatários</span>
                <button onClick={fetchWaProspects} style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "6px 10px", color: "#666", cursor: "pointer", display: "flex", alignItems: "center" }}>
                  <RefreshCw size={12} />
                </button>
                <span style={{ marginLeft: "auto", fontSize: "12px", color: "#555" }}>
                  {waProspects.length} com telefone · <span style={{ color: waSelecionados.size > 0 ? ACCENT : "#555" }}>{waSelecionados.size} selecionados</span>
                </span>
              </div>

              <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ padding: "10px 16px", borderBottom: `1px solid ${BORDER}` }}>
                  <button onClick={toggleWaTodos} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", color: "#888", fontSize: "12px", padding: 0 }}>
                    {watodosSel ? <CheckSquare size={14} color={ACCENT} /> : <Square size={14} color="#555" />}
                    {watodosSel ? "Desmarcar todos" : `Selecionar todos (${waProspects.length})`}
                  </button>
                </div>
                {loadingWa ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#555", fontSize: "13px" }}>Carregando...</div>
                ) : waProspects.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#555", fontSize: "13px" }}>Nenhum prospect com telefone encontrado.</div>
                ) : (
                  <div style={{ maxHeight: "480px", overflowY: "auto" }}>
                    <table className="disp-table">
                      <tbody>
                        {waProspects.map((p) => {
                          const sel = waSelecionados.has(p.id);
                          return (
                            <tr key={p.id} onClick={() => toggleWaProspect(p.id)}>
                              <td style={{ width: "36px", paddingRight: 0 }}>
                                {sel ? <CheckSquare size={14} color={ACCENT} /> : <Square size={14} color="#444" />}
                              </td>
                              <td>
                                <div style={{ fontWeight: "500", color: sel ? "#F0EDE8" : "#ccc" }}>{p.nome}</div>
                                <div style={{ fontSize: "11px", color: "#555" }}>{p.cidade}</div>
                              </td>
                              <td style={{ fontSize: "12px", color: "#666", whiteSpace: "nowrap" }}>{p.telefone}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── HISTÓRICO ── */}
        {tab === "historico" && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
              <button onClick={fetchLogs} style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "7px 12px", color: "#666", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                <RefreshCw size={13} /> Atualizar
              </button>
            </div>

            <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "10px", overflow: "hidden" }}>
              {loadingLogs ? (
                <div style={{ padding: "60px", textAlign: "center", color: "#555" }}>Carregando...</div>
              ) : logs.length === 0 ? (
                <div style={{ padding: "60px", textAlign: "center", color: "#555", fontSize: "13px" }}>
                  Nenhum disparo registrado ainda.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="disp-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Prospect</th>
                        <th>Email</th>
                        <th>Template</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((l) => (
                        <tr key={l.id}>
                          <td style={{ whiteSpace: "nowrap", color: "#666", fontSize: "12px" }}>
                            {new Date(l.sent_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                            {" "}
                            {new Date(l.sent_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td style={{ fontWeight: "500", color: "#F0EDE8" }}>{l.nome}</td>
                          <td style={{ fontSize: "12px", color: "#666" }}>{l.email}</td>
                          <td style={{ fontSize: "12px", color: "#888" }}>{l.template}</td>
                          <td>
                            {l.status === "enviado" ? (
                              <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#22c55e", fontSize: "12px" }}>
                                <CheckCircle2 size={12} /> Enviado
                              </span>
                            ) : (
                              <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#ef4444", fontSize: "12px" }}>
                                <XCircle size={12} /> Falhou
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
