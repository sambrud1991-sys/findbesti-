import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ error: "Phone and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find valid OTP
    const { data: otpRecord, error: fetchError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("phone", phone)
      .eq("code", otp)
      .eq("verified", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark OTP as verified
    await supabase
      .from("otp_codes")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    // Check if user exists with this phone
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.phone === phone || u.user_metadata?.phone === phone
    );

    let session;

    if (existingUser) {
      // Generate magic link / sign in existing user
      const { data, error } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: existingUser.email || `${phone.replace("+", "")}@phone.findbesti.app`,
      });

      if (error) throw error;

      // Sign in with the token
      const { data: signInData, error: signInError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { phone }
      );
      if (signInError) throw signInError;

      // Create a session for the user
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
        type: "magiclink", 
        email: existingUser.email || `${phone.replace("+", "")}@phone.findbesti.app`,
      });

      // Return user info - client will use signInWithPassword with a temp password approach
      // Actually, let's use a simpler approach with admin API
      const tempPassword = crypto.randomUUID();
      await supabase.auth.admin.updateUserById(existingUser.id, { 
        password: tempPassword 
      });

      const email = existingUser.email || `${phone.replace("+", "")}@phone.findbesti.app`;
      
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: tempPassword,
      });

      if (loginError) throw loginError;
      session = loginData.session;
    } else {
      // Create new user
      const email = `${phone.replace("+", "")}@phone.findbesti.app`;
      const tempPassword = crypto.randomUUID();

      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        phone,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: { phone, display_name: "User" },
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
