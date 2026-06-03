"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Play, Pause } from "lucide-react";
import Header from "@/components/header";

const ACCENT = "#00CFFF";
const BORDER = "rgba(255,255,255,0.07)";
const GREEN  = "#4ADE80";

const CNAE_LISTA = [
  { codigo: "8630504", label: "Odontologia" },
  { codigo: "9602502", label: "Estética e Beleza" },
  { codigo: "8650004", label: "Fisioterapia" },
  { codigo: "8690901", label: "Psicologia / Psicanálise" },
  { codigo: "8630503", label: "Clínica Médica" },
  { codigo: "9313100", label: "Academia / Fitness" },
  { codigo: "9602501", label: "Cabeleireiro / Barbearia" },
  { codigo: "6911701", label: "Advocacia" },
  { codigo: "6822600", label: "Imobiliária" },
  { codigo: "5611201", label: "Restaurante" },
];

const UF_LIST = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const HOURS   = Array.from({ length: 24 }, (_, i) => i);

const MSG_DEFAULT = `Olá! Vi que a {nome} atua em {cidade} e queria apresentar algo que pode impactar diretamente o crescimento digital do negócio.\n\nA Upflu oferece um diagnóstico digital gratuito de 2 minutos, sem compromisso. Posso enviar o link?\n\nUpflu | upflu.digital`;
const FOLLOWUP_DEFAULT = `Oi! Passei aqui para ver se conseguiu ver a mensagem anterior sobre o crescimento digital da {nome}.\n\nSe tiver interesse em conversar, é só responder. Pode ser uma boa oportunidade!\n\nUpflu | upflu.digital`;

type Config = {
  id: string; name: string; cnae: string; cnae_label: string;
  municipio: string; uf: string; message_template: string;
  daily_limit: number; active: boolean; send_hour: number;
  followup_days: number; followup_template: string | null;
};

const EMPTY: Omit<Config, "id"> = {
  name: "", cnae: "8630504", cnae_label: "Odontologia",
  municipio: "", uf: "ES", message_template: MSG_DEFAULT,
  daily_limit: 30, active: true, send_hour: 9,
  followup_days: 3, followup_template: FOLLOWUP_DEFAULT,
};

const inputStyle: React.CSSProperties = {
  background: "#0d0d0d", border: `1px solid ${BORDER}`, borderRadius: "8px",
  padding: "10px 12px", fontSize: "13px", color: "#F0EDE8", outline: "none",
  width: "100%", boxSizing: "border-box", fontFamily: "inherit",
};
const labelStyle: React.CSSProperties = {
  fontSize: "11px", fontWeight: "600", color: "#777068",
  letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: "6px",
};

