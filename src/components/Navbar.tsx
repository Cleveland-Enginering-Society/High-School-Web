'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check authentication status and admin access
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      // Check if user is admin (user_type === 2)
      if (user) {
        try {
          const response = await fetch('/api/account');
          if (response.ok) {
            const data = await response.json();
            setIsAdmin(data.user?.user_type === 2);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      } else {
        setIsAdmin(false);
      }
      
      setIsLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsAuthenticated(!!session);
      
      // Re-check admin status on auth change
      if (session?.user) {
        try {
          const response = await fetch('/api/account');
          if (response.ok) {
            const data = await response.json();
            setIsAdmin(data.user?.user_type === 2);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
    closeMobileMenu();
  };

  return (
    <>
      <nav className="flex items-center justify-between w-full p-10 translate-x-5">
        {/* Logo - Left side */}
        <Link href="/" className="flex items-center">
          <Image
            src="/CES Left Aligned.webp"
            alt="CES Logo"
            width={300}
            height={100}
            className="object-contain"
          />
        </Link>

        {/* Desktop Navigation - Right side */}
        {!isLoading && (
          <div className="hidden md:flex items-center gap-8">
            {isAuthenticated ? (
              <>
                <Link href="/account" className="text-base">
                  Account
                </Link>
                <Link href="/events" className="text-base">
                  Events
                </Link>
                <Link href="/about" className="text-base">
                  About 
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-base">
                  Login
                </Link>
                <Link href="/signup" className="text-base">
                  Signup
                </Link>
                <Link href="/events" className="text-base">
                  Events
                </Link>
                <Link href="/about" className="text-base">
                  About 
                </Link>
              </>
            )}
          </div>
        )}

        {/* Mobile Hamburger Button */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden flex flex-col gap-1.5 p-2"
          aria-label="Toggle menu"
        >
          <span className="w-6 h-0.5 bg-current"></span>
          <span className="w-6 h-0.5 bg-current"></span>
          <span className="w-6 h-0.5 bg-current"></span>
        </button>
      </nav>

      {/* Mobile Full-Screen Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-white">
          <div className="flex flex-col h-full w-full relative">
            {/* Header with X button */}
            <div className="flex justify-end p-6 absolute top-0 right-0 z-10">
              <button
                onClick={closeMobileMenu}
                className="relative w-8 h-8 flex items-center justify-center"
                aria-label="Close menu"
              >
                <span className="absolute w-6 h-0.5 bg-current rotate-45"></span>
                <span className="absolute w-6 h-0.5 bg-current -rotate-45"></span>
              </button>
            </div>

            {/* Menu Links - Centered */}
            <div className="flex flex-col gap-6 items-center justify-center h-full">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/account"
                    onClick={closeMobileMenu}
                    className="text-xl"
                  >
                    Account
                  </Link>
                  <Link
                    href="/events"
                    onClick={closeMobileMenu}
                    className="text-xl"
                  >
                    Events
                  </Link>
                  <Link
                    href="/about"
                    onClick={closeMobileMenu}
                    className="text-xl"
                  >
                    About 
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="text-xl"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={closeMobileMenu}
                    className="text-xl"
                  >
                    Signup
                  </Link>
                  <Link
                    href="/events"
                    onClick={closeMobileMenu}
                    className="text-xl"
                  >
                    Events
                  </Link>
                  <Link
                    href="/about"
                    onClick={closeMobileMenu}
                    className="text-xl"
                  >
                    About
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

