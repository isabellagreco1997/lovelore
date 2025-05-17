"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

  useEffect(() => {
    if (!supabase || !id || dataFetched) return;

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        const { data: story, error: storyError } = await supabase
          .from('stories')
          .select('*')
          .eq('id', id)
          .single();

        if (storyError) throw storyError;
        if (!story) throw new Error('Story not found');

        const chaptersArray = Array.isArray(story.chapters) 
          ? story.chapters 
          : (story.chapters?.chapters || []);

        setStoryData({ ...story, chapters: chaptersArray });

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

  useEffect(() => {
    if (!supabase || !worldId || !user || !chapterId || !storyData || !dataFetched || conversation) return;

    const initializeConversation = async () => {
      try {
        setGeneratingInitialMessage(true);
        
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

        const currentChapter = storyData.chapters[parseInt(chapterId)];
        if (!currentChapter) throw new Error('Chapter not found');

        const storyContext = {
          storyName: storyData.world_name,
          chapterName: currentChapter.chapterName,
          chapterContext: currentChapter.chapterContext,
          chapterObjective: currentChapter.objective
        };

        const result = await streamAIResponse(
          "Begin the story",
          storyContext,
          () => {},
          []
        );

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
    return <div className="h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
    return <Auth />;
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
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-300"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-6 max-w-md">
          <h3 className="text-red-400 font-medium mb-2">Error</h3>
          <p className="text-red-300">{error}</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/30 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      {conversation ? (
        <ConversationView 
          conversation={conversation} 
          initialMessage={conversation.messages?.sort((a: any, b: any) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )[0]}
        />
      ) : (
        <div className="h-screen flex items-center justify-center">
          <div className="text-center text-gray-400">Conversation not found</div>
        </div>
      )}
    </div>
  );
}