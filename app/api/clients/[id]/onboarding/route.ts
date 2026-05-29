import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("onboarding_tasks")
    .select("*")
    .eq("client_id", id)
    .order("position", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const { taskIds } = await req.json();
  if (!Array.isArray(taskIds)) return NextResponse.json({ error: "taskIds obrigatório" }, { status: 400 });
  const supabase = createAdminClient();
  await Promise.all(
    (taskIds as string[]).map((taskId, index) =>
      supabase.from("onboarding_tasks").update({ position: index }).eq("id", taskId).eq("client_id", id)
    )
  );
  return NextResponse.json({ success: true });
}

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const { title } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("onboarding_tasks")
    .select("position")
    .eq("client_id", id)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const position = existing ? (existing.position ?? 0) + 1 : 0;

  const { data, error } = await supabase
    .from("onboarding_tasks")
    .insert({ client_id: id, title: title.trim(), done: false, position })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
