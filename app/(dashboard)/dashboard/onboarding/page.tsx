"use client";

import { useEffect, useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { CheckSquare, Square, Trash2, Plus, ChevronDown, ChevronRight, CheckCircle2, Circle, GripVertical } from "lucide-react";
import Link from "next/link";
import Header from "@/components/header";

const ACCENT = "#00CFFF";
const BORDER = "rgba(255,255,255,0.07)";
const LS_KEY = "onboarding-client-order";

type Task = {
  id: string;
  client_id: string;
  title: string;
  done: boolean;
  position: number;
};

type ClientOnboarding = {
  id: string;
  name: string;
  segment: string;
  status: string;
  contact_email: string | null;
  tasks: Task[];
};

const STATUS_LABEL: Record<string, string> = {
  onboarding: "Onboarding",
  active: "Ativo",
  apresentacao: "Apresentação",
  captado: "Captado",
  paused: "Pausado",
  ended: "Encerrado",
};

function applyOrder(clients: ClientOnboarding[], order: string[]): ClientOnboarding[] {
  const map = new Map(order.map((id, i) => [id, i]));
  return [...clients].sort((a, b) => (map.get(a.id) ?? 9999) - (map.get(b.id) ?? 9999));
}

function ProgressBar({ pct, done }: { pct: number; done: boolean }) {
  return (
    <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "99px", overflow: "hidden", flex: 1 }}>
      <div style={{
        height: "100%", width: `${pct}%`, borderRadius: "99px",
        background: done ? "linear-gradient(90deg,#4CAF50,#81C784)" : `linear-gradient(90deg,${ACCENT},rgba(0,207,255,0.5))`,
        transition: "width 0.4s ease",
      }} />
    </div>
  );
}

