'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSignupDropdownOpen, setIsSignupDropdownOpen] = useState(false);
  const [isSignupDropdownPinned, setIsSignupDropdownPinned] = useState(false);
  const [isMobileSignupDropdownOpen, setIsMobileSignupDropdownOpen] = useState(false);
  const signupDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check authentication status and admin access
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      // Check if user is admin (user_type_table === 3 OR student with user_type === 3)
      if (user) {
        try {
          const response = await fetch('/api/account');
          if (response.ok) {
            const data = await response.json();
            const isAdminUser = data.user?.user_type_table === 3;
            const isAdminStudent = data.user?.user_type_table === 1 && data.user?.user_type === 3;
            setIsAdmin(isAdminUser || isAdminStudent);
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
                const isAdminUser = data.user?.user_type_table === 3;
                const isAdminStudent = data.user?.user_type_table === 1 && data.user?.user_type === 3;
                setIsAdmin(isAdminUser || isAdminStudent);
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

  // Close signup dropdown when clicking outside (desktop)
  useEffect(() => {
    if (!isSignupDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (signupDropdownRef.current && !signupDropdownRef.current.contains(e.target as Node)) {
        setIsSignupDropdownOpen(false);
        setIsSignupDropdownPinned(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSignupDropdownOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsMobileSignupDropdownOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
    closeMobileMenu();
  };

  return (
    <>
      <nav className="flex items-center justify-between w-full p-10">
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
          <div className="hidden md:flex items-center gap-8 ml-16">
            {isAuthenticated ? (
              <>
                <Link href="/account" className="text-base font-semibold">
                  Account
                </Link>
                <Link href="/events" className="text-base font-semibold">
                  Events
                </Link>
                <Link href="/about" className="text-base font-semibold">
                  About 
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/company" className="text-base font-semibold">
                  Company
                </Link>
                <Link href="/login" className="text-base font-semibold">
                  Login
                </Link>
                <div
                  ref={signupDropdownRef}
                  className="relative flex items-center h-full"
                  onMouseEnter={() => setIsSignupDropdownOpen(true)}
                  onMouseLeave={() => { if (!isSignupDropdownPinned) setIsSignupDropdownOpen(false); }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (!isSignupDropdownOpen) {
                        setIsSignupDropdownOpen(true);
                        setIsSignupDropdownPinned(true);
                      } else if (isSignupDropdownPinned) {
                        setIsSignupDropdownOpen(false);
                        setIsSignupDropdownPinned(false);
                      } else {
                        setIsSignupDropdownPinned(true);
                      }
                    }}
                    className="text-base font-semibold bg-transparent border-none cursor-pointer p-0"
                  >
                    Signup
                  </button>
                  {isSignupDropdownOpen && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 pt-3 z-10">
                      <div className="bg-white border border-black px-6 py-2 rounded shadow-lg min-w-40">
                        <Link href="/signup/student" className="block py-1 hover:bg-gray-100 text-center font-semibold" onClick={() => { setIsSignupDropdownOpen(false); setIsSignupDropdownPinned(false); }}>
                          Student
                        </Link>
                        <Link href="/signup/company" className="block py-1 hover:bg-gray-100 text-center font-semibold" onClick={() => { setIsSignupDropdownOpen(false); setIsSignupDropdownPinned(false); }}>
                          Company
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                <Link href="/events" className="text-base font-kanit text-black font-semibold">
                  Events
                </Link>
                <Link href="/about" className="text-base font-kanit text-black font-semibold">
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
                    href="/company"
                    onClick={closeMobileMenu}
                    className="text-xl font-semibold"
                  >
                  Company
                  </Link>
                  <Link
                    href="/account"
                    onClick={closeMobileMenu}
                    className="text-xl font-semibold"
                  >
                    Account
                  </Link>
                  <Link
                    href="/events"
                    onClick={closeMobileMenu}
                    className="text-xl font-semibold"
                  >
                    Events
                  </Link>
                  <Link
                    href="/about"
                    onClick={closeMobileMenu}
                    className="text-xl font-semibold"
                  >
                    About 
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="text-xl font-semibold"
                  >
                    Login
                  </Link>
                  <div className="flex flex-col items-center gap-4">
                    <button
                      onClick={() => setIsMobileSignupDropdownOpen(!isMobileSignupDropdownOpen)}
                      className="text-xl font-semibold flex items-center gap-2"
                    >
                      Signup
                      <span className={`transform transition-transform ${isMobileSignupDropdownOpen ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    {isMobileSignupDropdownOpen && (
                      <div className="flex flex-col gap-3 items-center">
                        <Link
                          href="/signup/student"
                          onClick={closeMobileMenu}
                          className="text-lg font-medium px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                        >
                          Student
                        </Link>
                        <Link
                          href="/signup/company"
                          onClick={closeMobileMenu}
                          className="text-lg font-medium px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                        >
                          Company
                        </Link>
                      </div>
                    )}
                  </div>
                  <Link
                    href="/events"
                    onClick={closeMobileMenu}
                    className="text-xl font-semibold"
                  >
                    Events
                  </Link>
                  <Link
                    href="/about"
                    onClick={closeMobileMenu}
                    className="text-xl font-semibold"
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

