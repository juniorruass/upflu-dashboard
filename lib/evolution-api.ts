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

export type EvolutionInstance = {
  id?: string;
  name: string;
  connectionStatus: string;
  ownerJid?: string;
  profileName?: string;
  profilePicUrl?: string;
};

export type EvolutionState = {
  instance?: {
    instanceName: string;
    state: string;
  };
  state?: string;
};

export type EvolutionQR = {
  code?: string;
  base64?: string;
  count?: number;
};
