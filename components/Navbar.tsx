"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "../contexts/CartContext";

export default function Navbar() {
  const { data: session, status } = useSession();
  const { totalItems, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-secondary-900/95 backdrop-blur-sm border-b border-primary-500/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="hover:scale-105 transition-transform flex-shrink-0">
            <span className="text-2xl md:text-3xl font-bold gradient-text">RyderComps</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-300 hover:text-primary-400 transition-colors font-medium">Home</Link>
            <Link href="/winners" className="text-gray-300 hover:text-primary-400 transition-colors font-medium">Winners</Link>
            <Link href="/faqs" className="text-gray-300 hover:text-primary-400 transition-colors font-medium">FAQs</Link>
            {session && (
              <Link href="/dashboard" className="text-gray-300 hover:text-primary-400 transition-colors font-medium">Dashboard</Link>
            )}
            {session?.user?.role === "admin" && (
              <Link href="/admin" className="text-gray-300 hover:text-primary-400 transition-colors font-medium">Admin</Link>
            )}
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-3 md:space-x-6">
            {/* Shopping Cart */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-gray-300 hover:text-primary-400 transition-colors"
              title="Shopping Cart"
            >
              <span className="text-xl md:text-2xl">🛒</span>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center space-x-4">
              {status === "loading" && (
                <div className="text-gray-400">Loading...</div>
              )}
              
              {!session && status !== "loading" && (
                <Link 
                  href="/auth/register" 
                  className="p-2 text-gray-300 hover:text-primary-400 transition-colors"
                  title="Sign Up"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 448 512">
                    <path d="M313.6 304c-28.7 0-42.5 16-89.6 16-47.1 0-60.8-16-89.6-16C60.2 304 0 364.2 0 438.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-25.6c0-74.2-60.2-134.4-134.4-134.4zM400 464H48v-25.6c0-47.6 38.8-86.4 86.4-86.4 14.6 0 38.3 16 89.6 16 51.7 0 74.9-16 89.6-16 47.6 0 86.4 38.8 86.4 86.4V464zM224 288c79.5 0 144-64.5 144-144S303.5 0 224 0 80 64.5 80 144s64.5 144 144 144zm0-240c52.9 0 96 43.1 96 96s-43.1 96-96 96-96-43.1-96-96 43.1-96 96-96z"></path>
                  </svg>
                </Link>
              )}
              
              {session && (
                <>
                  <Link 
                    href="/account" 
                    className="p-2 text-gray-300 hover:text-primary-400 transition-colors"
                    title={`Profile - ${session.user?.name}`}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 448 512">
                      <path d="M313.6 304c-28.7 0-42.5 16-89.6 16-47.1 0-60.8-16-89.6-16C60.2 304 0 364.2 0 438.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-25.6c0-74.2-60.2-134.4-134.4-134.4zM400 464H48v-25.6c0-47.6 38.8-86.4 86.4-86.4 14.6 0 38.3 16 89.6 16 51.7 0 74.9-16 89.6-16 47.6 0 86.4 38.8 86.4 86.4V464zM224 288c79.5 0 144-64.5 144-144S303.5 0 224 0 80 64.5 80 144s64.5 144 144 144zm0-240c52.9 0 96 43.1 96 96s-43.1 96-96 96-96-43.1-96-96 43.1-96 96-96z"></path>
                    </svg>
                  </Link>
                  
                  {session.user?.role === "admin" && (
                    <Link 
                      href="/admin" 
                      className="p-2 text-gray-300 hover:text-primary-400 transition-colors"
                      title="Admin Panel"
                    >
                      <span className="text-2xl">⚙️</span>
                    </Link>
                  )}
                  
                  <button 
                    type="button"
                    onClick={() => signOut()}
                    className="bg-gradient-primary px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
                    title="Sign Out"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-primary-400 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-primary-500/20 pt-4">
            <div className="flex flex-col space-y-3">
              <Link 
                href="/" 
                className="text-gray-300 hover:text-primary-400 transition-colors font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/winners" 
                className="text-gray-300 hover:text-primary-400 transition-colors font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Winners
              </Link>
              <Link 
                href="/faqs" 
                className="text-gray-300 hover:text-primary-400 transition-colors font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQs
              </Link>
              {session && (
                <Link 
                  href="/dashboard" 
                  className="text-gray-300 hover:text-primary-400 transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              {session?.user?.role === "admin" && (
                <Link 
                  href="/admin" 
                  className="text-gray-300 hover:text-primary-400 transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              )}
              
              <div className="border-t border-primary-500/20 pt-3 mt-2">
                {!session && status !== "loading" && (
                  <div className="flex flex-col space-y-2">
                    <Link 
                      href="/auth/signin" 
                      className="text-gray-300 hover:text-primary-400 transition-colors font-medium py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/auth/register" 
                      className="bg-gradient-primary text-white text-center px-6 py-3 rounded-xl font-semibold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
                
                {session && (
                  <div className="flex flex-col space-y-2">
                    <Link 
                      href="/account" 
                      className="text-gray-300 hover:text-primary-400 transition-colors font-medium py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Account
                    </Link>
                    <button 
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        signOut();
                      }}
                      className="bg-gradient-primary text-white text-center px-6 py-3 rounded-xl font-semibold w-full"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
