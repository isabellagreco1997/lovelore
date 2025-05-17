import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSupabase from '@/hooks/useSupabase';
import { Story } from '@/types/database';
import Link from 'next/link';

const StoryList = () => {
  const supabase = useSupabase();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!supabase) return;

    const fetchStories = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('stories')
          .select(`
            id,
            world_name,
            story_context,
            created_at,
            image,
            logo_image,
            description,
            chapters,
            worlds (
              genre
            )
          `);

        if (error) throw error;
        
        // Filter out anime stories and format the data
        const filteredStories = (data || [])
          .filter(story => story.worlds?.genre !== 'anime')
          .map(story => ({
            id: story.id,
            world_name: story.world_name,
            story_context: story.story_context,
            created_at: story.created_at,
            image: story.image,
            logo_image: story.logo_image,
            description: story.description,
            chapters: Array.isArray(story.chapters) ? story.chapters : []
          }));
        
        setStories(filteredStories);
      } catch (error: any) {
        console.error('Error fetching stories:', error.message);
        setError('Failed to load stories');
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600 animate-pulse">Loading your stories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md">
        <div className="flex items-center">
          <svg className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
        <div className="mb-6">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No stories yet</h3>
        <p className="text-gray-600 mb-6">Create your first story to begin your storytelling journey!</p>
        <button 
          onClick={() => router.push('/story/new')}
          className="inline-flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-600 text-white px-5 py-3 rounded-lg text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Create New Story
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {stories.map((story) => (
        <Link href={`/story/${story.id}`} key={story.id}>
          <div className="relative rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-[400px] group">
            {/* Image overlay */}
            <div className="absolute inset-0 z-0">
              {story.image ? (
                <img 
                  src={story.image} 
                  alt={story.world_name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-800 to-indigo-900 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">{story.world_name.charAt(0)}</span>
                </div>
              )}
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
            </div>
            
            {/* Content */}
            <div className="absolute inset-0 z-10 flex flex-col justify-between p-4">
              {/* Top section */}
              <div>
                <span className="inline-block bg-red-800/90 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Story
                </span>
                
                {/* Optional badge for chapter count */}
                {story.chapters && story.chapters.length > 0 && (
                  <span className="inline-block bg-purple-900/90 text-white px-4 py-1 rounded-full text-sm font-medium ml-2">
                    {story.chapters.length} {story.chapters.length === 1 ? 'episode' : 'episodes'}
                  </span>
                )}
              </div>
              
              {/* Bottom section */}
              <div>
                {/* Stats */}
                <div className="flex items-center space-x-3 mb-3">
                  {/* Like count */}
                  <div className="flex items-center">
                    <span className="text-red-500 mr-1">❤️</span>
                    <span className="text-white">{Math.floor(Math.random() * 10 + 1)}.{Math.floor(Math.random() * 10)}k</span>
                  </div>
                  
                  {/* Play count */}
                  <div className="flex items-center">
                    <span className="text-purple-400 mr-1">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                    <span className="text-white">{Math.floor(Math.random() * 90 + 10)}.{Math.floor(Math.random() * 10)}k</span>
                  </div>
                  
                  {/* Age restriction */}
                  <div className="flex items-center">
                    <span className="text-red-500 mr-1">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </span>
                    <span className="text-white">18+</span>
                  </div>
                </div>
                
                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-1 line-clamp-2">{story.world_name}</h3>
                
                {/* Description */}
                <p className="text-gray-300 text-sm line-clamp-2">{story.description}</p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default StoryList;