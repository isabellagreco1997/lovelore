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
          .select('*');

        if (error) throw error;
        
        // Transform the data to match our Story type
        const formattedStories = data?.map(story => ({
          ...story,
          chapters: Array.isArray(story.chapters) ? story.chapters : []
        })) || [];
        
        setStories(formattedStories);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="bg-gray-900 rounded-xl overflow-hidden shadow-lg h-[400px]">
            <div className="h-48 bg-gray-800"></div>
            <div className="p-6 space-y-4">
              <div className="h-4 bg-gray-800 rounded w-3/4"></div>
              <div className="h-4 bg-gray-800 rounded w-1/2"></div>
              <div className="h-4 bg-gray-800 rounded w-5/6"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border-l-4 border-red-500 p-6 rounded-lg shadow-lg">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-red-900/30 flex items-center justify-center">
              <span className="text-red-500 text-lg">!</span>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-red-300">Error Loading Stories</h3>
            <p className="mt-1 text-red-200">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-3 bg-red-900/30 text-red-300 px-4 py-2 rounded-md hover:bg-red-900/40 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="bg-indigo-900/30 rounded-xl shadow-xl p-12 text-center border border-indigo-800/30 backdrop-blur-sm">
        <div className="mb-8">
          <div className="mx-auto h-20 w-20 rounded-full bg-indigo-900/50 flex items-center justify-center border border-indigo-700/30">
            <span className="text-3xl">📚</span>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-white mb-4">Begin Your Journey</h3>
        <p className="text-indigo-200 mb-8 max-w-md mx-auto">
          Your story collection is empty. Start by creating your first interactive narrative and bring your imagination to life.
        </p>
        <button 
          onClick={() => router.push('/story/new')}
          className="inline-flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
        >
          <span className="mr-2">✨</span>
          Create Your First Story
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {stories.map((story, index) => (
          <Link 
            href={`/story/${story.id}`} 
            key={story.id}
            className="group relative bg-indigo-900/20 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 border border-indigo-800/30 backdrop-blur-sm"
          >
            {/* Card Content */}
            <div className="relative h-[400px]">
              {/* Background Image with Gradient Overlay */}
              <div className="absolute inset-0">
                {story.image ? (
                  <img 
                    src={story.image} 
                    alt={story.world_name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">{story.world_name.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900 via-indigo-900/70 to-transparent opacity-90 group-hover:opacity-75 transition-opacity duration-500"></div>
              </div>

              {/* Content Overlay */}
              <div className="relative h-full flex flex-col justify-between p-6">
                {/* Top Section */}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-900/70 text-purple-200 border border-purple-700/30">
                      Interactive Story
                    </span>
                    {story.chapters && story.chapters.length > 0 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-900/70 text-indigo-200 border border-indigo-700/30">
                        {story.chapters.length} {story.chapters.length === 1 ? 'Chapter' : 'Chapters'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Section */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white group-hover:text-purple-200 transition-colors duration-300">
                    {story.world_name}
                  </h3>
                  
                  <p className="text-indigo-200 line-clamp-2 text-sm">
                    {story.description}
                  </p>

                  {/* Stats Row */}
                  <div className="flex items-center space-x-4 text-sm text-indigo-200">
                    <div className="flex items-center">
                      <span className="mr-1">👥</span>
                      <span>{Math.floor(Math.random() * 10 + 1)}.{Math.floor(Math.random() * 10)}k</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-1">❤️</span>
                      <span>{Math.floor(Math.random() * 90 + 10)}%</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-1">⏱️</span>
                      <span>{Math.floor(Math.random() * 30 + 15)} min</span>
                    </div>
                  </div>

                  {/* Play Button */}
                  <button className="w-full bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-colors duration-300 backdrop-blur-sm border border-white/10">
                    Begin Story
                  </button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default StoryList;