export default function AutomatizarPage() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState<Omit<Config, "id">>(EMPTY);
  const [editId, setEditId]   = useState<string | null>(null);
  const [msg, setMsg]         = useState("");

  useEffect(() => { loadConfigs(); }, []);

  async function loadConfigs() {
    setLoading(true);
    const r = await fetch("/api/prospecting-configs");
    const d = await r.json();
    setConfigs(d.configs ?? []);
    setLoading(false);
  }

  async function salvar() {
    if (!form.name.trim() || !form.municipio.trim()) { setMsg("Nome e cidade são obrigatórios."); return; }
    setSaving(true); setMsg("");
    const cnaeInfo = CNAE_LISTA.find((c) => c.codigo === form.cnae);
    const body = { ...form, cnae_label: cnaeInfo?.label ?? form.cnae, ...(editId ? { id: editId } : {}) };
    const r = await fetch("/api/prospecting-configs", {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!r.ok) { setMsg(d.error ?? "Erro ao salvar."); setSaving(false); return; }
    setMsg("Salvo com sucesso!");
    setForm(EMPTY); setEditId(null);
    await loadConfigs();
    setSaving(false);
  }

  async function toggleActive(config: Config) {
    await fetch("/api/prospecting-configs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: config.id, active: !config.active }),
    });
    await loadConfigs();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir esta configuração?")) return;
    await fetch("/api/prospecting-configs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadConfigs();
  }

  function editar(config: Config) {
    setEditId(config.id);
    setForm({ name: config.name, cnae: config.cnae, cnae_label: config.cnae_label, municipio: config.municipio, uf: config.uf, message_template: config.message_template, daily_limit: config.daily_limit, active: config.active, send_hour: config.send_hour, followup_days: config.followup_days, followup_template: config.followup_template });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <Header title="Prospecção Automática" />
      <div style={{ padding: "40px", maxWidth: "860px" }}>

        {/* Form */}
        <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "32px", marginBottom: "40px" }}>
          <p style={{ fontSize: "11px", fontWeight: "600", color: ACCENT, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 20px" }}>
            {editId ? "Editando configuração" : "Nova automação"}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Nome da automação</label>
              <input style={inputStyle} placeholder="Ex: Odontologia - Vitória" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Segmento / CNAE</label>
              <select style={{ ...inputStyle, cursor: "pointer" }} value={form.cnae} onChange={(e) => setForm({ ...form, cnae: e.target.value })}>
                {CNAE_LISTA.map((c) => <option key={c.codigo} value={c.codigo}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Cidade</label>
              <input style={inputStyle} placeholder="Ex: Vitória" value={form.municipio} onChange={(e) => setForm({ ...form, municipio: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Estado (UF)</label>
              <select style={{ ...inputStyle, cursor: "pointer" }} value={form.uf} onChange={(e) => setForm({ ...form, uf: e.target.value })}>
                {UF_LIST.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Horário do disparo</label>
              <select style={{ ...inputStyle, cursor: "pointer" }} value={form.send_hour} onChange={(e) => setForm({ ...form, send_hour: Number(e.target.value) })}>
                {HOURS.map((h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Limite diário de WhatsApps</label>
              <input style={inputStyle} type="number" min="1" max="100" value={form.daily_limit} onChange={(e) => setForm({ ...form, daily_limit: Number(e.target.value) })} />
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Mensagem do 1º contato</label>
            <p style={{ fontSize: "11px", color: "#555", margin: "0 0 6px" }}>Use {"{nome}"} e {"{cidade}"} como variáveis</p>
            <textarea style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }} value={form.message_template} onChange={(e) => setForm({ ...form, message_template: e.target.value })} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "16px", marginBottom: "24px" }}>
            <div>
              <label style={labelStyle}>Follow-up após</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input style={{ ...inputStyle, width: "70px" }} type="number" min="1" max="30" value={form.followup_days} onChange={(e) => setForm({ ...form, followup_days: Number(e.target.value) })} />
                <span style={{ fontSize: "13px", color: "#777" }}>dias</span>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Mensagem de follow-up</label>
              <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} value={form.followup_template ?? ""} onChange={(e) => setForm({ ...form, followup_template: e.target.value || null })} />
            </div>
          </div>

          {msg && <p style={{ fontSize: "13px", color: msg.includes("sucesso") ? GREEN : "#FF6B6B", marginBottom: "16px" }}>{msg}</p>}

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={salvar} disabled={saving} style={{ display: "flex", alignItems: "center", gap: "8px", background: ACCENT, color: "#000", border: "none", borderRadius: "8px", padding: "10px 24px", fontSize: "13px", fontWeight: "700", cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={14} />}
              {editId ? "Salvar alterações" : "Criar automação"}
            </button>
            {editId && (
              <button onClick={() => { setEditId(null); setForm(EMPTY); setMsg(""); }} style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "10px 20px", fontSize: "13px", color: "#777", cursor: "pointer" }}>
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Lista */}
        <p style={{ fontSize: "11px", fontWeight: "600", color: "#555", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "16px" }}>
          Automações configuradas
        </p>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#555" }}><Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} /></div>
        ) : configs.length === 0 ? (
          <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "40px", textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "#555", margin: 0 }}>Nenhuma automação criada ainda.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {configs.map((c) => (
              <div key={c.id} style={{ background: "#111", border: `1px solid ${c.active ? "rgba(74,222,128,0.15)" : BORDER}`, borderRadius: "12px", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#F0EDE8" }}>{c.name}</span>
                    <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 8px", borderRadius: "4px", background: c.active ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.05)", color: c.active ? GREEN : "#555", border: `1px solid ${c.active ? "rgba(74,222,128,0.2)" : BORDER}` }}>
                      {c.active ? "ATIVA" : "PAUSADA"}
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>
                    {c.cnae_label} · {c.municipio}, {c.uf} · {String(c.send_hour).padStart(2, "0")}:00 · {c.daily_limit} msgs/dia · follow-up em {c.followup_days}d
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  <button onClick={() => toggleActive(c)} title={c.active ? "Pausar" : "Ativar"} style={{ background: c.active ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${c.active ? "rgba(74,222,128,0.2)" : BORDER}`, borderRadius: "8px", padding: "8px 12px", cursor: "pointer", color: c.active ? GREEN : "#555" }}>
                    {c.active ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button onClick={() => editar(c)} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 12px", cursor: "pointer", color: "#888", fontSize: "12px" }}>
                    Editar
                  </button>
                  <button onClick={() => excluir(c.id)} style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", color: "#FF6B6B" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );
}
