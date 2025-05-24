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
import TikTokBrowserBanner from '@/components/home/TikTokBrowserBanner';
import SubscriptionModal from '@/components/SubscriptionModal';
import Script from 'next/script';
import Head from 'next/head';
import LoadingSpinner from '@/components/LoadingSpinner';

// Add this CSS at the top level of your component or in a global CSS file
const shadowGlowStyle = `
  .shadow-glow {
    box-shadow: 0 0 15px rgba(255, 206, 84, 0.3);
  }

  @keyframes float-slow {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-10px) rotate(5deg); }
  }
  
  @keyframes float-medium {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(-5deg); }
  }
  
  @keyframes float-fast {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(8deg); }
  }
  
  .animate-float-slow {
    animation: float-slow 6s ease-in-out infinite;
  }
  
  .animate-float-medium {
    animation: float-medium 4s ease-in-out infinite;
  }
  
  .animate-float-fast {
    animation: float-fast 3s ease-in-out infinite;
  }
`;

// Countdown Timer Component
const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 3,
    hours: 7,
    minutes: 25,
    seconds: 0
  });

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-black/20 backdrop-blur-sm px-2 py-1.5 rounded-md border border-white/10">
      {/* Simple countdown for all screen sizes */}
      <div className="flex items-center justify-center">
        <span className="text-white font-mono text-[11px] xs:text-xs sm:text-sm font-medium">
          {timeLeft.days}d : {timeLeft.hours.toString().padStart(2, '0')}h : {timeLeft.minutes.toString().padStart(2, '0')}m
        </span>
      </div>
    </div>
  );
};

