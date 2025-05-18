"use client";

import { ReactNode } from 'react';
import useUser from '@/hooks/useUser';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, signOut, loading } = useUser();
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isLoginPage = pathname === '/login';

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
        <header className="bg-black shadow-md sticky top-0 z-10 border-b border-[#EC444B]">
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
              
              {user && (
                <nav className="hidden md:flex space-x-6">
                  <Link href="/story" className="text-white hover:text-purple-300 transition-colors flex items-center">
                    <span className="mr-1">✦</span> Stories
                  </Link>
                </nav>
              )}
            </div>
            
            {!loading && (
              <div className="flex items-center space-x-2 md:space-x-4">
                {user ? (
                  <>
                    <span className="text-white hidden sm:block text-sm">
                      {user.email?.split('@')[0]}
                    </span>
                    
                    {/* Account Link - Icon on mobile, text on desktop */}
                    <Link 
                      href="/account"
                      className="bg-transparent border border-[#EC444B] text-white rounded-md text-sm font-medium transition-all duration-300 hover:bg-[#EC444B]/10 flex items-center justify-center"
                    >
                      <span className="hidden sm:block px-4 py-2">Account</span>
                      <span className="sm:hidden w-9 h-9 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </span>
                    </Link>

                    {/* Sign Out Button - Icon on mobile, text on desktop */}
                    <button
                      onClick={() => signOut()}
                      className="bg-transparent border border-[#EC444B] text-white rounded-md text-sm font-medium transition-all duration-300 hover:bg-[#EC444B]/10 flex items-center justify-center"
                    >
                      <span className="hidden sm:block px-4 py-2">Sign Out</span>
                      <span className="sm:hidden w-9 h-9 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </span>
                    </button>
                  </>
                ) : (
                  <Link href="/login">
                    <span className="bg-transparent border border-[#EC444B] text-white px-3 py-1.5 md:px-4 md:py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-[#EC444B]/10">
                      Sign In
                    </span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </header>
      )}
      
      {/* Main content */}
      <main className={`flex-grow z-10 ${isLoginPage ? '' : isHomePage ? 'mb-8' : 'my-8 mx-4 md:mx-8'}`}>
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
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Twitter
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Discord
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    GitHub
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-white font-semibold mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/story" className="text-gray-400 hover:text-white transition-colors">
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
              <div className="flex items-center space-x-4">
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Privacy
                </Link>
                <span className="text-gray-700">•</span>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Terms
                </Link>
                <span className="text-gray-700">•</span>
                <Link href="/help" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Help
                </Link>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;