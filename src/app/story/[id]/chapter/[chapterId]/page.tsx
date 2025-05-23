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
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [chapterProgress, setChapterProgress] = useState<Record<string, boolean>>({});

  // Animation state for cycling phrases
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const generatingPhrases = [
    'Curating Your Story',
    'Dressing your main character in today\'s drama',
    'Whispering secrets to your favorite character',
    'Assigning star signs to your cast',
    'Giving your heroine her signature hairstyle',
    'Spawning emotional damage for character growth',
    'Writing flirty comebacks for your love interest',
    'Selecting enemies to lovers intensity level',
    'Testing if your sidekick is chaotic good or just chaotic'
  ];

  // Cycle through phrases every 3 seconds when in generating step
  useEffect(() => {
    if (processingStep !== 'generating') return;
    
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentPhraseIndex((prev) => (prev + 1) % generatingPhrases.length);
        setIsAnimating(false);
      }, 150); // Half of the transition time for smooth effect
    }, 3000);

    return () => clearInterval(interval);
  }, [processingStep]);

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

        // Check if user can access this chapter
        const chapterIdValue = Array.isArray(chapterId) ? chapterId[0] : chapterId;
        const currentChapterIndex = parseInt(chapterIdValue);
        
        // Validate chapter index
        if (isNaN(currentChapterIndex) || currentChapterIndex < 0 || currentChapterIndex >= chaptersArray.length) {
          throw new Error('Invalid chapter');
        }
        
        // Check chapter access (will be validated again after progress is loaded)
        // This is just a basic check - full validation happens later
        console.log(`Accessing chapter ${currentChapterIndex} of ${chaptersArray.length} total chapters`);

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
          const hasMessages = existingConvo.messages?.length > 0;
          setHasExistingMessages(hasMessages);
          setIsInitialLoad(false);
          setGeneratingInitialMessage(false);
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

  // Check subscription status
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

  // Fetch chapter progress for access validation
  useEffect(() => {
    if (!supabase || !user || !worldId || !storyData) return;
    
    const fetchChapterProgress = async () => {
      try {
        const { data, error } = await supabase
          .from('user_chapter_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('world_id', worldId);
          
        if (error) {
          console.error('Error fetching chapter progress:', error);
          return;
        }
        
        const progressMap: Record<string, boolean> = {};
        data.forEach((progress: any) => {
          progressMap[progress.chapter_id] = progress.is_completed;
        });
        
        setChapterProgress(progressMap);
      } catch (error: any) {
        console.error('Error processing chapter progress:', error.message);
      }
    };
    
    fetchChapterProgress();
  }, [supabase, user, worldId, storyData]);

  // Validate chapter access
  useEffect(() => {
    // Only run validation when ALL required data is loaded
    if (!storyData || !user || !worldId) {
      return;
    }
    
    // Special case: if we have worldId but no progress data loaded yet, wait for progress
    if (Object.keys(chapterProgress).length === 0) {
      return;
    }
    
    const chapterIdValue = Array.isArray(chapterId) ? chapterId[0] : chapterId;
    const currentChapterIndex = parseInt(chapterIdValue);
    
    // Chapter locking logic (same as story page)
    const isChapterLocked = (index: number) => {
      // First chapter is always unlocked
      if (index === 0) {
        return false;
      }
      
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
    
    const isLocked = isChapterLocked(currentChapterIndex);
    
    if (isLocked) {
      router.push(`/story/${id}`);
      return;
    }
  }, [storyData, chapterProgress, hasActiveSubscription, user, chapterId, id, router, worldId]);

  if (userLoading || loading || (isInitialLoad && !hasExistingMessages) || generatingInitialMessage) {
    const getLoadingTitle = () => {
      if (userLoading) return 'Authenticating';
      if (processingStep === 'loading') return 'Loading Your Story';
      if (processingStep === 'creating-world') return 'Creating Your Story World';
      if (processingStep === 'initializing') return 'Preparing Your Adventure';
      if (processingStep === 'generating') return generatingPhrases[currentPhraseIndex];
      return 'Generating Your Story';
    };

    const getLoadingSubtitle = () => {
      if (userLoading) return 'Please wait while we verify your credentials...';
      if (processingStep === 'loading') return 'Loading story data...';
      if (processingStep === 'creating-world') return 'Please wait while we prepare your adventure world...';
      if (processingStep === 'initializing') return 'Setting up your story experience...';
      if (processingStep === 'generating') return '';
      return 'Please wait while we prepare your story...';
    };

    return (
      <LoadingSpinner
        variant="fullscreen"
        theme="pink"
        fullscreenTitle={getLoadingTitle()}
        fullscreenSubtitle={getLoadingSubtitle()}
        showDots={true}
        titleClassName={`transition-all duration-300 ease-in-out ${isAnimating ? 'text-fade-out' : 'text-fade-in'}`}
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