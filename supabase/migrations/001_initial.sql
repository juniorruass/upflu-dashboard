-- UPFLU Content Dashboard — Initial Schema
-- Run this in the Supabase SQL Editor

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.carousels (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'declined')),
  post_number     integer UNIQUE,
  topic           text NOT NULL,
  caption         text,
  created_at      timestamptz DEFAULT now() NOT NULL,
  approved_at     timestamptz,
  declined_at     timestamptz
);

CREATE TABLE IF NOT EXISTS public.slides (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carousel_id     uuid NOT NULL REFERENCES public.carousels(id) ON DELETE CASCADE,
  slide_number    integer NOT NULL,
  html_content    text NOT NULL,
  image_url       text,
  created_at      timestamptz DEFAULT now() NOT NULL,
  UNIQUE (carousel_id, slide_number)
);

CREATE TABLE IF NOT EXISTS public.app_settings (
  id                      integer PRIMARY KEY DEFAULT 1,
  auto_generate_enabled   boolean NOT NULL DEFAULT true,
  cron_time_brt           text NOT NULL DEFAULT '09:00',
  updated_at              timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Seed default settings row
INSERT INTO public.app_settings (id, auto_generate_enabled, cron_time_brt)
VALUES (1, true, '09:00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_carousels_status     ON public.carousels(status);
CREATE INDEX IF NOT EXISTS idx_carousels_created_at ON public.carousels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_slides_carousel_id   ON public.slides(carousel_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.carousels   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slides      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Carousels: authenticated only
CREATE POLICY "auth_read_carousels"   ON public.carousels FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_carousels" ON public.carousels FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_carousels" ON public.carousels FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_carousels" ON public.carousels FOR DELETE TO authenticated USING (true);

-- Slides: authenticated only
CREATE POLICY "auth_read_slides"   ON public.slides FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_slides" ON public.slides FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_slides" ON public.slides FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_slides" ON public.slides FOR DELETE TO authenticated USING (true);

-- Settings: authenticated only
CREATE POLICY "auth_read_settings"   ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_update_settings" ON public.app_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_insert_settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- STORAGE BUCKET (optional — for storing PNG exports)
-- ============================================================

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('carousels', 'carousels', true)
-- ON CONFLICT (id) DO NOTHING;
