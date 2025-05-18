"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Auth from '@/components/Auth';
import ConversationView from '@/components/ConversationView';
import useUser from '@/hooks/useUser';
import useSupabase from '@/hooks/useSupabase';

export default function ConversationPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const supabase = useSupabase();

  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storyData, setStoryData] = useState<any>(null);
  const [chapterIndex, setChapterIndex] = useState<number | null>(null);
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);

  // Fetch conversation data
  useEffect(() => {
    if (!supabase || !id || !user) return;

    const fetchConversation = async () => {
      try {
        setLoading(true);
        
        // Get the conversation by ID
        const { data, error } = await supabase
          .from('conversations')
          .select(`
            *,
            messages(
              *
            )
          `)
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        // Verify this conversation belongs to the current user
        if (data.user_id !== user.id) {
          throw new Error('You do not have permission to view this conversation');
        }
        
        setConversation(data);

        // Fetch story data to get chapter information
        const { data: worldData, error: worldError } = await supabase
          .from('worlds')
          .select('story_id')
          .eq('id', data.world_id)
          .single();
          
        if (worldError) throw worldError;
        
        const { data: storyData, error: storyError } = await supabase
          .from('stories')
          .select('*')
          .eq('id', worldData.story_id)
          .single();
          
        if (storyError) throw storyError;
        
        let chaptersArray = [];
        if (storyData.chapters) {
          if (storyData.chapters.chapters && Array.isArray(storyData.chapters.chapters)) {
            chaptersArray = storyData.chapters.chapters;
          } else if (Array.isArray(storyData.chapters)) {
            chaptersArray = storyData.chapters;
          }
        }
        
        const processedStoryData = {
          ...storyData,
          chapters: chaptersArray
        };
        
        setStoryData(processedStoryData);
        
        // Find the chapter index - chapter_id is actually the chapter index as a string
        const chapterIndexFromId = parseInt(data.chapter_id);
        setChapterIndex(
          !isNaN(chapterIndexFromId) && chapterIndexFromId >= 0 && chapterIndexFromId < processedStoryData.chapters.length 
            ? chapterIndexFromId 
            : -1
        );
      } catch (error: any) {
        console.error('Error fetching conversation:', error.message);
        setError('Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [supabase, id, user]);

  if (userLoading) {
    return <Layout><div className="h-screen flex items-center justify-center text-white">Loading...</div></Layout>;
  }

  if (!user) {
    return <Layout><Auth /></Layout>;
  }

  return (
    <Layout>
      <div className="h-screen flex flex-col bg-gray-950">
        <div className="border-b border-gray-800 p-4 bg-gray-900 text-white">
          <button 
            onClick={() => router.back()}
            className="mr-4 px-3 py-1 bg-gray-800 rounded-lg hover:bg-gray-700 text-white"
          >
            ← Back
          </button>
          <div className="inline-block">
            <span className="font-semibold block">
              {loading ? 'Loading...' : (
                chapterIndex !== null && chapterIndex >= 0 && storyData?.chapters ? 
                `Chapter ${chapterIndex + 1}: ${storyData.chapters[chapterIndex].chapterName}` : 
                conversation?.chapter_id || 'Conversation'
              )}
            </span>
          </div>
        </div>

        {/* Chapter Objective Section */}
        {!loading && chapterIndex !== null && chapterIndex >= 0 && storyData?.chapters && storyData.chapters[chapterIndex].objective && (
          <div className="border-b border-gray-700/50 bg-gray-900/50 p-3">
            <div className="max-w-4xl mx-auto">
              <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-blue-800/40 flex items-center justify-center text-blue-300 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-blue-400 font-medium uppercase tracking-wider mb-1">Chapter Objective</div>
                    <div className="text-blue-100 font-light">{storyData.chapters[chapterIndex].objective}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowObjectiveModal(true)}
                  className="ml-4 w-5 h-5 rounded-full bg-blue-800/30 text-blue-300 flex items-center justify-center hover:bg-blue-700/40 transition-all flex-shrink-0"
                  aria-label="More information about objectives"
                >
                  ?
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center bg-gray-950 text-white">
            <div className="text-xl">Loading conversation...</div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center bg-gray-950">
            <div className="text-xl text-red-500">{error}</div>
          </div>
        ) : conversation ? (
          <div className="flex-1">
            <ConversationView 
              conversation={conversation} 
              initialMessage={undefined}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-950 text-white">
            <div className="text-xl">Conversation not found</div>
          </div>
        )}
      </div>

      {/* Objective Modal */}
      {showObjectiveModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 max-w-md rounded-xl border border-blue-800/30 shadow-lg p-6 m-4">
            <h3 className="text-xl text-blue-300 mb-3 font-semibold">Chapter Objectives</h3>
            <p className="text-gray-300 mb-4">
              The story for this chapter will continue until you achieve the objective. When completed, the next chapter will be unlocked.
            </p>
            <p className="text-gray-300 mb-4">
              If you prefer to keep playing in this chapter, you can do so. When you eventually start the next chapter, it will take into account what happened in previous chapters.
            </p>
            <div className="flex justify-end">
              <button 
                onClick={() => setShowObjectiveModal(false)}
                className="px-4 py-2 bg-blue-900/40 hover:bg-blue-800/50 text-blue-300 rounded-lg transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
} 