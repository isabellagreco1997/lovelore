"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Auth from '@/components/Auth';
import ConversationView from '@/components/ConversationView';
import useUser from '@/hooks/useUser';
import useSupabase from '@/hooks/useSupabase';
import { streamAIResponse, getStoryContextFromConversation, getPreviousChapterMessages, formatPreviousChapterSummary } from '@/lib/deepseek';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ChapterPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const chapterId = Array.isArray(params.chapterId) ? params.chapterId[0] : params.chapterId;
  
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
  const [worldCreationInProgress, setWorldCreationInProgress] = useState(false);
  const [processingStep, setProcessingStep] = useState<'loading' | 'creating-world' | 'initializing' | 'generating'>('loading');
  const isCreatingWorldRef = useRef(false);

  useEffect(() => {
    if (!supabase || !id || dataFetched || userLoading) return;
    
    // Don't proceed if user isn't authenticated
    if (!user) {
      console.log('User not authenticated, waiting for authentication...');
      return;
    }

    const fetchInitialData = async () => {
      try {
        console.log('User authenticated, fetching initial data...');
        setLoading(true);
        setProcessingStep('loading');
        
        // Ensure ID is a string
        const storyId = Array.isArray(id) ? id[0] : id;
        
        const { data: story, error: storyError } = await supabase
          .from('stories')
          .select('*')
          .eq('id', storyId)
          .single();

        if (storyError) throw storyError;
        if (!story) throw new Error('Story not found');

        const chaptersArray = Array.isArray(story.chapters) 
          ? story.chapters 
          : (story.chapters?.chapters || []);

        setStoryData({ ...story, chapters: chaptersArray });

        // World processing step
        console.log('Fetching world for story ID:', storyId);
        setProcessingStep('creating-world');
        
        try {
          // Use direct fetch instead of Supabase client to ensure proper headers
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          
          if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase environment variables');
          }
          
          // First, check if a world already exists for this user AND story
          console.log(`Checking for existing world for story ${storyId} and user ${user.id}`);
          
          const { data: existingWorlds, error: worldError } = await supabase
            .from('worlds')
            .select('id')
            .eq('story_id', storyId)
            .eq('user_id', user.id);
            
          if (worldError) {
            console.error('Error checking for existing worlds:', worldError);
            throw worldError;
          }
          
          // If world already exists for this user and story, use it
          if (existingWorlds && existingWorlds.length > 0) {
            console.log('Found existing world for this user and story:', existingWorlds[0]);
            setWorldId(existingWorlds[0].id);
          } else {
            // If no world exists, create a new one
            console.log('No world found for this user and story, creating a new world...');
            
            // Use ref to prevent duplicate world creation
            if (isCreatingWorldRef.current) {
              console.log('World creation already in progress, waiting...');
              // Wait for existing creation to finish
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              // Check again if world was created while waiting
              const { data: recheckWorlds } = await supabase
                .from('worlds')
                .select('id')
                .eq('story_id', storyId)
                .eq('user_id', user.id);
                
              if (recheckWorlds && recheckWorlds.length > 0) {
                console.log('World was created in another process:', recheckWorlds[0]);
                setWorldId(recheckWorlds[0].id);
                return;
              }
            }
            
            // Set flag to prevent parallel world creation
            isCreatingWorldRef.current = true;
            
            try {
              // Create a new world for this story
              const newWorld = {
                user_id: user.id,
                story_id: storyId,
                name: story.world_name || 'New World',
                description: story.description || '',
                is_prebuilt: false,
                created_at: new Date().toISOString()
              };
              
              const { data: createdWorld, error: createError } = await supabase
                .from('worlds')
                .insert([newWorld])
                .select()
                .single();
                
              if (createError) {
                console.error('Error creating world:', createError);
                throw createError;
              }
              
              console.log('Successfully created new world:', createdWorld);
              
              // Wait for 2 seconds to ensure the world creation is properly registered in the database
              console.log('Waiting for world creation to be fully processed...');
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              setWorldId(createdWorld.id);
            } finally {
              // Reset flag regardless of success or failure
              isCreatingWorldRef.current = false;
            }
          }
          
          // Wait a moment before proceeding to next step
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (worldError: any) {
          console.error('World error:', worldError);
          throw worldError;
        }
        
        // Now we have a worldId, proceed to immediate initialization
        console.log('World ready, proceeding to conversation initialization...');
        setDataFetched(true);
        
      } catch (error: any) {
        console.error('Error fetching initial data:', error.message);
        setError(error.message || 'Failed to load story data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [supabase, id, user, userLoading]);

  useEffect(() => {
    if (!supabase || !worldId || !user || !chapterId || !storyData || !dataFetched || conversation) return;

    const initializeConversation = async () => {
      try {
        setProcessingStep('initializing');
        setGeneratingInitialMessage(true);
        
        // Debug what we're querying with
        console.log('Querying conversations with:', {
          world_id: worldId,
          chapter_id: chapterId,
          user_id: user.id
        });
        
        // First, check for existing conversation - Use orderBy and limit instead of maybeSingle
        const { data: existingConvos, error: fetchError } = await supabase
          .from('conversations')
          .select(`
            *,
            messages(*)
          `)
          .eq('world_id', worldId)
          .eq('chapter_id', chapterId)
          .eq('user_id', user.id)
          .order('started_at', { ascending: false })
          .limit(1);

        if (fetchError) throw fetchError;

        // Use the most recent conversation if any exist
        if (existingConvos && existingConvos.length > 0) {
          const existingConvo = existingConvos[0];
          console.log('Found existing conversation:', existingConvo.id);
          setConversation(existingConvo);
          setHasExistingMessages(existingConvo.messages?.length > 0);
          setIsInitialLoad(false);
          return;
        }

        console.log('No existing conversation found, creating new one');
        
        // Create a new conversation
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

        if (createError) {
          console.error('Error creating conversation:', createError);
          throw createError;
        }
        
        console.log('Created new conversation:', newConvo.id);

        const chapterIdValue = Array.isArray(chapterId) ? chapterId[0] : chapterId;
        const currentChapter = storyData.chapters[parseInt(chapterIdValue)];
        if (!currentChapter) throw new Error('Chapter not found');

        // Generate the initial message
        setProcessingStep('generating');
        
        const storyContext = {
          storyName: storyData.world_name,
          chapterName: currentChapter.chapterName,
          chapterContext: currentChapter.chapterContext,
          chapterObjective: currentChapter.objective
        };

        console.log('About to call DeepSeek API with context:', JSON.stringify(storyContext));
        
        try {
          // Get previous chapter messages if not on first chapter
          let previousChapterMessages: Array<{role: string, content: string}> = [];
          let previousChapterSummary = '';
          
          const chapterIdValue = Array.isArray(chapterId) ? chapterId[0] : chapterId;
          const currentChapterIndex = parseInt(chapterIdValue);
          if (currentChapterIndex > 0) {
            const prevChapterId = String(currentChapterIndex - 1);
            console.log(`Fetching previous chapter (${prevChapterId}) messages for continuity`);
            
            // Get messages from previous chapter
            previousChapterMessages = await getPreviousChapterMessages(
              supabase,
              worldId,
              user.id,
              prevChapterId
            );
            
            // Create a summary from those messages
            if (previousChapterMessages.length > 0) {
              previousChapterSummary = formatPreviousChapterSummary(previousChapterMessages);
              console.log(`Generated previous chapter summary (${previousChapterSummary.length} chars)`);
            } else {
              console.log('No previous chapter messages found for continuity');
            }
          } else {
            console.log('First chapter - no previous context to include');
          }
          
          // Now call streamAIResponse with the previous chapter context
          const result = await streamAIResponse(
            "Begin the story",
            storyContext,
            (chunk) => {
              console.log('Received chunk from DeepSeek:', chunk.substring(0, 50) + '...');
            },
            [],
            previousChapterSummary,
            previousChapterMessages
          );
          
          console.log('Successfully received DeepSeek response:', result.content.substring(0, 100) + '...');

          // Save the generated message
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

          // Complete the process
          setConversation({
            ...newConvo,
            messages: [message]
          });
          setHasExistingMessages(true);
          setIsInitialLoad(false);
        } catch (deepseekError) {
          console.error('DeepSeek API call failed:', deepseekError);
          throw new Error('Failed to generate story content');
        }
      } catch (error: any) {
        console.error('Error initializing conversation:', error.message);
        // Don't set error message, just keep user in loading state
        // setError('Failed to initialize conversation. Please try refreshing the page.');
        // setIsInitialLoad(false);
      } finally {
        setGeneratingInitialMessage(false);
      }
    };

    initializeConversation();
  }, [supabase, worldId, user, chapterId, storyData, dataFetched, conversation]);

  if (userLoading || loading || (isInitialLoad && !hasExistingMessages)) {
    const getLoadingTitle = () => {
      if (userLoading) return 'Authenticating';
      if (processingStep === 'loading') return 'Loading Your Story';
      if (processingStep === 'creating-world') return 'Creating Your Story World';
      if (processingStep === 'initializing') return 'Preparing Your Adventure';
      return 'Generating Your Story';
    };

    const getLoadingSubtitle = () => {
      if (userLoading) return 'Please wait while we verify your credentials...';
      if (processingStep === 'loading') return 'Loading story data...';
      if (processingStep === 'creating-world') return 'Please wait while we prepare your adventure world...';
      if (processingStep === 'initializing') return 'Setting up your story experience...';
      return 'Please wait while we craft your unique narrative experience...';
    };

    return (
      <LoadingSpinner
        variant="fullscreen"
        theme="purple"
        fullscreenTitle={getLoadingTitle()}
        fullscreenSubtitle={getLoadingSubtitle()}
        showDots={true}
      />
    );
  }

  if (!user) {
    return <Auth />;
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