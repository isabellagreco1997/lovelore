"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import Auth from '@/components/Auth';
import useUser from '@/hooks/useUser';
import useSupabase from '@/hooks/useSupabase';

export default function ConversationsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const supabase = useSupabase();

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's conversations
  useEffect(() => {
    if (!supabase || !user) return;

    const fetchConversations = async () => {
      try {
        setLoading(true);
        
        // Get all conversations for this user
        const { data, error } = await supabase
          .from('conversations')
          .select(`
            *,
            messages!inner(*)
          `)
          .eq('user_id', user.id)
          .order('started_at', { ascending: false });
          
        if (error) throw error;
        
        // Process the data to include the first message for each conversation
        const processedData = data.map((convo: any) => {
          // Sort messages by timestamp
          const sortedMessages = [...convo.messages].sort(
            (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          
          return {
            ...convo,
            firstMessage: sortedMessages[0]
          };
        });
        
        setConversations(processedData);
      } catch (error: any) {
        console.error('Error fetching conversations:', error.message);
        setError('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [supabase, user]);

  if (userLoading) {
    return <Layout><div className="p-8 text-center">Loading...</div></Layout>;
  }

  if (!user) {
    return <Layout><Auth /></Layout>;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Your Conversations</h1>
        
        {loading ? (
          <div className="text-center py-8">Loading conversations...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8">
            <p className="mb-4">You don't have any conversations yet.</p>
            <Link href="/story" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Start a new story
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {conversations.map((conversation) => (
              <Link 
                href={`/conversations/${conversation.id}`}
                key={conversation.id} 
                className="border rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 bg-white"
              >
                <div className="font-semibold text-lg mb-2">{conversation.chapter_id}</div>
                <div className="text-sm text-gray-500 mb-3">
                  Started: {formatDate(conversation.started_at)}
                </div>
                <div className="line-clamp-3 text-sm text-gray-700">
                  {conversation.firstMessage?.content || 'No messages'}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
} 