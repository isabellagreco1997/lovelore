import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useSupabase from '@/hooks/useSupabase';
import useUser from '@/hooks/useUser';
import { Message } from '@/types/database';
import { getStoryContextFromConversation, streamAIResponse, checkObjectiveCompletion } from '@/lib/deepseek';

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
        
        // Fetch the story data using world_id from the conversation
        const { data: worldData, error: worldError } = await supabase
          .from('worlds')
          .select('story_id')
          .eq('id', conversation.world_id)
          .single();
          
        if (worldError) throw worldError;
        
        // Now fetch the story with its chapters
        const { data: storyData, error: storyError } = await supabase
          .from('stories')
          .select('*')
          .eq('id', worldData.story_id)
          .single();
          
        if (storyError) throw storyError;
        
        // Handle nested chapters structure
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
        
        // Fetch messages if not provided as initialMessage
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

  // Fetch messages for the conversation
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

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!userInput.trim() || !conversation || sendingMessage || !supabase || !user) return;
    
    try {
      setSendingMessage(true);
      
      // Store the user input before clearing it
      const userInputText = userInput.trim();
      
      // Add user message to database
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
      
      // Update UI with user message
      const updatedMessages = [...messages, savedUserMessage];
      setMessages(updatedMessages);
      setUserInput('');
      
      // Get story context from conversation and story data
      const storyContext = await getStoryContextFromConversation(conversation, storyData);
      
      // Create a temporary message for streaming
      const tempAiMessage: Message = {
        id: `temp-streaming-${Date.now()}`,
        conversation_id: conversation.id,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString()
      };
      
      // Add temporary message to UI
      setMessages([...updatedMessages, tempAiMessage]);
      
      // Buffer to collect the streamed content
      let streamedContent = '';
      
      // Prepare conversation history for the API
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Stream the AI response
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
      
      // Get content and objective completion status
      const finalContent = result.content;
      const objectiveCompleted = result.objectiveCompleted;
      
      // Add assistant message to database
      const assistantMessage = {
        conversation_id: conversation.id,
        role: 'assistant',
        content: finalContent,
        timestamp: new Date().toISOString()
      };
      
      const { data: savedAssistantMessage, error: assistantMessageError } = await supabase
        .from('messages')
        .insert(assistantMessage)
        .select()
        .single();
        
      if (assistantMessageError) throw assistantMessageError;
      
      // Update UI with final assistant message
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

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(e.target.value);
  };

  // Handle pressing Enter to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-950 text-white">
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="text-center py-4">Loading conversation...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-4">{error}</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-4">No messages yet</div>
          ) : (
            <>
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`mb-6 ${
                    message.role === 'user' 
                      ? 'flex justify-end' 
                      : 'flex justify-start'
                  }`}
                >
                  <div className={`max-w-[70%]`}>
                    <div className="text-sm text-gray-400 mb-1 ml-2">
                      {message.role === 'user' ? 'You' : 'Storyteller'}
                    </div>
                    <div 
                      className={`p-4 rounded-2xl whitespace-pre-wrap ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-800 text-white'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-800 p-4 bg-gray-900">
        <div className="max-w-3xl mx-auto flex items-start">
          <textarea 
            className="flex-1 border border-gray-700 rounded-xl p-3 resize-none bg-gray-800 text-white focus:outline-none focus:border-blue-500"
            rows={2}
            placeholder="Type your response..."
            value={userInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={loading || sendingMessage}
          />
          <button
            className="ml-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400"
            onClick={handleSendMessage}
            disabled={!userInput.trim() || loading || sendingMessage}
          >
            {sendingMessage ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
} 