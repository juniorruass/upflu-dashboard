"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/header";
import {
  RefreshCw, Send, Tag, Zap, ChevronLeft, X, Plus, Trash2,
  Check, Settings, Clock, MessageSquare,
} from "lucide-react";

const ACCENT = "#00CFFF";
const BORDER = "rgba(255,255,255,0.07)";

// ── Types ────────────────────────────────────────────────────────
type Chat = {
  id: string;
  remoteJid?: string;
  name?: string;
  pushName?: string;
  unreadCount?: number;
  lastMessage?: { conversation?: string; timestamp?: number };
};

type Msg = {
  key: { remoteJid: string; fromMe: boolean; id: string };
  message?: { conversation?: string; extendedTextMessage?: { text: string } };
  messageTimestamp?: number;
  pushName?: string;
};

type LeadStatus = "novo" | "lead" | "quente" | "cliente" | "sem_interesse";

type PixelConfig = { id: string; name: string; pixelId: string; accessToken: string };

type PixelFire = {
  at: string;
  eventName: string;
  pixelName: string;
  phone: string;
  success: boolean;
  error?: string;
};

type LeadData = { status: LeadStatus; notes: string; updatedAt: string };

// ── Constants ─────────────────────────────────────────────────────
const LEAD_STATUSES: { value: LeadStatus; label: string; color: string }[] = [
  { value: "novo",          label: "Novo",          color: "#666"    },
  { value: "lead",          label: "Lead",          color: "#FF9500" },
  { value: "quente",        label: "Quente",        color: "#ef4444" },
  { value: "cliente",       label: "Cliente",       color: "#22c55e" },
  { value: "sem_interesse", label: "Sem interesse", color: "#555"    },
];

const META_EVENTS = [
  { value: "Lead",                   label: "Lead"               },
  { value: "Purchase",               label: "Compra"             },
  { value: "Contact",                label: "Contato"            },
  { value: "InitiateCheckout",       label: "Início de Checkout" },
  { value: "CompleteRegistration",   label: "Cadastro"           },
  { value: "ViewContent",            label: "Ver Conteúdo"       },
];

// ── Helpers ───────────────────────────────────────────────────────
function msgText(m: Msg): string {
  return m.message?.conversation ?? m.message?.extendedTextMessage?.text ?? "";
}

function jidToPhone(jid: string): string {
  return jid.replace(/@.*/, "").replace(/\D/g, "");
}

function fmtPhone(jid: string): string {
  const n = jidToPhone(jid);
  if (n.startsWith("55") && n.length === 13) return `+55 (${n.slice(2,4)}) ${n.slice(4,9)}-${n.slice(9)}`;
  if (n.startsWith("55") && n.length === 12) return `+55 (${n.slice(2,4)}) ${n.slice(4,8)}-${n.slice(8)}`;
  return n || jid;
}

function chatName(c: Chat): string {
  return c.name ?? c.pushName ?? fmtPhone(c.id);
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase() || "?";
}

function timeLabel(ts?: number): string {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function lsGet<T>(key: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; }
}

