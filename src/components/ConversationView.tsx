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
    <div className="flex flex-col h-full bg-gray-950">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-400"></div>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-400">
              {error}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-400 italic">
              Begin your journey...
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
                    className={`max-w-[80%] rounded-lg px-6 py-4 shadow-lg ${
                      message.role === 'user'
                        ? 'bg-purple-900/30 border border-purple-500/30 text-purple-50'
                        : 'bg-gray-900/50 border border-gray-700/30 text-gray-100'
                    }`}
                  >
                    <div className={`text-sm mb-2 ${
                      message.role === 'user' 
                        ? 'text-purple-300' 
                        : 'text-gray-400'
                    }`}>
                      {message.role === 'user' ? 'You' : 'Storyteller'}
                    </div>
                    <div className="prose prose-invert max-w-none">
                      {message.content}
                    </div>
                    <div className={`text-xs mt-2 ${
                      message.role === 'user' 
                        ? 'text-purple-400/60' 
                        : 'text-gray-500'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
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
      <div className="border-t border-gray-800 bg-gray-900/80 backdrop-blur-sm p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-4">
            <div className="flex-1 bg-gray-950 rounded-lg shadow-inner border border-gray-800">
              <textarea 
                className="w-full bg-transparent border-0 rounded-lg p-4 text-gray-100 placeholder-gray-500 resize-none focus:ring-2 focus:ring-purple-500/30 focus:border-transparent"
                rows={2}
                placeholder="Type your message..."
                value={userInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={loading || sendingMessage}
              />
            </div>
            <button
              className={`px-6 py-4 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
                !userInput.trim() || loading || sendingMessage
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-900 hover:bg-purple-800 text-purple-100 border border-purple-700/50'
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
                <span>Send</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}