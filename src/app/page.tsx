"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Auth from '@/components/Auth';
import useUser from '@/hooks/useUser';

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect via useEffect
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/images/Standard_Mode_Man_smirking__looking_deep_into_.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Interactive AI Stories
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-300">
            Experience stories that adapt to your choices
          </p>
          <button 
            onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-white text-black px-8 py-4 rounded-full font-medium text-lg hover:bg-gray-100 transition-all transform hover:scale-105"
          >
            Start Your Journey
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">GAMEPLAY</h2>
            <p className="text-xl text-gray-400">No rules, no objective. Only adventure.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-800 rounded-xl p-6 transform hover:scale-105 transition-all">
              <div className="text-purple-500 text-2xl font-bold mb-4">1</div>
              <h3 className="text-xl font-bold mb-4">Define your world</h3>
              <p className="text-gray-400">
                Pick a character, a world, or a story from thousands of community-made scenarios, or create your own!
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-800 rounded-xl p-6 transform hover:scale-105 transition-all">
              <div className="text-purple-500 text-2xl font-bold mb-4">2</div>
              <h3 className="text-xl font-bold mb-4">Take actions</h3>
              <p className="text-gray-400">
                You can decide what your character says or does. The AI will produce responses from other characters or world events for you to respond to.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-800 rounded-xl p-6 transform hover:scale-105 transition-all">
              <div className="text-purple-500 text-2xl font-bold mb-4">3</div>
              <h3 className="text-xl font-bold mb-4">Make it yours</h3>
              <p className="text-gray-400">
                Customize your adventure with custom theme combinations and advanced AI tweaks. Create cards for characters, locations, and more!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Section */}
      <section id="auth-section" className="py-20 bg-black">
        <Auth />
      </section>
    </main>
  );
}