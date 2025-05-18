'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Auth from '@/components/Auth';
import useUser from '@/hooks/useUser';
import useSupabase from '@/hooks/useSupabase';
import { Story, Chapter, UserChapterProgress } from '@/types/database';

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
  const [expandedDescription, setExpandedDescription] = useState(false);

  useEffect(() => {
    if (!supabase || !id) return;

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
        
        const { data: worldData, error: worldError } = await supabase
          .from('worlds')
          .select('id')
          .eq('story_id', id)
          .maybeSingle();
        
        if (worldError) {
          console.error('Error fetching world:', worldError);
        } else if (worldData) {
          setWorld(worldData);
        }
      } catch (error: any) {
        console.error('Error fetching story:', error.message);
        setError('Failed to load story');
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [supabase, id]);
  
  useEffect(() => {
    if (!supabase || !user || !world || !story) return;
    
    const fetchChapterProgress = async () => {
      try {
        const { data, error } = await supabase
          .from('user_chapter_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('world_id', world.id);
          
        if (error) {
          console.error('Error fetching chapter progress:', error);
          return;
        }
        
        const progressMap: Record<string, boolean> = {};
        data.forEach((progress: UserChapterProgress) => {
          progressMap[progress.chapter_id] = progress.is_completed;
        });
        
        setChapterProgress(progressMap);
      } catch (error: any) {
        console.error('Error processing chapter progress:', error.message);
      }
    };
    
    fetchChapterProgress();
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
      setShowResetConfirm(false);
      
      alert('Story progress has been reset successfully!');
      
    } catch (error: any) {
      console.error('Error resetting story:', error);
      alert(`Failed to reset story: ${error.message}`);
    } finally {
      setResetLoading(false);
    }
  };

  const isChapterCompleted = (chapterName: string) => {
    if (!story) return false;
    
    const chapterIndex = story.chapters.findIndex(ch => ch.chapterName === chapterName);
    if (chapterIndex === -1) return false;
    
    return !!chapterProgress[chapterIndex.toString()];
  };

  const isChapterLocked = (index: number) => {
    if (index === 0) return false;
    return !isChapterCompleted(story!.chapters[index - 1].chapterName);
  };

  if (userLoading || loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[80vh]">
          <div className="relative">
            <div className="h-24 w-24 rounded-full border-t-4 border-b-4 border-purple-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-12 w-12 rounded-full border-t-4 border-b-4 border-purple-300 animate-spin"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Auth />;
  }

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
      <div className="relative min-h-screen">
        {/* Hero Section - Responsive Design */}
        <div className="relative h-[300px] md:h-[50vh] overflow-hidden -mt-8">
          {/* Background Image - Hidden on mobile */}
          <div 
            className="absolute inset-0 bg-cover bg-center transform scale-110 transition-transform duration-1000 hidden md:block"
            style={{ 
              backgroundImage: `url(${story.image})`,
              transform: 'translateZ(0)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black"></div>
          </div>

          {/* Mobile-optimized content */}
          <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8 bg-gradient-to-b from-gray-900 to-black md:bg-none">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                {story.world_name}
              </h1>
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed drop-shadow-md px-4 md:px-0">
                {story.description?.substring(0, 120)}{story.description?.length > 120 ? '...' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 -mt-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Story Info Card */}
              <div className="lg:col-span-1">
                <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-800/50 overflow-hidden transition-all duration-300 hover:border-gray-700/50">
                  {story.image && (
                    <div className="relative h-64 overflow-hidden">
                      <img 
                        src={story.image} 
                        alt={story.world_name} 
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                    </div>
                  )}
                  
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-white mb-4">{story.world_name}</h2>
                    
                    <div className={`prose prose-invert max-w-none ${!expandedDescription && 'line-clamp-3'}`}>
                      <p className="text-gray-300">{story.description}</p>
                    </div>
                    
                    {story.description && story.description.length > 150 && (
                      <button
                        onClick={() => setExpandedDescription(!expandedDescription)}
                        className="mt-2 text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        {expandedDescription ? 'Show less' : 'Read more'}
                      </button>
                    )}
                    
                    <div className="mt-6 flex items-center justify-between text-sm">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-900/50 text-purple-200 border border-purple-700/50">
                        {story.chapters.length} chapters
                      </span>
                      <span className="text-gray-400">
                        Created {new Date(story.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {/* Reset Story Button */}
                    <div className="mt-6 pt-6 border-t border-gray-800">
                      <button
                        onClick={() => setShowResetConfirm(true)}
                        className="w-full bg-red-900/20 text-red-300 hover:bg-red-900/30 hover:text-red-200 py-2 px-4 rounded-xl transition-colors border border-red-900/50 hover:border-red-800"
                      >
                        Reset Story Progress
                      </button>
                      <p className="mt-2 text-xs text-gray-500">
                        This will delete all your conversations and progress for this story.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Chapters Section */}
              <div className="lg:col-span-2">
                <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-800/50 overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <span className="w-8 h-8 rounded-full bg-purple-900/50 flex items-center justify-center mr-3 text-purple-300">
                        📖
                      </span>
                      Chapters
                    </h2>

                    {/* Selected Chapter Preview - Moved to top */}
                    {selectedChapter && (
                      <>
                        <div className="mb-8 p-6 rounded-xl bg-gray-800/30 border border-gray-700/50">
                          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                            <span className="w-8 h-8 rounded-full bg-purple-900/50 flex items-center justify-center mr-3 text-purple-300">
                              📝
                            </span>
                            Chapter Preview
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-purple-300 text-sm font-medium mb-1">Objective</h4>
                              <p className="text-white">{selectedChapter.objective}</p>
                            </div>
                            <div>
                              <h4 className="text-purple-300 text-sm font-medium mb-1">Context</h4>
                              <p className="text-gray-300 italic">
                                "{selectedChapter.chapterContext.substring(0, 150)}..."
                              </p>
                            </div>
                            {isChapterCompleted(selectedChapter.chapterName) && (
                              <div className="text-green-400 flex items-center">
                                <span className="mr-2">✓</span>
                                You've completed this chapter!
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Start Chapter Button - Moved below preview */}
                        <div className="mb-8">
                          <button
                            onClick={handleStartChapter}
                            disabled={!selectedChapter || isChapterLocked(story.chapters.indexOf(selectedChapter))}
                            className={`
                              w-full py-3 px-6 rounded-xl font-medium text-base transition-all duration-300
                              ${!selectedChapter || isChapterLocked(story.chapters.indexOf(selectedChapter))
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'bg-transparent border border-[#EC444B] text-white hover:bg-[#EC444B]/10'
                              }
                            `}
                          >
                            {!selectedChapter
                              ? 'Select a Chapter'
                              : isChapterLocked(story.chapters.indexOf(selectedChapter))
                                ? 'Complete Previous Chapter to Unlock'
                                : isChapterCompleted(selectedChapter.chapterName)
                                  ? 'Play Chapter Again'
                                  : 'Start Chapter'}
                          </button>
                        </div>
                      </>
                    )}
                    
                    {/* Chapter Progress Timeline */}
                    <div className="space-y-4">
                      {story.chapters.map((chapter, index) => {
                        const isCompleted = isChapterCompleted(chapter.chapterName);
                        const isLocked = isChapterLocked(index);
                        const isSelected = selectedChapter?.chapterName === chapter.chapterName;
                        
                        return (
                          <div 
                            key={index}
                            onClick={() => !isLocked && setSelectedChapter(chapter)}
                            className={`
                              relative rounded-xl p-4 transition-all duration-300 cursor-pointer
                              ${isLocked ? 'bg-gray-800/30 cursor-not-allowed' : 'hover:bg-gray-800/50'}
                              ${isSelected ? 'bg-purple-900/20 border-l-4 border-purple-500' : 'border-l-4 border-transparent'}
                            `}
                          >
                            <div className="flex items-center">
                              <div className="mr-4">
                                {isCompleted ? (
                                  <div className="w-10 h-10 rounded-full bg-green-900/30 border border-green-500/50 flex items-center justify-center text-green-400">
                                    ✓
                                  </div>
                                ) : isLocked ? (
                                  <div className="w-10 h-10 rounded-full bg-gray-800/30 border border-gray-700/50 flex items-center justify-center text-gray-500">
                                    🔒
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-purple-900/30 border border-purple-500/50 flex items-center justify-center text-purple-400">
                                    {index + 1}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <h3 className={`font-medium mb-1 ${isLocked ? 'text-gray-500' : 'text-white'}`}>
                                  {chapter.chapterName}
                                </h3>
                                <p className={`text-sm line-clamp-2 ${isLocked ? 'text-gray-600' : 'text-gray-400'}`}>
                                  {chapter.objective}
                                </p>
                              </div>
                              
                              <div className="ml-4">
                                {isCompleted ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-300 border border-green-700/50">
                                    Completed
                                  </span>
                                ) : isLocked ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-800/30 text-gray-500 border border-gray-700/50">
                                    Locked
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-900/30 text-purple-300 border border-purple-700/50">
                                    Available
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full m-4 border border-gray-800 shadow-2xl">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-900/30 border border-red-500/50 mx-auto mb-6">
              <span className="text-2xl text-red-400">!</span>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Reset Story Progress</h2>
            <p className="text-gray-300 mb-6 text-center">
              Are you sure you want to reset your progress? This will delete all your conversations
              and chapter progress. This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-6 py-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
                disabled={resetLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleResetStory}
                className="px-6 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors relative overflow-hidden"
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <span className="flex items-center">
                    <span className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></span>
                    Resetting...
                  </span>
                ) : (
                  'Reset Story'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}