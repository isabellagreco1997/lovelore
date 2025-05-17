"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import StoryList from '@/components/StoryList';
import Auth from '@/components/Auth';
import useUser from '@/hooks/useUser';
import useSupabase from '@/hooks/useSupabase';
import { Story } from '@/types/database';
import FeaturedStoriesCarousel from '@/components/FeaturedStoriesCarousel';

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();
  const supabase = useSupabase();
  const [stories, setStories] = useState<Story[]>([]);
  const [featuredStories, setFeaturedStories] = useState<Story[]>([]);
  const [showcaseStories, setShowcaseStories] = useState<Story[]>([]);
  const [carouselLoading, setCarouselLoading] = useState(true);
  const [storiesLoading, setStoriesLoading] = useState(true);

  // Fetch stories for showcase
  useEffect(() => {
    if (!supabase) return;

    const fetchShowcaseStories = async () => {
      try {
        setStoriesLoading(true);
        const { data: storiesData, error: storiesError } = await supabase
          .from('stories')
          .select(`
            id,
            world_name,
            story_context,
            created_at,
            image,
            logo_image,
            description,
            chapters,
            genre
          `);

        if (storiesError) throw storiesError;
        
        // Filter out anime stories and format the data
        const filteredStories = (storiesData || [])
          .filter(story => story.genre !== 'anime')
          .map(story => ({
            id: story.id,
            world_name: story.world_name,
            story_context: story.story_context,
            created_at: story.created_at,
            image: story.image,
            logo_image: story.logo_image,
            description: story.description,
            chapters: Array.isArray(story.chapters) ? story.chapters : []
          }))
          .slice(0, 3);
        
        setShowcaseStories(filteredStories);
      } catch (error: any) {
        console.error('Error fetching showcase stories:', error.message);
      } finally {
        setStoriesLoading(false);
      }
    };

    fetchShowcaseStories();
  }, [supabase]);

  // Fetch stories for logged-in users
  useEffect(() => {
    if (!supabase || !user) return;

    const fetchStories = async () => {
      try {
        setCarouselLoading(true);
        const { data: storiesData, error: storiesError } = await supabase
          .from('stories')
          .select(`
            id,
            world_name,
            story_context,
            created_at,
            image,
            logo_image,
            description,
            chapters,
            genre
            
          `)
          .limit(7);

        if (storiesError) throw storiesError;
        
        // Filter out anime stories and format the data
        const filteredStories = (storiesData || [])
          .filter(story => story.genre !== 'anime')
          .map(story => ({
            id: story.id,
            world_name: story.world_name,
            story_context: story.story_context,
            created_at: story.created_at,
            image: story.image,
            logo_image: story.logo_image,
            description: story.description,
            chapters: Array.isArray(story.chapters) ? story.chapters : []
          }));
        
        setStories(filteredStories);
        setFeaturedStories(filteredStories.slice(0, Math.min(7, filteredStories.length)));
      } catch (error: any) {
        console.error('Error fetching stories for carousel:', error.message);
      } finally {
        setCarouselLoading(false);
      }
    };

    fetchStories();
  }, [supabase, user]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600 animate-pulse">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="relative min-h-screen flex flex-col">
          {/* Auth Section */}
          <div className="w-full">
            <Auth />
          </div>

          {/* Features Grid */}
          <div className="relative py-24 px-4 sm:px-6 lg:px-8 bg-black/80 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {/* Feature 1 */}
                <div className="text-center">
                  <div className="w-12 h-12 bg-[#EC444B] rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl">1</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Define your world</h3>
                  <p className="text-gray-400">
                    Pick a character, a world, or a story from thousands of community-made scenarios, or create your own! The AI will fill in the details for your unique adventure.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="text-center">
                  <div className="w-12 h-12 bg-[#EC444B] rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl">2</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Take actions</h3>
                  <p className="text-gray-400">
                    You can decide what your character says or does. The AI will produce responses from other characters or world events for you to respond to.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="text-center">
                  <div className="w-12 h-12 bg-[#EC444B] rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl">3</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Make it yours</h3>
                  <p className="text-gray-400">
                    Customize your adventure with custom theme combinations and advanced AI tweaks. Create cards for characters, locations, and more!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Scenarios */}
          <div className="relative py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
                Try out one of these scenarios
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {storiesLoading ? (
                  // Loading states for stories
                  [...Array(3)].map((_, index) => (
                    <div key={index} className="bg-gray-900/50 rounded-xl overflow-hidden backdrop-blur-sm border border-gray-800 animate-pulse">
                      <div className="h-48 bg-gray-800"></div>
                      <div className="p-6">
                        <div className="h-6 w-3/4 bg-gray-800 rounded mb-4"></div>
                        <div className="h-24 bg-gray-800 rounded mb-6"></div>
                        <div className="h-10 bg-gray-800 rounded"></div>
                      </div>
                    </div>
                  ))
                ) : showcaseStories.length > 0 ? (
                  // Display actual stories
                  showcaseStories.map((story) => (
                    <div key={story.id} className="bg-gray-900/50 rounded-xl overflow-hidden backdrop-blur-sm border border-gray-800 group">
                      {story.image && (
                        <div className="relative h-48 overflow-hidden">
                          <img 
                            src={story.image} 
                            alt={story.world_name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-white mb-4">{story.world_name}</h3>
                        <p className="text-gray-400 mb-6 line-clamp-3">
                          {story.description}
                        </p>
                        <button 
                          onClick={() => router.push('/login')}
                          className="w-full bg-[#EC444B]/10 text-[#EC444B] border border-[#EC444B]/20 rounded-lg px-4 py-2 hover:bg-[#EC444B]/20 transition-colors"
                        >
                          Play Now
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  // Fallback message if no stories
                  <div className="col-span-3 text-center text-gray-400">
                    No scenarios available at the moment.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="relative py-24 px-4 sm:px-6 lg:px-8 bg-black/80 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
                Frequently Asked Questions
              </h2>
              <div className="space-y-8">
                {/* FAQ Item 1 */}
                <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm border border-gray-800">
                  <h3 className="text-xl font-bold text-white mb-3">What is LoveLore?</h3>
                  <p className="text-gray-400">
                    LoveLore is an interactive storytelling platform where you can experience and create unique romantic narratives. Our AI-powered system adapts to your choices, creating personalized story experiences.
                  </p>
                </div>

                {/* FAQ Item 2 */}
                <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm border border-gray-800">
                  <h3 className="text-xl font-bold text-white mb-3">Is it free to use?</h3>
                  <p className="text-gray-400">
                    LoveLore offers both free and premium content. You can start with free scenarios and upgrade to access exclusive stories, advanced customization options, and more features.
                  </p>
                </div>

                {/* FAQ Item 3 */}
                <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm border border-gray-800">
                  <h3 className="text-xl font-bold text-white mb-3">How does the AI storytelling work?</h3>
                  <p className="text-gray-400">
                    Our advanced AI understands context and creates dynamic responses to your choices. It remembers your previous decisions and adapts the story accordingly, ensuring each playthrough is unique and personalized.
                  </p>
                </div>

                {/* FAQ Item 4 */}
                <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm border border-gray-800">
                  <h3 className="text-xl font-bold text-white mb-3">Can I create my own stories?</h3>
                  <p className="text-gray-400">
                    Yes! LoveLore provides tools for creating and sharing your own interactive stories. You can customize characters, settings, and plot points, then share them with the community.
                  </p>
                </div>

                {/* FAQ Item 5 */}
                <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm border border-gray-800">
                  <h3 className="text-xl font-bold text-white mb-3">Is my data secure?</h3>
                  <p className="text-gray-400">
                    We take privacy seriously. Your personal information and story progress are protected with industry-standard encryption. You can enjoy our platform knowing your data is safe and secure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-screen relative left-1/2 right-1/2 -mx-[50vw] mb-10">
        <FeaturedStoriesCarousel stories={featuredStories} loading={carouselLoading} />
      </div>
      
      <div className="space-y-10 max-w-screen-2xl mx-auto">
        <div className="rounded-xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 z-0"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white flex items-center mb-2">
              <span className="w-8 h-8 mr-3 rounded-full bg-[#EC444B] flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              Stories
            </h2>
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm max-w-md">Create, explore our interactive stories</p>
            </div>
          </div>
        </div>
        
        <StoryList />
      </div>
    </Layout>
  );
}