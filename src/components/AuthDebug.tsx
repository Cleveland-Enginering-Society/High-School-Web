'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Component that exposes auth checking functions to the browser console
 * Only runs in development mode
 */
export default function AuthDebug() {
  useEffect(() => {
    // Only expose in development
    if (process.env.NODE_ENV === 'development') {
      const supabase = createClient();

      // Expose checkAuth function to window for console access
      (window as any).checkAuth = async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('❌ Auth check error:', error);
          return {
            authenticated: false,
            user: null,
            error: error.message,
          };
        }
        
        const result = {
          authenticated: !!user,
          user: user ? {
            id: user.id,
            email: user.email,
            emailConfirmed: !!user.email_confirmed_at,
            createdAt: user.created_at,
          } : null,
          error: null,
        };
        
        console.log('🔐 Authentication Status:', result);
        return result;
      };

      // Expose getSession function
      (window as any).getSession = async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session check error:', error);
          return { session: null, error: error.message };
        }
        
        const result = {
          session: session ? {
            hasToken: !!session.access_token,
            expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : null,
            user: session.user ? {
              id: session.user.id,
              email: session.user.email,
            } : null,
          } : null,
          error: null,
        };
        
        console.log('📋 Session Info:', result);
        return result;
      };

      // Expose getUser function
      (window as any).getUser = async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('❌ Get user error:', error);
          return { user: null, error: error.message };
        }
        
        console.log('👤 Current User:', user);
        return { user, error: null };
      };

      console.log('✅ Auth debug functions loaded! Use these in console:');
      console.log('  - checkAuth() - Check if user is authenticated');
      console.log('  - getSession() - Get current session info');
      console.log('  - getUser() - Get current user details');
    }
  }, []);

  return null; // This component doesn't render anything
}

