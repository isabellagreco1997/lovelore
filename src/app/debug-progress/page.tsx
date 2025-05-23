"use client";

import { useState, useEffect } from 'react';
import useUser from '@/hooks/useUser';
import useSupabase from '@/hooks/useSupabase';
import Layout from '@/components/Layout';
import Auth from '@/components/Auth';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ProgressRecord {
  id: string;
  user_id: string;
  world_id: string;
  chapter_id: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface DebugData {
  storyInfo: any;
  worldInfo: any;
  actualWorldId: string;
  progress: ProgressRecord[];
  conversations: Array<{ chapter_id: string; created_at: string; world_id: string }>;
  debug: {
    requestParams: any;
    progressCount: number;
    conversationCount: number;
    progressIds: Array<{
      chapterId: string;
      chapterIdType: string;
      isCompleted: boolean;
      completedType: string;
      worldId: string;
    }>;
    conversationWorldIds: Array<{
      chapterId: string;
      worldId: string;
    }>;
  };
}

export default function DebugProgressPage() {
  const { user, loading: userLoading } = useUser();
  const supabase = useSupabase();
  const [stories, setStories] = useState<Array<{ id: string; world_name: string }>>([]);
  const [selectedStoryId, setSelectedStoryId] = useState<string>('');
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!supabase || !user) return;

    const fetchStories = async () => {
      const { data, error } = await supabase
        .from('stories')
        .select('id, world_name')
        .order('world_name');

      if (error) {
        console.error('Error fetching stories:', error);
        return;
      }

      setStories(data || []);
      if (data && data.length > 0) {
        setSelectedStoryId(data[0].id);
      }
    };

    fetchStories();
  }, [supabase, user]);

  const fetchDebugData = async () => {
    if (!user || !selectedStoryId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/debug-progress?userId=${user.id}&storyId=${selectedStoryId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch debug data');
      }

      setDebugData(data);
    } catch (error: any) {
      console.error('Error fetching debug data:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fixTypes = async () => {
    if (!user || !debugData?.actualWorldId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/debug-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          worldId: debugData.actualWorldId,
          action: 'fix_types'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fix types');
      }

      setMessage(data.message);
      // Refresh data
      await fetchDebugData();
    } catch (error: any) {
      console.error('Error fixing types:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const markChapterCompleted = async (chapterId: string) => {
    if (!user || !debugData?.actualWorldId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/debug-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          worldId: debugData.actualWorldId,
          action: 'mark_completed',
          chapterId: chapterId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark chapter completed');
      }

      setMessage(data.message);
      // Refresh data
      await fetchDebugData();
    } catch (error: any) {
      console.error('Error marking chapter completed:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStoryId) {
      fetchDebugData();
    }
  }, [selectedStoryId]);

  if (userLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[80vh]">
          <LoadingSpinner
            variant="spinner"
            size="lg"
            theme="purple"
          />
        </div>
      </Layout>
    );
  }

  if (!user) return <Auth />;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-white mb-6">Chapter Progress Debug Tool</h1>
        
        {message && (
          <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg">
            <p className="text-blue-300">{message}</p>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Story:
          </label>
          <select
            value={selectedStoryId}
            onChange={(e) => setSelectedStoryId(e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          >
            <option value="">Select a story...</option>
            {stories.map((story) => (
              <option key={story.id} value={story.id}>
                {story.world_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={fetchDebugData}
            disabled={loading || !selectedStoryId}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh Data'}
          </button>
          
          <button
            onClick={fixTypes}
            disabled={loading || !selectedStoryId || !debugData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Fix Data Types
          </button>
        </div>

        {debugData && (
          <div className="space-y-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-white mb-4">
                Story: {debugData.storyInfo?.world_name || 'Unknown'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-800/50 p-3 rounded">
                  <div className="text-sm text-gray-400">Progress Records</div>
                  <div className="text-2xl text-white">{debugData.debug.progressCount}</div>
                </div>
                <div className="bg-gray-800/50 p-3 rounded">
                  <div className="text-sm text-gray-400">Conversations</div>
                  <div className="text-2xl text-white">{debugData.debug.conversationCount}</div>
                </div>
                <div className="bg-gray-800/50 p-3 rounded">
                  <div className="text-sm text-gray-400">Completed Chapters</div>
                  <div className="text-2xl text-white">
                    {debugData.progress.filter(p => p.is_completed).length}
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-400 space-y-1">
                <div>Story ID: {debugData.storyInfo?.id}</div>
                <div>World ID: {debugData.actualWorldId}</div>
                <div>World Name: {debugData.worldInfo?.name}</div>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Chapter Progress Details</h3>
              
              {debugData.progress.length === 0 ? (
                <p className="text-gray-400">No progress records found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 text-gray-300">Chapter ID</th>
                        <th className="text-left py-2 text-gray-300">Completed</th>
                        <th className="text-left py-2 text-gray-300">World ID</th>
                        <th className="text-left py-2 text-gray-300">Created</th>
                        <th className="text-left py-2 text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {debugData.progress.map((record) => (
                        <tr key={record.id} className="border-b border-gray-800">
                          <td className="py-2 text-white">{record.chapter_id}</td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              record.is_completed 
                                ? 'bg-green-900/30 text-green-300' 
                                : 'bg-red-900/30 text-red-300'
                            }`}>
                              {record.is_completed ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="py-2 text-gray-400 text-xs">{record.world_id}</td>
                          <td className="py-2 text-gray-400">
                            {new Date(record.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-2">
                            {!record.is_completed && (
                              <button
                                onClick={() => markChapterCompleted(record.chapter_id)}
                                disabled={loading}
                                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                Mark Completed
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Started Chapters</h3>
              
              {debugData.conversations.length === 0 ? (
                <p className="text-gray-400">No conversations found.</p>
              ) : (
                <div className="space-y-2">
                  {debugData.conversations.map((conv, index) => {
                    const hasProgress = debugData.progress.some(p => p.chapter_id === conv.chapter_id);
                    const isCompleted = debugData.progress.some(p => p.chapter_id === conv.chapter_id && p.is_completed);
                    
                    return (
                      <div key={index} className="flex items-center justify-between bg-gray-800/30 p-3 rounded">
                        <div>
                          <span className="text-white">Chapter {conv.chapter_id}</span>
                          <span className="text-gray-400 ml-2">
                            (Started: {new Date(conv.created_at).toLocaleDateString()})
                          </span>
                          <span className="text-gray-500 ml-2 text-xs">
                            World: {conv.world_id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            isCompleted 
                              ? 'bg-green-900/30 text-green-300' 
                              : hasProgress
                              ? 'bg-yellow-900/30 text-yellow-300'
                              : 'bg-red-900/30 text-red-300'
                          }`}>
                            {isCompleted ? 'Completed' : hasProgress ? 'In Progress' : 'Not Tracked'}
                          </span>
                          {!isCompleted && (
                            <button
                              onClick={() => markChapterCompleted(conv.chapter_id)}
                              disabled={loading}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              Mark Completed
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Debug Information</h3>
              <pre className="bg-gray-800 p-3 rounded text-xs text-gray-300 overflow-x-auto">
                {JSON.stringify(debugData.debug, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 