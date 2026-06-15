"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, ChevronLeft, Send, MessageSquare } from "lucide-react";
import Header from "@/components/header";

const ACCENT = "#00CFFF";
const GREEN  = "#4ADE80";

type Chat = {
  id: string;
  remoteJid?: string;
  name?: string;
  pushName?: string;
  unreadCount?: number;
  lastMessage?: { conversation?: string; timestamp?: number };
};

type Contact = {
  id?: string;
  remoteJid?: string;
  pushName?: string;
  profileName?: string;
  name?: string;
};

type Msg = {
  key: { remoteJid: string; fromMe: boolean; id: string };
  message?: { conversation?: string; extendedTextMessage?: { text: string } };
  messageTimestamp?: number;
};

function msgText(m: Msg) {
  return m.message?.conversation ?? m.message?.extendedTextMessage?.text ?? "";
}

function formatTime(ts?: number) {
  if (!ts) return "";
  return new Date(ts * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const inp: React.CSSProperties = {
  background: "var(--up-bg)", border: `1px solid var(--up-border)`, borderRadius: "8px",
  padding: "10px 12px", fontSize: "13px", color: "var(--up-text)", outline: "none",
  width: "100%", boxSizing: "border-box", fontFamily: "inherit",
};

function formatPhone(jid: string): string {
  const num = jid.replace("@s.whatsapp.net", "").replace("@lid", "").replace(/\D/g, "");
  if (num.startsWith("55") && num.length === 13) {
    return `+55 (${num.slice(2,4)}) ${num.slice(4,9)}-${num.slice(9)}`;
  }
  if (num.startsWith("55") && num.length === 12) {
    return `+55 (${num.slice(2,4)}) ${num.slice(4,8)}-${num.slice(8)}`;
  }
  return num || jid;
}

export default function ChatPage() {
  const [chats, setChats]               = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [contacts, setContacts]         = useState<Record<string, string>>({});
  const [activeChat, setActiveChat]     = useState<Chat | null>(null);
  const [msgs, setMsgs]                 = useState<Msg[]>([]);
  const [msgsLoading, setMsgsLoading]   = useState(false);
  const [input, setInput]               = useState("");
  const [sending, setSending]           = useState(false);
  const [search, setSearch]             = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    if (!activeChat) return;
    loadMsgs(activeChat.id);
    const t = setInterval(() => loadMsgs(activeChat.id), 5000);
    return () => clearInterval(t);
  }, [activeChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  async function loadAll() {
    setChatsLoading(true);
    try {
      const [chatsRes, contactsRes] = await Promise.all([
        fetch("/api/evolution?action=chats&limit=50"),
        fetch("/api/evolution?action=contacts"),
      ]);
      const chatsData    = await chatsRes.json();
      const contactsData = await contactsRes.json();

      const map: Record<string, string> = {};
      (contactsData.contacts ?? []).forEach((c: Contact) => {
        const jid  = c.remoteJid ?? c.id ?? "";
        const name = c.pushName ?? c.profileName ?? c.name ?? "";
        if (jid && name) map[jid] = name;
      });

      setContacts(map);
      setChats(chatsData.chats ?? []);
    } catch { setChats([]); }
    setChatsLoading(false);
  }

  async function loadMsgs(jid: string) {
    setMsgsLoading(true);
    try {
      const r = await fetch(`/api/evolution?action=messages&jid=${encodeURIComponent(jid)}&limit=40`);
      const d = await r.json();
      setMsgs(d.messages ?? []);
    } catch {}
    setMsgsLoading(false);
  }

  async function sendMsg() {
    if (!input.trim() || !activeChat) return;
    setSending(true);
    await fetch("/api/evolution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "test", phone: activeChat.id.replace("@s.whatsapp.net", "").replace("@lid", ""), message: input }),
    });
    setInput("");
    setSending(false);
    await loadMsgs(activeChat.id);
  }

  function resolveName(c: Chat): string {
    if (contacts[c.id]) return contacts[c.id];
    if (c.pushName) return c.pushName;
    if (c.name) return c.name;
    if (c.id?.includes("@g.us")) return "Grupo";
    if (c.id?.includes("@lid")) return "Contato desconhecido";
    return formatPhone(c.id);
  }

  const filteredChats = chats.filter((c) => {
    const name = resolveName(c);
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const chatName = activeChat ? resolveName(activeChat) : "";

  return (
    <>
      <Header title="Chat ao Vivo" />
      <div style={{ padding: "24px 40px 40px", height: "calc(100vh - 65px)", display: "flex", flexDirection: "column" }}>

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "300px 1fr", gap: "16px", minHeight: 0 }}>

          {/* ── LISTA DE CHATS ── */}
          <div style={{ background: "var(--up-card)", border: `1px solid var(--up-border)`, borderRadius: "14px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "16px", borderBottom: `1px solid var(--up-border)` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <MessageSquare size={14} color={ACCENT} />
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--up-text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Conversas</span>
                </div>
                <button onClick={loadAll} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--up-text-dim)", padding: "4px" }}>
                  <RefreshCw size={12} style={{ animation: chatsLoading ? "spin 1s linear infinite" : "none" }} />
                </button>
              </div>
              <input
                style={{ ...inp, fontSize: "12px", padding: "8px 12px" }}
                placeholder="Buscar conversa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {chatsLoading ? (
                <div style={{ padding: "32px", textAlign: "center" }}>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite", color: "var(--up-text-dim)" }} />
                </div>
              ) : filteredChats.length === 0 ? (
                <p style={{ fontSize: "12px", color: "var(--up-text-dim)", padding: "24px", textAlign: "center", margin: 0 }}>
                  {search ? "Nenhum resultado." : "Sem conversas."}
                </p>
              ) : filteredChats.map((c, i) => {
                const id   = c.id || String(i);
                const name = resolveName(c);
                const isActive = activeChat?.id === id;
                return (
                  <div key={id} onClick={() => setActiveChat(c)}
                    style={{ padding: "12px 16px", borderBottom: `1px solid var(--up-border)`, cursor: "pointer", background: isActive ? "rgba(0,207,255,0.07)" : "transparent", borderLeft: isActive ? `2px solid ${ACCENT}` : "2px solid transparent", transition: "background .15s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                      <span style={{ fontSize: "13px", fontWeight: isActive ? "600" : "400", color: isActive ? ACCENT : "#F0EDE8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>{name}</span>
                      {c.unreadCount ? (
                        <span style={{ fontSize: "9px", fontWeight: "700", background: GREEN, color: "#000", borderRadius: "10px", padding: "1px 6px", flexShrink: 0 }}>{c.unreadCount}</span>
                      ) : null}
                    </div>
                    <p style={{ fontSize: "11px", color: "var(--up-text-dim)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.lastMessage?.conversation ?? ""}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── THREAD ── */}
          <div style={{ background: "var(--up-card)", border: `1px solid var(--up-border)`, borderRadius: "14px", display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Header */}
            <div style={{ padding: "14px 20px", borderBottom: `1px solid var(--up-border)`, display: "flex", alignItems: "center", gap: "10px" }}>
              {activeChat && (
                <button onClick={() => { setActiveChat(null); setMsgs([]); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--up-text-dim)", padding: "2px", display: "flex" }}>
                  <ChevronLeft size={16} />
                </button>
              )}
              <span style={{ fontSize: "14px", fontWeight: "600", color: activeChat ? "#F0EDE8" : "#555" }}>
                {activeChat ? chatName : "Selecione uma conversa"}
              </span>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {!activeChat ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ fontSize: "13px", color: "#444", textAlign: "center" }}>Escolha uma conversa ao lado para visualizar as mensagens.</p>
                </div>
              ) : msgsLoading && msgs.length === 0 ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite", color: "var(--up-text-dim)" }} />
                </div>
              ) : msgs.length === 0 ? (
                <p style={{ fontSize: "12px", color: "var(--up-text-dim)", textAlign: "center" }}>Sem mensagens.</p>
              ) : msgs.map((m) => (
                <div key={m.key.id} style={{ display: "flex", justifyContent: m.key.fromMe ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "70%", background: m.key.fromMe ? "rgba(0,207,255,0.12)" : "rgba(255,255,255,0.05)", border: `1px solid ${m.key.fromMe ? "rgba(0,207,255,0.2)" : "var(--up-border)"}`, borderRadius: m.key.fromMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px", padding: "9px 13px" }}>
                    <p style={{ fontSize: "13px", color: "var(--up-text)", margin: "0 0 4px", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{msgText(m)}</p>
                    <p style={{ fontSize: "10px", color: "var(--up-text-dim)", margin: 0, textAlign: "right" }}>{formatTime(m.messageTimestamp)}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            {activeChat && (
              <div style={{ padding: "12px 16px", borderTop: `1px solid var(--up-border)`, display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  style={{ ...inp, flex: 1 }}
                  placeholder="Escreva uma mensagem..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMsg())}
                />
                <button onClick={sendMsg} disabled={sending || !input.trim()}
                  style={{ background: ACCENT, border: "none", borderRadius: "8px", padding: "10px 14px", cursor: "pointer", color: "#000", display: "flex", alignItems: "center", opacity: sending || !input.trim() ? 0.5 : 1 }}>
                  {sending ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={15} />}
                </button>
              </div>
            )}
          </div>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );
}
