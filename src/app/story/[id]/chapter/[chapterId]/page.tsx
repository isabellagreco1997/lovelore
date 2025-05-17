"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Auth from '@/components/Auth';
import useUser from '@/hooks/useUser';
import useSupabase from '@/hooks/useSupabase';
import { Story, Chapter, Message } from '@/types/database';
import ChapterCompletionModal from '@/components/ChapterCompletionModal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { streamAIResponse, checkObjectiveCompletion, getPreviousChapterMessages, formatPreviousChapterSummary } from '@/lib/deepseek';

// Add the Markdown component
const MarkdownContent = ({ content }: { content: string }) => {
  // Check if content is empty - show loading animation instead of "(Empty message)"
  if (!content) {
    return (
      <div className="text-amber-800 py-1">
        <span className="inline-flex items-center">
          <span className="animate-pulse">.</span>
          <span className="animate-pulse animation-delay-300">.</span>
          <span className="animate-pulse animation-delay-600">.</span>
        </span>
        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
          .animate-pulse {
            animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          .animation-delay-300 {
            animation-delay: 0.3s;
          }
          .animation-delay-600 {
            animation-delay: 0.6s;
          }
        `}</style>
      </div>
    );
  }
  
  // Check if content likely contains Markdown
  const hasMarkdown = /(\*\*|__|\*|_|##|#|\[.*\]\(.*\)|`|>|\n\s*-|\n\s*\d+\.)/.test(content);
  
  if (!hasMarkdown) {
    return <div className="whitespace-pre-line text-sm text-amber-950 leading-relaxed">{content}</div>;
  }
  
  return (
    <div className="markdown-content text-sm text-amber-950 leading-relaxed">
      <style jsx global>{`
        .markdown-content h1, .markdown-content h2, .markdown-content h3 {
          margin-top: 1rem;
          margin-bottom: 0.75rem;
          font-weight: 600;
          color: #92400e; /* amber-800 */
        }
        .markdown-content h1 {
          font-size: 1.25rem;
        }
        .markdown-content h2 {
          font-size: 1.15rem;
        }
        .markdown-content h3 {
          font-size: 1.05rem;
        }
        .markdown-content ul, .markdown-content ol {
          margin-left: 1.25rem;
          margin-bottom: 1rem;
        }
        .markdown-content ul {
          list-style-type: disc;
        }
        .markdown-content ol {
          list-style-type: decimal;
        }
        .markdown-content li {
          margin-bottom: 0.25rem;
        }
        .markdown-content p {
          margin-bottom: 0.75rem;
        }
        .markdown-content p:last-child {
          margin-bottom: 0;
        }
        .markdown-content blockquote {
          border-left: 4px solid #fcd34d; /* amber-300 */
          padding-left: 0.75rem;
          font-style: italic;
          margin: 0.5rem 0;
          background-color: rgba(254, 243, 199, 0.5); /* amber-50 at 50% opacity */
          padding: 0.25rem 0.75rem;
          color: #92400e; /* amber-800 */
        }
        .markdown-content code {
          background-color: #fef3c7; /* amber-100 */
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875rem;
          color: #78350f; /* amber-900 */
        }
        .markdown-content pre {
          background-color: rgba(254, 243, 199, 0.7); /* amber-100 at 70% opacity */
          padding: 0.75rem;
          border-radius: 0.25rem;
          margin: 0.5rem 0;
          overflow-x: auto;
          font-family: monospace;
          font-size: 0.875rem;
          color: #78350f; /* amber-900 */
        }
        .markdown-content a {
          color: #1d4ed8; /* blue-700 */
          text-decoration: none;
        }
        .markdown-content a:hover {
          text-decoration: underline;
        }
        .markdown-content img {
          max-width: 100%;
          border-radius: 0.25rem;
        }
      `}</style>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p>{children}</p>,
          h1: ({ children }) => <h1>{children}</h1>,
          h2: ({ children }) => <h2>{children}</h2>,
          h3: ({ children }) => <h3>{children}</h3>,
          ul: ({ children }) => <ul>{children}</ul>,
          ol: ({ children }) => <ol>{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
          em: ({ children }) => <em>{children}</em>,
          strong: ({ children }) => <strong>{children}</strong>,
          blockquote: ({ children }) => <blockquote>{children}</blockquote>,
          code: ({ children }) => <code>{children}</code>,
          pre: ({ children }) => <pre>{children}</pre>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default function ChapterChatPage() {
  const { id, chapterId } = useParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const supabase = useSupabase();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [story, setStory] = useState<Story | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingNewConversation, setIsCreatingNewConversation] = useState(false);
  const [hasTriedFallback, setHasTriedFallback] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [world, setWorld] = useState<{ id: string } | null>(null);

  // Add system introduction message at beginning of conversation
  const addSystemIntroMessage = useCallback(async (convoId: string, chapterName: string) => {
    if (!chapter || !supabase) {
      console.error('Cannot add intro message - chapter or supabase client not available');
      return;
    }
    
    try {
      // Call the Deepseek API to generate the story introduction
      const storyContext = {
        storyName: story?.world_name,
        chapterName: chapter.chapterName,
        chapterContext: chapter.chapterContext,
        chapterObjective: chapter.objective
      };
      
      console.log('Calling DeepSeek API with context:', JSON.stringify(storyContext));
      
      // Create a temporary message for streaming
      const tempMessage: Message = {
        id: `temp-streaming-${Date.now()}`,
        conversation_id: convoId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString()
      };
      
      setMessages([tempMessage]);
      
      // Buffer to collect the streamed content
      let streamedContent = '';
      
      // Stream the AI response
      const result = await streamAIResponse(
        'Tell me about this chapter and what I can do.', 
        storyContext,
        (chunk) => {
          streamedContent += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempMessage.id ? { ...msg, content: streamedContent } : msg
            )
          );
        },
        [], // No previous messages for the first introduction
        '',
        []
      );
      
      // Get content and objective completion status
      const finalContent = result.content;
      const objectiveCompleted = result.objectiveCompleted;
      
      if (!finalContent || finalContent.trim() === '') {
        throw new Error('DeepSeek returned empty content');
      }
      
      // Create and save the message with the generated content
      const introMessage = {
        conversation_id: convoId,
        role: 'assistant',
        content: finalContent,
        timestamp: new Date().toISOString()
      };
      
      console.log('Saving message to database...');
      const { data, error } = await supabase
        .from('messages')
        .insert(introMessage)
        .select()
        .single();
        
      if (error) {
        console.error('Error saving message to database:', error);
        throw error;
      }
      
      console.log('Message saved, updating UI');
      setMessages([data]);
    } catch (error: any) {
      console.error('Error adding intro message:', error);
      setError(`Failed to generate story introduction: ${error.message}`);
      
      // Fall back to a basic introduction message if the API fails
      console.log('Using fallback message due to error');
      const fallbackMessage = {
        id: 'fallback-intro',
        conversation_id: convoId,
        role: 'assistant' as const,
        content: `*Chapter Introduction*\n\n${chapter.chapterContext}\n\nYour objective: ${chapter.objective}\n\nWhat would you like to do?`,
        timestamp: new Date().toISOString()
      };
      
      setMessages([fallbackMessage]);
    }
  }, [chapter, supabase, story]);

  // Create a new conversation or fetch existing one
  const createOrFetchConversation = useCallback(async (storyId: string, chapterName: string) => {
    if (!user || !supabase || !chapter) {
      console.error('Cannot create conversation - dependencies not available:', {
        hasUser: !!user,
        hasSupabase: !!supabase,
        hasChapter: !!chapter
      });
      return;
    }
    
    try {
      console.log('Creating new conversation directly...');
      setError(null);
      
      // Show a loading state immediately
      const tempMessage: Message = {
        id: 'temp-loading',
        conversation_id: 'loading',
        role: 'assistant' as const,
        content: 'Generating your story...',
        timestamp: new Date().toISOString()
      };
      
      setMessages([tempMessage]);
      
      // 1. First, find or create the world for this story
      // Find the world_id that corresponds to this story_id
      const { data: worlds, error: worldError } = await supabase
        .from('worlds')
        .select('id')
        .eq('story_id', storyId);
      
      if (worldError) throw worldError;
      
      let worldId;
      
      // Check if we have valid worlds data
      if (!worlds || worlds.length === 0) {
        console.log('No worlds found for story ID:', storyId);
        
        // Fetch story details first
        const { data: storyData, error: storyError } = await supabase
          .from('stories')
          .select('id, world_name, description')
          .eq('id', storyId)
          .single();
          
        if (storyError || !storyData) {
          throw new Error('The story does not exist');
        }
        
        console.log('Story exists - creating a new world for it');
        
        // Create a new world for this story
        const { data: newWorld, error: createWorldError } = await supabase
          .from('worlds')
          .insert({
            user_id: user.id,
            name: storyData.world_name || story?.world_name,
            description: storyData.description,
            created_at: new Date().toISOString(),
            is_prebuilt: false,
            story_id: storyId
          })
          .select()
          .single();
        
        if (createWorldError) throw createWorldError;
        
        worldId = newWorld.id;
        console.log('Created new world with ID:', worldId);
      } else {
        // If multiple worlds exist, use the first one
        worldId = worlds[0].id;
        console.log('Using existing world ID:', worldId);
      }
      
      // 2. Check if there's a previous chapter to get context from
      let previousChapterSummary = '';
      let previousChapterMessages: Array<{role: string, content: string}> = [];
      
      // Calculate the previous chapter index
      const currentChapterIndex = parseInt(chapterId as string);
      if (!isNaN(currentChapterIndex) && currentChapterIndex > 0 && story?.chapters) {
        const previousChapterIndex = currentChapterIndex - 1;
        const previousChapter = story.chapters[previousChapterIndex];
        
        if (previousChapter) {
          console.log('Fetching messages from previous chapter for continuity');
          // Fetch more messages from previous chapter for better continuity
          const messages = await getPreviousChapterMessages(
            supabase,
            worldId,
            user.id,
            previousChapterIndex.toString(), // Use the index as the chapter ID
            6 // Increase from 4 to 6 messages to get better context
          );
          
          if (messages.length > 0) {
            previousChapterMessages = messages;
            previousChapterSummary = formatPreviousChapterSummary(messages);
            console.log('Generated previous chapter summary for continuity:', previousChapterSummary);
            
            // Log what we're sending for continuity
            console.log(`Sending ${previousChapterMessages.length} messages from previous chapter for continuity`);
          } else {
            console.log('No previous messages found, generating a basic transition');
            // If no messages found but we know there was a previous chapter,
            // create a minimal transition
            previousChapterSummary = `**Previous Chapter:** ${previousChapter.chapterName}\n\nYou have completed the previous chapter where the objective was: ${previousChapter.objective}. Now you continue your journey in ${chapter.chapterName}.`;
          }
        }
      }
      
      // 3. Create the conversation entry
      console.log('Creating new conversation in database...');
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          world_id: worldId,
          user_id: user.id,
          chapter_id: chapterId,
          started_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (createError) throw createError;
      
      // 4. Generate the initial message with streaming
      const storyContext = {
        storyName: story?.world_name,
        chapterName: chapter.chapterName,
        chapterContext: chapter.chapterContext,
        chapterObjective: chapter.objective
      };
      
      // Set the conversation ID so we can use it
      setConversationId(newConversation.id);
      
      // Buffer to collect the streamed content
      let streamedContent = '';
      
      // Update the temp message to show streaming content
      setMessages(prevMsgs => [
        {
          ...prevMsgs[0],
          id: `streaming-${Date.now()}`,
          conversation_id: newConversation.id,
          content: ''
        }
      ]);
      
      // Stream the AI response
      try {
        const result = await streamAIResponse(
          previousChapterMessages.length > 0 
            ? 'Continue my story from the previous chapter.' 
            : 'Tell me about this chapter and what I can do.',
          storyContext,
          (chunk) => {
            streamedContent += chunk;
            setMessages((prev) => 
              prev.map(msg => ({ ...msg, content: streamedContent }))
            );
          },
          [],
          previousChapterSummary,
          previousChapterMessages
        );
        
        // Get content and objective completion status
        const finalContent = result.content;
        const objectiveCompleted = result.objectiveCompleted;
        
        if (!finalContent || finalContent.trim() === '') {
          throw new Error('DeepSeek returned empty content');
        }
        
        // Save the message to database
        const introMessage = {
          conversation_id: newConversation.id,
          role: 'assistant',
          content: finalContent,
          timestamp: new Date().toISOString()
        };
        
        // Save to database
        const { data: savedMessage, error: messageError } = await supabase
          .from('messages')
          .insert(introMessage)
          .select()
          .single();
          
        if (messageError) throw messageError;
        
        // Update UI with the saved message
        setMessages([savedMessage]);
      } catch (streamError) {
        console.error('Error streaming initial message:', streamError);
        
        // Fall back to a basic introduction message
        const fallbackMessage = {
          id: 'fallback-intro',
          conversation_id: newConversation.id,
          role: 'assistant' as const,
          content: `*Chapter Introduction*\n\n${chapter.chapterContext}\n\nYour objective: ${chapter.objective}\n\nWhat would you like to do?`,
          timestamp: new Date().toISOString()
        };
        
        setMessages([fallbackMessage]);
        
        // Try to save the fallback message to database
        try {
          await supabase
            .from('messages')
            .insert({
              conversation_id: newConversation.id,
              role: 'assistant',
              content: fallbackMessage.content,
              timestamp: new Date().toISOString()
            });
        } catch (saveError) {
          console.error('Failed to save fallback message:', saveError);
        }
      }
    } catch (error: any) {
      console.error('Error with conversation:', error);
      setError('Failed to start conversation: ' + error.message);
      
      // Show a fallback message if there's an error
      if (chapter) {
        const fallbackMessage = {
          id: 'fallback-error',
          conversation_id: 'error',
          role: 'assistant' as const,
          content: `*Chapter Introduction*\n\n${chapter.chapterContext}\n\nYour objective: ${chapter.objective}\n\nWhat would you like to do?`,
          timestamp: new Date().toISOString()
        };
        
        setMessages([fallbackMessage]);
      }
    }
  }, [user, supabase, chapter, story, chapterId]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (convoId: string) => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convoId)
        .order('timestamp', { ascending: true });
        
      if (error) throw error;
      
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error.message);
    }
  }, [supabase]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch story and chapter data
  useEffect(() => {
    if (!supabase || !id || !chapterId) return;

    const fetchStoryAndChapter = async () => {
      try {
        console.log('Starting to fetch story and chapter data');
        setLoading(true);
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        console.log('Retrieved story data, processing chapters');
        
        // Handle nested chapters structure
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
        
        console.log(`Found ${chaptersArray.length} chapters in story`);
        
        setStory(storyData);

        // Get the selected chapter using chapterId index
        const chapterIndex = parseInt(chapterId as string);
        if (isNaN(chapterIndex) || chapterIndex < 0 || chapterIndex >= storyData.chapters.length) {
          throw new Error('Invalid chapter ID');
        }
        
        console.log(`Selected chapter index: ${chapterIndex}`);
        setChapter(storyData.chapters[chapterIndex]);
        
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
        console.error('Error fetching story/chapter:', error.message);
        setError('Failed to load the story chapter');
      } finally {
        setLoading(false);
      }
    };

    fetchStoryAndChapter();
  }, [supabase, id, chapterId]);

  // Create conversation once user, story and chapter are all available
  useEffect(() => {
    if (!user || !supabase || !story || !chapter) {
      console.log('Waiting for dependencies:', { 
        hasUser: !!user, 
        hasSupabase: !!supabase, 
        hasStory: !!story, 
        hasChapter: !!chapter 
      });
      return;
    }
    
    // First check if we already have a conversation ID in state
    if (conversationId) {
      console.log('Conversation already exists with ID:', conversationId);
      return;
    }
    
    // If not, check if there's an existing conversation for this user and chapter
    const checkExistingConversation = async () => {
      try {
        console.log('Checking for existing conversations...');
        
        // Query for existing conversations with this user and chapter
        const { data, error } = await supabase
          .from('conversations')
          .select('id')
          .eq('user_id', user.id)
          .eq('chapter_id', chapterId)
          .order('started_at', { ascending: false })
          .limit(1);
          
        if (error) {
          console.error('Error checking existing conversations:', error);
          return false;
        }
        
        if (data && data.length > 0) {
          console.log('Found existing conversation:', data[0].id);
          setConversationId(data[0].id);
          return true;
        }
        
        return false;
      } catch (e) {
        console.error('Error in checkExistingConversation:', e);
        return false;
      }
    };
    
    // Execute the check and only create a new conversation if needed
    checkExistingConversation().then(exists => {
      if (!exists) {
        console.log('No existing conversation found, creating new one...');
        createOrFetchConversation(story.id, chapter.chapterName);
      }
    });
  }, [user, supabase, story, chapter, conversationId, createOrFetchConversation]);

  // Setup real-time subscription for messages
  useEffect(() => {
    if (!supabase || !conversationId) return;
    
    console.log('Setting up real-time subscription for messages');
    
    // Initial fetch of messages
    fetchMessages(conversationId);
    
    // Subscribe to changes
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        console.log('Real-time update received:', payload);
        
        // Refetch all messages to ensure correct order
        fetchMessages(conversationId);
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
        
        // Fetch messages again if subscription setup is successful
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time updates');
          fetchMessages(conversationId);
        }
      });
    
    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, [supabase, conversationId, fetchMessages]);

  // Add interval to refresh messages periodically as a fallback
  useEffect(() => {
    if (!conversationId || !supabase) return;
    
    const interval = setInterval(() => {
      console.log('Periodic message refresh');
      fetchMessages(conversationId);
    }, 300000); // Refresh every 5 minutes instead of 10 seconds
    
    return () => clearInterval(interval);
  }, [conversationId, supabase, fetchMessages]);

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!userInput.trim() || sendingMessage || !supabase) return;
    
    try {
      setSendingMessage(true);
      
      // Store the user input before clearing it
      const userInputText = userInput.trim();
      setUserInput('');
      
      // Check if we're in fallback mode (no valid conversationId)
      const isFallbackMode = !conversationId || conversationId === 'fallback';
      
      // Create a local user message
      const userMessage: Message = {
        id: `local-user-${Date.now()}`,
        conversation_id: conversationId || 'fallback',
        role: 'user' as const,
        content: userInputText,
        timestamp: new Date().toISOString()
      };
      
      // Update UI with user message immediately
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      
      // Add user message to database if not in fallback mode
      if (!isFallbackMode) {
        const { data: savedUserMessage, error: userMessageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role: 'user',
            content: userInputText,
            timestamp: new Date().toISOString()
          })
          .select()
          .single();
          
        if (userMessageError) throw userMessageError;
      }
      
      // Setup streaming for both normal and fallback mode
      const aiMessageId = `streaming-ai-${Date.now()}`;
      setMessages([...updatedMessages, {
        id: aiMessageId,
        conversation_id: conversationId || 'fallback',
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      }]);
      
      let streamedContent = '';
      
      try {
        // Prepare conversation history for the API
        const conversationHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        const result = await streamAIResponse(userInputText, {
          storyName: story?.world_name,
          chapterName: chapter?.chapterName,
          chapterContext: chapter?.chapterContext,
          chapterObjective: chapter?.objective
        }, (chunk) => {
          streamedContent += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId ? { ...msg, content: streamedContent } : msg
            )
          );
        }, conversationHistory);
        
        // Get content and objective completion status directly
        const finalContent = result.content;
        const objectiveCompleted = result.objectiveCompleted;
        
        // Only save to database if not in fallback mode
        if (!isFallbackMode) {
          // Save the final AI response to the database
          const assistantMessage = {
            conversation_id: conversationId,
            role: 'assistant',
            content: finalContent,
            timestamp: new Date().toISOString()
          };
          
          await supabase
            .from('messages')
            .insert(assistantMessage);
        }
        
        // Update the final message content
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId 
              ? { 
                  ...msg, 
                  id: !isFallbackMode ? `db-ai-${Date.now()}` : aiMessageId,
                  content: finalContent 
                } 
              : msg
          )
        );
        
        // Show completion modal if objective is completed
        if (objectiveCompleted) {
          setShowCompletionModal(true);
        }
      } catch (error) {
        console.error('Error getting AI response:', error);
        // Add error message
        const errorMessage: Message = {
          id: `local-error-${Date.now()}`,
          conversation_id: conversationId || 'fallback',
          role: 'assistant' as const,
          content: "I'm sorry, I couldn't generate a response right now. The server might be experiencing issues.",
          timestamp: new Date().toISOString()
        };
        setMessages([...updatedMessages, errorMessage]);
      }
    } catch (error: any) {
      console.error('Error sending message:', error.message);
      setError(`Failed to get a response: ${error.message}`);
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle navigation back to story page
  const handleBackToStory = () => {
    router.push(`/story/${id}`);
  };

  // Handle reset of current chapter
  const handleResetChapter = async () => {
    if (!world || !user || !chapter) return;
    
    if (!confirm(`Are you sure you want to reset this chapter? This will delete all your progress and conversations for "${chapter.chapterName}".`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/chapter-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          worldId: world.id,
          userId: user.id,
          chapterId: chapterId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset chapter');
      }
      
      // Reload the page to start fresh
      window.location.reload();
    } catch (error: any) {
      console.error('Error resetting chapter:', error.message);
      setError(`Failed to reset chapter: ${error.message}`);
      setLoading(false);
    }
  };

  // Add fallback function to directly test the DeepSeek API
  const tryDirectApiCall = async () => {
    if (hasTriedFallback) return;
    setHasTriedFallback(true);
    
    // Immediately show a local fallback message without waiting for API
    if (chapter) {
      console.log('Showing immediate fallback message');
      const fallbackMessage = {
        id: 'static-fallback',
        conversation_id: 'fallback',
        role: 'assistant' as const,
        content: `*Chapter Introduction*\n\n${chapter.chapterContext || ''}\n\nYour objective: ${chapter.objective || 'Explore the story'}\n\nWhat would you like to do?`,
        timestamp: new Date().toISOString()
      };
      setMessages([fallbackMessage]);
      setError(null);
    }
    
    // Still try the API in the background using the centralized implementation
    try {
      console.log('Trying API call as fallback using streamAIResponse...');
      
      // Prepare the story context
      const storyContext = {
        storyName: story?.world_name,
        chapterName: chapter?.chapterName,
        chapterContext: chapter?.chapterContext,
        chapterObjective: chapter?.objective
      };
      
      // Buffer to collect content
      let streamedContent = '';
      
      // Use the centralized implementation
      const result = await streamAIResponse(
        'Tell me about this chapter and what I can do.',
        storyContext,
        (chunk) => {
          streamedContent += chunk;
          // Don't update UI immediately to avoid flickering with the fallback message
        },
        [], // No previous messages for the fallback
        '', // No previous chapter summary
        [] // No previous chapter messages
      );
      
      // Only update if we got a valid response
      if (result.content && result.content.trim() !== '') {
        console.log('API call successful, updating fallback message');
        const fallbackMessage = {
          id: 'direct-fallback',
          conversation_id: conversationId || 'fallback',
          role: 'assistant' as const,
          content: result.content,
          timestamp: new Date().toISOString()
        };
        setMessages([fallbackMessage]);
      }
    } catch (e) {
      console.error('Error in API fallback:', e);
      // Already showing a fallback, so we don't need to handle this error
    }
  };

  // Handle objective completion
  const handleMarkChapterComplete = async () => {
    if (!user || !world || !chapter || !supabase) {
      console.error('Cannot mark chapter as complete - missing data');
      setShowCompletionModal(false);
      return;
    }
    
    try {
      // Call the API to update chapter progress
      const response = await fetch('/api/chapter-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id,
          world_id: world.id,
          chapter_id: chapterId,
          is_completed: true
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update chapter progress');
      }
      
      console.log('Chapter progress updated successfully');
    } catch (error: any) {
      console.error('Error updating chapter progress:', error.message);
    } finally {
      // Close the modal regardless of result
      setShowCompletionModal(false);
    }
  };

  // Continue without marking as complete
  const handleContinueWithoutMarking = () => {
    setShowCompletionModal(false);
  };

  if (userLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-4 mt-20">
          <div className="max-w-4xl mx-auto flex justify-center items-center h-[calc(100vh-200px)] pt-6 pb-6 px-4">
            <div className="flex flex-col items-center p-8 bg-indigo-900 rounded-lg shadow-lg border border-indigo-700">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-300 mb-4"></div>
              <p className="text-purple-200 text-lg">Loading your story...</p>
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
        <div className="container mx-auto px-4 py-4 mt-20">
          <div className="max-w-4xl mx-auto pt-6 pb-6 px-4">
            <div className="bg-indigo-900 border-l-4 border-red-500 text-white px-6 py-4 rounded-lg shadow-lg">
              <h3 className="text-lg font-medium text-red-300 mb-2 flex items-center">
                <span className="mr-2">✦</span> Error
              </h3>
              <p className="text-purple-100 mb-4">{error}</p>
              <div className="mt-4 flex gap-3">
                <button 
                  onClick={handleBackToStory}
                  className="bg-indigo-700 hover:bg-indigo-600 text-white py-2 px-4 rounded-md text-sm transition-colors border border-indigo-600"
                >
                  Back to Story
                </button>
                {world && user && chapter && (
                  <button 
                    onClick={handleResetChapter}
                    className="bg-amber-700 hover:bg-amber-600 text-white py-2 px-4 rounded-md text-sm transition-colors border border-amber-600"
                  >
                    Reset Chapter
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!story || !chapter) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto pt-6 pb-6 px-4">
          <div className="bg-indigo-900 text-center text-white py-8 rounded-lg shadow-lg border border-indigo-700">
            <p className="text-purple-200 mb-4">Chapter not found</p>
            <div className="mt-4">
              <button 
                onClick={handleBackToStory}
                className="bg-indigo-700 hover:bg-indigo-600 text-white py-2 px-4 rounded-md text-sm transition-colors border border-indigo-600"
              >
                Back to Story
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-3 mt-1">
        {/* Book container with paper texture and page styling */}
        <div 
          className="bg-[#f8f5e6] rounded-lg shadow-xl overflow-hidden max-w-4xl mx-auto flex flex-col relative" 
          style={{ 
            maxHeight: 'calc(100vh - 50px)',
            backgroundImage: 'url("/images/chat-background.png")',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3), 0 0 8px 5px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.5)'
          }}
        >
        

          {/* Header with story and chapter info */}
          <div className="relative flex items-center justify-center px-6 py-8 border-b border-gray-200 shadow-sm" 
            style={{ backgroundColor: '#FDEDD7' }}
          >
            {/* Abstract background shapes (optional, for rainbow/flare effect) */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <svg className="absolute top-0 left-0 w-32 h-32 opacity-20" viewBox="0 0 100 100">
                <defs>
                  <radialGradient id="rainbow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#a3e3ff" stopOpacity="0.2" />
                  </radialGradient>
                </defs>
                <circle cx="50" cy="50" r="50" fill="url(#rainbow)" />
              </svg>
            </div>
            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center flex-1">
              <div className="text-2xl font-bold text-gray-800">{story.world_name}</div>
              <div className="mt-1 text-base text-gray-500 italic">{chapter.chapterName}</div>
            </div>
            {/* Icon button on the right */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-amber-300 bg-white shadow hover:bg-amber-50 transition text-sm font-medium text-amber-800"
                title="Reset Chapter"
                onClick={handleResetChapter}
              >
                <svg width="20" height="20" fill="none" stroke="#b45309" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 12a9 9 0 1 1 18 0 9 9 0 0 1-18 0z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Reset Chapter
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 bg-white shadow hover:bg-gray-100 transition text-sm font-medium text-gray-700"
                title="Back to Chapter Selection"
                onClick={handleBackToStory}
              >
                <svg width="20" height="20" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back to Chapters
              </button>
            </div>
          </div>
          
          {/* Objective reminder - styled as a bookmark */}
          <div className="bg-gradient-to-r from-amber-700 to-amber-600 p-3 border-l-4 border-amber-900 relative">
            <p className="text-amber-100 font-serif font-medium flex items-center">
              <span className="mr-2 text-amber-300">✦</span>Objective: {chapter.objective}
            </p>
        
          </div>
          
          {/* Story content - styled as book pages */}
          <div 
            className="p-6 flex-grow overflow-auto relative"
            style={{ 
              maxHeight: 'calc(100vh - 170px)',
              minHeight: '800px',
              backgroundImage: 'url("/images/chat-background.png")',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
              boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.05)'
            }}
          >
            {/* Decorative elements - page corners */}
            <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-r-[20px] border-t-amber-700 border-r-amber-700 opacity-10"></div>
            
            <div className="max-w-2xl mx-auto space-y-4 pl-4">
              {messages.length === 0 ? (
                <div className="text-center p-6 bg-amber-50 rounded-lg border border-amber-200" style={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
                  <div className="animate-pulse mb-3 text-amber-800">
                    Loading story... 
                    <div className="inline-block w-5 h-5 ml-2 border-t-2 border-b-2 border-amber-700 rounded-full animate-spin"></div>
                  </div>
                  <div className="mb-3 font-medium text-red-700">
                    The DeepSeek API is taking too long to respond.
                  </div>
                  <div className="flex justify-center gap-2">
                    <button 
                      onClick={tryDirectApiCall}
                      className="mt-2 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-500 transition-colors border border-amber-500"
                    >
                      Show Story Immediately
                    </button>
                    <button 
                      onClick={handleResetChapter}
                      className="mt-2 px-4 py-2 bg-amber-700 text-white rounded hover:bg-amber-600 transition-colors border border-amber-500"
                    >
                      Reset Chapter
                    </button>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div 
                    key={index}
                    data-message-id={message.id}
                    className={`${
                      message.role === 'user' 
                        ? 'italic text-amber-950 border-l-4 border-amber-600 pl-3 bg-amber-50 rounded-r-lg' 
                        : 'text-amber-950 bg-transparent rounded-lg'
                    } py-3 px-4`}
                    style={{ boxShadow: message.role === 'user' ? '2px 2px 6px rgba(0, 0, 0, 0.05)' : 'none' }}
                  >
                    {message.role === 'user' ? (
                      <div className="text-sm font-medium mb-1 text-amber-800 flex items-center"><span className="mr-2 text-amber-600">✦</span>You said:</div>
                    ) : index === 0 ? null : (
                      <div className="text-sm font-medium mb-1 text-amber-800 flex items-center"><span className="mr-2 text-amber-600">✦</span>The story continues:</div>
                    )}
                    <MarkdownContent content={message.content} />
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Message input - styled as a book footnote */}
          <div className="w-full flex justify-center items-center py-2 px-0 bg-transparent">
            <div
              className="flex items-center w-full max-w-2xl mx-auto px-2 py-1 rounded-full bg-white/60 border border-gray-200 shadow-md backdrop-blur-md"
              style={{ minHeight: '48px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="What will you do next?"
                className="flex-grow bg-transparent border-none outline-none px-4 py-2 text-gray-900 placeholder-gray-400 font-serif resize-none h-10 min-h-[40px] max-h-24 focus:ring-0 focus:outline-none"
                disabled={sendingMessage}
                style={{ boxShadow: 'none', marginRight: '0.5rem' }}
                rows={1}
              />
              {/* Smiley Icon Button */}
              <button
                type="button"
                className="ml-1 flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors focus:outline-none border border-gray-200 bg-white/70"
                tabIndex={-1}
                aria-label="Insert emoji"
                disabled={sendingMessage}
                style={{ marginRight: '0.25rem' }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="10" stroke="#888" strokeWidth="1.5" fill="none"/>
                  <circle cx="8.2" cy="9.2" r="1" fill="#888"/>
                  <circle cx="13.8" cy="9.2" r="1" fill="#888"/>
                  <path d="M8.5 13c.7.8 2.3.8 3 0" stroke="#888" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </button>
              {/* Plus Icon Button */}
              <button
                type="button"
                className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors focus:outline-none border border-gray-200 bg-white/70"
                tabIndex={-1}
                aria-label="Add more"
                disabled={sendingMessage}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="10" stroke="#888" strokeWidth="1.5" fill="none"/>
                  <path d="M11 7v8M7 11h8" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Chapter completion modal */}
          <ChapterCompletionModal
            isOpen={showCompletionModal}
            onClose={handleContinueWithoutMarking}
            onConfirm={handleMarkChapterComplete}
            chapterName={chapter?.chapterName || ''}
          />
        </div>
      </div>
    </Layout>
  );
} 