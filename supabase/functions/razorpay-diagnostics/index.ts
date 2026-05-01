import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is authenticated
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is admin
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleRow } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";

    const trimmedKeyId = keyId.trim();
    const trimmedSecret = keySecret.trim();

    const keyIdMode =
      trimmedKeyId.startsWith("rzp_test_") ? "test" :
      trimmedKeyId.startsWith("rzp_live_") ? "live" : "unknown";

    // Razorpay secret has no rzp_ prefix; just length check
    const status = {
      key_id: {
        configured: !!keyId,
        prefix: trimmedKeyId.substring(0, 8),
        length: trimmedKeyId.length,
        valid_format: keyIdMode !== "unknown",
        mode: keyIdMode,
        has_whitespace: keyId !== trimmedKeyId,
      },
      key_secret: {
        configured: !!keySecret,
        length: trimmedSecret.length,
        valid_length: trimmedSecret.length >= 20 && trimmedSecret.length <= 60,
        has_whitespace: keySecret !== trimmedSecret,
      },
      auth_check: { ok: false, status: 0, error: null as string | null },
    };

    // Live auth probe — fetches a single order; 200/400 means auth OK, 401 means bad creds
    if (status.key_id.configured && status.key_secret.configured) {
      try {
        const credentials = btoa(`${trimmedKeyId}:${trimmedSecret}`);
        const probe = await fetch("https://api.razorpay.com/v1/orders?count=1", {
          method: "GET",
          headers: { Authorization: `Basic ${credentials}` },
        });
        status.auth_check.status = probe.status;
        if (probe.status === 200) {
          status.auth_check.ok = true;
          await probe.text();
        } else {
          const body = await probe.json().catch(() => ({}));
          status.auth_check.error = body?.error?.description ?? `HTTP ${probe.status}`;
        }
      } catch (e) {
        status.auth_check.error = e instanceof Error ? e.message : "probe failed";
      }
    }

    const overall_ok =
      status.key_id.configured &&
      status.key_id.valid_format &&
      !status.key_id.has_whitespace &&
      status.key_secret.configured &&
      status.key_secret.valid_length &&
      !status.key_secret.has_whitespace &&
      status.auth_check.ok;

    return new Response(
      JSON.stringify({ overall_ok, status, checked_at: new Date().toISOString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
