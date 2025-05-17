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
  const [carouselLoading, setCarouselLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !user) return;

    const fetchStories = async () => {
      try {
        setCarouselLoading(true);
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .limit(7);

        if (error) throw error;
        
        // Transform the data to match our Story type
        const formattedStories = data?.map(story => ({
          ...story,
          chapters: Array.isArray(story.chapters) ? story.chapters : []
        })) || [];
        
        setStories(formattedStories);
        // Use the first few stories for the carousel
        setFeaturedStories(formattedStories.slice(0, Math.min(7, formattedStories.length)));
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
            <p className="mt-4 text-gray-600 animate-pulse">Logging you in...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <Layout>
      {/* Full width carousel outside the main container */}
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