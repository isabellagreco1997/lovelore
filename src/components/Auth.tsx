'use client';

import { useState } from 'react';
import useUser from '@/hooks/useUser';
import useSupabase from '@/hooks/useSupabase';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn, signUp } = useUser();
  const supabase = useSupabase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        window.location.href = '/';
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!supabase) {
      setError('Authentication service not available');
      return;
    }
    
    setLoading(true);
    setError(null);
    console.log('Signing in with Google', `${window.location.origin}/login`);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="flex flex-col md:flex-row w-full max-w-[880px] bg-gray-900/20 rounded-2xl overflow-hidden backdrop-blur-sm">
        {/* Video section - Shown on both mobile and desktop */}
        <div className="w-full h-[300px] md:h-auto md:w-[450px] relative overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            preload="auto"
          >
            <source src="/images/Standard_Mode_Man_smirking__looking_deep_into_.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-gray-900/20 to-transparent"></div>
        </div>

        {/* Auth form */}
        <div className="w-full md:w-[430px] p-6 md:p-8 relative z-10">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src="/images/logo.png" 
              alt="LoveLore Logo" 
              className="h-12 w-auto object-contain"
            />
          </div>

          <div className="mb-8 relative">
            {/* Static hearts and chat bubble */}
            <div className="absolute -left-4 -top-4">🤍</div>
            <div className="absolute -right-2 top-2">💭</div>
            <div className="absolute left-2 -bottom-2">🤍</div>
            <div className="absolute right-8 -top-6">🤍</div>
            
            <h2 className="text-[3.5rem] leading-[0.9] mb-2 font-bold tracking-tight uppercase">
              MAKE YOUR FANTASIES <span className="text-[#EC444B]">TRUE</span>
            </h2>
            <p className="text-sm text-gray-400 font-light">
              Dive into interactive stories that come alive
            </p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white text-black rounded-xl p-3 font-medium flex items-center justify-center space-x-2 hover:bg-gray-100 transition-colors text-sm md:text-base"
              >
                <img 
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                  alt="Google" 
                  className="w-5 h-5" 
                />
                <span>Continue with Google</span>
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-xs md:text-sm">
                <span className="px-2 bg-gray-900/20 text-gray-500">OR</span>
              </div>
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
              required
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? "Enter your password" : "Create a password"}
              className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black rounded-xl px-4 py-3 font-medium hover:bg-gray-100 transition-colors text-sm md:text-base"
            >
              {loading ? 'Processing...' : 'Continue'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs md:text-sm text-gray-500">
              By continuing, you agree with the{' '}
              <a href="#" className="text-gray-400 hover:text-white">Terms</a>
              {' '}and{' '}
              <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
            </p>
          </div>

          <div className="mt-4 md:mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-gray-400 hover:text-white text-xs md:text-sm"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;