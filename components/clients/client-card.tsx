"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Phone, Mail, Trash2 } from "lucide-react";
import { Client, ServiceType } from "@/types";
import { STATUS_LABELS, STATUS_COLORS } from "./clients-view";

const GOLD = "#00CFFF";

const SERVICE_LABELS: Record<ServiceType, string> = {
  ai: "IA", automation: "Automação", traffic: "Tráfego",
  chatbot: "Chatbot", crm: "CRM", funnel: "Funil",
  whatsapp: "WhatsApp", seo: "SEO",
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

interface Props {
  client: Client;
  onDelete: (id: string) => void;
}

export default function ClientCard({ client, onDelete }: Props) {
  const sc = STATUS_COLORS[client.status] ?? { color: "var(--up-text-muted)", bg: "rgba(154,146,136,0.08)" };
  const services = client.services ?? [];
  const [deleting, setDeleting] = useState(false);
  const [hovered, setHovered] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Excluir "${client.name}"? Esta ação não pode ser desfeita.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
      if (res.ok) onDelete(client.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Link href={`/dashboard/clientes/${client.id}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: hovered ? "#131313" : "#111111",
          border: `1px solid ${hovered ? "rgba(0,207,255,0.25)" : "var(--up-border)"}`,
          borderRadius: "12px", padding: "24px", cursor: "pointer",
          transition: "border-color 0.15s, background 0.15s",
          position: "relative",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Delete button — visible on hover */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            position: "absolute", top: "12px", right: "12px",
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)",
            borderRadius: "6px", padding: "5px 7px",
            cursor: "pointer", display: "flex", alignItems: "center",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.15s",
            pointerEvents: hovered ? "auto" : "none",
          }}
        >
          <Trash2 size={13} color="#EF4444" />
        </button>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "18px" }}>
          <div style={{
            width: "44px", height: "44px", flexShrink: 0,
            background: "rgba(0,207,255,0.08)",
            border: "1px solid rgba(0,207,255,0.18)",
            borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px", fontWeight: "700", color: GOLD,
          }}>
            {initials(client.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "15px", fontWeight: "600", color: "var(--up-text)", margin: "0 0 3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {client.name}
            </p>
            <p style={{ fontSize: "12px", color: "var(--up-text-label)", margin: 0 }}>{client.segment}</p>
          </div>
          <span style={{
            fontSize: "10px", fontWeight: "600",
            color: sc.color, background: sc.bg,
            padding: "3px 8px", borderRadius: "20px",
            flexShrink: 0, letterSpacing: "0.04em",
            marginRight: "4px",
          }}>
            {STATUS_LABELS[client.status]}
          </span>
        </div>

        {/* Services */}
        {services.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "18px" }}>
            {services.map((s) => (
              <span key={s.service} style={{
                fontSize: "10px", fontWeight: "500", color: "var(--up-text-muted)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                padding: "3px 8px", borderRadius: "4px",
              }}>
                {SERVICE_LABELS[s.service as ServiceType]}
              </span>
            ))}
          </div>
        )}

        {/* Contact row */}
        <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "18px" }}>
          {client.contact_phone && (
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <Phone size={11} color="#777068" />
              <span style={{ fontSize: "12px", color: "var(--up-text-muted)" }}>{client.contact_phone}</span>
            </div>
          )}
          {client.contact_email && (
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <Mail size={11} color="#777068" />
              <span style={{ fontSize: "12px", color: "var(--up-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.contact_email}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div>
            <p style={{ fontSize: "11px", color: "var(--up-text-label)", margin: "0 0 1px" }}>MRR</p>
            <p style={{ fontSize: "16px", fontWeight: "700", color: client.monthly_value > 0 ? GOLD : "#777068", margin: 0, letterSpacing: "-0.02em" }}>
              {client.monthly_value > 0
                ? "R$ " + client.monthly_value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })
                : "-"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", color: GOLD }}>
            <span style={{ fontSize: "12px", fontWeight: "500" }}>Ver perfil</span>
            <ArrowRight size={13} />
          </div>
        </div>
      </div>
    </Link>
  );
}
