const BASE     = () => (process.env.EVOLUTION_API_URL ?? "").replace(/\/$/, "");
const API_KEY  = () => process.env.EVOLUTION_API_KEY ?? "";
const INSTANCE = () => process.env.EVOLUTION_INSTANCE ?? "";

function headers() {
  return { "Content-Type": "application/json", apikey: API_KEY() };
}

export async function evolutionSend(phone: string, text: string, instance?: string): Promise<boolean> {
  const base = BASE();
  const inst = instance ?? INSTANCE();
  if (!base || !API_KEY() || !inst) return false;
  try {
    const res = await fetch(`${base}/message/sendText/${encodeURIComponent(inst)}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ number: phone, text }),
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch { return false; }
}

export async function evolutionInstances(): Promise<EvolutionInstance[]> {
  const base = BASE();
  if (!base || !API_KEY()) return [];
  try {
    const res = await fetch(`${base}/instance/fetchInstances`, {
      headers: headers(),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export async function evolutionStatus(instance?: string): Promise<EvolutionState | null> {
  const base = BASE();
  const inst = instance ?? INSTANCE();
  if (!base || !API_KEY() || !inst) return null;
  try {
    const res = await fetch(`${base}/instance/connectionState/${encodeURIComponent(inst)}`, {
      headers: headers(),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export async function evolutionConnect(instance?: string): Promise<EvolutionQR | null> {
  const base = BASE();
  const inst = instance ?? INSTANCE();
  if (!base || !API_KEY() || !inst) return null;
  try {
    const res = await fetch(`${base}/instance/connect/${encodeURIComponent(inst)}`, {
      headers: headers(),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export async function evolutionDisconnect(instance?: string): Promise<boolean> {
  const base = BASE();
  const inst = instance ?? INSTANCE();
  if (!base || !API_KEY() || !inst) return false;
  try {
    const res = await fetch(`${base}/instance/logout/${encodeURIComponent(inst)}`, {
      method: "DELETE",
      headers: headers(),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch { return false; }
}

export async function evolutionFindChats(instance?: string, limit = 30): Promise<EvolutionChat[]> {
  const base = BASE();
  const inst = instance ?? INSTANCE();
  if (!base || !API_KEY() || !inst) return [];
  try {
    const res = await fetch(`${base}/chat/findChats/${encodeURIComponent(inst)}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ where: {} }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list: Record<string, unknown>[] = Array.isArray(data) ? data : (data?.chats ?? []);
    return list.slice(0, limit).map((c) => ({
      ...c,
      id: (c.remoteJid as string) || (c.id as string) || "",
    })) as EvolutionChat[];
  } catch { return []; }
}

export async function evolutionFindMessages(instance?: string, remoteJid?: string, limit = 40): Promise<EvolutionMessage[]> {
  const base = BASE();
  const inst = instance ?? INSTANCE();
  if (!base || !API_KEY() || !inst) return [];
  try {
    const body = remoteJid
      ? { where: { key: { remoteJid } }, limit, offset: 0 }
      : { where: {}, limit, offset: 0 };
    const res = await fetch(`${base}/chat/findMessages/${encodeURIComponent(inst)}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const records = data?.messages?.records
      ?? data?.records
      ?? (Array.isArray(data) ? data : []);
    const filtered = remoteJid
      ? records.filter((m: EvolutionMessage) => m.key?.remoteJid === remoteJid)
      : records;
    return filtered.slice(0, limit);
  } catch { return []; }
}

export async function evolutionFindContacts(instance?: string): Promise<EvolutionContact[]> {
  const base = BASE();
  const inst = instance ?? INSTANCE();
  if (!base || !API_KEY() || !inst) return [];
  try {
    const res = await fetch(`${base}/chat/findContacts/${encodeURIComponent(inst)}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ where: {} }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data?.contacts ?? []);
  } catch { return []; }
}

export async function evolutionCreateInstance(instanceName: string): Promise<{ instance?: { instanceName: string }; qrcode?: { base64?: string; code?: string } } | null> {
  const base = BASE();
  if (!base || !API_KEY()) return null;
  try {
    const res = await fetch(`${base}/instance/create`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ instanceName, qrcode: true, integration: "WHATSAPP-BAILEYS" }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export async function evolutionDeleteInstance(instance: string): Promise<boolean> {
  const base = BASE();
  if (!base || !API_KEY()) return false;
  try {
    const res = await fetch(`${base}/instance/delete/${encodeURIComponent(instance)}`, {
      method: "DELETE",
      headers: headers(),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch { return false; }
}

export async function evolutionFindGroups(instance?: string): Promise<EvolutionGroup[]> {
  const base = BASE();
  const inst = instance ?? INSTANCE();
  if (!base || !API_KEY() || !inst) return [];
  try {
    const res = await fetch(
      `${base}/group/fetchAllGroups/${encodeURIComponent(inst)}?getParticipants=false`,
      { headers: headers(), signal: AbortSignal.timeout(12000) },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export async function evolutionSendGroup(groupJid: string, text: string, instance?: string): Promise<boolean> {
  return evolutionSend(groupJid, text, instance);
}

export async function evolutionMeasureLatency(): Promise<number> {
  const base = BASE();
  if (!base || !API_KEY()) return -1;
  const start = Date.now();
  try {
    await fetch(`${base}/instance/fetchInstances`, {
      headers: headers(),
      signal: AbortSignal.timeout(5000),
    });
    return Date.now() - start;
  } catch { return -1; }
}

export type EvolutionInstance = {
  id?: string;
  name: string;
  connectionStatus: string;
  ownerJid?: string;
  profileName?: string;
  profilePicUrl?: string;
};

export type EvolutionState = {
  instance?: { instanceName: string; state: string };
  state?: string;
};

export type EvolutionQR = {
  code?: string;
  base64?: string;
  count?: number;
};

export type EvolutionChat = {
  id: string;
  remoteJid?: string;
  name?: string;
  pushName?: string;
  unreadCount?: number;
  lastMessage?: { conversation?: string; timestamp?: number };
  updatedAt?: string;
};

export type EvolutionContact = {
  id?: string;
  remoteJid?: string;
  pushName?: string;
  profileName?: string;
  name?: string;
};

export type EvolutionMessage = {
  key: { remoteJid: string; fromMe: boolean; id: string };
  message?: { conversation?: string; extendedTextMessage?: { text: string } };
  messageTimestamp?: number;
  pushName?: string;
  status?: string;
};

export type EvolutionGroup = {
  id: string;
  subject: string;
  subjectOwner?: string;
  subjectTime?: number;
  pictureUrl?: string | null;
  size?: number;
  creation?: number;
  owner?: string;
  desc?: string;
  descId?: string;
  restrict?: boolean;
  announce?: boolean;
};