function lsSet(key: string, val: unknown) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── Component ─────────────────────────────────────────────────────
export default function InboxPage() {
  const [chats,        setChats]        = useState<Chat[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [search,       setSearch]       = useState("");
  const [selectedJid,  setSelectedJid]  = useState<string | null>(null);
  const [messages,     setMessages]     = useState<Msg[]>([]);
  const [loadingMsgs,  setLoadingMsgs]  = useState(false);
  const [replyText,    setReplyText]    = useState("");
  const [sending,      setSending]      = useState(false);
  const [showRight,    setShowRight]    = useState(true);
  const [mobileView,   setMobileView]   = useState<"list" | "chat">("list");

  // Lead
  const [leadData,   setLeadData]   = useState<LeadData>({ status: "novo", notes: "", updatedAt: "" });
  const [leadSaved,  setLeadSaved]  = useState(false);

  // Pixel
  const [pixelConfigs,    setPixelConfigs]    = useState<PixelConfig[]>([]);
  const [selectedPixelId, setSelectedPixelId] = useState("");
  const [pixelEvent,      setPixelEvent]      = useState("Lead");
  const [firingPixel,     setFiringPixel]     = useState(false);
  const [pixelResult,     setPixelResult]     = useState<{ success: boolean; msg: string } | null>(null);
  const [pixelHistory,    setPixelHistory]    = useState<PixelFire[]>([]);
  const [showHistory,     setShowHistory]     = useState(false);
  const [showPixelForm,   setShowPixelForm]   = useState(false);
  const [newPixel,        setNewPixel]        = useState({ name: "", pixelId: "", accessToken: "" });

  const msgEndRef = useRef<HTMLDivElement>(null);

  // ── Init ──────────────────────────────────────────────────────
  useEffect(() => {
    const configs = lsGet<PixelConfig[]>("wz_pixel_configs", []);
    const history = lsGet<PixelFire[]>("wz_pixel_history", []);
    setPixelConfigs(configs);
    setPixelHistory(history);
    if (configs.length > 0) setSelectedPixelId(configs[0].id);
  }, []);

  // ── Fetch chats ───────────────────────────────────────────────
  const fetchChats = useCallback(async () => {
    setLoadingChats(true);
    try {
      const res  = await fetch("/api/evolution?action=chats&limit=60");
      const data = await res.json();
      setChats(data.chats ?? []);
    } catch { /* silent */ } finally { setLoadingChats(false); }
  }, []);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  // ── Fetch messages ────────────────────────────────────────────
  const fetchMessages = useCallback(async (jid: string) => {
    setLoadingMsgs(true);
    try {
      const res  = await fetch(`/api/evolution?action=messages&jid=${encodeURIComponent(jid)}&limit=60`);
      const data = await res.json();
      const sorted = (data.messages ?? [])
        .sort((a: Msg, b: Msg) => (a.messageTimestamp ?? 0) - (b.messageTimestamp ?? 0));
      setMessages(sorted);
    } catch { /* silent */ } finally { setLoadingMsgs(false); }
  }, []);

  // ── Select chat ───────────────────────────────────────────────
  useEffect(() => {
    if (!selectedJid) return;
    fetchMessages(selectedJid);
    const saved = lsGet<LeadData | null>(`wz_lead_${selectedJid}`, null);
    setLeadData(saved ?? { status: "novo", notes: "", updatedAt: "" });
    setPixelResult(null);
    setLeadSaved(false);
  }, [selectedJid, fetchMessages]);

  // ── Scroll bottom ─────────────────────────────────────────────
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function selectChat(jid: string) {
    setSelectedJid(jid);
    setMobileView("chat");
  }

  // ── Send ──────────────────────────────────────────────────────
  async function sendReply() {
    if (!replyText.trim() || !selectedJid || sending) return;
    setSending(true);
    try {
      await fetch("/api/evolution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", phone: jidToPhone(selectedJid), message: replyText }),
      });
      setReplyText("");
      setTimeout(() => fetchMessages(selectedJid!), 1500);
    } catch { /* silent */ } finally { setSending(false); }
  }

  // ── Save lead ─────────────────────────────────────────────────
  function saveLead() {
    if (!selectedJid) return;
    const data: LeadData = { ...leadData, updatedAt: new Date().toISOString() };
    lsSet(`wz_lead_${selectedJid}`, data);
    setLeadData(data);
    setLeadSaved(true);
    setTimeout(() => setLeadSaved(false), 2500);
  }

  // ── Fire pixel ────────────────────────────────────────────────
  async function firePixel() {
    const config = pixelConfigs.find((p) => p.id === selectedPixelId);
    if (!config || !selectedJid) return;
    setFiringPixel(true);
    setPixelResult(null);
    try {
      const res  = await fetch("/api/meta/capi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pixelId:     config.pixelId,
          accessToken: config.accessToken,
          eventName:   pixelEvent,
          phone:       jidToPhone(selectedJid),
        }),
      });
      const data = await res.json();
      const fire: PixelFire = {
        at:        new Date().toLocaleString("pt-BR"),
        eventName: pixelEvent,
        pixelName: config.name,
        phone:     fmtPhone(selectedJid),
        success:   res.ok,
        error:     res.ok ? undefined : data.error,
      };
      const newHistory = [fire, ...pixelHistory].slice(0, 40);
      setPixelHistory(newHistory);
      lsSet("wz_pixel_history", newHistory);
      setPixelResult(
        res.ok
          ? { success: true,  msg: `Evento ${pixelEvent} disparado — ${data.eventsReceived ?? 1} recebido(s)` }
          : { success: false, msg: data.error ?? "Erro na Meta API" },
      );
    } catch {
      setPixelResult({ success: false, msg: "Erro de conexão" });
    } finally { setFiringPixel(false); }
  }

  // ── Pixel config CRUD ─────────────────────────────────────────
  function addPixelConfig() {
    if (!newPixel.name.trim() || !newPixel.pixelId.trim() || !newPixel.accessToken.trim()) return;
    const cfg: PixelConfig = { id: Date.now().toString(), ...newPixel };
    const updated = [...pixelConfigs, cfg];
    setPixelConfigs(updated);
    lsSet("wz_pixel_configs", updated);
    setNewPixel({ name: "", pixelId: "", accessToken: "" });
    setShowPixelForm(false);
    setSelectedPixelId(cfg.id);
  }

  function removePixelConfig(id: string) {
    const updated = pixelConfigs.filter((p) => p.id !== id);
    setPixelConfigs(updated);
    lsSet("wz_pixel_configs", updated);
    if (selectedPixelId === id) setSelectedPixelId(updated[0]?.id ?? "");
  }

  // ── Derived ───────────────────────────────────────────────────
  const filtered     = chats.filter((c) => {
    if (!search) return true;
    return chatName(c).toLowerCase().includes(search.toLowerCase()) || jidToPhone(c.id).includes(search);
  });
  const selectedChat = chats.find((c) => c.id === selectedJid);
  const leadStatus   = LEAD_STATUSES.find((s) => s.value === leadData.status) ?? LEAD_STATUSES[0];

  // ── Styles ────────────────────────────────────────────────────
  const inp: React.CSSProperties = {
    background: "#0d0d0d", border: `1px solid ${BORDER}`, borderRadius: "6px",
    padding: "9px 12px", fontSize: "13px", color: "#F0EDE8", outline: "none",
    width: "100%", boxSizing: "border-box",
  };

  return (
    <>
      <Header title="Inbox WhatsApp" />

      <style>{`
        .ib-wrap { display:flex; height:calc(100vh - 60px); overflow:hidden; }

        /* Chat list */
        .ib-list { width:272px; min-width:272px; border-right:1px solid ${BORDER}; display:flex; flex-direction:column; background:#080808; }
        .ib-item { padding:11px 14px; cursor:pointer; border-bottom:1px solid ${BORDER}; display:flex; gap:10px; align-items:flex-start; transition:background .12s; }
        .ib-item:hover { background:rgba(255,255,255,.03); }
        .ib-item.sel { background:rgba(0,207,255,.06); border-left:2px solid ${ACCENT}; padding-left:12px; }

        /* Messages */
        .ib-msgs { flex:1; display:flex; flex-direction:column; min-width:0; background:#05060a; }
        .ib-scroll { flex:1; overflow-y:auto; padding:20px 24px; display:flex; flex-direction:column; gap:8px; }
        .bubble { max-width:72%; padding:9px 13px; border-radius:12px; font-size:13px; line-height:1.55; word-break:break-word; }
        .b-me   { align-self:flex-end;  background:rgba(0,207,255,.11); border:1px solid rgba(0,207,255,.18); border-bottom-right-radius:3px; }
        .b-them { align-self:flex-start; background:#111; border:1px solid ${BORDER}; border-bottom-left-radius:3px; }

        /* Right panel */
        .ib-right { width:292px; min-width:292px; border-left:1px solid ${BORDER}; display:flex; flex-direction:column; background:#080808; overflow-y:auto; }
        .rp-sec { padding:16px; border-bottom:1px solid ${BORDER}; }

        /* Misc */
        input:focus,select:focus,textarea:focus { border-color:${ACCENT}!important; }
        .spin { animation:spin .8s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }

        @media(max-width:900px) {
          .ib-list  { width:100%; min-width:0; display:${mobileView==="list"?"flex":"none"}!important; }
          .ib-msgs  { display:${mobileView==="chat"?"flex":"none"}!important; }
          .ib-right { display:none!important; }
        }
      `}</style>

      <div className="ib-wrap">

        {/* ─── Chat list ─────────────────────────────────────── */}
        <div className="ib-list">
          <div style={{ padding:"12px 12px 8px", borderBottom:`1px solid ${BORDER}` }}>
            <div style={{ display:"flex", alignItems:"center", marginBottom:"8px" }}>
              <span style={{ fontSize:"13px", fontWeight:600, color:"#F0EDE8", flex:1 }}>
                Conversas {chats.length > 0 && <span style={{ color:"#555", fontWeight:400 }}>({chats.length})</span>}
              </span>
              <button onClick={fetchChats} style={{ background:"transparent", border:"none", cursor:"pointer", color:"#555", padding:"4px" }}>
                <RefreshCw size={13} className={loadingChats ? "spin" : ""} />
              </button>
            </div>
            <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Buscar contato..." style={{ ...inp, fontSize:"12px", padding:"7px 10px" }} />
          </div>

          <div style={{ flex:1, overflowY:"auto" }}>
            {loadingChats ? (
              <div style={{ padding:"24px", color:"#555", fontSize:"12px", textAlign:"center" }}>Carregando...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding:"24px", color:"#444", fontSize:"12px", textAlign:"center" }}>Sem conversas</div>
            ) : filtered.map((c) => {
              const nm   = chatName(c);
              const lead = lsGet<LeadData|null>(`wz_lead_${c.id}`, null);
              const dot  = LEAD_STATUSES.find((s) => s.value === (lead?.status ?? "novo"));
              const sel  = selectedJid === c.id;
              const ts   = c.lastMessage?.timestamp;
              return (
                <div key={c.id} className={`ib-item${sel?" sel":""}`} onClick={()=>selectChat(c.id)}>
                  <div style={{ width:38, height:38, borderRadius:"50%", background:"rgba(0,207,255,.07)", border:"1px solid rgba(0,207,255,.14)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", fontWeight:600, color:ACCENT, flexShrink:0 }}>
                    {initials(nm)}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                      <span style={{ fontSize:"13px", fontWeight:500, color:"#F0EDE8", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{nm}</span>
                      <span style={{ fontSize:"10px", color:"#444" }}>{timeLabel(ts)}</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:"11px", color:"#555", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {c.lastMessage?.conversation ?? ""}
                      </span>
                      {c.unreadCount ? <span style={{ fontSize:"10px", background:ACCENT, color:"#000", borderRadius:10, padding:"1px 6px", fontWeight:700, flexShrink:0 }}>{c.unreadCount}</span> : null}
                      {dot && dot.value !== "novo" && <div style={{ width:6, height:6, borderRadius:"50%", background:dot.color, flexShrink:0 }} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Messages ──────────────────────────────────────── */}
        <div className="ib-msgs">
          {!selectedJid ? (
            <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12, color:"#2a2a2a" }}>
              <MessageSquare size={44} strokeWidth={1} />
              <span style={{ fontSize:"13px", color:"#444" }}>Selecione uma conversa</span>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding:"11px 18px", borderBottom:`1px solid ${BORDER}`, display:"flex", alignItems:"center", gap:10, background:"#080808", flexShrink:0 }}>
                <button onClick={()=>setMobileView("list")} style={{ background:"transparent", border:"none", cursor:"pointer", color:"#555" }} className="mobile-back-btn">
                  <ChevronLeft size={18} />
                </button>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"14px", fontWeight:600, color:"#F0EDE8" }}>{selectedChat ? chatName(selectedChat) : ""}</div>
                  <div style={{ fontSize:"11px", color:"#555" }}>{fmtPhone(selectedJid)}</div>
                </div>
                {leadData.status !== "novo" && (
                  <span style={{ fontSize:"10px", fontWeight:600, padding:"3px 8px", borderRadius:4, background:`${leadStatus.color}18`, color:leadStatus.color, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                    {leadStatus.label}
                  </span>
                )}
                <button onClick={()=>fetchMessages(selectedJid)} style={{ background:"transparent", border:"none", cursor:"pointer", color:"#555", padding:4 }}>
                  <RefreshCw size={13} />
                </button>
                <button
                  onClick={()=>setShowRight((v)=>!v)}
                  style={{ background:showRight?"rgba(0,207,255,.1)":"transparent", border:`1px solid ${showRight?ACCENT:BORDER}`, borderRadius:6, padding:"6px 10px", cursor:"pointer", color:showRight?ACCENT:"#666", display:"flex", alignItems:"center", gap:5, fontSize:"12px" }}
                >
                  <Tag size={12} /> Lead
                </button>
              </div>

              {/* Scroll */}
              <div className="ib-scroll">
                {loadingMsgs ? (
                  <div style={{ textAlign:"center", color:"#555", fontSize:"12px", padding:20 }}>Carregando mensagens...</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign:"center", color:"#333", fontSize:"12px", padding:20 }}>Sem mensagens</div>
                ) : messages.map((m, i) => {
                  const txt = msgText(m);
                  if (!txt) return null;
                  const time = m.messageTimestamp
                    ? new Date(m.messageTimestamp * 1000).toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" })
                    : "";
                  return (
                    <div key={m.key.id ?? i} className={`bubble ${m.key.fromMe ? "b-me" : "b-them"}`}>
                      {!m.key.fromMe && m.pushName && (
                        <div style={{ fontSize:"10px", color:ACCENT, marginBottom:3, fontWeight:600 }}>{m.pushName}</div>
                      )}
                      <span style={{ color:"#ddd" }}>{txt}</span>
                      <div style={{ fontSize:"10px", color:m.key.fromMe?"rgba(0,207,255,.45)":"#444", marginTop:4, textAlign:"right" }}>{time}</div>
                    </div>
                  );
                })}
                <div ref={msgEndRef} />
              </div>

              {/* Reply */}
              <div style={{ padding:"12px 16px", borderTop:`1px solid ${BORDER}`, background:"#080808", display:"flex", gap:8, flexShrink:0 }}>
                <input
                  value={replyText}
                  onChange={(e)=>setReplyText(e.target.value)}
                  onKeyDown={(e)=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); sendReply(); } }}
                  placeholder="Responder..."
                  style={{ ...inp, flex:1 }}
                />
                <button onClick={sendReply} disabled={!replyText.trim()||sending}
                  style={{ background:ACCENT, border:"none", borderRadius:6, padding:"0 14px", cursor:sending?"not-allowed":"pointer", opacity:sending?.6:1, color:"#000", display:"flex", alignItems:"center" }}>
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* ─── Right panel ───────────────────────────────────── */}
        {showRight && selectedJid && (
          <div className="ib-right">

            {/* Contact */}
            <div className="rp-sec">
              <div style={{ fontSize:"11px", color:"#555", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>Contato</div>
              <div style={{ fontSize:"14px", fontWeight:600, color:"#F0EDE8" }}>{selectedChat ? chatName(selectedChat) : ""}</div>
              <div style={{ fontSize:"12px", color:"#555", marginTop:3 }}>{fmtPhone(selectedJid)}</div>
            </div>

            {/* Lead status */}
            <div className="rp-sec">
              <div style={{ fontSize:"11px", color:"#555", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12, display:"flex", alignItems:"center", gap:5 }}>
                <Tag size={11} /> Status do Lead
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
                {LEAD_STATUSES.map((s) => (
                  <button key={s.value} onClick={()=>setLeadData((p)=>({...p, status:s.value}))}
                    style={{ background:leadData.status===s.value?`${s.color}20`:"transparent", border:`1px solid ${leadData.status===s.value?s.color:BORDER}`, borderRadius:5, padding:"4px 10px", cursor:"pointer", fontSize:"11px", fontWeight:500, color:leadData.status===s.value?s.color:"#555", transition:"all .12s" }}>
                    {s.label}
                  </button>
                ))}
              </div>
              <textarea
                value={leadData.notes}
                onChange={(e)=>setLeadData((p)=>({...p, notes:e.target.value}))}
                placeholder="Anotações sobre o lead..."
                rows={3}
                style={{ ...inp, resize:"vertical", fontFamily:"inherit", lineHeight:1.55, fontSize:"12px" }}
              />
              <button onClick={saveLead}
                style={{ marginTop:10, width:"100%", background:leadSaved?"#22c55e":ACCENT, border:"none", borderRadius:6, padding:9, cursor:"pointer", color:"#000", fontSize:"12px", fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:6, transition:"background .2s" }}>
                {leadSaved ? <><Check size={13}/> Salvo</> : "Salvar status"}
              </button>
            </div>

            {/* Meta Pixel */}
            <div className="rp-sec">
              <div style={{ fontSize:"11px", color:"#555", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12, display:"flex", alignItems:"center", gap:5 }}>
                <Zap size={11} /> Meta Pixel
              </div>

              {pixelConfigs.length === 0 ? (
                <div style={{ textAlign:"center", padding:"12px 0" }}>
                  <div style={{ fontSize:"12px", color:"#555", marginBottom:10 }}>Nenhum pixel configurado</div>
                  <button onClick={()=>setShowPixelForm(true)}
                    style={{ background:"transparent", border:`1px solid ${BORDER}`, borderRadius:6, padding:"7px 14px", cursor:"pointer", color:"#777", fontSize:"12px", display:"inline-flex", alignItems:"center", gap:6 }}>
                    <Plus size={12}/> Adicionar pixel
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom:10 }}>
                    <label style={{ fontSize:"11px", color:"#555", display:"block", marginBottom:5 }}>Pixel / Cliente</label>
                    <select value={selectedPixelId} onChange={(e)=>setSelectedPixelId(e.target.value)} style={{ ...inp, fontSize:"12px" }}>
                      {pixelConfigs.map((p)=>(
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom:12 }}>
                    <label style={{ fontSize:"11px", color:"#555", display:"block", marginBottom:5 }}>Evento</label>
                    <select value={pixelEvent} onChange={(e)=>setPixelEvent(e.target.value)} style={{ ...inp, fontSize:"12px" }}>
                      {META_EVENTS.map((e)=>(
                        <option key={e.value} value={e.value}>{e.label} ({e.value})</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={firePixel} disabled={firingPixel||!selectedPixelId}
                    style={{ width:"100%", background:"rgba(0,207,255,.07)", border:`1px solid rgba(0,207,255,.25)`, borderRadius:6, padding:"10px", cursor:firingPixel?"not-allowed":"pointer", color:ACCENT, fontSize:"13px", fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:6, opacity:firingPixel?.7:1 }}>
                    <Zap size={14}/> {firingPixel ? "Disparando..." : "Disparar Pixel"}
                  </button>

                  {pixelResult && (
                    <div style={{ marginTop:10, background:pixelResult.success?"rgba(34,197,94,.07)":"rgba(239,68,68,.07)", border:`1px solid ${pixelResult.success?"rgba(34,197,94,.2)":"rgba(239,68,68,.2)"}`, borderRadius:6, padding:"9px 12px", fontSize:"12px", color:pixelResult.success?"#22c55e":"#ef4444" }}>
                      {pixelResult.success ? "✓ " : "✗ "}{pixelResult.msg}
                    </div>
                  )}

                  <div style={{ marginTop:10, display:"flex", gap:6 }}>
                    <button onClick={()=>setShowPixelForm(true)}
                      style={{ flex:1, background:"transparent", border:`1px solid ${BORDER}`, borderRadius:5, padding:"6px", cursor:"pointer", color:"#555", fontSize:"11px", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
                      <Settings size={11}/> Pixels
                    </button>
                    <button onClick={()=>setShowHistory(true)}
                      style={{ flex:1, background:"transparent", border:`1px solid ${BORDER}`, borderRadius:5, padding:"6px", cursor:"pointer", color:"#555", fontSize:"11px", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
                      <Clock size={11}/> Histórico
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        )}
      </div>

      {/* ─── Modal: Pixel configs ─────────────────────────────── */}
      {showPixelForm && (
        <div onClick={(e)=>{ if(e.target===e.currentTarget) setShowPixelForm(false); }}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:"#111", border:`1px solid ${BORDER}`, borderRadius:12, padding:24, width:"100%", maxWidth:480, maxHeight:"85vh", overflowY:"auto" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <h3 style={{ fontSize:"15px", fontWeight:600, color:"#F0EDE8", margin:0 }}>Configurar Pixels</h3>
              <button onClick={()=>setShowPixelForm(false)} style={{ background:"transparent", border:"none", cursor:"pointer", color:"#555" }}><X size={16}/></button>
            </div>

            {/* Existing */}
            {pixelConfigs.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:"11px", color:"#555", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>Pixels salvos</div>
                {pixelConfigs.map((p)=>(
                  <div key={p.id} style={{ display:"flex", alignItems:"center", gap:10, background:"#0d0d0d", border:`1px solid ${BORDER}`, borderRadius:7, padding:"10px 14px", marginBottom:6 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"13px", fontWeight:500, color:"#F0EDE8" }}>{p.name}</div>
                      <div style={{ fontSize:"11px", color:"#555", marginTop:2 }}>ID: {p.pixelId}</div>
                    </div>
                    <button onClick={()=>removePixelConfig(p.id)} style={{ background:"transparent", border:"1px solid rgba(239,68,68,.2)", borderRadius:5, padding:"5px 7px", cursor:"pointer", color:"#ef4444" }}>
                      <Trash2 size={12}/>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new */}
            <div style={{ fontSize:"11px", color:"#555", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>Adicionar pixel</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div>
                <label style={{ fontSize:"11px", color:"#555", display:"block", marginBottom:5 }}>Nome (ex: Barbeiro João)</label>
                <input value={newPixel.name} onChange={(e)=>setNewPixel((p)=>({...p, name:e.target.value}))} placeholder="Nome do cliente" style={inp} />
              </div>
              <div>
                <label style={{ fontSize:"11px", color:"#555", display:"block", marginBottom:5 }}>Pixel ID</label>
                <input value={newPixel.pixelId} onChange={(e)=>setNewPixel((p)=>({...p, pixelId:e.target.value}))} placeholder="123456789012345" style={inp} />
              </div>
              <div>
                <label style={{ fontSize:"11px", color:"#555", display:"block", marginBottom:5 }}>Access Token (CAPI)</label>
                <input value={newPixel.accessToken} onChange={(e)=>setNewPixel((p)=>({...p, accessToken:e.target.value}))} placeholder="EAAxxxxxxxx..." type="password" style={inp} />
              </div>
              <button onClick={addPixelConfig} disabled={!newPixel.name||!newPixel.pixelId||!newPixel.accessToken}
                style={{ background:ACCENT, border:"none", borderRadius:6, padding:"10px", cursor:"pointer", color:"#000", fontSize:"13px", fontWeight:600, opacity:(!newPixel.name||!newPixel.pixelId||!newPixel.accessToken)?0.5:1 }}>
                Salvar pixel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: History ───────────────────────────────────── */}
      {showHistory && (
        <div onClick={(e)=>{ if(e.target===e.currentTarget) setShowHistory(false); }}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:"#111", border:`1px solid ${BORDER}`, borderRadius:12, padding:24, width:"100%", maxWidth:520, maxHeight:"80vh", overflowY:"auto" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <h3 style={{ fontSize:"15px", fontWeight:600, color:"#F0EDE8", margin:0 }}>Histórico de disparos</h3>
              <button onClick={()=>setShowHistory(false)} style={{ background:"transparent", border:"none", cursor:"pointer", color:"#555" }}><X size={16}/></button>
            </div>
            {pixelHistory.length === 0 ? (
              <div style={{ textAlign:"center", color:"#444", fontSize:"13px", padding:"20px 0" }}>Nenhum disparo registrado</div>
            ) : pixelHistory.map((h, i) => (
              <div key={i} style={{ background:"#0d0d0d", border:`1px solid ${BORDER}`, borderRadius:7, padding:"11px 14px", marginBottom:6 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:"12px", fontWeight:600, color:h.success?"#22c55e":"#ef4444" }}>
                    {h.success ? "✓" : "✗"} {h.eventName}
                  </span>
                  <span style={{ fontSize:"11px", color:"#555", flex:1 }}>{h.pixelName}</span>
                  <span style={{ fontSize:"10px", color:"#444" }}>{h.at}</span>
                </div>
                <div style={{ fontSize:"11px", color:"#555" }}>{h.phone}</div>
                {h.error && <div style={{ fontSize:"11px", color:"#ef4444", marginTop:3 }}>{h.error}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
