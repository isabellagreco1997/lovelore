"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Auth from '@/components/Auth';
import useUser from '@/hooks/useUser';
import useSupabase from '@/hooks/useSupabase';
import { Story, Chapter, UserChapterProgress } from '@/types/database';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function StoryPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const supabase = useSupabase();
  
  const [story, setStory] = useState<Story | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chapterProgress, setChapterProgress] = useState<Record<string, boolean>>({});
  const [world, setWorld] = useState<{ id: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [progressLoading, setProgressLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !user?.id) return;

    const checkSubscription = async () => {
      try {
        const { data: subscription, error } = await supabase
          .from('stripe_user_subscriptions')
          .select('subscription_status')
          .single();

        if (error) {
          console.error('Error checking subscription:', error);
          return;
        }

        setHasActiveSubscription(subscription?.subscription_status === 'active');
      } catch (error) {
        console.error('Error checking subscription status:', error);
      }
    };

    checkSubscription();
  }, [supabase, user?.id]);

  useEffect(() => {
    if (!supabase || !id || !user) return;

    const fetchStory = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        
        if (!data) {
          throw new Error('Story not found');
        }
        
        let chaptersArray = [];
        if (data.chapters) {
          if (data.chapters.chapters && Array.isArray(data.chapters.chapters)) {
            chaptersArray = data.chapters.chapters;
          } else if (Array.isArray(data.chapters)) {
            chaptersArray = data.chapters;
          }
        }
        
        const storyData = {
          ...data,
          chapters: chaptersArray
        };
        
        setStory(storyData);
        if (storyData.chapters.length > 0) {
          setSelectedChapter(storyData.chapters[0]);
        }
        
        // Get the world that belongs to this user for this story
        const { data: worldData, error: worldError } = await supabase
          .from('worlds')
          .select('id, name')
          .eq('story_id', id)
          .eq('user_id', user.id)  // This is the crucial fix - filter by user_id
          .limit(1)
          .single();
        
        if (worldError) {
          console.error('Error fetching world:', worldError);
          // Set world to null to indicate no world exists yet
          setWorld(null);
        } else if (worldData) {
          setWorld(worldData);
        } else {
          // No world found - this is normal for first-time story access
          setWorld(null);
        }
      } catch (error: any) {
        console.error('Error fetching story:', error.message);
        setError('Failed to load story');
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [supabase, id, user]);
  
  useEffect(() => {
    if (!supabase || !user || !story) return;
    
    const fetchChapterProgress = async () => {
      try {
        // If no world exists yet (first-time story access), set empty progress
        if (!world) {
          setChapterProgress({});
          setProgressLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('user_chapter_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('world_id', world.id);
          
        if (error) {
          console.error('Error fetching chapter progress:', error);
          // Don't return early - still need to set progressLoading to false
          setChapterProgress({});
          return;
        }
        
        const progressMap: Record<string, boolean> = {};
        if (data && data.length > 0) {
          data.forEach((progress: UserChapterProgress) => {
            progressMap[progress.chapter_id] = progress.is_completed;
          });
        }
        // If no data, progressMap stays empty {} which is correct for first-time access
        
        setChapterProgress(progressMap);
      } catch (error: any) {
        console.error('Error processing chapter progress:', error.message);
        // Set empty progress map for first-time access
        setChapterProgress({});
      } finally {
        setProgressLoading(false);
      }
    };
    
    fetchChapterProgress();
  }, [supabase, user, world, story]);

  // Force refresh progress when page becomes visible (e.g., when returning from a chapter)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && supabase && user && world && story) {
        // Small delay to ensure any pending updates are processed
        setTimeout(() => {
          const fetchChapterProgress = async () => {
            try {
              setProgressLoading(true);
              
              const { data, error } = await supabase
                .from('user_chapter_progress')
                .select('*')
                .eq('user_id', user.id)
                .eq('world_id', world.id);
                
              if (error) {
                console.error('Error refreshing chapter progress:', error);
                setChapterProgress({});
                return;
              }
              
              const progressMap: Record<string, boolean> = {};
              if (data && data.length > 0) {
                data.forEach((progress: UserChapterProgress) => {
                  progressMap[progress.chapter_id] = progress.is_completed;
                });
              }
              
              setChapterProgress(progressMap);
            } catch (error: any) {
              console.error('Error refreshing chapter progress:', error.message);
              setChapterProgress({});
            } finally {
              setProgressLoading(false);
            }
          };
          
          fetchChapterProgress();
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [supabase, user, world, story]);

  const handleStartChapter = () => {
    if (!selectedChapter) return;
    
    const chapterIndex = story!.chapters.findIndex(ch => ch.chapterName === selectedChapter.chapterName);
    router.push(`/story/${id}/chapter/${chapterIndex}`);
  };

  const handleResetStory = async () => {
    if (!user || !id) return;
    
    try {
      setResetLoading(true);
      
      const response = await fetch('/api/story-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId: id,
          userId: user.id
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset story');
      }
      
      setChapterProgress({});
      setWorld(null);
      setShowResetConfirm(false);
      
      alert(data.message || 'Story progress has been reset successfully!');
      
      setTimeout(() => {
        window.location.href = window.location.href;
      }, 2000);
      
    } catch (error: any) {
      console.error('Error resetting story:', error);
      
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Failed to reset story: ${errorMessage}`);
      
      setShowResetConfirm(false);
    } finally {
      setResetLoading(false);
    }
  };

  const isChapterCompleted = (chapterName: string) => {
    if (!story) return false;
    
    const chapterIndex = story.chapters.findIndex(ch => ch.chapterName === chapterName);
    if (chapterIndex === -1) return false;
    
    const rawChapterId = String(chapterIndex);
    return !!chapterProgress[rawChapterId];
  };

  const isChapterLocked = (index: number) => {
    // First chapter is always unlocked
    if (index === 0) return false;
    
    // Check if previous chapter is completed (sequential unlocking)
    const previousChapterId = String(index - 1);
    const isPrevChapterCompleted = !!chapterProgress[previousChapterId];
    
    // If previous chapter is not completed, this chapter is locked
    if (!isPrevChapterCompleted) {
      return true;
    }
    
    // If previous chapter is completed, check premium requirements
    // Premium chapters (index 4 and beyond) require subscription
    if (index >= 4 && !hasActiveSubscription) {
      return true;
    }
    
    // Chapter is unlocked if previous is completed and premium requirements are met
    return false;
  };

  if (userLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex justify-center items-center">
          <LoadingSpinner
            variant="spinner"
            size="xl"
            theme="pink"
            center={true}
          />
        </div>
      </Layout>
    );
  }

  if (!user) return <Auth />;
  if (error) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto mt-8 p-6 bg-red-900/20 border border-red-500/50 rounded-xl backdrop-blur-sm">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-red-500 text-2xl">!</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-red-200 mb-2">Error Loading Story</h3>
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!story) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto mt-8 p-8 bg-gray-900/50 border border-gray-800 rounded-xl backdrop-blur-sm text-center">
          <p className="text-xl text-gray-400">Story not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-black">
        {/* Mobile Hero */}
        <div className="md:hidden relative h-[300px] bg-gradient-to-b from-gray-900 to-black">
          {story.image && (
            <div className="absolute inset-0">
              <img 
                src={story.image} 
                alt={story.world_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black"></div>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              <h1 className="text-4xl font-bold text-white mb-2">{story.world_name}</h1>
              <p className="text-gray-300 text-sm line-clamp-2">
                {story.description}
              </p>
              <button
                onClick={() => setShowDescriptionModal(true)}
                className="text-purple-400 text-sm mt-2 hover:text-purple-300 transition-colors"
              >
                Read More
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Hero */}
        <div className="hidden md:block relative h-[400px]">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${story.image})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black"></div>
          </div>
          <div className="relative h-full flex items-center justify-center">
            <h1 className="text-7xl font-bold text-white">{story.world_name}</h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 -mt-10 md:-mt-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Mobile Chapter Selection */}
            <div className="lg:col-span-8 lg:order-2">
              <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-800/50 overflow-hidden">
                <div className="p-4 md:p-6">
                  {/* Chapter Preview - Mobile Optimized */}
                  {selectedChapter && (
                    <div className="mb-6 p-4 md:p-6 rounded-xl bg-gray-800/30 border border-gray-700/50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Current Chapter</h3>
                        <span className="text-sm text-gray-400">
                          {story.chapters.indexOf(selectedChapter) + 1} of {story.chapters.length}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-purple-300 text-sm font-medium">Objective</h4>
                          <p className="text-white text-sm">{selectedChapter.objective}</p>
                        </div>
                      </div>

                      <button
                        onClick={handleStartChapter}
                        disabled={isChapterLocked(story.chapters.indexOf(selectedChapter))}
                        className={`
                          w-full mt-4 py-3 px-4 rounded-xl font-medium text-sm transition-all
                          ${isChapterLocked(story.chapters.indexOf(selectedChapter))
                            ? 'bg-gray-800 text-gray-500'
                            : 'bg-[#EC444B] text-white active:scale-95'
                          }
                        `}
                      >
                        {(() => {
                          const selectedIndex = story.chapters.indexOf(selectedChapter);
                          if (!isChapterLocked(selectedIndex)) {
                            return isChapterCompleted(selectedChapter.chapterName) ? 'Play Again' : 'Start Chapter';
                          }
                          
                          // Chapter is locked - determine why
                          if (selectedIndex > 0) {
                            const previousChapterId = String(selectedIndex - 1);
                            const isPrevChapterCompleted = !!chapterProgress[previousChapterId];
                            
                            if (!isPrevChapterCompleted) {
                              return 'Complete Previous Chapter';
                            }
                            
                            // Previous chapter is completed, so this must be a premium lock
                            if (selectedIndex >= 4 && !hasActiveSubscription) {
                              return 'Upgrade to Premium ⭐';
                            }
                          }
                          
                          return 'Locked';
                        })()}
                      </button>
                    </div>
                  )}

                  {/* Chapter List - Mobile Optimized */}
                  {progressLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner
                        variant="spinner"
                        size="md"
                        theme="pink"
                        center={true}
                      />
                      <span className="ml-3 text-gray-400 text-sm">Loading chapter progress...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {story.chapters.map((chapter, index) => {
                        const isCompleted = isChapterCompleted(chapter.chapterName);
                        const isLocked = isChapterLocked(index);
                        const isPremiumChapter = index >= 4 && !hasActiveSubscription;
                        
                        // Determine the specific reason for locking
                        let lockReason = 'unlocked';
                        if (isLocked && index > 0) {
                          const previousChapterId = String(index - 1);
                          const isPrevChapterCompleted = !!chapterProgress[previousChapterId];
                          
                          if (!isPrevChapterCompleted) {
                            lockReason = 'progression'; // Previous chapter not completed
                          } else if (isPremiumChapter) {
                            lockReason = 'premium'; // Premium required
                          }
                        }
                        
                        // For display purposes, premium chapters should show premium styling even when unlocked
                        const displayAsPremium = isPremiumChapter && !isCompleted;
                        
                        const isSelected = selectedChapter?.chapterName === chapter.chapterName;
                        
                        return (
                          <div 
                            key={index}
                            onClick={() => !isLocked && setSelectedChapter(chapter)}
                            className={`
                              w-full text-left p-3 rounded-xl transition-all cursor-pointer
                              ${isLocked ? 'bg-gray-800/30 cursor-not-allowed' : 'active:scale-98 hover:bg-gray-800/50'}
                              ${isSelected ? 'bg-purple-900/20 border-l-4 border-purple-500' : 'border-l-4 border-transparent'}
                            `}
                          >
                            <div className="flex items-center">
                              <div className="mr-3">
                                {isCompleted ? (
                                  <div className="w-8 h-8 rounded-full bg-green-900/30 border border-green-500/50 flex items-center justify-center text-green-400 text-sm">
                                    ✓
                                  </div>
                                ) : displayAsPremium ? (
                                  <div className="w-8 h-8 rounded-full bg-amber-900/30 border border-amber-500/50 flex items-center justify-center text-amber-400 text-sm">
                                    ⭐
                                  </div>
                                ) : lockReason === 'progression' ? (
                                  <div className="w-8 h-8 rounded-full bg-gray-800/30 border border-gray-700/50 flex items-center justify-center text-gray-500 text-sm">
                                    🔒
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-purple-900/30 border border-purple-500/50 flex items-center justify-center text-purple-400 text-sm">
                                    {index + 1}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h3 className={`font-medium text-sm truncate ${isLocked ? 'text-gray-500' : 'text-white'}`}>
                                  {chapter.chapterName}
                                </h3>
                                {lockReason === 'progression' && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    Complete the chapter before to unlock
                                  </p>
                                )}
                              </div>
                              
                              <div className="ml-2">
                                {isCompleted ? (
                                  <span className="inline-block px-2 py-1 rounded-full text-xs bg-green-900/30 text-green-300 border border-green-700/50">
                                    Completed
                                  </span>
                                ) : displayAsPremium ? (
                                  <button 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log('Upgrade Premium button clicked!');
                                      console.log('Router:', router);
                                      try {
                                        router.push('/account?tab=subscription');
                                        console.log('Router.push called successfully');
                                      } catch (error) {
                                        console.error('Router.push failed:', error);
                                        // Fallback to window.location
                                        window.location.href = '/account?tab=subscription';
                                      }
                                    }}
                                    className="inline-block px-3 py-1.5 rounded-full text-xs bg-amber-900/40 text-amber-300 border border-amber-700/60 hover:bg-amber-900/60 hover:border-amber-600/80 hover:text-amber-200 transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
                                  >
                                    ⭐ Upgrade Premium
                                  </button>
                                ) : lockReason === 'progression' ? (
                                  <span className="inline-block px-2 py-1 rounded-full text-xs bg-gray-800/30 text-gray-500 border border-gray-700/50">
                                    Locked
                                  </span>
                                ) : (
                                  <span className="inline-block px-2 py-1 rounded-full text-xs bg-purple-900/30 text-purple-300 border border-purple-700/50">
                                    Not Completed
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Story Info - Hidden on Mobile */}
            <div className="hidden lg:block lg:col-span-4 lg:order-1">
              <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-800/50 overflow-hidden">
                {story.image && (
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={story.image} 
                      alt={story.world_name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                  </div>
                )}
                
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-3">{story.world_name}</h2>
                    <p className="text-gray-300 text-sm leading-relaxed">{story.description}</p>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-900/50 text-purple-200 border border-purple-700/50">
                      {story.chapters.length} chapters
                    </span>
                    {!hasActiveSubscription && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-900/50 text-amber-200 border border-amber-700/50">
                        4 Free Chapters
                      </span>
                    )}
                  </div>

                  {!hasActiveSubscription && (
                    <div className="mb-6 p-4 bg-amber-900/20 rounded-xl border border-amber-700/30">
                      <div className="flex items-center space-x-2 text-amber-300 mb-2">
                        <span>⭐</span>
                        <h3 className="font-medium">Premium Story</h3>
                      </div>
                      <p className="text-amber-200/80 text-sm mb-4">
                        Upgrade to Premium to unlock all chapters and enjoy unlimited access to this story.
                      </p>
                      <button
                        onClick={() => router.push('/account?tab=subscription')}
                        className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg px-4 py-2 text-sm transition-colors"
                      >
                        Upgrade to Premium
                      </button>
                    </div>
                  )}

                  {/* Reset Story Button */}
                  <div className="mt-6 pt-6 border-t border-gray-800">
                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="w-full bg-red-900/20 text-red-300 hover:bg-red-900/30 hover:text-red-200 py-2 px-4 rounded-xl transition-colors border border-red-900/50 hover:border-red-800"
                    >
                      Reset Progress
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description Modal for Mobile */}
        {showDescriptionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm md:hidden">
            <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-4">{story.world_name}</h2>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">{story.description}</p>
              <button
                onClick={() => setShowDescriptionModal(false)}
                className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800 shadow-2xl">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-900/30 border border-red-500/50 mx-auto mb-4">
                <span className="text-xl text-red-400">!</span>
              </div>
              
              <h2 className="text-xl font-bold text-white mb-3 text-center">Reset Story Progress?</h2>
              <p className="text-gray-300 mb-6 text-center text-sm">
                This will delete all your conversations and progress. This cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 rounded-xl border border-gray-700 text-gray-300 text-sm"
                  disabled={resetLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetStory}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm"
                  disabled={resetLoading}
                >
                  {resetLoading ? 'Resetting...' : 'Reset'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}