function TaskList({ client, onUpdate }: {
  client: ClientOnboarding;
  onUpdate: (clientId: string, tasks: Task[], newStatus?: string) => void;
}) {
  const [tasks, setTasks] = useState<Task[]>(client.tasks);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => { setTasks(client.tasks); }, [client.tasks]);

  async function toggle(task: Task) {
    setToggling(task.id);
    const res = await fetch(`/api/clients/${client.id}/onboarding/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !task.done }),
    });
    if (res.ok) {
      const { completed } = await res.json();
      const updated = tasks.map((t) => t.id === task.id ? { ...t, done: !task.done } : t);
      setTasks(updated);
      onUpdate(client.id, updated, completed ? "active" : undefined);
    }
    setToggling(null);
  }

  async function addTask() {
    if (!newTitle.trim()) return;
    setAdding(true);
    const res = await fetch(`/api/clients/${client.id}/onboarding`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    if (res.ok) {
      const task: Task = await res.json();
      const updated = [...tasks, task];
      setTasks(updated);
      onUpdate(client.id, updated);
      setNewTitle("");
    }
    setAdding(false);
  }

  async function deleteTask(taskId: string) {
    const res = await fetch(`/api/clients/${client.id}/onboarding/${taskId}`, { method: "DELETE" });
    if (res.ok) {
      const updated = tasks.filter((t) => t.id !== taskId);
      setTasks(updated);
      onUpdate(client.id, updated);
    }
  }

  return (
    <Droppable droppableId={`tasks-${client.id}`} type="TASK">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          style={{
            borderTop: `1px solid ${BORDER}`,
            padding: "8px 20px 16px",
            background: snapshot.isDraggingOver ? "rgba(0,207,255,0.02)" : "transparent",
            transition: "background 0.15s",
          }}
        >
          {tasks.length === 0 && (
            <p style={{ fontSize: "13px", color: "#555", padding: "12px 0 8px", margin: 0 }}>
              Nenhuma tarefa ainda.
            </p>
          )}
          {tasks.map((t, idx) => (
            <Draggable key={t.id} draggableId={`task-${t.id}`} index={idx}>
              {(prov, snap) => (
                <div
                  ref={prov.innerRef}
                  {...prov.draggableProps}
                  className="task-row"
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "7px 0",
                    borderBottom: `1px solid rgba(255,255,255,0.03)`,
                    background: snap.isDragging ? "#111111" : "transparent",
                    borderRadius: snap.isDragging ? "6px" : 0,
                    ...prov.draggableProps.style,
                  }}
                >
                  <span {...prov.dragHandleProps} style={{ color: "#333", display: "flex", cursor: "grab", flexShrink: 0 }}>
                    <GripVertical size={13} />
                  </span>
                  <button
                    onClick={() => toggle(t)}
                    disabled={toggling === t.id}
                    style={{
                      background: "none", border: "none", cursor: "pointer", padding: 0,
                      display: "flex", flexShrink: 0,
                      color: t.done ? "#4CAF50" : "#555",
                      transition: "color 0.15s",
                      opacity: toggling === t.id ? 0.5 : 1,
                    }}
                  >
                    {t.done ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                  <span style={{
                    flex: 1, fontSize: "13px",
                    color: t.done ? "#555" : "#D0CBC4",
                    textDecoration: t.done ? "line-through" : "none",
                    transition: "all 0.2s",
                  }}>
                    {t.title}
                  </span>
                  <button
                    onClick={() => deleteTask(t.id)}
                    className="task-delete-btn"
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      padding: "2px", color: "#444", display: "flex",
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px" }}>
            <span style={{ color: "#333", display: "flex", flexShrink: 0 }}>
              <Plus size={14} />
            </span>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}
              placeholder="Adicionar tarefa..."
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontSize: "13px", color: "#777068", fontFamily: "var(--font-outfit),sans-serif",
                padding: "4px 0",
              }}
            />
            {newTitle.trim() && (
              <button
                onClick={addTask}
                disabled={adding}
                style={{
                  background: ACCENT, border: "none", borderRadius: "5px",
                  padding: "4px 10px", fontSize: "11px", fontWeight: "600",
                  color: "#080808", cursor: "pointer", fontFamily: "var(--font-outfit),sans-serif",
                }}
              >
                {adding ? "..." : "Add"}
              </button>
            )}
          </div>
        </div>
      )}
    </Droppable>
  );
}

function ClientBlock({ client, index, onUpdate }: {
  client: ClientOnboarding;
  index: number;
  onUpdate: (clientId: string, tasks: Task[], newStatus?: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const done = client.tasks.filter((t) => t.done).length;
  const total = client.tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = total > 0 && done === total;

  return (
    <Draggable draggableId={`client-${client.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            background: "#111111",
            border: `1px solid ${allDone ? "rgba(76,175,80,0.25)" : snapshot.isDragging ? "rgba(0,207,255,0.3)" : BORDER}`,
            borderRadius: "12px",
            overflow: "hidden",
            marginBottom: "10px",
            transition: "border-color 0.2s",
            boxShadow: snapshot.isDragging ? "0 8px 32px rgba(0,0,0,0.4)" : "none",
            ...provided.draggableProps.style,
          }}
        >
          {/* Header */}
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", background: allDone ? "rgba(76,175,80,0.04)" : "transparent" }}>
            {/* Client drag handle */}
            <span
              {...provided.dragHandleProps}
              style={{ color: "#333", display: "flex", cursor: "grab", flexShrink: 0 }}
            >
              <GripVertical size={15} />
            </span>

            {/* Avatar */}
            <div style={{
              width: "34px", height: "34px", borderRadius: "8px", flexShrink: 0,
              background: allDone ? "rgba(76,175,80,0.1)" : "rgba(0,207,255,0.08)",
              border: `1px solid ${allDone ? "rgba(76,175,80,0.25)" : "rgba(0,207,255,0.18)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "13px", fontWeight: "700",
              color: allDone ? "#4CAF50" : ACCENT,
            }}>
              {client.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                <Link
                  href={`/dashboard/clientes/${client.id}`}
                  style={{ fontSize: "14px", fontWeight: "600", color: "#F0EDE8", textDecoration: "none" }}
                >
                  {client.name}
                </Link>
                <span style={{ fontSize: "10px", color: "#777068", background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, padding: "1px 7px", borderRadius: "4px" }}>
                  {STATUS_LABEL[client.status] ?? client.status}
                </span>
                {client.segment && <span style={{ fontSize: "11px", color: "#555" }}>{client.segment}</span>}
                {allDone && (
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: "600", color: "#4CAF50", background: "rgba(76,175,80,0.1)", padding: "2px 8px", borderRadius: "4px" }}>
                    <CheckCircle2 size={10} /> Concluído
                  </span>
                )}
              </div>
              {total > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <ProgressBar pct={pct} done={allDone} />
                  <span style={{ fontSize: "11px", fontWeight: "600", color: allDone ? "#4CAF50" : ACCENT, flexShrink: 0 }}>
                    {done}/{total}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setCollapsed((v) => !v)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#555", display: "flex", flexShrink: 0 }}
            >
              {collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>

          {/* Tasks */}
          {!collapsed && (
            <TaskList client={client} onUpdate={onUpdate} />
          )}
        </div>
      )}
    </Draggable>
  );
}

export default function OnboardingPage() {
  const [clients, setClients] = useState<ClientOnboarding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((data: ClientOnboarding[]) => {
        const order: string[] = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
        setClients(applyOrder(data, order));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleUpdate = useCallback((clientId: string, tasks: Task[], newStatus?: string) => {
    setClients((prev) =>
      prev.map((c) => c.id === clientId ? { ...c, tasks, status: newStatus ?? c.status } : c)
    );
  }, []);

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    if (result.type === "CLIENT") {
      const reordered = Array.from(clients);
      const [removed] = reordered.splice(result.source.index, 1);
      reordered.splice(result.destination.index, 0, removed);
      setClients(reordered);
      localStorage.setItem(LS_KEY, JSON.stringify(reordered.map((c) => c.id)));
      return;
    }

    if (result.type === "TASK") {
      const clientId = result.source.droppableId.replace("tasks-", "");
      setClients((prev) =>
        prev.map((c) => {
          if (c.id !== clientId) return c;
          const tasks = Array.from(c.tasks);
          const [removed] = tasks.splice(result.source.index, 1);
          tasks.splice(result.destination!.index, 0, removed);
          fetch(`/api/clients/${clientId}/onboarding`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskIds: tasks.map((t) => t.id) }),
          });
          return { ...c, tasks };
        })
      );
    }
  }

  const totalTasks  = clients.reduce((s, c) => s + c.tasks.length, 0);
  const doneTasks   = clients.reduce((s, c) => s + c.tasks.filter((t) => t.done).length, 0);
  const inOnboarding = clients.filter((c) => c.status === "onboarding").length;
  const completed    = clients.filter((c) => c.tasks.length > 0 && c.tasks.every((t) => t.done));
  const inProgress   = clients.filter((c) => c.tasks.length > 0 && !c.tasks.every((t) => t.done));
  const noTasks      = clients.filter((c) => c.tasks.length === 0);
  const pctGeral     = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <>
      <Header title="Onboarding" />
      <style>{`
        .task-delete-btn { opacity: 0 !important; transition: opacity 0.15s; }
        .task-row:hover .task-delete-btn { opacity: 0.6 !important; }
        .onb-grid { display: grid; grid-template-columns: 1fr 320px; gap: 24px; align-items: start; }
        @media (max-width: 900px) { .onb-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="page-wrap" style={{ flex: 1 }}>
        <div className="onb-grid">

          {/* ── LEFT: client list ─────────────────────────────── */}
          <div>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}>
                <p style={{ color: "#555", fontSize: "13px" }}>Carregando...</p>
              </div>
            ) : clients.length === 0 ? (
              <div style={{ background: "#111111", border: `1px dashed rgba(255,255,255,0.08)`, borderRadius: "12px", padding: "60px 40px", textAlign: "center" }}>
                <Circle size={32} color="#333" style={{ marginBottom: "16px" }} />
                <p style={{ fontSize: "15px", fontWeight: "600", color: "#555", margin: "0 0 8px" }}>Nenhum cliente cadastrado</p>
                <p style={{ fontSize: "13px", color: "#444", margin: 0 }}>Adicione clientes na aba <strong style={{ color: "#666" }}>Clientes</strong> primeiro.</p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="clients" type="CLIENT">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {clients.map((client, index) => (
                        <ClientBlock
                          key={client.id}
                          client={client}
                          index={index}
                          onUpdate={handleUpdate}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>

          {/* ── RIGHT: overview panel ─────────────────────────── */}
          {!loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Progresso geral */}
              <div style={{ background: "#111111", border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "22px 20px" }}>
                <p style={{ fontSize: "10px", fontWeight: "600", color: "#555", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.12em" }}>Progresso geral</p>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "12px" }}>
                  <p style={{ fontSize: "36px", fontWeight: "700", color: ACCENT, margin: 0, letterSpacing: "-0.04em", lineHeight: 1 }}>
                    {pctGeral}%
                  </p>
                  <p style={{ fontSize: "12px", color: "#555", margin: "0 0 4px" }}>
                    {doneTasks}/{totalTasks} tarefas
                  </p>
                </div>
                <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pctGeral}%`, borderRadius: "99px", background: pctGeral === 100 ? "linear-gradient(90deg,#4CAF50,#81C784)" : `linear-gradient(90deg,${ACCENT},rgba(0,207,255,0.5))`, transition: "width 0.4s ease" }} />
                </div>
              </div>

              {/* Contadores */}
              <div style={{ background: "#111111", border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "20px" }}>
                <p style={{ fontSize: "10px", fontWeight: "600", color: "#555", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.12em" }}>Situação</p>
                {[
                  { label: "Em onboarding", value: inOnboarding, color: ACCENT },
                  { label: "Em andamento",  value: inProgress.length, color: "#F59E0B" },
                  { label: "Concluídos",    value: completed.length,  color: "#4ADE80" },
                  { label: "Sem tarefas",   value: noTasks.length,    color: "#555" },
                ].map((r) => (
                  <div key={r.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                    <span style={{ fontSize: "12px", color: "#9A9288" }}>{r.label}</span>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: r.color }}>{r.value}</span>
                  </div>
                ))}
              </div>

              {/* Clientes concluídos */}
              {completed.length > 0 && (
                <div style={{ background: "#111111", border: "1px solid rgba(76,175,80,0.2)", borderRadius: "12px", padding: "20px" }}>
                  <p style={{ fontSize: "10px", fontWeight: "600", color: "#4ADE80", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.12em" }}>✓ Concluídos</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {completed.map((c) => (
                      <Link key={c.id} href={`/dashboard/clientes/${c.id}`} style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
                        <div style={{ width: "26px", height: "26px", borderRadius: "6px", background: "rgba(76,175,80,0.1)", border: "1px solid rgba(76,175,80,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "700", color: "#4ADE80", flexShrink: 0 }}>
                          {c.name.split(" ").slice(0,2).map((w) => w[0]).join("").toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "12px", fontWeight: "600", color: "#F0EDE8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                          <p style={{ fontSize: "10px", color: "#555", margin: 0 }}>{c.tasks.length} tarefas concluídas</p>
                        </div>
                        <CheckCircle2 size={13} color="#4ADE80" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Clientes em andamento com progresso */}
              {inProgress.length > 0 && (
                <div style={{ background: "#111111", border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "20px" }}>
                  <p style={{ fontSize: "10px", fontWeight: "600", color: "#555", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.12em" }}>Em andamento</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {inProgress.map((c) => {
                      const d = c.tasks.filter((t) => t.done).length;
                      const t = c.tasks.length;
                      const p = Math.round((d / t) * 100);
                      return (
                        <div key={c.id}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                            <span style={{ fontSize: "12px", color: "#D0CBC4", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{c.name}</span>
                            <span style={{ fontSize: "10px", color: "#555", flexShrink: 0, marginLeft: "8px" }}>{d}/{t}</span>
                          </div>
                          <div style={{ height: "3px", background: "rgba(255,255,255,0.05)", borderRadius: "99px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${p}%`, borderRadius: "99px", background: `linear-gradient(90deg,${ACCENT},rgba(0,207,255,0.5))` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
