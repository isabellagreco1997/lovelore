"use client";

import { ReactNode, useState } from 'react';
import useUser from '@/hooks/useUser';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Library, User, LogOut, Menu, X } from 'lucide-react';
import Breadcrumbs from './Breadcrumbs';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, signOut, loading } = useUser();
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isLoginPage = pathname === '/login';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 left-16 w-2 h-2 rounded-full bg-purple-400 opacity-40"></div>
      <div className="absolute top-40 left-40 w-1 h-1 rounded-full bg-purple-300 opacity-30"></div>
      <div className="absolute top-60 left-20 w-1 h-1 rounded-full bg-blue-300 opacity-30"></div>
      <div className="absolute bottom-20 right-16 w-2 h-2 rounded-full bg-purple-400 opacity-40"></div>
      <div className="absolute bottom-40 right-40 w-1 h-1 rounded-full bg-purple-300 opacity-30"></div>
      <div className="absolute top-20 right-20 w-1 h-1 rounded-full bg-blue-300 opacity-30"></div>
      <div className="absolute bottom-60 left-40 w-1 h-1 rounded-full bg-blue-300 opacity-30"></div>
      
      {/* Large decorative circles */}
      <div className="fixed -top-40 -left-40 w-80 h-80 rounded-full border border-indigo-800 opacity-20"></div>
      <div className="fixed -bottom-60 -right-40 w-96 h-96 rounded-full border border-indigo-800 opacity-20"></div>
      
      {/* Header - Hide on login page */}
      {!isLoginPage && (
        <header className="bg-black shadow-md sticky top-0 z-20 border-b border-[#EC444B]">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
            <div className="flex items-center space-x-4 md:space-x-8">
              <Link href="/" className="flex-shrink-0">
                <div className="flex items-center group">
                  <img 
                    src="/images/logo.png" 
                    alt="LoveLore Logo" 
                    className="h-8 w-auto object-contain"
                  />
                </div>
              </Link>
              
              <nav className="hidden md:flex space-x-6">
                {user ? (
                  <Link 
                    href="/" 
                    className={`relative group flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                      isHomePage ? 'text-white bg-[#EC444B]/10 shadow-[0_0_15px_rgba(236,68,75,0.15)]' : 'text-gray-400 hover:text-white hover:bg-[#EC444B]/5'
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    <span>Explore</span>
                  </Link>
                ) : null}
                
                {user && (
                  <Link 
                    href="/stories" 
                    className={`relative group flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                      pathname === '/stories' ? 'text-white bg-[#EC444B]/10 shadow-[0_0_15px_rgba(236,68,75,0.15)]' : 'text-gray-400 hover:text-white hover:bg-[#EC444B]/5'
                    }`}
                  >
                    <Library className="w-4 h-4" />
                    <span>Stories</span>
                  </Link>
                )}
              </nav>
            </div>
            
            {!loading && (
              <div className="flex items-center space-x-2 md:space-x-4">
                {user ? (
                  <>
                    <span className="text-white hidden sm:block text-sm">
                      {user.email?.split('@')[0]}
                    </span>
                    
                    {/* Desktop Account and Sign Out */}
                    <div className="hidden sm:flex items-center space-x-2">
                      <Link 
                        href="/account"
                        className={`bg-transparent border border-[#EC444B] text-white rounded-md text-sm font-medium transition-all duration-300 hover:bg-[#EC444B]/10 flex items-center ${
                          pathname === '/account' ? 'bg-[#EC444B]/10 shadow-[0_0_15px_rgba(236,68,75,0.15)]' : ''
                        }`}
                      >
                        <span className="flex items-center space-x-2 px-4 py-2">
                          <User className="w-4 h-4" />
                          <span>Account</span>
                        </span>
                      </Link>

                      <button
                        onClick={() => signOut()}
                        className="bg-transparent border border-[#EC444B] text-white rounded-md text-sm font-medium transition-all duration-300 hover:bg-[#EC444B]/10 flex items-center"
                      >
                        <span className="flex items-center space-x-2 px-4 py-2">
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </span>
                      </button>
                    </div>
                    
                    {/* Mobile hamburger menu button */}
                    <button 
                      className="sm:hidden p-2 rounded-md bg-transparent border border-[#EC444B] text-white"
                      onClick={toggleMobileMenu}
                      aria-label="Toggle mobile menu"
                    >
                      {mobileMenuOpen ? (
                        <X className="w-5 h-5" />
                      ) : (
                        <Menu className="w-5 h-5" />
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="hidden sm:block">
                      <span className="bg-transparent border border-[#EC444B] text-white px-3 py-1.5 md:px-4 md:py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-[#EC444B]/10">
                        Sign In
                      </span>
                    </Link>
                    
                    {/* Mobile hamburger menu button for guest users */}
                    <button 
                      className="sm:hidden p-2 rounded-md bg-transparent border border-[#EC444B] text-white"
                      onClick={toggleMobileMenu}
                      aria-label="Toggle mobile menu"
                    >
                      {mobileMenuOpen ? (
                        <X className="w-5 h-5" />
                      ) : (
                        <Menu className="w-5 h-5" />
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden absolute top-full left-0 right-0 bg-black border-b border-[#EC444B] z-30 animate-fadeIn">
              <div className="px-4 py-4 space-y-4">
                {user && (
                  <Link 
                    href="/" 
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                      isHomePage ? 'bg-[#EC444B]/10 text-white' : 'text-gray-300 hover:bg-[#EC444B]/5 hover:text-white'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Home className="w-5 h-5" />
                    <span className="font-medium">Explore</span>
                  </Link>
                )}
                
                {user && (
                  <Link 
                    href="/stories" 
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                      pathname === '/stories' ? 'bg-[#EC444B]/10 text-white' : 'text-gray-300 hover:bg-[#EC444B]/5 hover:text-white'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Library className="w-5 h-5" />
                    <span className="font-medium">Stories</span>
                  </Link>
                )}
                
                {user && (
                  <>
                    <div className="pt-2 border-t border-gray-800">
                      <Link 
                        href="/account" 
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                          pathname === '/account' ? 'bg-[#EC444B]/10 text-white' : 'text-gray-300 hover:bg-[#EC444B]/5 hover:text-white'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="w-5 h-5" />
                        <span className="font-medium">Account</span>
                      </Link>
                      
                      <button
                        onClick={() => {
                          signOut();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#EC444B]/5 hover:text-white text-left"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-800 px-4">
                      <p className="text-sm text-gray-400">Signed in as:</p>
                      <p className="text-white font-medium truncate">{user.email}</p>
                    </div>
                  </>
                )}
                
                {!user && (
                  <div className="pt-2 border-t border-gray-800">
                    <Link 
                      href="/login" 
                      className="flex items-center justify-center bg-transparent border border-[#EC444B] text-white py-3 rounded-lg font-medium hover:bg-[#EC444B]/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </header>
      )}
      
      {/* Main content */}
      <main className={`flex-grow z-10 ${isLoginPage ? '' : isHomePage ? 'mb-8' : 'my-8 mx-4 md:mx-8'}`}>
        {!isLoginPage && <Breadcrumbs />}
        {children}
      </main>
      
      {/* Footer - Hide on login page */}
      {!isLoginPage && (
        <footer className="bg-gray-900/30 backdrop-blur-sm border-t border-gray-800 py-12 mt-auto z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Logo and Description */}
              <div className="col-span-1 md:col-span-2">
                <Link href="/">
                  <div className="flex items-center mb-4">
                    <img 
                      src="/images/logo.png" 
                      alt="LoveLore Logo" 
                      className="h-8 w-auto object-contain"
                    />
                  </div>
                </Link>
                <p className="text-gray-400 text-sm mb-4">
                  Experience interactive storytelling like never before. Create, explore, and immerse yourself in unique narratives powered by advanced AI.
                </p>
                <div className="flex space-x-4">
                  <a href="https://www.tiktok.com/@lovelore.ai" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors flex items-center">
                    <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.26 0 .51.03.76.09V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.65a6.34 6.34 0 0 0 10.86 4.48 6.81 6.81 0 0 0 .89-1.48 6.33 6.33 0 0 0 .3-1.95V7.54a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.23.03Z"/>
                    </svg>
                    TikTok
                  </a>
                  <a href="https://www.instagram.com/lovelore.stories/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors flex items-center">
                    <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    Instagram
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-white font-semibold mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/stories" className="text-gray-400 hover:text-white transition-colors">
                      Browse Stories
                    </Link>
                  </li>
                  <li>
                    <Link href="/account" className="text-gray-400 hover:text-white transition-colors">
                      Account Settings
                    </Link>
                  </li>
                  <li>
                    <Link href="/help" className="text-gray-400 hover:text-white transition-colors">
                      Help Center
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h3 className="text-white font-semibold mb-4">Resources</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/help" className="text-gray-400 hover:text-white transition-colors">
                      Help Center
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                      Contact Us
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm mb-4 md:mb-0">
                &copy; {new Date().getFullYear()} LoveLore. All rights reserved.
              </p>
              
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;