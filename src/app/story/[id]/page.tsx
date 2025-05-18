"use client";

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
      <div className="min-h-screen bg-black">
        {/* Mobile-optimized header */}
        <div className="px-4 py-6 md:hidden">
          <h1 className="text-2xl font-bold text-white mb-2">{story.world_name}</h1>
          <p className="text-sm text-gray-300">{story.description}</p>
        </div>

        {/* Story content */}
        <div className="px-4 md:px-8">
          {/* Chapter list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Chapters</h2>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Reset Progress
              </button>
            </div>

            {/* Chapter Preview - if selected */}
            {selectedChapter && (
              <div className="bg-gray-900/50 rounded-xl p-4 mb-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {selectedChapter.chapterName}
                </h3>
                <p className="text-sm text-gray-300 mb-4">{selectedChapter.objective}</p>
                <button
                  onClick={handleStartChapter}
                  disabled={isChapterLocked(story.chapters.indexOf(selectedChapter))}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
                    isChapterLocked(story.chapters.indexOf(selectedChapter))
                      ? 'bg-gray-800 text-gray-500'
                      : 'bg-[#EC444B] text-white'
                  }`}
                >
                  {isChapterLocked(story.chapters.indexOf(selectedChapter))
                    ? 'Complete Previous Chapter'
                    : 'Start Chapter'}
                </button>
              </div>
            )}

            {/* Chapter list */}
            <div className="space-y-2">
              {story.chapters.map((chapter, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedChapter(chapter)}
                  disabled={isChapterLocked(index)}
                  className={`w-full text-left p-4 rounded-xl transition-colors ${
                    selectedChapter?.chapterName === chapter.chapterName
                      ? 'bg-[#EC444B]/10 border border-[#EC444B]/50'
                      : isChapterLocked(index)
                      ? 'bg-gray-900/50 border border-gray-800 opacity-50'
                      : 'bg-gray-900/50 border border-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white mb-1">{chapter.chapterName}</h3>
                      <p className="text-sm text-gray-400 line-clamp-1">{chapter.objective}</p>
                    </div>
                    <div className="flex items-center">
                      {isChapterCompleted(chapter.chapterName) ? (
                        <span className="text-green-400">✓</span>
                      ) : isChapterLocked(index) ? (
                        <span className="text-gray-500">🔒</span>
                      ) : (
                        <span className="text-[#EC444B]">→</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">Reset Progress?</h2>
              <p className="text-gray-300 mb-6">
                This will delete all your progress and conversations for this story. This cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                  disabled={resetLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetStory}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  disabled={resetLoading}
                >
                  {resetLoading ? 'Resetting...' : 'Reset Story'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}