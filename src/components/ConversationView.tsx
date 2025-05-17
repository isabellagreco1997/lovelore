import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useSupabase from '@/hooks/useSupabase';
import useUser from '@/hooks/useUser';
import { Message } from '@/types/database';
import { getStoryContextFromConversation, streamAIResponse } from '@/lib/deepseek';

interface ConversationViewProps {
  conversation: any;
  initialMessage?: Message;
}

export default function ConversationView({ conversation, initialMessage }: ConversationViewProps) {
  const router = useRouter();
  const { user } = useUser();
  const supabase = useSupabase();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>(initialMessage ? [initialMessage] : []);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storyData, setStoryData] = useState<any>(null);
  const [currentChapter, setCurrentChapter] = useState<any>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch story data and messages when conversation changes
  useEffect(() => {
    if (!conversation || !supabase) return;

    const fetchStoryAndMessages = async () => {
      try {
        setLoading(true);
        
        const { data: worldData, error: worldError } = await supabase
          .from('worlds')
          .select('story_id')
          .eq('id', conversation.world_id)
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
        
        // Find current chapter
        const chapter = processedStoryData.chapters.find(
          (ch: any) => ch.chapterName === conversation.chapter_id
        );
        setCurrentChapter(chapter);
        
        if (!initialMessage) {
          await fetchMessages();
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

  const fetchMessages = async () => {
    if (!supabase || !conversation) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('timestamp', { ascending: true });
        
      if (error) throw error;
      
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error.message);
      setError('Failed to load messages');
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
      
      const { data: savedUserMessage, error: userMessageError } = await supabase
        .from('messages')
        .insert(userMessage)
        .select()
        .single();
        
      if (userMessageError) throw userMessageError;
      
      const updatedMessages = [...messages, savedUserMessage];
      setMessages(updatedMessages);
      setUserInput('');
      
      const storyContext = await getStoryContextFromConversation(conversation, storyData);
      
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
        conversationHistory
      );
      
      const assistantMessage = {
        conversation_id: conversation.id,
        role: 'assistant',
        content: result.content,
        timestamp: new Date().toISOString()
      };
      
      const { data: savedAssistantMessage, error: assistantMessageError } = await supabase
        .from('messages')
        .insert(assistantMessage)
        .select()
        .single();
        
      if (assistantMessageError) throw assistantMessageError;
      
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

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Story Header */}
      <div className="bg-black border-b border-pink-900/20 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center space-y-2">
            <h1 className="text-3xl font-light text-pink-200 tracking-wide">
              {storyData?.world_name || 'Loading story...'}
            </h1>
            <div className="text-sm text-pink-300/60 flex items-center space-x-3">
              <span className="text-pink-400/40">♥</span>
              <span className="font-light tracking-wider">
                {currentChapter?.chapterName || conversation?.chapter_id || 'Unknown Chapter'}
              </span>
              <span className="text-pink-400/40">♥</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-black">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-400"></div>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-4 text-red-400">
              {error}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-pink-300/50 italic font-light">
              Begin your romantic journey...
            </div>
          ) : (
            <div className="space-y-8">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-3xl px-8 py-6 
                      ${message.role === 'user'
                        ? 'bg-[#1a0a1f] border border-pink-900/30'
                        : 'bg-[#0a0a1f] border border-purple-900/30'
                      }`}
                  >
                    <div className={`text-sm mb-2 font-light tracking-wide
                      ${message.role === 'user' ? 'text-pink-300/60' : 'text-purple-300/60'}`}
                    >
                      {message.role === 'user' ? 'You' : 'Storyteller'}
                    </div>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-200 leading-relaxed">{message.content}</p>
                    </div>
                    <div className={`text-xs mt-3 font-light tracking-wider
                      ${message.role === 'user' ? 'text-pink-400/30' : 'text-purple-400/30'}`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
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
      <div className="border-t border-pink-900/20 bg-black p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-4">
            <div className="flex-1 bg-[#0a0a1f] rounded-2xl border border-pink-900/30">
              <textarea 
                className="w-full bg-transparent border-0 rounded-2xl p-4 text-pink-100 placeholder-pink-500/30 resize-none focus:ring-2 focus:ring-pink-500/20 focus:border-transparent font-light"
                rows={2}
                placeholder="Share your desires..."
                value={userInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={loading || sendingMessage}
              />
            </div>
            <button
              className={`px-8 py-4 rounded-2xl font-light tracking-wider transition-all duration-300 flex items-center space-x-2
                ${!userInput.trim() || loading || sendingMessage
                  ? 'bg-gray-900 text-gray-600 cursor-not-allowed'
                  : 'bg-[#1a0a1f] hover:bg-[#2a0a2f] text-pink-300 border border-pink-900/30'
                }`}
              onClick={handleSendMessage}
              disabled={!userInput.trim() || loading || sendingMessage}
            >
              {sendingMessage ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></span>
                  <span>Sending...</span>
                </>
              ) : (
                <span>Whisper</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}