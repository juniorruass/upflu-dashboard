"use client";

import { useState } from "react";
import Header from "@/components/header";
import { Search, Download, Mail, Loader2, CheckCircle2, XCircle } from "lucide-react";

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

type Clinic = {
  id: string;
  nome: string;
  tipo: string;
  cidade: string;
  telefone: string;
  website: string;
  endereco: string;
  avaliacao: number | string;
  totalAvaliacoes: number;
  email: string;
  mensagem: string;
  emailEnviado: boolean;
};

export default function ProspeccaoPage() {
  const [cities, setCities] = useState<string[]>([...ALL_CITIES]);
  const [types, setTypes] = useState<string[]>([...ALL_TYPES]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");

  function toggleCity(c: string) {
    setCities((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }

  function toggleType(t: string) {
    setTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  async function buscar() {
    if (!cities.length || !types.length) return;
    setLoading(true);
    setStatus("Buscando clínicas no Google Maps...");
    setClinics([]);
    try {
      const res = await fetch("/api/prospeccao/buscar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cities, types }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(`Erro: ${data.error || "Falha na busca."}`);
        return;
      }
      setClinics(data.clinics || []);
      const msg = data.total_existing > 0
        ? `${data.total_new} novas clínicas encontradas. (${data.total_existing} já estavam no CRM)`
        : `${data.total_new} clínicas encontradas.`;
      setStatus(msg);
    } catch (e) {
      setStatus(`Erro: ${String(e)}`);
    } finally {
      setLoading(false);
    }
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
      setStatus(`${data.sent} emails enviados com sucesso.`);
    } catch {
      setStatus("Erro ao enviar emails.");
    } finally {
      setSending(false);
    }
  }

  function exportarCSV() {
    if (!clinics.length) return;
    const headers = ["Nome", "Tipo", "Cidade", "Telefone", "Email", "Website", "Endereço", "Avaliação", "Mensagem", "Email Enviado"];
    const rows = clinics.map((c) => [
      c.nome, c.tipo, c.cidade, c.telefone, c.email,
      c.website, c.endereco, String(c.avaliacao),
      `"${c.mensagem.replace(/"/g, '""').replace(/\n/g, " ")}"`,
      c.emailEnviado ? "Sim" : "Não",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prospeccao_clinicas.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const comEmail = clinics.filter((c) => c.email).length;
  const enviados = clinics.filter((c) => c.emailEnviado).length;

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
        .badge-estetica   { background: rgba(0,207,255,0.1);   color: ${ACCENT};   border: 1px solid rgba(0,207,255,0.2); }
        .badge-odonto     { background: rgba(160,100,255,0.1); color: #a064ff;     border: 1px solid rgba(160,100,255,0.2); }
        .badge-psico      { background: rgba(255,183,77,0.1);  color: #FFB74D;     border: 1px solid rgba(255,183,77,0.2); }
        .badge-fisiо      { background: rgba(76,175,80,0.1);   color: #4CAF50;     border: 1px solid rgba(76,175,80,0.2); }
        .badge-nutri      { background: rgba(255,138,101,0.1); color: #FF8A65;     border: 1px solid rgba(255,138,101,0.2); }
        .badge-default    { background: rgba(255,255,255,0.05); color: #9A9288;    border: 1px solid rgba(255,255,255,0.1); }
        .check-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 6px; cursor: pointer; transition: background 0.15s; }
        .check-item:hover { background: rgba(255,255,255,0.03); }
        .btn-primary { background: ${ACCENT}; color: #000; border: none; border-radius: 8px; padding: 10px 20px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: opacity 0.15s; }
        .btn-primary:hover { opacity: 0.85; }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-ghost { background: transparent; color: #ccc; border: 1px solid ${BORDER}; border-radius: 8px; padding: 10px 16px; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: border-color 0.15s; }
        .btn-ghost:hover { border-color: rgba(255,255,255,0.2); color: #fff; }
        .btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }
        @media (max-width: 900px) {
          .prosp-pad { padding: 20px 16px; }
          .prosp-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="prosp-pad" style={{ flex: 1 }}>

        {/* Título */}
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "11px", fontWeight: "500", color: ACCENT, letterSpacing: "0.22em", textTransform: "uppercase", margin: "0 0 8px" }}>
            Captação inteligente
          </p>
          <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#F0EDE8", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Prospecção de Clínicas
          </h2>
          <p style={{ fontSize: "13px", color: "#666", margin: 0, fontWeight: "300" }}>
            Busca automática no Google Maps com mensagens personalizadas prontas para envio.
          </p>
        </div>

        <div className="prosp-grid">

          {/* Painel de filtros */}
          <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "24px", position: "sticky", top: "20px" }}>

            <p style={{ fontSize: "11px", fontWeight: "600", color: "#555", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 12px" }}>
              Cidades
            </p>
            {ALL_CITIES.map((c) => (
              <label key={c} className="check-item" style={{ userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={cities.includes(c)}
                  onChange={() => toggleCity(c)}
                  style={{ accentColor: ACCENT, width: "14px", height: "14px", cursor: "pointer" }}
                />
                <span style={{ fontSize: "13px", color: cities.includes(c) ? "#F0EDE8" : "#666" }}>{c}</span>
              </label>
            ))}

            <div style={{ height: "1px", background: BORDER, margin: "20px 0" }} />

            <p style={{ fontSize: "11px", fontWeight: "600", color: "#555", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 12px" }}>
              Tipo de clínica
            </p>
            {ALL_TYPES.map((t) => (
              <label key={t} className="check-item" style={{ userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={types.includes(t)}
                  onChange={() => toggleType(t)}
                  style={{ accentColor: ACCENT, width: "14px", height: "14px", cursor: "pointer" }}
                />
                <span style={{ fontSize: "13px", color: types.includes(t) ? "#F0EDE8" : "#666", textTransform: "capitalize" }}>{t}</span>
              </label>
            ))}

            <div style={{ height: "1px", background: BORDER, margin: "20px 0" }} />

            <button className="btn-primary" onClick={buscar} disabled={loading || !cities.length || !types.length} style={{ width: "100%", justifyContent: "center" }}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              {loading ? "Buscando..." : "Buscar Clínicas"}
            </button>

            {clinics.length > 0 && (
              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <button className="btn-ghost" onClick={exportarCSV} style={{ width: "100%", justifyContent: "center" }}>
                  <Download size={14} /> Exportar CSV
                </button>
                <button className="btn-ghost" onClick={enviarEmails} disabled={sending || comEmail === 0}
                  style={{ width: "100%", justifyContent: "center" }}>
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                  {sending ? "Enviando..." : `Enviar Emails (${comEmail - enviados})`}
                </button>
              </div>
            )}
          </div>

          {/* Resultados */}
          <div>
            {status && (
              <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", fontSize: "13px", color: "#aaa" }}>
                {status}
              </div>
            )}

            {clinics.length === 0 && !loading && (
              <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "60px 40px", textAlign: "center" }}>
                <Search size={32} color="#333" style={{ margin: "0 auto 16px" }} />
                <p style={{ fontSize: "14px", color: "#555", margin: 0 }}>
                  Selecione as cidades e tipos de clínica e clique em Buscar.
                </p>
              </div>
            )}

            {clinics.length > 0 && (
              <>
                {/* Resumo */}
                <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                  {[
                    { label: "Encontradas", value: clinics.length, color: "#F0EDE8" },
                    { label: "Com email", value: comEmail, color: ACCENT },
                    { label: "Emails enviados", value: enviados, color: "#22c55e" },
                  ].map((s) => (
                    <div key={s.label} style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "12px 20px" }}>
                      <p style={{ fontSize: "10px", color: "#555", margin: "0 0 4px", letterSpacing: "0.1em", textTransform: "uppercase" }}>{s.label}</p>
                      <p style={{ fontSize: "24px", fontWeight: "700", color: s.color, margin: 0, lineHeight: 1, letterSpacing: "-0.03em" }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Tabela */}
                <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "10px", overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table className="prosp-table">
                      <thead>
                        <tr>
                          <th>Clínica</th>
                          <th>Cidade</th>
                          <th>Tipo</th>
                          <th>Telefone</th>
                          <th>Email</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clinics.map((c) => (
                          <tr key={c.id}>
                            <td>
                              <div style={{ fontWeight: "500", color: "#F0EDE8", marginBottom: "2px" }}>{c.nome}</div>
                              {c.avaliacao && (
                                <div style={{ fontSize: "11px", color: "#555" }}>
                                  ★ {c.avaliacao} ({c.totalAvaliacoes} avaliações)
                                </div>
                              )}
                            </td>
                            <td style={{ whiteSpace: "nowrap" }}>{c.cidade}</td>
                            <td>
                              <span className={`badge ${
                                c.tipo.includes("estética")      ? "badge-estetica" :
                                c.tipo.includes("odontológ")     ? "badge-odonto"   :
                                c.tipo.includes("psicólog") || c.tipo.includes("psiquiat") ? "badge-psico" :
                                c.tipo.includes("fisioter")      ? "badge-fisiо"    :
                                c.tipo.includes("nutri")         ? "badge-nutri"    :
                                "badge-default"
                              }`}>
                                {c.tipo.includes("estética")     ? "Estética"      :
                                 c.tipo.includes("odontológ")    ? "Odonto"        :
                                 c.tipo.includes("psicólog")     ? "Psicólogo"     :
                                 c.tipo.includes("psiquiat")     ? "Psiquiatra"    :
                                 c.tipo.includes("fisioter")     ? "Fisioterapia"  :
                                 c.tipo.includes("nutri")        ? "Nutrição"      :
                                 c.tipo}
                              </span>
                            </td>
                            <td style={{ whiteSpace: "nowrap" }}>{c.telefone || "—"}</td>
                            <td style={{ fontSize: "12px", color: c.email ? ACCENT : "#444" }}>
                              {c.email || "—"}
                            </td>
                            <td>
                              {c.emailEnviado ? (
                                <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#22c55e", fontSize: "12px" }}>
                                  <CheckCircle2 size={13} /> Enviado
                                </span>
                              ) : c.email ? (
                                <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#555", fontSize: "12px" }}>
                                  <XCircle size={13} /> Pendente
                                </span>
                              ) : (
                                <span style={{ fontSize: "12px", color: "#333" }}>Sem email</span>
                              )}
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
      </div>
    </>
  );
}
