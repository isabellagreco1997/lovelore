"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Auth from '@/components/Auth';
import ConversationView from '@/components/ConversationView';
import useUser from '@/hooks/useUser';
import useSupabase from '@/hooks/useSupabase';
import { streamAIResponse, getStoryContextFromConversation } from '@/lib/deepseek';

export default function ChapterPage() {
  const { id, chapterId } = useParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const supabase = useSupabase();

  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasExistingMessages, setHasExistingMessages] = useState(false);
  const [storyData, setStoryData] = useState<any>(null);

  // Fetch story data first
  useEffect(() => {
    if (!supabase || !id) return;

    const fetchStoryData = async () => {
      try {
        // Get the story data
        const { data: worldData, error: worldError } = await supabase
          .from('worlds')
          .select('story_id')
          .eq('id', id)
          .single();

        if (worldError) throw worldError;

        const { data: storyData, error: storyError } = await supabase
          .from('stories')
          .select('*')
          .eq('id', worldData.story_id)
          .single();

        if (storyError) throw storyError;

        // Process chapters data
        let chaptersArray = [];
        if (storyData.chapters) {
          if (storyData.chapters.chapters && Array.isArray(storyData.chapters.chapters)) {
            chaptersArray = storyData.chapters.chapters;
          } else if (Array.isArray(storyData.chapters)) {
            chaptersArray = storyData.chapters;
          }
        }

        setStoryData({
          ...storyData,
          chapters: chaptersArray
        });
      } catch (error: any) {
        console.error('Error fetching story data:', error.message);
        setError('Failed to load story data');
      }
    };

    fetchStoryData();
  }, [supabase, id]);

  // Fetch or create conversation data
  useEffect(() => {
    if (!supabase || !id || !user || !chapterId || !storyData) return;

    const fetchConversation = async () => {
      try {
        setLoading(true);
        
        // Get the conversation by world ID and chapter ID
        let { data: existingConversation, error: fetchError } = await supabase
          .from('conversations')
          .select(`
            *,
            messages(
              *
            )
          `)
          .eq('world_id', id)
          .eq('chapter_id', chapterId)
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (fetchError) throw fetchError;
        
        // If no conversation exists, create a new one
        if (!existingConversation) {
          const { data: newConversation, error: createError } = await supabase
            .from('conversations')
            .insert([
              {
                user_id: user.id,
                world_id: id,
                chapter_id: chapterId,
                started_at: new Date().toISOString()
              }
            ])
            .select()
            .single();
            
          if (createError) throw createError;
          
          // Get the story context for the initial message
          const storyContext = await getStoryContextFromConversation(newConversation, storyData);
          
          // Generate initial message using DeepSeek
          const result = await streamAIResponse(
            "Begin the story",
            storyContext,
            () => {}, // Empty callback since we're not streaming this initial message
            []
          );

          // Save the initial message
          const { data: savedMessage, error: messageError } = await supabase
            .from('messages')
            .insert([
              {
                conversation_id: newConversation.id,
                role: 'assistant',
                content: result.content,
                timestamp: new Date().toISOString()
              }
            ])
            .select()
            .single();

          if (messageError) throw messageError;

          // Update the conversation with the initial message
          existingConversation = {
            ...newConversation,
            messages: [savedMessage]
          };
        }
        
        setConversation(existingConversation);
        // Check if there are any existing messages
        setHasExistingMessages(existingConversation.messages && existingConversation.messages.length > 0);
        // Set initial load to false once we have data
        setIsInitialLoad(false);
      } catch (error: any) {
        console.error('Error fetching conversation:', error.message);
        setError('Failed to load conversation');
        // Also set initial load to false on error
        setIsInitialLoad(false);
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [supabase, id, chapterId, user, storyData]);

  if (userLoading) {
    return <Layout><div className="h-screen flex items-center justify-center text-white">Loading...</div></Layout>;
  }

  if (!user) {
    return <Layout><Auth /></Layout>;
  }

  // Only show the initial loading screen if we're in the initial load state and have no existing messages
  if (isInitialLoad && !hasExistingMessages) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 border-t-4 border-b-4 border-purple-500 rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-16 h-16 border-t-4 border-b-4 border-purple-300 rounded-full animate-spin animation-delay-150"></div>
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-4 h-4 bg-purple-400 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <div className="mt-8 space-y-3">
            <h2 className="text-2xl font-bold text-white">Generating Your Story</h2>
            <p className="text-purple-300">Please wait while we craft your unique narrative experience...</p>
          </div>
          
          <div className="mt-4 flex justify-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce animation-delay-200"></div>
            <div className="w-3 h-3 bg-purple-300 rounded-full animate-bounce animation-delay-400"></div>
          </div>
        </div>
        
        <style jsx>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animation-delay-150 {
            animation-delay: 150ms;
          }
          .animation-delay-200 {
            animation-delay: 200ms;
          }
          .animation-delay-400 {
            animation-delay: 400ms;
          }
        `}</style>
      </div>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-4 mt-20">
          <div className="max-w-4xl mx-auto flex justify-center items-center h-[calc(100vh-200px)] pt-6 pb-6 px-4">
            <div className="flex flex-col items-center p-8 bg-indigo-900 rounded-lg shadow-lg border border-indigo-700">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-300 mb-4"></div>
              <p className="text-purple-200 text-lg">Loading conversation...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-4 mt-20">
          <div className="max-w-4xl mx-auto pt-6 pb-6 px-4">
            <div className="bg-indigo-900 border-l-4 border-red-500 text-white px-6 py-4 rounded-lg shadow-lg">
              <h3 className="text-lg font-medium text-red-300 mb-2 flex items-center">
                <span className="mr-2">✦</span> Error
              </h3>
              <p className="text-purple-100 mb-4">{error}</p>
              <div className="mt-4">
                <button 
                  onClick={() => router.back()}
                  className="bg-indigo-700 hover:bg-indigo-600 text-white py-2 px-4 rounded-md text-sm transition-colors border border-indigo-600"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4">
        {conversation ? (
          <div className="max-w-4xl mx-auto">
            <ConversationView 
              conversation={conversation} 
              initialMessage={conversation.messages?.sort((a: any, b: any) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              )[0]}
            />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto pt-6 pb-6 px-4">
            <div className="bg-indigo-900 text-center text-white py-8 rounded-lg shadow-lg border border-indigo-700">
              <p className="text-purple-200 mb-4">Conversation not found</p>
              <button 
                onClick={() => router.back()}
                className="bg-indigo-700 hover:bg-indigo-600 text-white py-2 px-4 rounded-md text-sm transition-colors border border-indigo-600"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}