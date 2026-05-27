'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { resolveNavbarAuth } from '@/lib/clientSession';

function DropdownChevron({ open }: { open: boolean }) {
  return (
    <span
      className={`inline-block text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      aria-hidden
    >
      ▼
    </span>
  );
}

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCompany, setIsCompany] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignupDropdownOpen, setIsSignupDropdownOpen] = useState(false);
  const [isSignupDropdownPinned, setIsSignupDropdownPinned] = useState(false);
  const [isMobileSignupDropdownOpen, setIsMobileSignupDropdownOpen] = useState(false);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isCompanyDropdownPinned, setIsCompanyDropdownPinned] = useState(false);
  const [isMobileCompanyDropdownOpen, setIsMobileCompanyDropdownOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [isAdminDropdownPinned, setIsAdminDropdownPinned] = useState(false);
  const [isMobileAdminDropdownOpen, setIsMobileAdminDropdownOpen] = useState(false);
  const signupDropdownRef = useRef<HTMLDivElement>(null);
  const companyDropdownRef = useRef<HTMLDivElement>(null);
  const adminDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const applyAuthState = (state: {
    isAuthenticated: boolean;
    isAdmin: boolean;
    isCompany: boolean;
  }) => {
    setIsAuthenticated(state.isAuthenticated);
    setIsAdmin(state.isAdmin);
    setIsCompany(state.isCompany);
  };

  useEffect(() => {
    const syncAuth = async () => {
      const state = await resolveNavbarAuth(supabase);
      applyAuthState(state);
      setIsLoading(false);
    };

    syncAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      syncAuth();
    });

    const onFocus = () => {
      syncAuth();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', onFocus);
    };
  }, [supabase]);

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

  useEffect(() => {
    if (!isCompanyDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target as Node)) {
        setIsCompanyDropdownOpen(false);
        setIsCompanyDropdownPinned(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCompanyDropdownOpen]);

  useEffect(() => {
    if (!isAdminDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(e.target as Node)) {
        setIsAdminDropdownOpen(false);
        setIsAdminDropdownPinned(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAdminDropdownOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsMobileSignupDropdownOpen(false);
    setIsMobileCompanyDropdownOpen(false);
    setIsMobileAdminDropdownOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
    closeMobileMenu();
  };

  const toggleSignupDropdown = () => {
    if (!isSignupDropdownOpen) {
      setIsSignupDropdownOpen(true);
      setIsSignupDropdownPinned(true);
    } else if (isSignupDropdownPinned) {
      setIsSignupDropdownOpen(false);
      setIsSignupDropdownPinned(false);
    } else {
      setIsSignupDropdownPinned(true);
    }
  };

  const toggleCompanyDropdown = () => {
    if (!isCompanyDropdownOpen) {
      setIsCompanyDropdownOpen(true);
      setIsCompanyDropdownPinned(true);
    } else if (isCompanyDropdownPinned) {
      setIsCompanyDropdownOpen(false);
      setIsCompanyDropdownPinned(false);
    } else {
      setIsCompanyDropdownPinned(true);
    }
  };

  const toggleAdminDropdown = () => {
    if (!isAdminDropdownOpen) {
      setIsAdminDropdownOpen(true);
      setIsAdminDropdownPinned(true);
    } else if (isAdminDropdownPinned) {
      setIsAdminDropdownOpen(false);
      setIsAdminDropdownPinned(false);
    } else {
      setIsAdminDropdownPinned(true);
    }
  };

  const closeSignupDropdown = () => {
    setIsSignupDropdownOpen(false);
    setIsSignupDropdownPinned(false);
  };

  const closeCompanyDropdown = () => {
    setIsCompanyDropdownOpen(false);
    setIsCompanyDropdownPinned(false);
  };

  const closeAdminDropdown = () => {
    setIsAdminDropdownOpen(false);
    setIsAdminDropdownPinned(false);
  };

  const companyDropdownLinks = (
    <>
      <Link
        href="/company/tour-requests"
        className="block py-1 hover:bg-gray-100 text-center font-semibold"
        onClick={closeCompanyDropdown}
      >
        Tour Requests
      </Link>
      <Link
        href="/company/tour-request"
        className="block py-1 hover:bg-gray-100 text-center font-semibold"
        onClick={closeCompanyDropdown}
      >
        Create Tour Request
      </Link>
    </>
  );

  return (
    <>
      <nav className="flex items-center justify-between w-full p-10">
        <Link href="/" className="flex items-center">
          <Image
            src="/CES Left Aligned.webp"
            alt="CES Logo"
            width={300}
            height={100}
            className="object-contain"
          />
        </Link>

        {!isLoading && (
          <div className="hidden md:flex items-center gap-8 ml-16">
            {isAuthenticated ? (
              <>
                <Link href="/account" className="text-base font-semibold">
                  Account
                </Link>
                {isAdmin && (
                  <div
                    ref={adminDropdownRef}
                    className="relative flex items-center h-full"
                    onMouseEnter={() => setIsAdminDropdownOpen(true)}
                    onMouseLeave={() => {
                      if (!isAdminDropdownPinned) setIsAdminDropdownOpen(false);
                    }}
                  >
                    <button
                      type="button"
                      onClick={toggleAdminDropdown}
                      className="text-base font-semibold bg-transparent border-none cursor-pointer p-0 flex items-center gap-1"
                    >
                      Admins
                      <DropdownChevron open={isAdminDropdownOpen} />
                    </button>
                    {isAdminDropdownOpen && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 pt-3 z-10">
                        <div className="bg-white border border-black px-6 py-2 rounded shadow-lg min-w-48">
                          <Link
                            href="/admin/tour-requests"
                            className="block py-1 hover:bg-gray-100 text-center font-semibold"
                            onClick={closeAdminDropdown}
                          >
                            Tour Requests
                          </Link>
                          <Link
                            href="/admin/accounts"
                            className="block py-1 hover:bg-gray-100 text-center font-semibold"
                            onClick={closeAdminDropdown}
                          >
                            Accounts
                          </Link>
                          <Link
                            href="/admin/admin-requests"
                            className="block py-1 hover:bg-gray-100 text-center font-semibold"
                            onClick={closeAdminDropdown}
                          >
                            New Admin Requests
                          </Link>
                          <Link
                            href="/admin/new-admin-request"
                            className="block py-1 hover:bg-gray-100 text-center font-semibold"
                            onClick={closeAdminDropdown}
                          >
                            Request New Admin
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {isCompany && (
                  <div
                    ref={companyDropdownRef}
                    className="relative flex items-center h-full"
                    onMouseEnter={() => setIsCompanyDropdownOpen(true)}
                    onMouseLeave={() => {
                      if (!isCompanyDropdownPinned) setIsCompanyDropdownOpen(false);
                    }}
                  >
                    <button
                      type="button"
                      onClick={toggleCompanyDropdown}
                      className="text-base font-semibold bg-transparent border-none cursor-pointer p-0 flex items-center gap-1"
                    >
                      Company
                      <DropdownChevron open={isCompanyDropdownOpen} />
                    </button>
                    {isCompanyDropdownOpen && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 pt-3 z-10">
                        <div className="bg-white border border-black px-6 py-2 rounded shadow-lg min-w-48">
                          {companyDropdownLinks}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
                <Link href="/login" className="text-base font-semibold">
                  Login
                </Link>
                <div
                  ref={signupDropdownRef}
                  className="relative flex items-center h-full"
                  onMouseEnter={() => setIsSignupDropdownOpen(true)}
                  onMouseLeave={() => {
                    if (!isSignupDropdownPinned) setIsSignupDropdownOpen(false);
                  }}
                >
                  <button
                    type="button"
                    onClick={toggleSignupDropdown}
                    className="text-base font-semibold bg-transparent border-none cursor-pointer p-0 flex items-center gap-1"
                  >
                    Signup
                    <DropdownChevron open={isSignupDropdownOpen} />
                  </button>
                  {isSignupDropdownOpen && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 pt-3 z-10">
                      <div className="bg-white border border-black px-6 py-2 rounded shadow-lg min-w-40">
                        <Link
                          href="/signup/student"
                          className="block py-1 hover:bg-gray-100 text-center font-semibold"
                          onClick={closeSignupDropdown}
                        >
                          Student
                        </Link>
                        <Link
                          href="/signup/company"
                          className="block py-1 hover:bg-gray-100 text-center font-semibold"
                          onClick={closeSignupDropdown}
                        >
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

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-white">
          <div className="flex flex-col h-full w-full relative">
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

            <div className="flex flex-col gap-6 items-center justify-center h-full">
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <div className="flex flex-col items-center gap-4">
                      <button
                        onClick={() => setIsMobileAdminDropdownOpen(!isMobileAdminDropdownOpen)}
                        className="text-xl font-semibold flex items-center gap-2"
                      >
                        Admins
                        <DropdownChevron open={isMobileAdminDropdownOpen} />
                      </button>
                      {isMobileAdminDropdownOpen && (
                        <div className="flex flex-col gap-3 items-center">
                          <Link
                            href="/admin/tour-requests"
                            onClick={closeMobileMenu}
                            className="text-lg font-medium px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                          >
                            Tour Requests
                          </Link>
                          <Link
                            href="/admin/accounts"
                            onClick={closeMobileMenu}
                            className="text-lg font-medium px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                          >
                            Accounts
                          </Link>
                          <Link
                            href="/admin/admin-requests"
                            onClick={closeMobileMenu}
                            className="text-lg font-medium px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                          >
                            New Admin Requests
                          </Link>
                          <Link
                            href="/admin/new-admin-request"
                            onClick={closeMobileMenu}
                            className="text-lg font-medium px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                          >
                            Request New Admin
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                  {isCompany && (
                    <div className="flex flex-col items-center gap-4">
                      <button
                        onClick={() => setIsMobileCompanyDropdownOpen(!isMobileCompanyDropdownOpen)}
                        className="text-xl font-semibold flex items-center gap-2"
                      >
                        Company
                        <DropdownChevron open={isMobileCompanyDropdownOpen} />
                      </button>
                      {isMobileCompanyDropdownOpen && (
                        <div className="flex flex-col gap-3 items-center">
                          <Link
                            href="/company/tour-requests"
                            onClick={closeMobileMenu}
                            className="text-lg font-medium px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                          >
                            Tour Requests
                          </Link>
                          <Link
                            href="/company/tour-request"
                            onClick={closeMobileMenu}
                            className="text-lg font-medium px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                          >
                            Create Tour Request
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
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
                      <DropdownChevron open={isMobileSignupDropdownOpen} />
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
