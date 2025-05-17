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
import FeaturesGrid from '@/components/home/FeaturesGrid';
import FeaturedScenarios from '@/components/home/FeaturedScenarios';
import FAQSection from '@/components/home/FAQSection';

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
          <div className="w-full">
            <Auth />
          </div>
          <FeaturesGrid />
          <FeaturedScenarios stories={showcaseStories} loading={storiesLoading} />
          <FAQSection />
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