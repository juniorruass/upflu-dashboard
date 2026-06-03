"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/header";
import Link from "next/link";
import {
  Search, Download, Mail, Loader2, CheckCircle2, XCircle, Plus, Building2, Zap,
} from "lucide-react";

const ACCENT = "#00CFFF";
const BORDER = "rgba(255,255,255,0.07)";

const ALL_CITIES = [
  "Teixeira de Freitas, BA",
  "Vila Velha, ES",
  "Serra, ES",
  "Vitória, ES",
];

const ALL_TYPES = [
  "clínica estética",
  "clínica odontológica",
  "psicólogo",
  "psiquiatra",
  "fisioterapeuta",
  "nutricionista",
];

const CNAE_LISTA = [
  { codigo: "8630504", label: "Odontologia",                    tipo: "clínica odontológica" },
  { codigo: "9602502", label: "Estética e Beleza",              tipo: "clínica estética"     },
  { codigo: "8650004", label: "Fisioterapia",                   tipo: "fisioterapeuta"       },
  { codigo: "8690901", label: "Psicologia / Psicanálise",       tipo: "psicólogo"            },
  { codigo: "8630503", label: "Clínica Médica (consultas)",     tipo: "clínica médica"       },
  { codigo: "8630501", label: "Clínica Médica (ambulatorial)",  tipo: "clínica médica"       },
  { codigo: "9313100", label: "Academia / Fitness",             tipo: "academia"             },
  { codigo: "9602501", label: "Cabeleireiro / Barbearia",       tipo: "barbearia"            },
  { codigo: "6911701", label: "Advocacia",                      tipo: "advogado"             },
  { codigo: "6822600", label: "Imobiliária",                    tipo: "imobiliária"          },
  { codigo: "5611201", label: "Restaurante",                    tipo: "restaurante"          },
  { codigo: "8650099", label: "Saúde (outros profissionais)",   tipo: "saúde"                },
];

const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
  "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
  "RS","RO","RR","SC","SP","SE","TO",
];

type Clinic = {
  id: string; nome: string; tipo: string; cidade: string;
  telefone: string; website: string; endereco: string;
  avaliacao: number | string; totalAvaliacoes: number;
  email: string; mensagem: string; emailEnviado: boolean;
};

type EmpresaCNAE = {
  cnpj: string; cnpj_formatado: string; nome: string; razao_social: string;
  cidade: string; uf: string; situacao_cadastral: string;
  cnae: string; tipo: string; telefone: string; email: string;
  mensagem: string; adicionado?: boolean;
};

