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

  useEffect(() => {
    if (!supabase || !id) return;

    const fetchStory = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        console.log('Raw story data:', data);
        
        // Handle nested chapters structure
        let chaptersArray = [];
        if (data.chapters) {
          console.log('Chapters data structure:', data.chapters);
          if (data.chapters.chapters && Array.isArray(data.chapters.chapters)) {
            chaptersArray = data.chapters.chapters;
            console.log('Using nested chapters array:', chaptersArray);
          } else if (Array.isArray(data.chapters)) {
            chaptersArray = data.chapters;
            console.log('Using direct chapters array:', chaptersArray);
          }
        }
        
        const storyData = {
          ...data,
          chapters: chaptersArray
        };
        
        console.log('Processed story data:', storyData);
        
        setStory(storyData);
        // Set the first chapter as selected by default if available
        if (storyData.chapters.length > 0) {
          setSelectedChapter(storyData.chapters[0]);
        }
        
        // Fetch the corresponding world for this story
        const { data: worldData, error: worldError } = await supabase
          .from('worlds')
          .select('id')
          .eq('story_id', id)
          .single();
        
        if (worldError) {
          console.error('Error fetching world:', worldError);
        } else {
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
  
  // Fetch chapter progress when user, world, and story are available
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
        
        // Convert to a record for easy lookup
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
    
    // Navigate to the chapter chat page
    const chapterIndex = story!.chapters.findIndex(ch => ch.chapterName === selectedChapter.chapterName);
    console.log('Starting chapter:', selectedChapter);
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
      
      // Reset the chapter progress in local state
      setChapterProgress({});
      setShowResetConfirm(false);
      
      // Show success message
      alert('Story progress has been reset successfully!');
      
    } catch (error: any) {
      console.error('Error resetting story:', error);
      alert(`Failed to reset story: ${error.message}`);
    } finally {
      setResetLoading(false);
    }
  };

  // Check if a chapter is completed
  const isChapterCompleted = (chapterName: string) => {
    if (!story) return false;
    
    // Find the index for this chapter name
    const chapterIndex = story.chapters.findIndex(ch => ch.chapterName === chapterName);
    if (chapterIndex === -1) return false;
    
    // Check if this index is marked as completed
    return !!chapterProgress[chapterIndex.toString()];
  };

  if (userLoading || loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </Layout>
    );
  }

  if (!story) {
    return (
      <Layout>
        <div className="text-center text-gray-500 py-8">
          Story not found.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header Banner */}
      {story && story.image && (
        <div className="w-full h-64 md:h-80 relative -mt-4 mb-8">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-60"></div>
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${story.image})` }}
          ></div>
          <div className="absolute bottom-0 left-0 w-full p-6 text-white">
            <h1 className="text-3xl md:text-4xl font-bold drop-shadow-lg">{story.world_name}</h1>
            <p className="text-lg md:text-xl max-w-2xl drop-shadow-md mt-2">{story.description?.substring(0, 100)}{story.description?.length > 100 ? '...' : ''}</p>
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="mx-4 md:mx-6 mb-4">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a href="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-[#EB444B]">
                <svg className="w-3 h-3 mr-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                  <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
                </svg>
                Home
              </a>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                </svg>
                <span className="ml-1 text-sm font-medium text-[#EB444B] md:ml-2">{story?.world_name || 'Story Details'}</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 my-8 mx-4">
        
        {/* Story info */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md">
            {story && story.image && (
              <img 
                src={story.image} 
                alt={story?.world_name || 'Story image'} 
                className="w-full h-64 object-cover mb-6 rounded-md"
              />
            )}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{story?.world_name}</h1>
            <p className="text-gray-700 mb-4">{story?.description}</p>
            <div className="flex items-center justify-between">
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                {story?.chapters.length} chapters
              </span>
              <span className="text-gray-500 text-sm">
                Created: {story && new Date(story.created_at).toLocaleDateString()}
              </span>
            </div>
            
            {/* Reset Story Button */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full bg-red-100 text-red-700 hover:bg-red-200 py-2 px-4 rounded-md transition-colors"
              >
                Reset Story Progress
              </button>
              <p className="mt-2 text-xs text-gray-500">
                This will delete all your conversations and progress for this story, allowing you to start fresh.
              </p>
            </div>
          </div>
        </div>
        
        {/* Chapters */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Chapters</h2>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Select a chapter:
              </label>
              <select 
                className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
                value={selectedChapter?.chapterName || ''}
                onChange={(e) => {
                  const chapter = story?.chapters.find(ch => ch.chapterName === e.target.value);
                  setSelectedChapter(chapter || null);
                }}
              >
                {story?.chapters && story.chapters.length > 0 ? (
                  story.chapters.map((chapter, index) => (
                    <option key={index} value={chapter.chapterName}>
                      {chapter.chapterName} 
                      {isChapterCompleted(chapter.chapterName) ? ' (Completed)' : ''}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No chapters available</option>
                )}
              </select>
            </div>
            
            {/* Chapter list with completion status */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Chapter Progress</h3>
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                {story?.chapters?.map((chapter, index) => (
                  <div 
                    key={index}
                    onClick={() => setSelectedChapter(chapter)}
                    className={`
                      border-b last:border-b-0 border-[#EB444B] 
                      cursor-pointer transition-colors duration-150
                      ${selectedChapter?.chapterName === chapter.chapterName 
                        ? 'bg-purple-50 border-l-4 border-l-[#EB444B]-500' 
                        : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                      }
                    `}
                  >
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="mr-3">
                          {isChapterCompleted(chapter.chapterName) ? (
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                              <span className="text-sm font-medium">{index + 1}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{chapter.chapterName}</h4>
                          {chapter.objective && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-1">{chapter.objective}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        {isChapterCompleted(chapter.chapterName) ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {selectedChapter && (
              <div className="p-4 rounded-md mb-6">
                <h3 className="font-bold text-gray-700 mb-2">{selectedChapter.chapterName}</h3>
                <p className="text-gray-700 mb-2">
                  <span className="font-bold">Objective:</span> {selectedChapter.objective}
                </p>
                <p className="text-gray-700 italic">
                  "{selectedChapter.chapterContext.substring(0, 150)}..."
                </p>
                {isChapterCompleted(selectedChapter.chapterName) && (
                  <div className="mt-2 text-green-700 font-medium">
                    ✓ You've completed this chapter!
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={handleStartChapter}
              disabled={!selectedChapter}
              className="w-full bg-transparent border border-[#EC444B] text-black py-3 px-4 rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {selectedChapter && isChapterCompleted(selectedChapter.chapterName) 
                ? 'Play Chapter Again' 
                : 'Start Chapter'}
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reset Story Progress</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to reset your progress for this story? This will delete all your conversations and chapter progress. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={resetLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleResetStory}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
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