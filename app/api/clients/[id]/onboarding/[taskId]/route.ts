import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { sendWelcomeEmail } from "@/lib/email";

type Ctx = { params: Promise<{ id: string; taskId: string }> };

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: Ctx) {
  const { id, taskId } = await params;
  const body = await req.json();
  const supabase = createAdminClient();

  const allowed: Record<string, unknown> = {};
  if (typeof body.done === "boolean") allowed.done = body.done;
  if (typeof body.title === "string" && body.title.trim()) allowed.title = body.title.trim();

  const { error } = await supabase
    .from("onboarding_tasks")
    .update(allowed)
    .eq("id", taskId)
    .eq("client_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Check if all tasks are done → promote client to "active" + send welcome email
  if (body.done === true) {
    const { data: tasks } = await supabase
      .from("onboarding_tasks")
      .select("done")
      .eq("client_id", id);

    const allDone = tasks && tasks.length > 0 && tasks.every((t) => t.done);

    if (allDone) {
      await supabase
        .from("clients")
        .update({ status: "active" })
        .eq("id", id)
        .eq("status", "onboarding");

      // Send welcome email if portal credentials are set
      const { data: client } = await supabase
        .from("clients")
        .select("name, contact_email, portal_password")
        .eq("id", id)
        .single();

      if (client?.contact_email && client?.portal_password) {
        try {
          await sendWelcomeEmail({
            name: client.name,
            email: client.contact_email,
            password: client.portal_password,
          });
        } catch (e) {
          console.error("[onboarding] welcome email failed:", e);
        }
      }

      return NextResponse.json({ completed: true });
    }
  }

  return NextResponse.json({ completed: false });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id, taskId } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("onboarding_tasks")
    .delete()
    .eq("id", taskId)
    .eq("client_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
