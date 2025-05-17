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
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-black">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-200">
              {error}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-400">
              Start your story by sending a message...
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
                  <div className={`max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-100'
                  } rounded-2xl px-6 py-4 shadow-lg relative`}>
                    <div className="text-sm opacity-75 mb-2">
                      {message.role === 'user' ? 'You' : 'Storyteller'}
                    </div>
                    <div className="prose prose-invert max-w-none">
                      {message.content}
                    </div>
                    <div className="text-xs opacity-50 mt-2">
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
            <div className="flex-1 bg-gray-800 rounded-xl shadow-inner">
              <textarea 
                className="w-full bg-transparent border-0 rounded-xl p-4 text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-purple-500"
                rows={2}
                placeholder="Type your message..."
                value={userInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={loading || sendingMessage}
              />
            </div>
            <button
              className={`px-6 py-4 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2
                ${!userInput.trim() || loading || sendingMessage
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-500 text-white'
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
                  <span className="transform rotate-90">➤</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}