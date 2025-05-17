import { useState } from 'react';
import useUser from '@/hooks/useUser';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signIn, signUp } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
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

  return (
    <div className="min-h-screen flex bg-black">
      {/* Left side - Auth form */}
      <div className="w-full md:w-[480px] flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Get access to 10M+ Characters
            </h2>
            <p className="text-gray-400">
              Sign up in just ten seconds
            </p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <button
                type="button"
                className="w-full bg-white text-black rounded-xl p-3 font-medium flex items-center justify-center space-x-2 hover:bg-gray-100 transition-colors mb-3"
              >
                <img src="/images/google.svg" alt="Google" className="w-5 h-5" />
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                className="w-full bg-white text-black rounded-xl p-3 font-medium flex items-center justify-center space-x-2 hover:bg-gray-100 transition-colors"
              >
                <img src="/images/apple.svg" alt="Apple" className="w-5 h-5" />
                <span>Continue with Apple</span>
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-black text-gray-500">OR</span>
              </div>
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? "Enter your password" : "Create a password"}
              className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black rounded-xl px-4 py-3 font-medium hover:bg-gray-100 transition-colors"
            >
              {loading ? 'Processing...' : 'Continue'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              By continuing, you agree with the{' '}
              <a href="#" className="text-gray-400 hover:text-white">Terms</a>
              {' '}and{' '}
              <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
            </p>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-gray-400 hover:text-white text-sm"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>
      </div>

      {/* Right side - Video */}
      <div className="hidden md:block flex-1 relative overflow-hidden rounded-l-[2rem]">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          preload="auto"
        >
          <source src="/images/Standard_Mode_Man_smirking__looking_deep_into_.mp4" type="video/mp4" />
          <source src="/images/Standard_Mode_Man_smirking__looking_deep_into_.webm" type="video/webm" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};

export default Auth;