export default function ProspeccaoPage() {
  const router = useRouter();
  const [modo, setModo] = useState<"maps" | "cnae">("maps");

  // Maps state
  const [cities, setCities]   = useState<string[]>([...ALL_CITIES]);
  const [types, setTypes]     = useState<string[]>([...ALL_TYPES]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus]   = useState("");

  // CNAE state
  const [cnaeSel, setCnaeSel]     = useState(CNAE_LISTA[0].codigo);
  const [municipio, setMunicipio] = useState("");
  const [uf, setUf]               = useState("ES");
  const [empresas, setEmpresas]   = useState<EmpresaCNAE[]>([]);
  const [loadingCNAE, setLoadingCNAE] = useState(false);
  const [statusCNAE, setStatusCNAE]   = useState("");
  const [adicionando, setAdicionando] = useState<string | null>(null);

  // ── Maps ──
  async function buscar() {
    if (!cities.length || !types.length) return;
    setLoading(true);
    setStatus("Buscando no Google Maps...");
    setClinics([]);
    try {
      const res = await fetch("/api/prospeccao/buscar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cities, types }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus(`Erro: ${data.error || "Falha."}`); return; }
      setClinics(data.clinics || []);
      setStatus(
        data.total_existing > 0
          ? `${data.total_new} novas encontradas. (${data.total_existing} já no CRM)`
          : `${data.total_new} clínicas encontradas.`
      );
    } catch (e) { setStatus(`Erro: ${String(e)}`); }
    finally { setLoading(false); }
  }

  async function enviarEmails() {
    const comEmail = clinics.filter((c) => c.email && !c.emailEnviado);
    if (!comEmail.length) return;
    setSending(true);
    setStatus(`Enviando emails para ${comEmail.length} clínicas...`);
    try {
      const res = await fetch("/api/prospeccao/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinics: comEmail }),
      });
      const data = await res.json();
      setClinics((prev) =>
        prev.map((c) => {
          const r = data.results?.find((x: { email: string; ok: boolean }) => x.email === c.email);
          return r?.ok ? { ...c, emailEnviado: true } : c;
        })
      );
      setStatus(`${data.sent} emails enviados.`);
    } catch { setStatus("Erro ao enviar emails."); }
    finally { setSending(false); }
  }

  function exportarCSV() {
    if (!clinics.length) return;
    const headers = ["Nome","Tipo","Cidade","Telefone","Email","Website","Endereço","Avaliação","Mensagem","Email Enviado"];
    const rows = clinics.map((c) => [
      c.nome, c.tipo, c.cidade, c.telefone, c.email, c.website, c.endereco,
      String(c.avaliacao),
      `"${c.mensagem.replace(/"/g, '""').replace(/\n/g, " ")}"`,
      c.emailEnviado ? "Sim" : "Não",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "prospeccao.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  // ── CNAE ──
  async function buscarCNAE() {
    if (!municipio.trim()) return;
    setLoadingCNAE(true);
    setStatusCNAE("Consultando Receita Federal via Brasil.io...");
    setEmpresas([]);
    const cnaeInfo = CNAE_LISTA.find((c) => c.codigo === cnaeSel);
    try {
      const res = await fetch("/api/prospeccao/cnae", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnae: cnaeSel, municipio: municipio.trim(), uf, tipoProspect: cnaeInfo?.tipo }),
      });
      const data = await res.json();
      if (!res.ok) { setStatusCNAE(`Erro: ${data.error}`); return; }
      setEmpresas(data.empresas || []);
      // Redireciona pro CRM aba Por CNAE automaticamente
      if (data.total > 0) {
        router.push("/dashboard/crm?aba=cnae");
      } else {
        const existMsg = data.total_existentes > 0 ? ` (${data.total_existentes} já no CRM)` : "";
        setStatusCNAE(`${data.total} empresas ativas encontradas${existMsg}.`);
      }
    } catch (e) { setStatusCNAE(`Erro: ${String(e)}`); }
    finally { setLoadingCNAE(false); }
  }

  async function adicionarAoCRM(empresa: EmpresaCNAE) {
    setAdicionando(empresa.cnpj);
    try {
      const res = await fetch("/api/crm/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(empresa),
      });
      if (res.ok) {
        setEmpresas((prev) => prev.map((e) => e.cnpj === empresa.cnpj ? { ...e, adicionado: true } : e));
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao adicionar.");
      }
    } finally { setAdicionando(null); }
  }

  async function adicionarTodas() {
    for (const empresa of empresas.filter((e) => !e.adicionado)) {
      await adicionarAoCRM(empresa);
    }
  }

  const comEmail   = clinics.filter((c) => c.email).length;
  const enviados   = clinics.filter((c) => c.emailEnviado).length;
  const adicionadas = empresas.filter((e) => e.adicionado).length;

  return (
    <>
      <Header title="Prospecção" />

      <style>{`
        .prosp-pad { padding: 40px; }
        .prosp-grid { display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: start; }
        .prosp-table { width: 100%; border-collapse: collapse; }
        .prosp-table th { font-size: 10px; font-weight: 600; color: #666; letter-spacing: 0.12em; text-transform: uppercase; padding: 10px 16px; text-align: left; border-bottom: 1px solid ${BORDER}; }
        .prosp-table td { font-size: 13px; color: #ccc; padding: 12px 16px; border-bottom: 1px solid ${BORDER}; vertical-align: top; }
        .prosp-table tr:last-child td { border-bottom: none; }
        .prosp-table tr:hover td { background: rgba(255,255,255,0.02); }
        .badge { display: inline-block; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.06em; text-transform: uppercase; }
        .badge-estetica { background: rgba(0,207,255,0.1);   color: ${ACCENT}; border: 1px solid rgba(0,207,255,0.2); }
        .badge-odonto   { background: rgba(160,100,255,0.1); color: #a064ff;   border: 1px solid rgba(160,100,255,0.2); }
        .badge-psico    { background: rgba(255,183,77,0.1);  color: #FFB74D;   border: 1px solid rgba(255,183,77,0.2); }
        .badge-fisio    { background: rgba(76,175,80,0.1);   color: #4CAF50;   border: 1px solid rgba(76,175,80,0.2); }
        .badge-nutri    { background: rgba(255,138,101,0.1); color: #FF8A65;   border: 1px solid rgba(255,138,101,0.2); }
        .badge-default  { background: rgba(255,255,255,0.05);color: #9A9288;   border: 1px solid rgba(255,255,255,0.1); }
        .badge-ativa    { background: rgba(34,197,94,0.1);   color: #22c55e;   border: 1px solid rgba(34,197,94,0.2); }
        .check-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 6px; cursor: pointer; transition: background 0.15s; }
        .check-item:hover { background: rgba(255,255,255,0.03); }
        .btn-primary { background: ${ACCENT}; color: #000; border: none; border-radius: 8px; padding: 10px 20px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: opacity 0.15s; }
        .btn-primary:hover { opacity: 0.85; }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-ghost { background: transparent; color: #ccc; border: 1px solid ${BORDER}; border-radius: 8px; padding: 10px 16px; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: border-color 0.15s; }
        .btn-ghost:hover { border-color: rgba(255,255,255,0.2); color: #fff; }
        .btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-sm { background: rgba(0,207,255,0.1); color: ${ACCENT}; border: 1px solid rgba(0,207,255,0.2); border-radius: 6px; padding: 5px 10px; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; white-space: nowrap; transition: all 0.15s; }
        .btn-sm:hover { background: rgba(0,207,255,0.2); }
        .btn-sm:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-sm.done { background: rgba(34,197,94,0.1); color: #22c55e; border-color: rgba(34,197,94,0.2); cursor: default; }
        .prosp-input { background: #0d0d0d; border: 1px solid ${BORDER}; border-radius: 6px; padding: 9px 12px; font-size: 13px; color: #ccc; outline: none; width: 100%; box-sizing: border-box; transition: border-color 0.15s; }
        .prosp-input:focus { border-color: rgba(0,207,255,0.4); }
        .prosp-input::placeholder { color: #444; }
        .prosp-select { background: #0d0d0d; border: 1px solid ${BORDER}; border-radius: 6px; padding: 9px 12px; font-size: 13px; color: #ccc; outline: none; width: 100%; box-sizing: border-box; cursor: pointer; }
        .tab-btn { background: transparent; border: none; border-bottom: 2px solid transparent; padding: 8px 18px; font-size: 13px; color: #666; cursor: pointer; font-weight: 500; transition: all 0.15s; }
        .tab-btn.active { color: ${ACCENT}; border-bottom-color: ${ACCENT}; }
        .tab-btn:hover:not(.active) { color: #aaa; }
        @media (max-width: 900px) {
          .prosp-pad { padding: 20px 16px; }
          .prosp-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="prosp-pad" style={{ flex: 1 }}>

        {/* Título */}
        <div style={{ marginBottom: "24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: "11px", fontWeight: "500", color: ACCENT, letterSpacing: "0.22em", textTransform: "uppercase", margin: "0 0 8px" }}>
              Captação inteligente
            </p>
            <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#F0EDE8", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
              Prospecção
            </h2>
            <p style={{ fontSize: "13px", color: "#666", margin: 0 }}>
              Busca via Google Maps ou diretamente na Receita Federal por CNAE — só empresas ativas.
            </p>
          </div>
          <Link href="/dashboard/prospeccao/automatizar" style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.25)", borderRadius: "10px", padding: "10px 18px", textDecoration: "none", color: ACCENT, fontSize: "13px", fontWeight: "600", flexShrink: 0 }}>
            <Zap size={14} />
            Automatizar
          </Link>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, marginBottom: "28px" }}>
          <button className={`tab-btn${modo === "maps" ? " active" : ""}`} onClick={() => setModo("maps")}>
            Google Maps
          </button>
          <button className={`tab-btn${modo === "cnae" ? " active" : ""}`} onClick={() => setModo("cnae")}>
            CNAE · Receita Federal
          </button>
        </div>

        {/* ─── MODO MAPS ─── */}
        {modo === "maps" && (
          <div className="prosp-grid">
            <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "24px", position: "sticky", top: "20px" }}>
              <p style={{ fontSize: "11px", fontWeight: "600", color: "#555", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 12px" }}>Cidades</p>
              {ALL_CITIES.map((c) => (
                <label key={c} className="check-item" style={{ userSelect: "none" }}>
                  <input type="checkbox" checked={cities.includes(c)} onChange={() => setCities((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c])} style={{ accentColor: ACCENT, width: "14px", height: "14px", cursor: "pointer" }} />
                  <span style={{ fontSize: "13px", color: cities.includes(c) ? "#F0EDE8" : "#666" }}>{c}</span>
                </label>
              ))}
              <div style={{ height: "1px", background: BORDER, margin: "20px 0" }} />
              <p style={{ fontSize: "11px", fontWeight: "600", color: "#555", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 12px" }}>Tipo de negócio</p>
              {ALL_TYPES.map((t) => (
                <label key={t} className="check-item" style={{ userSelect: "none" }}>
                  <input type="checkbox" checked={types.includes(t)} onChange={() => setTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])} style={{ accentColor: ACCENT, width: "14px", height: "14px", cursor: "pointer" }} />
                  <span style={{ fontSize: "13px", color: types.includes(t) ? "#F0EDE8" : "#666", textTransform: "capitalize" }}>{t}</span>
                </label>
              ))}
              <div style={{ height: "1px", background: BORDER, margin: "20px 0" }} />
              <button className="btn-primary" onClick={buscar} disabled={loading || !cities.length || !types.length} style={{ width: "100%", justifyContent: "center" }}>
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                {loading ? "Buscando..." : "Buscar no Maps"}
              </button>
              {clinics.length > 0 && (
                <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button className="btn-ghost" onClick={exportarCSV} style={{ width: "100%", justifyContent: "center" }}>
                    <Download size={14} /> Exportar CSV
                  </button>
                  <button className="btn-ghost" onClick={enviarEmails} disabled={sending || comEmail === 0} style={{ width: "100%", justifyContent: "center" }}>
                    {sending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                    {sending ? "Enviando..." : `Enviar Emails (${comEmail - enviados})`}
                  </button>
                </div>
              )}
            </div>

            <div>
              {status && <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", fontSize: "13px", color: "#aaa" }}>{status}</div>}
              {clinics.length === 0 && !loading && (
                <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "60px 40px", textAlign: "center" }}>
                  <Search size={32} color="#333" style={{ margin: "0 auto 16px" }} />
                  <p style={{ fontSize: "14px", color: "#555", margin: 0 }}>Selecione cidades e tipos e clique em Buscar.</p>
                </div>
              )}
              {clinics.length > 0 && (
                <>
                  <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                    {[{ label: "Encontradas", value: clinics.length, color: "#F0EDE8" }, { label: "Com email", value: comEmail, color: ACCENT }, { label: "Enviados", value: enviados, color: "#22c55e" }].map((s) => (
                      <div key={s.label} style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "12px 20px" }}>
                        <p style={{ fontSize: "10px", color: "#555", margin: "0 0 4px", letterSpacing: "0.1em", textTransform: "uppercase" }}>{s.label}</p>
                        <p style={{ fontSize: "24px", fontWeight: "700", color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ overflowX: "auto" }}>
                      <table className="prosp-table">
                        <thead><tr><th>Clínica</th><th>Cidade</th><th>Tipo</th><th>Telefone</th><th>Email</th><th>Status</th></tr></thead>
                        <tbody>
                          {clinics.map((c) => (
                            <tr key={c.id}>
                              <td>
                                <div style={{ fontWeight: "500", color: "#F0EDE8" }}>{c.nome}</div>
                                {c.avaliacao && <div style={{ fontSize: "11px", color: "#555" }}>★ {c.avaliacao} ({c.totalAvaliacoes})</div>}
                              </td>
                              <td style={{ whiteSpace: "nowrap" }}>{c.cidade}</td>
                              <td>
                                <span className={`badge ${c.tipo.includes("estética") ? "badge-estetica" : c.tipo.includes("odontológ") ? "badge-odonto" : c.tipo.includes("psicólog") || c.tipo.includes("psiquiat") ? "badge-psico" : c.tipo.includes("fisioter") ? "badge-fisio" : c.tipo.includes("nutri") ? "badge-nutri" : "badge-default"}`}>
                                  {c.tipo.includes("estética") ? "Estética" : c.tipo.includes("odontológ") ? "Odonto" : c.tipo.includes("psicólog") ? "Psicólogo" : c.tipo.includes("psiquiat") ? "Psiquiatra" : c.tipo.includes("fisioter") ? "Fisio" : c.tipo.includes("nutri") ? "Nutrição" : c.tipo}
                                </span>
                              </td>
                              <td style={{ whiteSpace: "nowrap" }}>{c.telefone || "—"}</td>
                              <td style={{ fontSize: "12px", color: c.email ? ACCENT : "#444" }}>{c.email || "—"}</td>
                              <td>
                                {c.emailEnviado ? <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#22c55e", fontSize: "12px" }}><CheckCircle2 size={13} /> Enviado</span>
                                  : c.email ? <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#555", fontSize: "12px" }}><XCircle size={13} /> Pendente</span>
                                  : <span style={{ fontSize: "12px", color: "#333" }}>Sem email</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ─── MODO CNAE ─── */}
        {modo === "cnae" && (
          <div className="prosp-grid">
            <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "24px", position: "sticky", top: "20px" }}>
              <p style={{ fontSize: "11px", fontWeight: "600", color: "#555", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 8px" }}>Segmento / CNAE</p>
              <select className="prosp-select" value={cnaeSel} onChange={(e) => setCnaeSel(e.target.value)} style={{ marginBottom: "16px" }}>
                {CNAE_LISTA.map((c) => (
                  <option key={c.codigo} value={c.codigo}>{c.label} · {c.codigo}</option>
                ))}
              </select>

              <div style={{ height: "1px", background: BORDER, margin: "4px 0 16px" }} />

              <p style={{ fontSize: "11px", fontWeight: "600", color: "#555", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 8px" }}>Cidade</p>
              <input
                className="prosp-input"
                placeholder="Ex: Vitória, Vila Velha..."
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && buscarCNAE()}
                style={{ marginBottom: "12px" }}
              />

              <p style={{ fontSize: "11px", fontWeight: "600", color: "#555", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 8px" }}>Estado (UF)</p>
              <select className="prosp-select" value={uf} onChange={(e) => setUf(e.target.value)} style={{ marginBottom: "20px" }}>
                {UF_LIST.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>

              <button className="btn-primary" onClick={buscarCNAE} disabled={loadingCNAE || !municipio.trim()} style={{ width: "100%", justifyContent: "center" }}>
                {loadingCNAE ? <Loader2 size={15} className="animate-spin" /> : <Building2 size={15} />}
                {loadingCNAE ? "Buscando..." : "Buscar empresas ativas"}
              </button>

              {empresas.length > 0 && (
                <button className="btn-ghost" onClick={adicionarTodas} disabled={adicionadas === empresas.length} style={{ width: "100%", justifyContent: "center", marginTop: "10px" }}>
                  <Plus size={14} />
                  {adicionadas === empresas.length ? "Todas no CRM" : "Adicionar todas ao CRM"}
                </button>
              )}

              <div style={{ marginTop: "20px", padding: "12px", background: "#0d0d0d", borderRadius: "8px", border: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: "11px", color: "#555", margin: "0 0 4px" }}>Fonte dos dados</p>
                <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>Receita Federal via Brasil.io</p>
                <p style={{ fontSize: "11px", color: "#444", margin: "4px 0 0" }}>Retorna apenas empresas com situação ATIVA</p>
              </div>
            </div>

            <div>
              {statusCNAE && <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", fontSize: "13px", color: "#aaa" }}>{statusCNAE}</div>}

              {empresas.length === 0 && !loadingCNAE && (
                <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "60px 40px", textAlign: "center" }}>
                  <Building2 size={32} color="#333" style={{ margin: "0 auto 16px" }} />
                  <p style={{ fontSize: "14px", color: "#555", margin: "0 0 8px" }}>Selecione o segmento e a cidade.</p>
                  <p style={{ fontSize: "12px", color: "#444", margin: 0 }}>Retorna apenas empresas com situação ATIVA na Receita Federal.</p>
                </div>
              )}

              {empresas.length > 0 && (
                <>
                  <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                    {[{ label: "Encontradas", value: empresas.length, color: "#F0EDE8" }, { label: "Adicionadas ao CRM", value: adicionadas, color: "#22c55e" }].map((s) => (
                      <div key={s.label} style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "12px 20px" }}>
                        <p style={{ fontSize: "10px", color: "#555", margin: "0 0 4px", letterSpacing: "0.1em", textTransform: "uppercase" }}>{s.label}</p>
                        <p style={{ fontSize: "24px", fontWeight: "700", color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ overflowX: "auto" }}>
                      <table className="prosp-table">
                        <thead>
                          <tr><th>Empresa</th><th>CNPJ</th><th>Cidade / UF</th><th>Telefone</th><th>Situação</th><th>CRM</th></tr>
                        </thead>
                        <tbody>
                          {empresas.map((e) => (
                            <tr key={e.cnpj}>
                              <td>
                                <div style={{ fontWeight: "500", color: "#F0EDE8" }}>{e.nome}</div>
                                {e.razao_social !== e.nome && <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>{e.razao_social}</div>}
                              </td>
                              <td style={{ fontFamily: "monospace", fontSize: "12px", whiteSpace: "nowrap", color: "#888" }}>{e.cnpj_formatado}</td>
                              <td style={{ whiteSpace: "nowrap", color: "#888" }}>{e.cidade}</td>
                              <td style={{ whiteSpace: "nowrap" }}>{e.telefone || "—"}</td>
                              <td><span className="badge badge-ativa">ATIVA</span></td>
                              <td>
                                <button
                                  className={`btn-sm${e.adicionado ? " done" : ""}`}
                                  onClick={() => !e.adicionado && adicionarAoCRM(e)}
                                  disabled={adicionando === e.cnpj || e.adicionado}
                                >
                                  {adicionando === e.cnpj ? <Loader2 size={11} className="animate-spin" /> : e.adicionado ? <CheckCircle2 size={11} /> : <Plus size={11} />}
                                  {e.adicionado ? "No CRM" : "CRM"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
