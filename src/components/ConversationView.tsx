import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useSupabase from '@/hooks/useSupabase';
import useUser from '@/hooks/useUser';
import { Message } from '@/types/database';
import { streamAIResponse, getStoryContextFromConversation, getPreviousChapterMessages, formatPreviousChapterSummary } from '@/lib/deepseek';
import ChapterCompletionModal from './ChapterCompletionModal';

interface ConversationViewProps {
  conversation: any;
  initialMessage?: Message;
}

function ConversationView({ conversation, initialMessage }: ConversationViewProps) {
  const router = useRouter();
  const { user } = useUser();
  const supabase = useSupabase();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storyData, setStoryData] = useState<any>(null);
  const [chapterIndex, setChapterIndex] = useState<number | null>(null);
  const [generatingInitialMessage, setGeneratingInitialMessage] = useState(false);
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [currentChapterName, setCurrentChapterName] = useState('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!conversation || !supabase) return;

    const fetchStoryAndMessages = async () => {
      try {
        setLoading(true);
        
        // Fetch world and story data using direct fetch with proper headers
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Missing Supabase environment variables');
        }
        
        // Fetch world data
        const worldResponse = await fetch(
          `${supabaseUrl}/rest/v1/worlds?select=story_id&id=eq.${conversation.world_id}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Prefer': 'return=representation'
            }
          }
        );
        
        if (!worldResponse.ok) {
          throw new Error(`Error fetching world: ${worldResponse.status} ${worldResponse.statusText}`);
        }
        
        const worlds = await worldResponse.json();
        if (!worlds || worlds.length === 0) {
          throw new Error('World not found');
        }
        
        console.log('Found world for story_id:', worlds[0].story_id);
        
        // Fetch story data
        const storyResponse = await fetch(
          `${supabaseUrl}/rest/v1/stories?select=*&id=eq.${worlds[0].story_id}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Prefer': 'return=representation'
            }
          }
        );
        
        if (!storyResponse.ok) {
          throw new Error(`Error fetching story: ${storyResponse.status} ${storyResponse.statusText}`);
        }
        
        const stories = await storyResponse.json();
        if (!stories || stories.length === 0) {
          throw new Error('Story not found');
        }
        
        const storyData = stories[0];
        
        // Process chapters array
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
        
        // Find the chapter index
        const chapterIndexFromId = parseInt(conversation.chapter_id);
        setChapterIndex(
          !isNaN(chapterIndexFromId) && chapterIndexFromId >= 0 && chapterIndexFromId < processedStoryData.chapters.length 
            ? chapterIndexFromId 
            : -1
        );
        
        // Always fetch all messages for this conversation
        const messagesResponse = await fetch(
          `${supabaseUrl}/rest/v1/messages?select=*&conversation_id=eq.${conversation.id}&order=timestamp.asc`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Prefer': 'return=representation'
            }
          }
        );
        
        if (!messagesResponse.ok) {
          throw new Error(`Error fetching messages: ${messagesResponse.status} ${messagesResponse.statusText}`);
        }
        
        const fetchedMessages = await messagesResponse.json();
        console.log('Fetched messages, count:', fetchedMessages.length);
        
        // Update messages state
        setMessages(fetchedMessages);
        
        // Generate initial message if none exist
        if (fetchedMessages.length === 0 && !generatingInitialMessage) {
          console.log('No messages found, generating initial message immediately');
          generateInitialMessage(processedStoryData);
        }
      } catch (error: any) {
        console.error('Error fetching story data:', error.message);
        setError('Failed to load the conversation');
      } finally {
        setLoading(false);
      }
    };

    fetchStoryAndMessages();
  }, [conversation, supabase, initialMessage]);
  
  useEffect(() => {
    const shouldGenerateInitialMessage = 
      !loading && 
      !generatingInitialMessage && 
      storyData && 
      messages.length === 0 && 
      !initialMessage &&
      user &&
      supabase;
      
    if (shouldGenerateInitialMessage) {
      console.log('Backup check: No messages found and story data loaded - initiating message generation');
      generateInitialMessage(storyData);
    }
  }, [storyData, messages.length, loading, generatingInitialMessage, initialMessage, user, supabase]);

  const fetchMessages = async () => {
    if (!supabase || !conversation) return;
    
    try {
      console.log('Fetching messages for conversation ID:', conversation.id);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('timestamp', { ascending: true });
        
      if (error) throw error;
      
      console.log('Messages fetched:', data ? data.length : 0);
      setMessages(data || []);
      
      return data || [];
    } catch (error: any) {
      console.error('Error fetching messages:', error.message);
      setError('Failed to load messages');
      return [];
    }
  };

  const generateInitialMessage = async (currentStoryData: any = null) => {
    if (!supabase || !conversation || !user) {
      console.error('Missing required context for generating initial message');
      return;
    }
    
    const storyDataToUse = currentStoryData || storyData;
    if (!storyDataToUse) {
      console.error('No story data available for generating initial message');
      return;
    }
    
    try {
      setGeneratingInitialMessage(true);
      console.log('Generating initial message with storyData:', storyDataToUse.world_name);
      
      const storyContext = await getStoryContextFromConversation(conversation, storyDataToUse);
      console.log('Story context for initial message:', storyContext);
      
      let streamedContent = '';
      let result;
      
      let previousChapterMessages: Array<{role: string, content: string}> = [];
      let previousChapterSummary = '';
      
      const currentChapterIndex = parseInt(conversation.chapter_id);
      if (currentChapterIndex > 0) {
        const prevChapterId = String(currentChapterIndex - 1);
        console.log(`Fetching previous chapter (${prevChapterId}) messages for initial message`);
        
        previousChapterMessages = await getPreviousChapterMessages(
          supabase,
          conversation.world_id,
          user!.id,
          prevChapterId
        );
        
        if (previousChapterMessages.length > 0) {
          previousChapterSummary = formatPreviousChapterSummary(previousChapterMessages);
          console.log(`Included previous chapter summary (${previousChapterSummary.length} chars) for initial message`);
        } else {
          console.log('No previous chapter messages found for continuity');
        }
      } else {
        console.log('First chapter - no previous context to include');
      }
      
      try {
        result = await streamAIResponse(
          "Begin the story",
          storyContext,
          (chunk) => {
            streamedContent += chunk;
            console.log('Received chunk:', chunk.substring(0, 50) + '...');
          },
          [],
          previousChapterSummary,
          previousChapterMessages
        );
        
        console.log('Full initial message generated:', result.content.substring(0, 100) + '...');
      } catch (deepseekError: any) {
        console.error('Error in deepseek API call:', deepseekError);
        throw new Error(`Failed to generate story: ${deepseekError.message}`);
      }
      
      if (!result) {
        throw new Error('Failed to generate initial message: No content received from AI');
      }
      
      const assistantMessage = {
        conversation_id: conversation.id,
        role: 'assistant',
        content: result.content,
        timestamp: new Date().toISOString()
      };
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables');
      }
      
      const saveResponse = await fetch(
        `${supabaseUrl}/rest/v1/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(assistantMessage)
        }
      );
      
      if (!saveResponse.ok) {
        const errorText = await saveResponse.text();
        console.error('Error saving message:', errorText);
        throw new Error(`Error saving message: ${saveResponse.status} ${saveResponse.statusText}`);
      }
      
      const savedMessages = await saveResponse.json();
      if (!savedMessages || !savedMessages[0]) {
        throw new Error('Failed to save message - no data returned');
      }
      
      const savedAssistantMessage = savedMessages[0];
      
      console.log('Initial message saved to database');
      setMessages([savedAssistantMessage]);
    } catch (error: any) {
      console.error('Error generating initial message:', error.message);
      setError(`Failed to generate initial message: ${error.message}`);
    } finally {
      setGeneratingInitialMessage(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || !conversation || sendingMessage || !supabase || !user) return;
    
    try {
      setSendingMessage(true);
      const userInputText = userInput.trim();
      
      const userMessage = {
        conversation_id: conversation.id,
        role: 'user',
        content: userInputText,
        timestamp: new Date().toISOString()
      };
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables');
      }
      
      const userMessageResponse = await fetch(
        `${supabaseUrl}/rest/v1/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(userMessage)
        }
      );
      
      if (!userMessageResponse.ok) {
        const errorText = await userMessageResponse.text();
        console.error('Error saving user message:', errorText);
        throw new Error(`Error saving user message: ${userMessageResponse.status} ${userMessageResponse.statusText}`);
      }
      
      const savedUserMessageArray = await userMessageResponse.json();
      if (!savedUserMessageArray || !savedUserMessageArray[0]) {
        throw new Error('Failed to save user message - no data returned');
      }
      
      const savedUserMessage = savedUserMessageArray[0];
      
      const updatedMessages = [...messages, savedUserMessage];
      setMessages(updatedMessages);
      setUserInput('');
      
      const storyContext = await getStoryContextFromConversation(conversation, storyData);
      console.log('Story context for response:', storyContext);
      
      if (storyContext.chapterName) {
        setCurrentChapterName(storyContext.chapterName);
      }
      
      const tempAiMessage: Message = {
        id: `temp-streaming-${Date.now()}`,
        conversation_id: conversation.id,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString()
      };
      
      setMessages([...updatedMessages, tempAiMessage]);
      
      let streamedContent = '';
      
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      let previousChapterMessages: Array<{role: string, content: string}> = [];
      let previousChapterSummary = '';
      
      const currentChapterIndex = parseInt(conversation.chapter_id);
      if (currentChapterIndex > 0) {
        const prevChapterId = String(currentChapterIndex - 1);
        console.log(`Fetching previous chapter (${prevChapterId}) messages for continuity`);
        
        previousChapterMessages = await getPreviousChapterMessages(
          supabase,
          conversation.world_id,
          user!.id,
          prevChapterId
        );
        
        if (previousChapterMessages.length > 0) {
          previousChapterSummary = formatPreviousChapterSummary(previousChapterMessages);
          console.log(`Included previous chapter summary (${previousChapterSummary.length} chars) for continuity`);
        } else {
          console.log('No previous chapter messages found for continuity');
        }
      } else {
        console.log('First chapter - no previous context to include');
      }
      
      const result = await streamAIResponse(
        userInputText,
        storyContext,
        (chunk) => {
          streamedContent += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempAiMessage.id ? { ...msg, content: streamedContent } : msg
            )
          );
        },
        conversationHistory,
        previousChapterSummary,
        previousChapterMessages
      );
      
      console.log('AI Response completed. Objective status:', {
        objectiveCompleted: result.objectiveCompleted,
        objective: storyContext.chapterObjective
      });
      
      if (result.objectiveCompleted) {
        console.log('Chapter objective completed! Showing completion modal.');
        setShowCompletionModal(true);
      }
      
      const assistantMessage = {
        conversation_id: conversation.id,
        role: 'assistant',
        content: result.content,
        timestamp: new Date().toISOString()
      };
      
      const assistantMessageResponse = await fetch(
        `${supabaseUrl}/rest/v1/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(assistantMessage)
        }
      );
      
      if (!assistantMessageResponse.ok) {
        const errorText = await assistantMessageResponse.text();
        console.error('Error saving AI message:', errorText);
        throw new Error(`Error saving AI message: ${assistantMessageResponse.status} ${assistantMessageResponse.statusText}`);
      }
      
      const savedAssistantMessageArray = await assistantMessageResponse.json();
      if (!savedAssistantMessageArray || !savedAssistantMessageArray[0]) {
        throw new Error('Failed to save AI message - no data returned');
      }
      
      const savedAssistantMessage = savedAssistantMessageArray[0];
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempAiMessage.id 
            ? { ...savedAssistantMessage }
            : msg
        )
      );
    } catch (error: any) {
      console.error('Error sending message:', error.message);
      setError(`Failed to send message: ${error.message}`);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBackToChapters = () => {
    if (storyData?.id) {
      router.push(`/story/${storyData.id}`);
    }
  };

  const handleMarkChapterCompleted = async () => {
    try {
      if (!user || !conversation) return;
      
      const chapterId = conversation.chapter_id;
      
      console.log('Marking chapter as completed:', {
        userId: user.id,
        worldId: conversation.world_id,
        chapterId: chapterId,
        rawConversationChapterId: conversation.chapter_id
      });
      
      const response = await fetch('/api/chapter-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          world_id: conversation.world_id,
          chapter_id: chapterId,
          is_completed: true
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error updating chapter progress:', errorText);
        throw new Error(`Error updating chapter progress: ${response.status}`);
      }
      
      console.log('Chapter marked as completed, ID:', chapterId);
      
      setShowCompletionModal(false);
      
      if (storyData?.id) {
        router.push(`/story/${storyData.id}`);
      }
    } catch (error: any) {
      console.error('Error marking chapter as completed:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Minimal Story Header */}
      <div className="bg-gradient-to-b from-[#1a0a1f] to-black border-b border-pink-900/30 px-4 md:px-8 py-3 md:py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToChapters}
              className="px-2 md:px-4 py-1.5 md:py-2 rounded-lg bg-gradient-to-r from-[#1a0a1f] to-[#2a0a2f] hover:from-[#2a0a2f] hover:to-[#3a0a3f] text-pink-300 border border-pink-900/30 hover:border-pink-800/50 hover:shadow-[0_0_30px_rgba(236,72,153,0.1)] transition-all duration-300 text-sm md:text-base"
            >
              ← Back
            </button>
            <div className="flex flex-col items-center text-center space-y-1 md:space-y-2">
              <h1 className="text-lg md:text-2xl font-light text-pink-200 tracking-wider">
                {storyData?.world_name || 'Loading story...'}
              </h1>
              <div className="text-xs md:text-sm text-pink-300/60 font-light tracking-widest uppercase">
                {chapterIndex !== null && chapterIndex >= 0 && storyData?.chapters ? (
                  `Chapter ${chapterIndex + 1}: ${storyData.chapters[chapterIndex].chapterName}`
                ) : (
                  'Loading chapter...'
                )}
              </div>
            </div>
            <div className="w-[60px] md:w-[104px]"></div>
          </div>
        </div>
      </div>

      {/* Chapter Objective Section */}
      {chapterIndex !== null && chapterIndex >= 0 && storyData?.chapters && storyData.chapters[chapterIndex].objective && (
        <div className="bg-gradient-to-b from-[#1a0a1f]/80 to-black/80 border-b border-pink-900/30 px-4 md:px-8 py-2 md:py-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-pink-900/20 border border-pink-800/30 rounded-lg md:rounded-xl p-2 md:p-3 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-pink-800/40 flex items-center justify-center text-pink-300 mr-2 md:mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] md:text-xs text-pink-400 font-medium uppercase tracking-wider mb-0.5 md:mb-1">Chapter Objective</div>
                  <div className="text-pink-200 font-light text-xs md:text-sm">{storyData.chapters[chapterIndex].objective}</div>
                </div>
              </div>
              <button 
                onClick={() => setShowObjectiveModal(true)}
                className="ml-2 md:ml-4 w-5 h-5 md:w-6 md:h-6 rounded-full bg-pink-800/30 text-pink-300 flex items-center justify-center hover:bg-pink-700/40 transition-all flex-shrink-0 text-xs md:text-sm"
                aria-label="More information about objectives"
              >
                ?
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Chat Messages */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-black">
        <div className="max-w-4xl mx-auto">
          {loading || generatingInitialMessage ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-pink-300/50 italic font-light tracking-wider">
                Loading conversation...
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-900/10 border border-red-500/20 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center space-x-3 text-red-400">
                <span>⚠</span>
                <p>{error}</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center">
              <p className="text-pink-300/50 italic font-light tracking-wider">
                Begin your journey...
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div 
                    className={`max-w-[80%] rounded-3xl p-6 backdrop-blur-sm transition-all duration-300
                      ${message.role === 'user'
                        ? 'bg-gradient-to-br from-[#1a0a1f] to-[#0a0a1f] border border-pink-900/30 hover:border-pink-800/30'
                        : 'bg-gradient-to-br from-[#0a0a1f] to-[#0a0a2f] border border-purple-900/30 hover:border-purple-800/30'
                      }`}
                  >
                    <div className={`flex items-center space-x-2 mb-3
                      ${message.role === 'user' ? 'text-pink-300/60' : 'text-purple-300/60'}`}
                    >
                      <span className="font-light tracking-wider text-xs md:text-sm">
                        {message.role === 'user' ? 'You' : 'Storyteller'}
                      </span>
                    </div>
                    <div className="prose prose-invert max-w-none">
                      {(() => {
                        const processFormattedText = (text: string) => {
                          const segments: React.ReactNode[] = [];
                          
                          const processQuotes = (inputText: string) => {
                            const quoteParts: React.ReactNode[] = [];
                            const quoteRegex = /"([^"]+)"/g;
                            let quoteMatch;
                            let lastIndex = 0;
                            
                            while ((quoteMatch = quoteRegex.exec(inputText)) !== null) {
                              if (quoteMatch.index > lastIndex) {
                                quoteParts.push(inputText.substring(lastIndex, quoteMatch.index));
                              }
                              quoteParts.push(<strong key={`q-${quoteMatch.index}`}>"{quoteMatch[1]}"</strong>);
                              lastIndex = quoteMatch.index + quoteMatch[0].length;
                            }
                            
                            if (lastIndex < inputText.length) {
                              quoteParts.push(inputText.substring(lastIndex));
                            }
                            
                            return quoteParts;
                          };
                          
                          const processBold = (inputText: React.ReactNode) => {
                            if (typeof inputText !== 'string') return [inputText];
                            
                            const boldParts: React.ReactNode[] = [];
                            const boldRegex = /\*\*([^*]+)\*\*/g;
                            let boldMatch;
                            let lastIndex = 0;
                            
                            while ((boldMatch = boldRegex.exec(inputText as string)) !== null) {
                              if (boldMatch.index > lastIndex) {
                                boldParts.push(inputText.toString().substring(lastIndex, boldMatch.index));
                              }
                              boldParts.push(<strong key={`b-${boldMatch.index}`}>{boldMatch[1]}</strong>);
                              lastIndex = boldMatch.index + boldMatch[0].length;
                            }
                            
                            if (lastIndex < inputText.toString().length) {
                              boldParts.push(inputText.toString().substring(lastIndex));
                            }
                            
                            return boldParts;
                          };
                          
                          const processItalic = (inputText: React.ReactNode) => {
                            if (typeof inputText !== 'string') return [inputText];
                            
                            const italicParts: React.ReactNode[] = [];
                            const italicRegex = /\*([^*]+)\*/g;
                            let italicMatch;
                            let lastIndex = 0;
                            
                            while ((italicMatch = italicRegex.exec(inputText as string)) !== null) {
                              if (italicMatch.index > lastIndex) {
                                italicParts.push(inputText.toString().substring(lastIndex, italicMatch.index));
                              }
                              italicParts.push(<em key={`i-${italicMatch.index}`}>{italicMatch[1]}</em>);
                              last
Index = italicMatch.index + italicMatch[0].length;
                            }
                            
                            if (lastIndex < inputText.toString().length) {
                              italicParts.push(inputText.toString().substring(lastIndex));
                            }
                            
                            
                            return italicParts;
                          };
                          
                          let currentSegments: React.ReactNode[] = [text];
                          
                          let newSegments: React.ReactNode[] = [];
                          for (const segment of currentSegments) {
                            if (typeof segment === 'string') {
                              newSegments = [...newSegments, ...processQuotes(segment)];
                            } else {
                              newSegments.push(segment);
                            }
                          }
                          currentSegments = newSegments;
                          
                          newSegments = [];
                          for (const segment of currentSegments) {
                            if (typeof segment === 'string') {
                              newSegments = [...newSegments, ...processBold(segment)];
                            } else {
                              newSegments.push(segment);
                            }
                          }
                          currentSegments = newSegments;
                          
                          newSegments = [];
                          for (const segment of currentSegments) {
                            if (typeof segment === 'string') {
                              newSegments = [...newSegments, ...processItalic(segment)];
                            } else {
                              newSegments.push(segment);
                            }
                          }
                          
                          return newSegments;
                        };
                        
                        return message.content.split('\n').map((paragraph, index) => {
                          const namedDialogueMatch = paragraph.match(/^([A-Za-z\s]+):\s*(.+)$/);
                          
                          if (namedDialogueMatch) {
                            const [_, characterName, dialogue] = namedDialogueMatch;
                            
                            const formattedParts = processFormattedText(dialogue);
                            
                            return (
                              <p key={index} className="text-gray-200 leading-relaxed font-light mb-3 pl-4 border-l-2 border-pink-900/30 py-2">
                                <span className="font-medium text-pink-300 text-sm md:text-base">{characterName}:</span>
                                <br />
                                <span className="block mt-1 pl-2 text-sm md:text-base leading-relaxed md:leading-relaxed">
                                  {formattedParts}
                                </span>
                              </p>
                            );
                          } else if (paragraph.trim()) {
                            const formattedParts = processFormattedText(paragraph);
                            
                            return (
                              <p key={index} className="text-gray-200 text-sm md:text-base leading-relaxed md:leading-relaxed font-light mb-2">
                                {formattedParts}
                              </p>
                            );
                          } else {
                            return <br key={index} />;
                          }
                        });
                      })()}
                    </div>
                    <div className={`flex items-center space-x-2 mt-4 text-[10px] md:text-xs font-light tracking-wider
                      ${message.role === 'user' ? 'text-pink-400/30' : 'text-purple-400/30'}`}
                    >
                      <time>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </time>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-pink-900/30 bg-gradient-to-t from-[#1a0a1f] to-black p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-2 md:space-x-4">
            <div className="flex-1 bg-gradient-to-r from-[#0a0a1f] to-[#0a0a2f] rounded-xl border border-pink-900/30 transition-all duration-300 focus-within:border-pink-800/50 focus-within:shadow-[0_0_30px_rgba(236,72,153,0.1)]">
              <textarea 
                className="w-full bg-transparent border-0 rounded-xl p-3 md:p-6 text-pink-100 placeholder-pink-500/30 resize-none focus:ring-0 font-light tracking-wide text-sm md:text-base h-[40px] md:h-auto"
                rows={1}
                placeholder="Type your message..."
                value={userInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={loading || sendingMessage || generatingInitialMessage}
              />
            </div>
            <button
              className={`px-4 py-2 md:px-8 md:py-4 rounded-xl font-light tracking-wider transition-all duration-300 text-sm md:text-base
                ${!userInput.trim() || loading || sendingMessage || generatingInitialMessage
                  ? 'bg-gray-900/50 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#1a0a1f] to-[#2a0a2f] hover:from-[#2a0a2f] hover:to-[#3a0a3f] text-pink-300 border border-pink-900/30 hover:border-pink-800/50 hover:shadow-[0_0_30px_rgba(236,72,153,0.1)]'
                }`}
              onClick={handleSendMessage}
              disabled={!userInput.trim() || loading || sendingMessage || generatingInitialMessage}
            >
              {sendingMessage ? (
                <span className="flex items-center space-x-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-current"></span>
                  <span className="hidden md:inline">Sending...</span>
                </span>
              ) : generatingInitialMessage ? (
                <span className="flex items-center space-x-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-current"></span>
                  <span className="hidden md:inline">Initializing...</span>
                </span>
              ) : (
                <span>Send</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Chapter Completion Modal */}
      <ChapterCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        onConfirm={handleMarkChapterCompleted}
        chapterName={currentChapterName}
      />

      {/* Objective Modal */}
      {showObjectiveModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gradient-to-b from-[#2a0a2f] to-[#1a0a1f] max-w-md rounded-2xl border border-pink-800/40 shadow-[0_0_30px_rgba(236,72,153,0.1)] p-6 m-4">
            <h3 className="text-xl text-pink-300 mb-3 font-medium">Chapter Objectives</h3>
            <p className="text-pink-100/90 mb-4">
              The story for this chapter will continue until you achieve the objective. When completed, the next chapter will be unlocked.
            </p>
            <p className="text-pink-100/90 mb-4">
              If you prefer to keep playing in this chapter, you can do so. When you eventually start the next chapter, it will take into account what happened in previous chapters.
            </p>
            <div className="flex justify-end">
              <button 
                onClick={() => setShowObjectiveModal(false)}
                className="px-4 py-2 bg-pink-900/40 hover:bg-pink-800/40 text-pink-300 rounded-xl transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConversationView;