"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import useSupabase from '@/hooks/useSupabase';
import { Story } from '@/types/database';

const StoriesPage = () => {
  const supabase = useSupabase();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [genres, setGenres] = useState<string[]>([]);

  useEffect(() => {
    if (!supabase) return;

    const fetchStories = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('stories')
          .select('*');

        if (error) throw error;

        // Process and filter stories
        const processedStories = (data || []).map(story => ({
          ...story,
          chapters: Array.isArray(story.chapters) ? story.chapters : []
        }));

        setStories(processedStories);

        // Extract unique genres
        const uniqueGenres = [...new Set(processedStories.map(story => story.genre || 'Other'))];
        setGenres(uniqueGenres);
      } catch (error) {
        console.error('Error fetching stories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [supabase]);

  // Filter stories based on search query and genre
  const filteredStories = stories.filter(story => {
    const matchesSearch = story.world_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         story.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || story.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filter Section */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search stories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#EC444B] focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                  🔍
                </span>
              </div>
            </div>

            {/* Genre Filter */}
            <div className="md:w-64">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#EC444B] focus:border-transparent"
              >
                <option value="all">All Genres</option>
                {genres.map((genre) => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stories Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-gray-900/50 rounded-xl h-[400px] animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <a
                key={story.id}
                href={`/story/${story.id}`}
                className="group relative rounded-xl overflow-hidden h-[400px] transition-transform hover:-translate-y-1"
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  {story.image ? (
                    <img
                      src={story.image}
                      alt={story.world_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-800 to-indigo-900"></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                </div>

                {/* Content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                  <div>
                    <span className="inline-block bg-[#EC444B]/90 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {story.genre || 'Other'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{story.world_name}</h3>
                    <p className="text-gray-300 line-clamp-2">{story.description}</p>

                    {/* Stats */}
                    <div className="flex items-center space-x-4 mt-4">
                      <div className="flex items-center">
                        <span className="text-red-500 mr-1">❤️</span>
                        <span className="text-white">{Math.floor(Math.random() * 10 + 1)}.{Math.floor(Math.random() * 10)}k</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-[#EC444B] mr-1">✦</span>
                        <span className="text-white">{story.chapters.length} chapters</span>
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && filteredStories.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl text-gray-400">No stories found matching your criteria</h3>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StoriesPage;