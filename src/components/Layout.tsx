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
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link href="/">
                <div className="flex items-center group">
                  <img 
                    src="/images/logo.png" 
                    alt="LoveLore Logo" 
                    className="h-8 w-auto object-contain mr-2"
                  />
                </div>
              </Link>
              
              {user && (
                <nav className="hidden md:flex space-x-6">
                  <Link href="/story" className="text-white hover:text-purple-300 transition-colors flex items-center">
                    <span className="mr-1">✦</span> Stories
                  </Link>
                  <Link href="/conversations" className="text-white hover:text-purple-300 transition-colors flex items-center">
                    <span className="mr-1">✦</span> Conversations
                  </Link>
                </nav>
              )}
            </div>
            
            {!loading && (
              <div>
                {user ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-purple-200 hidden sm:inline">Hello, {user.email?.split('@')[0]}</span>
                    <button
                      onClick={() => signOut()}
                      className="bg-transparent border border-[#EC444B] text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 shadow-sm hover:shadow"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link href="/login">
                    <span className="bg-transparent border border-[#EC444B] text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 shadow-sm hover:shadow">
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
      <main className={`flex-grow z-10 ${isLoginPage ? '' : isHomePage ? 'mb-8' : 'my-8 mx-8'}`}>
        {children}
      </main>
      
      {/* Footer - Hide on login page */}
      {!isLoginPage && (
        <footer className="bg-black py-6 mt-auto z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <p className="text-purple-200 text-sm mb-2 sm:mb-0">
                &copy; {new Date().getFullYear()} LoveLore. All rights reserved.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-purple-200 hover:text-purple-300 transition-colors">
                  About
                </a>
                <a href="#" className="text-purple-200 hover:text-purple-300 transition-colors">
                  Privacy
                </a>
                <a href="#" className="text-purple-200 hover:text-purple-300 transition-colors">
                  Terms
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;