const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      apiKey: Deno.env.get("FIREBASE_API_KEY"),
      authDomain: Deno.env.get("FIREBASE_AUTH_DOMAIN"),
      projectId: Deno.env.get("FIREBASE_PROJECT_ID"),
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
