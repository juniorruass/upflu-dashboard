"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import Header from "@/components/header";
import { Plus, X, Phone, Mail, MapPin, Trash2, MessageSquare } from "lucide-react";

const ACCENT = "#00CFFF";

const COLUMNS = [
  { id: "potencial",       label: "Potencial",        color: "#FF9500" },
  { id: "prospectado",     label: "Prospectado",      color: "var(--up-text-dim)"    },
  { id: "ignorado",        label: "Ignorado",         color: "#444"    },
  { id: "reuniao",         label: "Reunião Agendada", color: "#a064ff" },
  { id: "proposta",        label: "Proposta Enviada", color: "#3b82f6" },
  { id: "fechado",         label: "Fechado",          color: "#22c55e" },
  { id: "onboarding",      label: "Onboarding",       color: "#10b981" },
  { id: "ativo",           label: "Ativo",            color: "#00C896" },
  { id: "cancelado",       label: "Cancelado",        color: "#ef4444" },
];

type KanbanCard = {
  id: string;
  coluna: string;
  posicao: number;
  nome: string;
  empresa: string;
  telefone: string;
  email: string;
  cidade: string;
  tipo: string;
  notas: string;
  prospect_id: string | null;
  created_at: string;
};

type BoardState = Record<string, KanbanCard[]>;

