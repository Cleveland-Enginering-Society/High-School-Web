import { createClient } from '@/lib/supabase/client';

/**
 * Check if the current user is authenticated
 * @returns Promise with user data if authenticated, null otherwise
 */
export async function checkAuth() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Auth check error:', error);
    return { authenticated: false, user: null, error: error.message };
  }
  
  return {
    authenticated: !!user,
    user: user ? {
      id: user.id,
      email: user.email,
      emailConfirmed: user.email_confirmed_at ? true : false,
      createdAt: user.created_at,
    } : null,
    error: null,
  };
}

/**
 * Get the current session
 * @returns Promise with session data
 */
export async function getSession() {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Session check error:', error);
    return { session: null, error: error.message };
  }
  
  return {
    session: session ? {
      accessToken: session.access_token ? '***' + session.access_token.slice(-10) : null,
      expiresAt: session.expires_at,
      user: session.user ? {
        id: session.user.id,
        email: session.user.email,
      } : null,
    } : null,
    error: null,
  };
}

