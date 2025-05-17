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
        
        setStoryData({
          ...storyData,
          chapters: chaptersArray
        });
        
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
    <div className="flex flex-col h-full bg-gradient-to-b from-pink-50 to-purple-50">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-400"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-red-600">
              {error}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 italic">
              ✨ Begin your magical story by sending a message... ✨
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${
                    message.role === 'user' 
                      ? 'justify-end' 
                      : 'justify-start'
                  }`}
                >
                  <div 
                    className={`max-w-[80%] rounded-3xl px-6 py-4 shadow-lg relative ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white'
                        : 'bg-white text-gray-800 border border-pink-100'
                    }`}
                  >
                    <div className={`text-sm mb-2 ${
                      message.role === 'user' 
                        ? 'text-pink-100' 
                        : 'text-pink-400'
                    }`}>
                      {message.role === 'user' ? '✨ You' : '🌸 Storyteller'}
                    </div>
                    <div className="prose max-w-none">
                      {message.content}
                    </div>
                    <div className={`text-xs mt-2 ${
                      message.role === 'user' 
                        ? 'text-pink-100' 
                        : 'text-pink-300'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                    <div 
                      className={`absolute -bottom-2 ${
                        message.role === 'user' 
                          ? '-left-2 transform rotate-45' 
                          : '-right-2 transform -rotate-45'
                      } w-4 h-4 ${
                        message.role === 'user'
                          ? 'bg-purple-400'
                          : 'bg-white border-b border-r border-pink-100'
                      }`}
                    />
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-pink-100 bg-white/80 backdrop-blur-sm p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-4">
            <div className="flex-1 bg-white rounded-2xl shadow-inner border border-pink-100">
              <textarea 
                className="w-full bg-transparent border-0 rounded-2xl p-4 text-gray-800 placeholder-pink-300 resize-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                rows={2}
                placeholder="✨ Type your message..."
                value={userInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={loading || sendingMessage}
              />
            </div>
            <button
              className={`px-6 py-4 rounded-2xl font-medium transition-all duration-300 flex items-center space-x-2 ${
                !userInput.trim() || loading || sendingMessage
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white transform hover:scale-105'
              }`}
              onClick={handleSendMessage}
              disabled={!userInput.trim() || loading || sendingMessage}
            >
              {sendingMessage ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <span>✨</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}