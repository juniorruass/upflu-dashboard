"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Users } from "lucide-react";
import { Client, ClientStatus } from "@/types";
import ClientCard from "./client-card";
import ClientFormModal from "./client-form-modal";

const GOLD = "#00CFFF";

const STATUS_LABELS: Record<ClientStatus, string> = {
  apresentacao: "Apresentação",
  captado:      "Captado",
  active:       "Ativo",
  onboarding:   "Onboarding",
  paused:       "Pausado",
  ended:        "Encerrado",
};

const STATUS_COLORS: Record<ClientStatus, { color: string; bg: string }> = {
  apresentacao: { color: "#60A5FA", bg: "rgba(96,165,250,0.08)" },
  captado:      { color: "#A78BFA", bg: "rgba(167,139,250,0.08)" },
  active:       { color: "#4ADE80", bg: "rgba(74,222,128,0.08)" },
  onboarding:   { color: GOLD,      bg: "rgba(0,207,255,0.08)" },
  paused:       { color: "var(--up-text-muted)", bg: "rgba(154,146,136,0.08)" },
  ended:        { color: "#EF4444", bg: "rgba(239,68,68,0.08)" },
};

export { STATUS_LABELS, STATUS_COLORS };

type SortOption = "recent" | "name_asc" | "name_desc" | "mrr_desc" | "mrr_asc";

const SORT_LABELS: Record<SortOption, string> = {
  recent:    "Mais recente",
  name_asc:  "A → Z",
  name_desc: "Z → A",
  mrr_desc:  "Maior MRR",
  mrr_asc:   "Menor MRR",
};

interface Props {
  initialClients: Client[];
  overdueClientIds: string[];
}