export default function KanbanPage() {
  const [board, setBoard] = useState<BoardState>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<KanbanCard | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [editNotas, setEditNotas] = useState("");

  useEffect(() => { fetchCards(); }, []);

  async function fetchCards() {
    setLoading(true);
    const res = await fetch("/api/kanban/cards");
    const data = await res.json();
    const grouped: BoardState = {};
    COLUMNS.forEach((c) => { grouped[c.id] = []; });
    (data.cards || []).forEach((card: KanbanCard) => {
      if (grouped[card.coluna]) grouped[card.coluna].push(card);
    });
    setBoard(grouped);
    setLoading(false);
  }

  async function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcCol = source.droppableId;
    const dstCol = destination.droppableId;
    const srcCards = [...(board[srcCol] || [])];
    const dstCards = srcCol === dstCol ? srcCards : [...(board[dstCol] || [])];

    const [moved] = srcCards.splice(source.index, 1);
    dstCards.splice(destination.index, 0, { ...moved, coluna: dstCol });

    const newBoard = { ...board, [srcCol]: srcCards, [dstCol]: dstCards };
    setBoard(newBoard);

    await fetch(`/api/kanban/cards/${draggableId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coluna: dstCol, posicao: destination.index }),
    });
  }

  async function addCard(coluna: string) {
    if (!newName.trim()) return;
    const res = await fetch("/api/kanban/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coluna, nome: newName.trim() }),
    });
    const data = await res.json();
    if (data.card) {
      setBoard((prev) => ({ ...prev, [coluna]: [...(prev[coluna] || []), data.card] }));
    }
    setNewName("");
    setAddingTo(null);
  }

  async function deleteCard(id: string, coluna: string) {
    await fetch(`/api/kanban/cards/${id}`, { method: "DELETE" });
    setBoard((prev) => ({ ...prev, [coluna]: prev[coluna].filter((c) => c.id !== id) }));
    if (selected?.id === id) setSelected(null);
  }

  async function saveNotas(id: string) {
    await fetch(`/api/kanban/cards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notas: editNotas }),
    });
    setBoard((prev) => {
      const newBoard = { ...prev };
      Object.keys(newBoard).forEach((col) => {
        newBoard[col] = newBoard[col].map((c) => c.id === id ? { ...c, notas: editNotas } : c);
      });
      return newBoard;
    });
    setSelected((prev) => prev ? { ...prev, notas: editNotas } : null);
  }

  const totalCards = Object.values(board).reduce((sum, col) => sum + col.length, 0);

  return (
    <>
      <Header title="Kanban" />

      <style>{`
        .kanban-wrap { padding: 24px 32px 32px; flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .kanban-board { display: flex; gap: 12px; overflow-x: auto; flex: 1; padding-bottom: 12px; }
        .kanban-col { min-width: 260px; max-width: 260px; display: flex; flex-direction: column; background: var(--up-bg); border: 1px solid var(--up-border); border-radius: 10px; overflow: hidden; }
        .kanban-col-header { padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--up-border); }
        .kanban-cards { flex: 1; padding: 10px; display: flex; flex-direction: column; gap: 8px; min-height: 60px; overflow-y: auto; max-height: calc(100vh - 260px); }
        .kanban-card { background: #161616; border: 1px solid var(--up-border); border-radius: 8px; padding: 12px; cursor: pointer; transition: border-color 0.15s; user-select: none; }
        .kanban-card:hover { border-color: rgba(255,255,255,0.15); }
        .kanban-card.dragging { border-color: ${ACCENT}; box-shadow: 0 4px 20px rgba(0,207,255,0.15); }
        .add-card-btn { width: 100%; background: transparent; border: none; color: #444; font-size: 12px; padding: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px; justify-content: center; border-top: 1px solid var(--up-border); transition: color 0.15s; }
        .add-card-btn:hover { color: #888; }
        .detail-panel { position: fixed; top: 0; right: 0; width: 380px; height: 100vh; background: var(--up-card); border-left: 1px solid var(--up-border); z-index: 100; display: flex; flex-direction: column; }
        .badge { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.06em; }
        @media (max-width: 768px) { .kanban-wrap { padding: 16px; } .detail-panel { width: 100%; } }
      `}</style>

      <div className="kanban-wrap">
        <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "11px", color: ACCENT, letterSpacing: "0.22em", textTransform: "uppercase", margin: "0 0 4px" }}>Funil de vendas</p>
            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "var(--up-text)", margin: 0, letterSpacing: "-0.02em" }}>Kanban</h2>
          </div>
          <div style={{ fontSize: "12px", color: "var(--up-text-dim)" }}>{totalCards} cards no funil</div>
        </div>

        {loading ? (
          <div style={{ color: "var(--up-text-dim)", fontSize: "13px", padding: "40px" }}>Carregando...</div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="kanban-board">
              {COLUMNS.map((col) => {
                const cards = board[col.id] || [];
                return (
                  <div key={col.id} className="kanban-col">
                    <div className="kanban-col-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: col.color }} />
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--up-text)" }}>{col.label}</span>
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--up-text-dim)", background: "var(--up-card)", padding: "2px 7px", borderRadius: "10px" }}>{cards.length}</span>
                    </div>

                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div
                          className="kanban-cards"
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={{ background: snapshot.isDraggingOver ? "rgba(0,207,255,0.03)" : undefined }}
                        >
                          {cards.map((card, index) => (
                            <Draggable key={card.id} draggableId={card.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  className={`kanban-card${snapshot.isDragging ? " dragging" : ""}`}
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => { setSelected(card); setEditNotas(card.notas || ""); }}
                                >
                                  <div style={{ fontWeight: "600", fontSize: "13px", color: "var(--up-text)", marginBottom: "6px", lineHeight: 1.3 }}>{card.nome}</div>
                                  {card.cidade && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                                      <MapPin size={10} color="#555" />
                                      <span style={{ fontSize: "11px", color: "var(--up-text-dim)" }}>{card.cidade.split(",")[0]}</span>
                                    </div>
                                  )}
                                  {card.tipo && (
                                    <span className="badge" style={{ background: card.tipo.includes("estética") ? "rgba(0,207,255,0.1)" : "rgba(160,100,255,0.1)", color: card.tipo.includes("estética") ? ACCENT : "#a064ff" }}>
                                      {card.tipo.includes("estética") ? "Estética" : card.tipo.includes("odonto") ? "Odonto" : card.tipo}
                                    </span>
                                  )}
                                  <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                                    {card.telefone && <Phone size={11} color="#444" />}
                                    {card.email && <Mail size={11} color="#444" />}
                                    {card.notas && <MessageSquare size={11} color="#444" />}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>

                    {addingTo === col.id ? (
                      <div style={{ padding: "8px 10px", borderTop: `1px solid var(--up-border)` }}>
                        <input
                          autoFocus
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") addCard(col.id); if (e.key === "Escape") setAddingTo(null); }}
                          placeholder="Nome do lead..."
                          style={{ width: "100%", background: "var(--up-card)", border: `1px solid ${ACCENT}`, borderRadius: "6px", padding: "8px 10px", fontSize: "12px", color: "var(--up-text)", outline: "none", boxSizing: "border-box" }}
                        />
                        <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                          <button onClick={() => addCard(col.id)} style={{ flex: 1, background: ACCENT, border: "none", borderRadius: "5px", padding: "6px", fontSize: "11px", fontWeight: "600", color: "#000", cursor: "pointer" }}>Adicionar</button>
                          <button onClick={() => setAddingTo(null)} style={{ background: "transparent", border: `1px solid var(--up-border)`, borderRadius: "5px", padding: "6px 8px", cursor: "pointer", color: "var(--up-text-dim)" }}><X size={12} /></button>
                        </div>
                      </div>
                    ) : (
                      <button className="add-card-btn" onClick={() => { setAddingTo(col.id); setNewName(""); }}>
                        <Plus size={13} /> Adicionar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        )}
      </div>

      {/* Painel lateral */}
      {selected && (
        <div className="detail-panel">
          <div style={{ padding: "20px 24px", borderBottom: `1px solid var(--up-border)`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "10px", color: "var(--up-text-dim)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {COLUMNS.find((c) => c.id === selected.coluna)?.label}
              </p>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "var(--up-text)", margin: 0 }}>{selected.nome}</h3>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--up-text-dim)" }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            {[
              { icon: Phone, label: "Telefone", value: selected.telefone },
              { icon: Mail, label: "Email", value: selected.email },
              { icon: MapPin, label: "Cidade", value: selected.cidade },
            ].map(({ icon: Icon, label, value }) => value ? (
              <div key={label} style={{ marginBottom: "16px" }}>
                <p style={{ fontSize: "10px", color: "var(--up-text-dim)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Icon size={13} color="#555" />
                  <span style={{ fontSize: "13px", color: "#ccc" }}>{value}</span>
                </div>
              </div>
            ) : null)}

            <div style={{ marginTop: "8px" }}>
              <p style={{ fontSize: "10px", color: "var(--up-text-dim)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Notas</p>
              <textarea
                value={editNotas}
                onChange={(e) => setEditNotas(e.target.value)}
                placeholder="Adicione notas sobre esse lead..."
                rows={5}
                style={{ width: "100%", background: "var(--up-bg)", border: `1px solid var(--up-border)`, borderRadius: "8px", padding: "12px", fontSize: "13px", color: "#ccc", outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }}
              />
              <button
                onClick={() => saveNotas(selected.id)}
                style={{ marginTop: "8px", width: "100%", background: ACCENT, border: "none", borderRadius: "6px", padding: "9px", fontSize: "12px", fontWeight: "600", color: "#000", cursor: "pointer" }}
              >
                Salvar notas
              </button>
            </div>

            <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: `1px solid var(--up-border)` }}>
              <p style={{ fontSize: "10px", color: "var(--up-text-dim)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Mover para coluna</p>
              <select
                value={selected.coluna}
                onChange={async (e) => {
                  const newCol = e.target.value;
                  await fetch(`/api/kanban/cards/${selected.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ coluna: newCol }),
                  });
                  setBoard((prev) => {
                    const oldCol = selected.coluna;
                    const newBoard = { ...prev };
                    newBoard[oldCol] = newBoard[oldCol].filter((c) => c.id !== selected.id);
                    newBoard[newCol] = [...(newBoard[newCol] || []), { ...selected, coluna: newCol }];
                    return newBoard;
                  });
                  setSelected({ ...selected, coluna: newCol });
                }}
                style={{ width: "100%", background: "var(--up-card)", border: `1px solid var(--up-border)`, borderRadius: "6px", padding: "10px 12px", fontSize: "13px", color: "#ccc", outline: "none" }}
              >
                {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>

            <button
              onClick={() => deleteCard(selected.id, selected.coluna)}
              style={{ marginTop: "20px", width: "100%", background: "transparent", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", padding: "9px", fontSize: "12px", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              <Trash2 size={13} /> Remover card
            </button>
          </div>
        </div>
      )}
    </>
  );
}