// JSON-LD structured data for SEO
const StructuredData = ({ stories }: { stories: Story[] }) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lovelore.app';
  
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'LoveLore',
    alternateName: 'LoveLore - AI Love Stories',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/stories?search={search_term_string}`,
      'query-input': 'required name=search_term_string'
    },
    description: 'Experience interactive romance stories where AI brings your choices to life. Fall in love, choose your path, and shape your story.',
    keywords: 'ai love, ai boyfriends, ai love stories, interactive stories, romance stories, AI storytelling, choose your own adventure, narrative games'
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'LoveLore',
    url: baseUrl,
    logo: `${baseUrl}/images/logo.png`,
    description: 'Interactive AI-powered romance storytelling platform',
    sameAs: [
      'https://www.tiktok.com/@lovelore.ai',
      'https://www.instagram.com/lovelore.stories/'
    ]
  };

  // Site navigation schema to help with sitelinks
  const siteNavigationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SiteNavigationElement',
    name: 'Main Navigation',
    url: baseUrl,
    hasPart: [
      {
        '@type': 'WebPage',
        '@id': `${baseUrl}/`,
        name: 'Home',
        url: `${baseUrl}/`,
        description: 'Discover interactive AI love stories and start your romantic adventure'
      },
      {
        '@type': 'WebPage',
        '@id': `${baseUrl}/stories`,
        name: 'Stories',
        url: `${baseUrl}/stories`,
        description: 'Browse our collection of interactive romance stories'
      },
      {
        '@type': 'WebPage',
        '@id': `${baseUrl}/login`,
        name: 'Sign In',
        url: `${baseUrl}/login`,
        description: 'Sign in to access your personalized story experience'
      },
      {
        '@type': 'WebPage',
        '@id': `${baseUrl}/help`,
        name: 'Help',
        url: `${baseUrl}/help`,
        description: 'Get help and support for using LoveLore'
      },
      {
        '@type': 'WebPage',
        '@id': `${baseUrl}/contact`,
        name: 'Contact',
        url: `${baseUrl}/contact`,
        description: 'Get in touch with the LoveLore team'
      }
    ]
  };

  const storiesSchema = stories.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Featured Stories',
    description: 'Interactive romance stories on LoveLore',
    itemListElement: stories.map((story, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'CreativeWork',
        '@id': `${baseUrl}/story/${story.id}`,
        name: story.world_name,
        description: story.description || story.story_context,
        url: `${baseUrl}/story/${story.id}`,
        image: story.image,
        genre: 'Romance',
        author: {
          '@type': 'Organization',
          name: 'LoveLore'
        }
      }
    }))
  } : null;

  return (
    <>
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavigationSchema) }}
      />
      {storiesSchema && (
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(storiesSchema) }}
        />
      )}
    </>
  );
};

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();
  const supabase = useSupabase();
  const [stories, setStories] = useState<Story[]>([]);
  const [featuredStories, setFeaturedStories] = useState<Story[]>([]);
  const [showcaseStories, setShowcaseStories] = useState<Story[]>([]);
  const [recentlyViewedStories, setRecentlyViewedStories] = useState<Story[]>([]);
  const [carouselLoading, setCarouselLoading] = useState(true);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [recentStoriesLoading, setRecentStoriesLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [showTikTokBanner, setShowTikTokBanner] = useState(true);
  const [hasActualRecentlyViewed, setHasActualRecentlyViewed] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Check if user has a subscription
  useEffect(() => {
    if (!supabase || !user) {
      setSubscriptionLoading(false);
      return;
    }

    const checkSubscription = async () => {
      try {
        setSubscriptionLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.error('No session available for checking subscription');
          setHasSubscription(false);
          return;
        }
        
        const response = await fetch('/api/stripe-subscription', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          credentials: 'include',
        });
        
        if (!response.ok) {
          console.error('Failed to fetch subscription data');
          setHasSubscription(false);
          return;
        }
        
        const { subscription } = await response.json();
        
        if (subscription && subscription.status === 'active') {
          setHasSubscription(true);
        } else {
          setHasSubscription(false);
        }
      } catch (error: any) {
        console.error('Error checking subscription status:', error.message);
        setHasSubscription(false);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    checkSubscription();
  }, [supabase, user]);

  // Show subscription modal when user visits homepage
  useEffect(() => {
    if (user && !loading) {
      // Add a small delay to ensure the page has loaded
      const timer = setTimeout(() => {
        setShowSubscriptionModal(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, loading]);

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
          .filter(story => story.genre !== 'Anime')
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

  // Fetch recently viewed stories
  useEffect(() => {
    if (!supabase || !user) return;

    const fetchRecentlyViewedStories = async () => {
      try {
        setRecentStoriesLoading(true);
        
        // Get user's recent conversations from the database
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select('world_id, started_at, ended_at')
          .eq('user_id', user.id)
          .order('started_at', { ascending: false })
          .limit(10);
        
        if (conversationsError) throw conversationsError;
        
        if (!conversationsData || conversationsData.length === 0) {
          // No conversations found - don't show any recently viewed content
          setRecentlyViewedStories([]);
          setHasActualRecentlyViewed(false);
          setRecentStoriesLoading(false);
          return;
        }
        
        // Get the unique world IDs
        const worldIds = Array.from(new Set(conversationsData.map(conv => conv.world_id))).slice(0, 5);
        
        // Get the worlds associated with these conversations
        const { data: worldsData, error: worldsError } = await supabase
          .from('worlds')
          .select('id, story_id')
          .in('id', worldIds);
        
        if (worldsError) throw worldsError;
        
        // Get the story IDs from worlds
        const storyIds = worldsData.map(world => world.story_id).filter(Boolean);
        
        if (storyIds.length === 0) {
          setHasActualRecentlyViewed(false);
          setRecentStoriesLoading(false);
          return;
        }
        
        // Get the story details
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
          .in('id', storyIds);
        
        if (storiesError) throw storiesError;
        
        // Sort stories to match the order of conversations
        const worldIdToStoryId = Object.fromEntries(
          worldsData.map(world => [world.id, world.story_id])
        );
        
        const conversationWorldIds = conversationsData
          .map(conv => conv.world_id)
          .filter((value, index, self) => self.indexOf(value) === index); // Keep only unique values in original order
        
        const sortedStoryIds = conversationWorldIds
          .map(worldId => worldIdToStoryId[worldId])
          .filter(Boolean);
        
        const sortedStories = sortedStoryIds
          .map(storyId => storiesData.find(story => story.id === storyId))
          .filter(Boolean)
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
        
        setRecentlyViewedStories(sortedStories);
        setHasActualRecentlyViewed(true); // User has actual recently viewed content
      } catch (error: any) {
        console.error('Error fetching recently viewed stories:', error.message);
        setHasActualRecentlyViewed(false);
      } finally {
        setRecentStoriesLoading(false);
      }
    };

    fetchRecentlyViewedStories();
  }, [supabase, user]);

  // Simple handler for closing the TikTok banner
  const handleCloseTikTokBanner = () => {
    setShowTikTokBanner(false);
  };

  if (loading) {
    return (
      <Layout>
        <TikTokBrowserBanner onClose={handleCloseTikTokBanner} />
        <div className="min-h-screen flex justify-center items-center">
          <LoadingSpinner
            variant="spinner"
            size="xl"
            theme="pink"
            text="Loading"
            center={true}
          />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <TikTokBrowserBanner onClose={handleCloseTikTokBanner} />
        <div className="relative min-h-screen flex flex-col">


          
          <div className="w-full">
            <Auth />
          </div>
          
          {/* Added tagline banner */}
          <div className="mb-8 mt-8 relative max-w-xl mx-auto px-8 sm:px-4">
            {/* Static hearts and chat bubble - adjusted for mobile */}
            <div className="absolute left-2 sm:-left-4 -top-2 sm:-top-4">🤍</div>
            <div className="absolute left-4 sm:left-2 -bottom-4 sm:-bottom-6">🤍</div>
            <div className="absolute right-4 sm:right-8 -top-2 sm:-top-6">🤍</div>
            
            <h2 className="text-[2.8rem] sm:text-[3.5rem] leading-[0.9] mb-2 font-bold tracking-tight uppercase">
            Step Into the Story You <span className="text-[#EC444B]"> Secretly</span> Want
            </h2>
            <p className="text-sm text-gray-400 font-light">
              With our interactive stories, your desires come alive through immersive AI-powered experiences
            </p>
          </div>
          
          <FeaturesGrid />
          <FeaturedScenarios stories={showcaseStories} loading={storiesLoading} />
          <FAQSection />
        </div>
      </Layout>
    );
  }

  return (
          <>
        <style jsx global>{shadowGlowStyle}</style>
       
       {/* Structured data for SEO */}
       {featuredStories.length > 0 && <StructuredData stories={featuredStories} />}
       
        <Layout>
          {showTikTokBanner && <TikTokBrowserBanner onClose={handleCloseTikTokBanner} />}
        {!subscriptionLoading && !hasSubscription && (
          <div className="w-screen relative left-1/2 right-1/2 -mx-[50vw]">
            <div className="bg-gradient-to-r from-indigo-900 via-[#EC444B] to-purple-900 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
              {/* Decorative elements */}
              <div className="absolute top-0 left-[10%] w-20 h-20 rounded-full bg-yellow-500/10 blur-xl"></div>
              <div className="absolute bottom-0 right-[20%] w-24 h-24 rounded-full bg-purple-500/10 blur-xl"></div>
              
              <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-3 md:py-2 relative">
                <div className="flex flex-row items-center justify-between gap-2 sm:gap-3">
                  <div className="flex items-center shrink-0 max-w-[60%] sm:max-w-none">
                    <div className="flex items-center justify-center w-7 h-7 sm:w-7 sm:h-7 md:w-6 md:h-6 rounded-full bg-yellow-400/20 backdrop-blur-sm mr-2 sm:mr-2 md:mr-3 shadow-glow shrink-0">
                      <span className="text-sm sm:text-sm md:text-sm">🔥</span>
                    </div>
                    <div className="hidden xs:block uppercase">
                      <p className="text-[10px] xs:text-[11px] sm:text-xs md:text-xs text-yellow-300 uppercase font-bold tracking-wider leading-none mb-0.5 break-words">Limited Time Offer</p>
                      <p className="font-bold text-white text-[11px] xs:text-xs sm:text-sm md:text-sm leading-tight break-words">
                        <span className="text-yellow-300 uppercase whitespace-nowrap">50% OFF</span> your first subscription!
                      </p>
                    </div>
                    <div className="block xs:hidden">
                      <p className="font-bold text-white text-[11px] leading-tight break-words uppercase">
                        <span className="text-yellow-300 uppercase whitespace-nowrap uppercase">50% OFF</span> first sub!
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-3 md:gap-3 shrink-0">
                    <CountdownTimer />
                    
                    <button 
                      onClick={() => router.push('/account?tab=subscription')}
                      className="group relative overflow-hidden bg-white hover:bg-yellow-300 text-[#EC444B] font-bold text-[10px] xs:text-xs sm:text-sm md:text-xs px-2.5 xs:px-3 sm:px-4 md:px-4 py-1.5 sm:py-1.5 md:py-1.5 rounded-lg transition-all duration-300 shadow-glow transform hover:scale-105 whitespace-nowrap"
                    >
                      <span className="relative z-10 uppercase">Subscribe</span>
                      <span className="absolute inset-0 bg-gradient-to-r from-yellow-200 via-white to-yellow-200 transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="w-screen relative left-1/2 right-1/2 -mx-[50vw] mb-10">
          <FeaturedStoriesCarousel stories={featuredStories} loading={carouselLoading} />
        </div>
        
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* New tagline banner - should show for all logged-in users */}
          {user && (
            <div className="text-center mb-6 md:mb-10 relative py-4 md:py-8">
              {/* Floating hearts */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="heart-1 absolute w-4 h-4 text-[#EC444B] opacity-60 animate-float-slow" style={{top: '10%', left: '15%'}}>❤️</div>
                <div className="heart-2 absolute w-4 h-4 text-[#EC444B] opacity-60 animate-float-medium" style={{top: '60%', left: '5%'}}>❤️</div>
                <div className="heart-3 absolute w-4 h-4 text-[#EC444B] opacity-60 animate-float-fast" style={{top: '20%', left: '75%'}}>❤️</div>
                <div className="heart-4 absolute w-4 h-4 text-[#EC444B] opacity-60 animate-float-slow" style={{top: '70%', left: '85%'}}>❤️</div>
              </div>
              
              <h2 className="font-bold text-white text-2xl sm:text-3xl uppercase tracking-wider leading-none mb-0">
                New Stories Added Every Week
              </h2>
              <p className="font-bold text-white text-2xl sm:text-3xl uppercase tracking-wider leading-none -mt-2">
                Your <span className="text-[#EC444B]">fantasies</span> come to life
              </p>
            </div>
          )}
          
          {/* Recently Viewed Stories Section */}
          {user && (
            <>
              <div className="rounded-xl p-6 relative overflow-hidden">
                <div className="absolute inset-0 z-0"></div>
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold text-white flex items-center mb-2">
                    <span className="w-8 h-8 mr-3 rounded-full bg-[#EC444B] flex items-center justify-center shadow-sm">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    {hasActualRecentlyViewed ? "RECENTLY VIEWED" : "WELCOME TO LOVELORE"}
                  </h2>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-400 text-sm max-w-md">
                      {hasActualRecentlyViewed 
                        ? "Continue where you left off" 
                        : "Let the fun begin! Pick a story below to start your adventure"}
                    </p>
                  </div>
                </div>
              </div>
              
              {hasActualRecentlyViewed ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {recentStoriesLoading ? (
                    Array(4).fill(0).map((_, index) => (
                      <LoadingSpinner
                        key={index}
                        variant="skeleton"
                        skeleton={{
                          image: true,
                          lines: 2,
                          height: "h-44"
                        }}
                        className="bg-gray-800/50 rounded-xl overflow-hidden shadow-lg h-72"
                      />
                    ))
                  ) : (
                    recentlyViewedStories.map((story) => (
                      <div 
                        key={story.id}
                        onClick={() => router.push(`/story/${story.id}`)}
                        className="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/90 rounded-xl overflow-hidden shadow-lg cursor-pointer transform transition-all duration-500 hover:shadow-[0_0_15px_rgba(236,68,75,0.3)] hover:-translate-y-1"
                      >
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#EC444B]/10 to-purple-900/20 rounded-bl-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-[#EC444B]/10 to-purple-900/20 rounded-tr-3xl"></div>
                        
                        {/* Image container with gradient overlay */}
                        <div className="h-44 w-full relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60 z-10"></div>
                          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/40 via-transparent to-gray-900 opacity-60 z-10"></div>
                          
                          {story.image ? (
                            <img 
                              src={story.image} 
                              alt={story.world_name} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
                              <span className="text-white text-3xl opacity-50">📚</span>
                            </div>
                          )}
                          
                          {/* Continue badge */}
                          <div className="absolute top-3 right-3 z-20 bg-[#EC444B]/90 text-white text-xs font-bold py-1 px-2 rounded-full shadow-md transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0">
                            Continue
                          </div>
                          
                          {story.logo_image && (
                            <div className="absolute bottom-3 left-3 h-10 w-auto z-20 drop-shadow-lg">
                              <img 
                                src={story.logo_image} 
                                alt={`${story.world_name} logo`} 
                                className="h-full w-auto object-contain"
                              />
                            </div>
                          )}
                        </div>
                        
                        {/* Content with subtle decoration */}
                        <div className="p-4 border-t border-gray-700/30 relative">
                          <h3 className="text-white font-bold truncate text-lg group-hover:text-[#EC444B] transition-colors duration-300">
                            {story.world_name}
                          </h3>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-[#EC444B]/20 to-purple-900/20 mb-6">
                    <span className="text-4xl">🌟</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">Ready for Your First Adventure?</h3>
                  <p className="text-gray-400 max-w-md mx-auto mb-6">
                    Dive into immersive interactive stories where your choices shape the narrative. 
                    Your journey begins with a single click below!
                  </p>
                  <div className="flex justify-center">
                    <button 
                      onClick={() => document.getElementById('stories-section')?.scrollIntoView({ behavior: 'smooth' })}
                      className="bg-[#EC444B] hover:bg-[#d83a40] text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300 transform hover:scale-105"
                    >
                      Explore Stories
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <div id="stories-section" className="rounded-xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 z-0"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white flex items-center mb-2">
                <span className="w-8 h-8 mr-3 rounded-full bg-[#EC444B] flex items-center justify-center shadow-sm">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
                STORIES
              </h2>
              <div className="flex items-center justify-between">
                <p className="text-gray-400 text-sm max-w-md">Explore our interactive stories</p>
              </div>
            </div>
          </div>
          
          <StoryList />
        </div>
        
        {/* Subscription Modal */}
        <SubscriptionModal 
          isOpen={showSubscriptionModal} 
          onClose={() => setShowSubscriptionModal(false)} 
        />
      </Layout>
    </>
  );
}