export default function ClientsView({ initialClients, overdueClientIds }: Props) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ClientStatus | "all">("all");
  const [sort, setSort] = useState<SortOption>("recent");
  const [showForm, setShowForm] = useState(false);

  const overdueSet = useMemo(() => new Set(overdueClientIds), [overdueClientIds]);

  const filtered = useMemo(() => {
    const result = clients.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.segment.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || c.status === filterStatus;
      return matchSearch && matchStatus;
    });

    result.sort((a, b) => {
      switch (sort) {
        case "name_asc":  return a.name.localeCompare(b.name, "pt-BR");
        case "name_desc": return b.name.localeCompare(a.name, "pt-BR");
        case "mrr_desc":  return (b.monthly_value || 0) - (a.monthly_value || 0);
        case "mrr_asc":   return (a.monthly_value || 0) - (b.monthly_value || 0);
        default:          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [clients, search, filterStatus, sort]);

  const stats = useMemo(() => ({
    total: clients.length,
    active: clients.filter((c) => c.status === "active").length,
    mrr: clients.filter((c) => c.status === "active" || c.status === "onboarding")
      .reduce((sum, c) => sum + (c.monthly_value || 0), 0),
    onboarding: clients.filter((c) => c.status === "onboarding").length,
  }), [clients]);

  function handleAdded(client: Client) {
    setClients((prev) => [client, ...prev]);
    setShowForm(false);
  }

  function handleDeleted(id: string) {
    setClients((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <>
    <style>{`
      .cv-pad { padding: 40px; }
      .cv-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 40px; }
      .cv-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
      .cv-search { position: relative; flex: 1; max-width: 320px; }
      .cv-filters { display: flex; gap: 6px; flex-wrap: wrap; }
      .cv-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(320px,1fr)); gap: 16px; }
      .cv-sort-select { background: var(--up-card); border: 1px solid var(--up-border); border-radius: 6px; padding: 8px 12px; font-size: 12px; color: var(--up-text-muted); cursor: pointer; font-family: inherit; outline: none; }
      @media (max-width: 768px) {
        .cv-pad { padding: 20px 16px 48px; }
        .cv-stats { grid-template-columns: repeat(2,1fr); gap: 10px; margin-bottom: 24px; }
        .cv-toolbar { gap: 8px; }
        .cv-search { max-width: 100%; flex: 1 1 100%; order: -1; }
        .cv-filters { order: 1; width: 100%; overflow-x: auto; flex-wrap: nowrap; padding-bottom: 4px; }
        .cv-grid { grid-template-columns: 1fr; }
      }
      @media (max-width: 480px) {
        .cv-stats { grid-template-columns: 1fr 1fr; }
      }
    `}</style>
    <div className="cv-pad" style={{ flex: 1 }}>
      {/* Stats */}
      <div className="cv-stats">
        {[
          { label: "Total de clientes", value: stats.total, unit: "" },
          { label: "Clientes ativos", value: stats.active, unit: "" },
          { label: "MRR total", value: "R$ " + stats.mrr.toLocaleString("pt-BR", { minimumFractionDigits: 0 }), unit: "", isText: true },
          { label: "Em onboarding", value: stats.onboarding, unit: "" },
        ].map((s, i) => (
          <div key={i} style={{
            background: "var(--up-card)", border: `1px solid var(--up-border)`,
            borderRadius: "10px", padding: "24px", position: "relative", overflow: "hidden",
          }}>
            {i === 2 && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg,transparent,${GOLD},transparent)` }} />}
            <p style={{ fontSize: "11px", fontWeight: "500", color: "var(--up-text-label)", margin: "0 0 8px", letterSpacing: "0.12em", textTransform: "uppercase" }}>{s.label}</p>
            <p style={{ fontSize: s.isText ? "26px" : "36px", fontWeight: "700", color: i === 2 ? GOLD : "#F0EDE8", margin: 0, letterSpacing: "-0.03em", lineHeight: 1 }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="cv-toolbar">
        <div className="cv-search">
          <Search size={14} color="#777068" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Buscar cliente ou segmento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", background: "var(--up-card)", border: `1px solid var(--up-border)`,
              borderRadius: "8px", padding: "10px 14px 10px 36px",
              fontSize: "13px", color: "var(--up-text)", outline: "none", boxSizing: "border-box",
              fontFamily: "var(--font-outfit),sans-serif",
            }}
          />
        </div>

        <div className="cv-filters">
          {(["all", "apresentacao", "captado", "active", "onboarding", "paused", "ended"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: "8px 14px", borderRadius: "6px", border: `1px solid ${filterStatus === s ? "rgba(0,207,255,0.4)" : "var(--up-border)"}`,
                background: filterStatus === s ? "rgba(0,207,255,0.08)" : "transparent",
                color: filterStatus === s ? GOLD : "#9A9288",
                fontSize: "12px", fontWeight: "500", cursor: "pointer",
                fontFamily: "var(--font-outfit),sans-serif",
              }}
            >
              {s === "all" ? "Todos" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          className="cv-sort-select"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
        >
          {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <button
          onClick={() => setShowForm(true)}
          style={{
            marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px",
            background: GOLD, border: "none", borderRadius: "8px",
            padding: "10px 18px", fontSize: "13px", fontWeight: "600",
            color: "#080808", cursor: "pointer", fontFamily: "var(--font-outfit),sans-serif",
          }}
        >
          <Plus size={15} />
          Novo cliente
        </button>
      </div>

      {/* Result count */}
      <p style={{ fontSize: "12px", color: "var(--up-text-label)", margin: "-12px 0 20px", fontWeight: "400" }}>
        {filtered.length === clients.length
          ? `${clients.length} cliente${clients.length !== 1 ? "s" : ""}`
          : `${filtered.length} de ${clients.length} cliente${clients.length !== 1 ? "s" : ""}`}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--up-text-label)" }}>
          <Users size={36} color="#1A1A1A" style={{ margin: "0 auto 16px", display: "block" }} />
          <p style={{ fontSize: "15px", fontWeight: "500", color: "var(--up-text-muted)", margin: "0 0 6px" }}>
            {clients.length === 0 ? "Nenhum cliente cadastrado ainda." : "Nenhum resultado para esta busca."}
          </p>
          <p style={{ fontSize: "13px", color: "var(--up-text-label)", margin: 0 }}>
            {clients.length === 0 ? "Clique em Novo cliente para começar." : "Tente outro nome ou filtro."}
          </p>
        </div>
      ) : (
        <div className="cv-grid">
          {filtered.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onDelete={handleDeleted}
              isOverdue={overdueSet.has(client.id)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <ClientFormModal
          onClose={() => setShowForm(false)}
          onSaved={handleAdded}
        />
      )}
    </div>
  </>
  );
}
