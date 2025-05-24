'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import useUser from '@/hooks/useUser';
import useSupabase from '@/hooks/useSupabase';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    number: false,
    special: false,
    uppercase: false
  });

  const { signIn, signUp } = useUser();
  const supabase = useSupabase();

  const validatePassword = (value: string) => {
    setPasswordValidation({
      length: value.length >= 8,
      number: /\d/.test(value),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      uppercase: /[A-Z]/.test(value)
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (!isLogin) {
      validatePassword(value);
    }
  };

  const isPasswordValid = () => {
    return Object.values(passwordValidation).every(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        window.location.href = '/';
      } else {
        if (!isPasswordValid()) {
          throw new Error('Please meet all password requirements');
        }
        const { error } = await signUp(email, password);
        if (error) throw error;
        
        // Show success message for email confirmation
        setSuccess('Check your email to confirm your account');
        // Clear the form
        setEmail('');
        setPassword('');
        // Switch to login mode after successful signup
        setIsLogin(true);
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!supabase) {
        throw new Error('Authentication service not available');
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/login`,
      });
      
      if (error) throw error;
      
      setSuccess('Password reset link has been sent to your email');
    } catch (error: any) {
      setError(error.message || 'Failed to send password reset email');
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
            <div className="absolute left-2 -bottom-6">🤍</div>
            <div className="absolute right-8 -top-6">🤍</div>
            
            <h2 className="text-[3.5rem] leading-[0.9] mb-2 font-bold tracking-tight uppercase">
              MAKE YOUR FANTASIES <span className="text-[#EC444B]">TRUE</span>
            </h2>
            <p className="text-sm text-gray-400 font-light">
              Dive into interactive stories that come alive - instantly create captivation fiction with our AI story writer
            </p>
          </div>

          {error && (
            <div className="bg-black/40 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-sm backdrop-blur-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-black/40 border border-[#EC444B]/30 text-center p-6 rounded-xl mb-6 backdrop-blur-sm">
              <div className="flex justify-center mb-3">
                <Mail className="w-8 h-8 text-[#EC444B]" />
              </div>
              <div className="text-white font-medium">{success}</div>
              <div className="text-gray-400 text-xs mt-2">Check your spam folder too</div>
            </div>
          )}

          {forgotPassword ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#EC444B] focus:border-transparent text-sm md:text-base"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black rounded-xl px-4 py-3 font-medium hover:bg-gray-100 transition-colors text-sm md:text-base disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Send Reset Link'}
              </button>
              <div className="text-center mt-4">
                <button 
                  type="button"
                  onClick={() => setForgotPassword(false)}
                  className="text-gray-400 hover:text-white text-xs md:text-sm"
                >
                  Back to login
                </button>
              </div>
            </form>
          ) : (
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
                className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#EC444B] focus:border-transparent text-sm md:text-base"
                required
              />

              <div className="space-y-2">
                <input
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder={isLogin ? "Enter your password" : "Create a password"}
                  className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#EC444B] focus:border-transparent text-sm md:text-base"
                  required
                />

                {!isLogin && (
                  <div className="space-y-2 text-xs">
                    <p className="text-gray-400">Password requirements:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`flex items-center space-x-2 ${passwordValidation.length ? 'text-[#EC444B]' : 'text-gray-500'}`}>
                        <span>{passwordValidation.length ? '✓' : '○'}</span>
                        <span>8+ characters</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${passwordValidation.uppercase ? 'text-[#EC444B]' : 'text-gray-500'}`}>
                        <span>{passwordValidation.uppercase ? '✓' : '○'}</span>
                        <span>Uppercase letter</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${passwordValidation.number ? 'text-[#EC444B]' : 'text-gray-500'}`}>
                        <span>{passwordValidation.number ? '✓' : '○'}</span>
                        <span>Number</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${passwordValidation.special ? 'text-[#EC444B]' : 'text-gray-500'}`}>
                        <span>{passwordValidation.special ? '✓' : '○'}</span>
                        <span>Special character</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || (!isLogin && !isPasswordValid())}
                className="w-full bg-white text-black rounded-xl px-4 py-3 font-medium hover:bg-gray-100 transition-colors text-sm md:text-base disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Continue'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs md:text-sm text-gray-500">
              By continuing, you agree with the{' '}
              <a href="/terms" className="text-gray-400 hover:text-white">Terms</a>
              {' '}and{' '}
              <a href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</a>
            </p>
          </div>

          {!forgotPassword && (
            <>
              <div className="mt-4 text-center">
                {isLogin && (
                  <button
                    onClick={() => setForgotPassword(true)}
                    className="text-gray-400 hover:text-white text-xs md:text-sm"
                  >
                    Forgot your password?
                  </button>
                )}
              </div>
  
              <div className="mt-4 md:mt-6 text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-gray-400 hover:text-white text-xs md:text-sm"
                >
                  {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;