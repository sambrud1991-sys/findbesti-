import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, firebase_uid } = await req.json();

    if (!phone || !firebase_uid) {
      return new Response(
        JSON.stringify({ error: "Phone and firebase_uid are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user exists with this phone
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.phone === phone || u.user_metadata?.phone === phone
    );

    let session;
    const email = `${phone.replace("+", "")}@phone.findbesti.app`;
    const tempPassword = crypto.randomUUID();

    if (existingUser) {
      // Update existing user and sign in
      await supabase.auth.admin.updateUserById(existingUser.id, {
        password: tempPassword,
        phone,
        user_metadata: { ...existingUser.user_metadata, firebase_uid },
      });

      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: existingUser.email || email,
        password: tempPassword,
      });

      if (loginError) throw loginError;
      session = loginData.session;
    } else {
      // Create new user
      const { error: createError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        phone,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: { phone, display_name: "User", firebase_uid },
      });

      if (createError) throw createError;

      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: tempPassword,
      });

      if (loginError) throw loginError;
      session = loginData.session;
    }

    return new Response(
      JSON.stringify({ success: true, session }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Verify OTP error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Verification failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
