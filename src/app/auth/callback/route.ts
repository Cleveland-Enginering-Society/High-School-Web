import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  // Handle password recovery - redirect to reset password page
  if (type === "recovery") {
    const redirectTo = request.nextUrl.clone();
    redirectTo.pathname = "/reset-password";
    // Keep the token parameters for the reset password page
    return NextResponse.redirect(redirectTo);
  }

  // For other auth types, use the next parameter or default to dashboard
  const defaultNext = next ?? "/dashboard";
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = defaultNext;
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");
  redirectTo.searchParams.delete("code");
  redirectTo.searchParams.delete("next");

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      return NextResponse.redirect(redirectTo);
    }
  }

  if (code) {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(redirectTo);
    }
  }

  // Return the user to an error page with instructions
  redirectTo.pathname = "/login";
  redirectTo.searchParams.set("error", "auth_callback_error");
  return NextResponse.redirect(redirectTo);
}

