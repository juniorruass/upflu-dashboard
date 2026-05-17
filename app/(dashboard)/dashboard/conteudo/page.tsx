import { createServerClient } from "@/lib/supabase";
import Header from "@/components/header";
import ContentTabs from "@/components/content-tabs";
import { Carousel } from "@/types";

async function getCarouselsByStatus() {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("carousels")
    .select(
      `id, status, post_number, topic, caption, created_at, approved_at, declined_at,
       slides(id, carousel_id, slide_number, html_content, image_url, created_at)`
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching carousels:", error);
    return { pending: [], approved: [], declined: [] };
  }

  const all = (data ?? []) as unknown as Carousel[];

  return {
    pending: all.filter((c) => c.status === "pending"),
    approved: all.filter((c) => c.status === "approved"),
    declined: all.filter((c) => c.status === "declined"),
  };
}

export default async function ConteudoPage() {
  const { pending, approved, declined } = await getCarouselsByStatus();

  return (
    <>
      <Header title="Conteúdo" />
      <ContentTabs
        initialPending={pending}
        initialApproved={approved}
        initialDeclined={declined}
      />
    </>
  );
}
