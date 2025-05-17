"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Auth from '@/components/Auth';
import ConversationView from '@/components/ConversationView';
import useUser from '@/hooks/useUser';
import useSupabase from '@/hooks/useSupabase';

export default function ConversationPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const supabase = useSupabase();

  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversation data
  useEffect(() => {
    if (!supabase || !id || !user) return;

    const fetchConversation = async () => {
      try {
        setLoading(true);
        
        // Get the conversation by ID
        const { data, error } = await supabase
          .from('conversations')
          .select(`
            *,
            messages(
              *
            )
          `)
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        // Verify this conversation belongs to the current user
        if (data.user_id !== user.id) {
          throw new Error('You do not have permission to view this conversation');
        }
        
        setConversation(data);
      } catch (error: any) {
        console.error('Error fetching conversation:', error.message);
        setError('Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [supabase, id, user]);

  if (userLoading) {
    return <Layout><div className="h-screen flex items-center justify-center text-white">Loading...</div></Layout>;
  }

  if (!user) {
    return <Layout><Auth /></Layout>;
  }

  return (
    <Layout>
      <div className="h-screen flex flex-col bg-gray-950">
        <div className="border-b border-gray-800 p-4 bg-gray-900 text-white">
          <button 
            onClick={() => router.back()}
            className="mr-4 px-3 py-1 bg-gray-800 rounded-lg hover:bg-gray-700 text-white"
          >
            ← Back
          </button>
          <span className="font-semibold">
            {loading ? 'Loading...' : conversation?.chapter_id || 'Conversation'}
          </span>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center bg-gray-950 text-white">
            <div className="text-xl">Loading conversation...</div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center bg-gray-950">
            <div className="text-xl text-red-500">{error}</div>
          </div>
        ) : conversation ? (
          <div className="flex-1">
            <ConversationView 
              conversation={conversation} 
              initialMessage={conversation.messages?.sort((a: any, b: any) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              )[0]}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-950 text-white">
            <div className="text-xl">Conversation not found</div>
          </div>
        )}
      </div>
    </Layout>
  );
} 