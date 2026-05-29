import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();

  // All clients that are in onboarding OR have tasks
  const { data: clients, error: clientErr } = await supabase
    .from("clients")
    .select("id, name, segment, status, contact_email")
    .order("name", { ascending: true });

  if (clientErr) return NextResponse.json({ error: clientErr.message }, { status: 500 });

  const { data: tasks, error: taskErr } = await supabase
    .from("onboarding_tasks")
    .select("*")
    .order("position", { ascending: true });

  if (taskErr) return NextResponse.json({ error: taskErr.message }, { status: 500 });

  const tasksByClient = (tasks ?? []).reduce<Record<string, typeof tasks>>((acc, t) => {
    if (!acc[t.client_id]) acc[t.client_id] = [];
    acc[t.client_id]!.push(t);
    return acc;
  }, {});

  const result = (clients ?? [])
    .map((c) => ({ ...c, tasks: tasksByClient[c.id] ?? [] }));

  return NextResponse.json(result);
}
