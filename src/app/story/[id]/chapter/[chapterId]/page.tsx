"use client";

import { useState, useEffect } from 'react';
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
  const [worldId, setWorldId] = useState<string | null>(null);
  const [dataFetched, setDataFetched] = useState(false);
  const [generatingInitialMessage, setGeneratingInitialMessage] = useState(false);

  // Fetch story and world data once
  useEffect(() => {
    if (!supabase || !id || dataFetched) return;

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Get story data
        const { data: story, error: storyError } = await supabase
          .from('stories')
          .select('*')
          .eq('id', id)
          .single();

        if (storyError) throw storyError;
        if (!story) throw new Error('Story not found');

        // Process chapters
        const chaptersArray = Array.isArray(story.chapters) 
          ? story.chapters 
          : (story.chapters?.chapters || []);

        setStoryData({ ...story, chapters: chaptersArray });

        // Get world data
        const { data: world, error: worldError } = await supabase
          .from('worlds')
          .select('id')
          .eq('story_id', id)
          .single();

        if (worldError) throw worldError;
        if (!world) throw new Error('World not found');

        setWorldId(world.id);
        setDataFetched(true);
      } catch (error: any) {
        console.error('Error fetching initial data:', error.message);
        setError(error.message || 'Failed to load story data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [supabase, id]);

  // Handle conversation after initial data is loaded
  useEffect(() => {
    if (!supabase || !worldId || !user || !chapterId || !storyData || !dataFetched || conversation) return;

    const initializeConversation = async () => {
      try {
        setGeneratingInitialMessage(true);
        
        // Check for existing conversation
        const { data: existingConvo, error: fetchError } = await supabase
          .from('conversations')
          .select(`
            *,
            messages(*)
          `)
          .eq('world_id', worldId)
          .eq('chapter_id', chapterId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (existingConvo) {
          setConversation(existingConvo);
          setHasExistingMessages(existingConvo.messages?.length > 0);
          setIsInitialLoad(false);
          return;
        }

        // Create new conversation
        const { data: newConvo, error: createError } = await supabase
          .from('conversations')
          .insert([{
            user_id: user.id,
            world_id: worldId,
            chapter_id: chapterId,
            started_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (createError) throw createError;

        // Get the chapter context
        const currentChapter = storyData.chapters[parseInt(chapterId)];
        if (!currentChapter) throw new Error('Chapter not found');

        // Generate initial message
        const storyContext = {
          storyName: storyData.world_name,
          chapterName: currentChapter.chapterName,
          chapterContext: currentChapter.chapterContext,
          chapterObjective: currentChapter.objective
        };

        const result = await streamAIResponse(
          "Begin the story",
          storyContext,
          () => {}, // Empty callback since we're not streaming this initial message
          []
        );

        // Save initial message
        const { data: message, error: messageError } = await supabase
          .from('messages')
          .insert([{
            conversation_id: newConvo.id,
            role: 'assistant',
            content: result.content,
            timestamp: new Date().toISOString()
          }])
          .select()
          .single();

        if (messageError) throw messageError;

        // Set final state
        setConversation({
          ...newConvo,
          messages: [message]
        });
        setHasExistingMessages(true);
        setIsInitialLoad(false);
      } catch (error: any) {
        console.error('Error initializing conversation:', error.message);
        setError('Failed to initialize conversation');
        setIsInitialLoad(false);
      } finally {
        setGeneratingInitialMessage(false);
      }
    };

    initializeConversation();
  }, [supabase, worldId, user, chapterId, storyData, dataFetched, conversation]);

  if (userLoading) {
    return <Layout><div className="h-screen flex items-center justify-center text-white">Loading...</div></Layout>;
  }

  if (!user) {
    return <Layout><Auth /></Layout>;
  }

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
            <h2 className="text-2xl font-bold text-white">
              {generatingInitialMessage ? 'Generating Your Story' : 'Loading Your Story'}
            </h2>
            <p className="text-purple-300">
              {generatingInitialMessage 
                ? 'Please wait while we craft your unique narrative experience...'
                : 'Loading story data...'}
            </p>
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