import {
  createBrowserClient as ssrBrowserClient,
  createServerClient as ssrServerClient,
} from "@supabase/ssr";
import { createClient as supabaseClient } from "@supabase/supabase-js";

const URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/^﻿/, "").trim();
const ANON = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").replace(/^﻿/, "").trim();

export function createBrowserClient() {
  return ssrBrowserClient(URL, ANON);
}

export async function createServerClient() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return ssrServerClient(URL, ANON, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server component — cookies written by middleware
        }
      },
    },
  });
}

export function createAdminClient() {
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/^﻿/, "").trim();
  return supabaseClient(
    URL,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
