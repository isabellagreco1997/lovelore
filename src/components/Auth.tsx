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
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full bg-red-600">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          src="/Standard_Mode_Man_smirking__looking_deep_into_.mp4"
          type="video/mp4"
        />
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      </div>

      {/* Auth Container */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-[#1c1c1c]/90 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-gray-800/50">
          <div className="px-8 pt-8 pb-6">
            <h2 className="text-3xl font-bold text-white mb-2">
              Get access to 10M+ Characters
            </h2>
            <p className="text-gray-400">
              Sign up in just ten seconds
            </p>
          </div>

          <div className="px-8 pb-8">
            {error && (
              <div className="bg-red-900/20 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
      </div>
    </div>
  );
};

export default Auth;