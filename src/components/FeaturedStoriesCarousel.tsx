import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Story } from '@/types/database';

interface FeaturedStoriesCarouselProps {
  stories: Story[];
  loading: boolean;
}

const FeaturedStoriesCarousel = ({ stories, loading }: FeaturedStoriesCarouselProps) => {
  const router = useRouter();
  const [activeSlide, setActiveSlide] = useState(0);
  const featuredStories = stories.slice(0, 3); // Limit to first 3 stories

  // Auto-advance the carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (featuredStories.length > 1) {
        nextSlide();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [featuredStories, activeSlide]);

  const nextSlide = () => {
    setActiveSlide((prev) => (prev === featuredStories.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? featuredStories.length - 1 : prev - 1));
  };

  const goToSlide = (index: number) => {
    setActiveSlide(index);
  };

  return (
    <div className="relative overflow-hidden h-[650px] w-full">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            <p className="mt-4 text-white animate-pulse">Loading featured stories...</p>
          </div>
        </div>
      ) : featuredStories.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900">
          <div className="text-center max-w-md px-6">
            <h3 className="text-2xl font-bold text-white mb-4">No featured stories yet</h3>
            <p className="text-gray-300 mb-6">Create your first story to see it featured in this carousel!</p>
            <button 
              onClick={() => router.push('/story/new')} 
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg font-medium"
            >
              Create a Story
            </button>
          </div>
        </div>
      ) : (
        /* Carousel Container */
        <div className="absolute inset-0 w-full h-full">
          {/* Carousel slides */}
          {featuredStories.map((story, index) => (
            <div 
              key={story.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${
                index === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              {/* Background Image */}
              <div className="absolute inset-0 z-0">
                <div className="w-full h-full bg-gradient-to-br from-blue-900 to-indigo-900">
                  {story.image ? (
                    <img 
                      src={story.image} 
                      alt={story.world_name} 
                      className="w-full h-full object-cover opacity-70"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/70"></div>
                </div>
              </div>
              
              {/* Content */}
              <div className="relative z-10 flex flex-col md:flex-row w-full h-full max-w-screen-2xl mx-auto px-8 md:px-16">
                {/* Left Content (Empty for Image Space) */}
                <div className="w-full md:w-6/12 lg:w-7/12"></div>
                
                {/* Right Content */}
                <div className="w-full md:w-6/12 lg:w-5/12 p-8 flex flex-col justify-center space-y-6">
                  {/* Stats */}
                  <div className="flex items-center space-x-6 text-white">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{Math.floor(Math.random() * 20 + 5)}.{Math.floor(Math.random() * 10)}k</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>{Math.floor(Math.random() * 150 + 30)}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{Math.floor(Math.random() * 30 + 5)} min</span>
                    </div>
                  </div>
                  
                  {/* Title and Description */}
                  <h2 className="text-4xl font-bold text-white">{story.world_name}</h2>
                  <p className="text-gray-200 text-base line-clamp-3 md:line-clamp-4">
                    {story.description}
                  </p>
                  
                  {/* Play Button */}
                  <div>
                    <button 
                      onClick={() => router.push(`/story/${story.id}`)} 
                      className="bg-[#EC444B] hover:bg-[#d83a40] text-white px-8 py-4 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl w-full text-lg"
                    >
                      Play now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Navigation Arrows */}
      {featuredStories.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            className="absolute left-8 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-3 z-20"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-8 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-3 z-20"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
      
      {/* Indicator Dots */}
      {featuredStories.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3 z-20">
          {featuredStories.map((_, index) => (
            <button 
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === activeSlide ? 'bg-white scale-110' : 'bg-white/40 hover:bg-white/60'
              }`}
            ></button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturedStoriesCarousel; 