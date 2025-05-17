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

function ConversationView({ conversation, initialMessage }: ConversationViewProps) {
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      {/* Minimal Story Header */}
      <div className="bg-gradient-to-b from-[#1a0a1f] to-black border-b border-pink-900/30 px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center space-y-2">
            <h1 className="text-2xl font-light text-pink-200 tracking-wider">
              {storyData?.world_name || 'Loading story...'}
            </h1>
            <div className="text-sm text-pink-300/60 font-light tracking-widest uppercase">
              {currentChapter?.chapterName || conversation?.chapter_id || 'Unknown Chapter'}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Chat Messages */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-black">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-pink-500/20"></div>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-400"></div>
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
                      <span className="font-light tracking-wider text-sm">
                        {message.role === 'user' ? 'You' : 'Storyteller'}
                      </span>
                    </div>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-200 leading-relaxed font-light">{message.content}</p>
                    </div>
                    <div className={`flex items-center space-x-2 mt-4 text-xs font-light tracking-wider
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
      <div className="border-t border-pink-900/30 bg-gradient-to-t from-[#1a0a1f] to-black p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-4">
            <div className="flex-1 bg-gradient-to-r from-[#0a0a1f] to-[#0a0a2f] rounded-2xl border border-pink-900/30 transition-all duration-300 focus-within:border-pink-800/50 focus-within:shadow-[0_0_30px_rgba(236,72,153,0.1)]">
              <textarea 
                className="w-full bg-transparent border-0 rounded-2xl p-6 text-pink-100 placeholder-pink-500/30 resize-none focus:ring-0 font-light tracking-wide"
                rows={2}
                placeholder="Type your message..."
                value={userInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={loading || sendingMessage}
              />
            </div>
            <button
              className={`px-8 py-4 rounded-2xl font-light tracking-wider transition-all duration-300
                ${!userInput.trim() || loading || sendingMessage
                  ? 'bg-gray-900/50 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#1a0a1f] to-[#2a0a2f] hover:from-[#2a0a2f] hover:to-[#3a0a3f] text-pink-300 border border-pink-900/30 hover:border-pink-800/50 hover:shadow-[0_0_30px_rgba(236,72,153,0.1)]'
                }`}
              onClick={handleSendMessage}
              disabled={!userInput.trim() || loading || sendingMessage}
            >
              {sendingMessage ? (
                <span className="flex items-center space-x-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-current"></span>
                  <span>Sending...</span>
                </span>
              ) : (
                <span>Send</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConversationView;