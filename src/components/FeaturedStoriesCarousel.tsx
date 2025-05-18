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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const featuredStories = stories.slice(0, 5); // Show up to 5 stories

  useEffect(() => {
    const interval = setInterval(() => {
      if (featuredStories.length > 1) {
        handleNextSlide();
      }
    }, 6000); // Slightly longer interval for better readability
    
    return () => clearInterval(interval);
  }, [featuredStories, activeSlide]);

  const handleNextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveSlide((prev) => (prev === featuredStories.length - 1 ? 0 : prev + 1));
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handlePrevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveSlide((prev) => (prev === 0 ? featuredStories.length - 1 : prev - 1));
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === activeSlide) return;
    setIsTransitioning(true);
    setActiveSlide(index);
    setTimeout(() => setIsTransitioning(false), 500);
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
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg font-medium transform hover:scale-105 transition-all duration-300"
            >
              Create a Story
            </button>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 w-full h-full">
          {featuredStories.map((story, index) => (
            <div 
              key={story.id}
              className={`absolute inset-0 w-full h-full transition-all duration-500 ease-in-out transform ${
                index === activeSlide 
                  ? 'opacity-100 translate-x-0 z-10' 
                  : index < activeSlide
                    ? 'opacity-0 -translate-x-full z-0'
                    : 'opacity-0 translate-x-full z-0'
              }`}
            >
              <div className="absolute inset-0 z-0">
                <div className="w-full h-full bg-gradient-to-br from-blue-900 to-indigo-900">
                  {story.image && (
                    <div className="relative w-full h-full">
                      <img 
                        src={story.image} 
                        alt={story.world_name} 
                        className="w-full h-full object-cover opacity-70 transition-transform duration-700 scale-105 hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/90 backdrop-blur-[2px]"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50"></div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="relative z-10 flex flex-col md:flex-row w-full h-full max-w-screen-2xl mx-auto px-8 md:px-16">
                <div className="w-full md:w-6/12 lg:w-7/12 flex items-center justify-center p-8">
                  {story.logo_image ? (
                    <img 
                      src={story.logo_image} 
                      alt={`${story.world_name} logo`}
                      className="max-w-md w-full h-auto object-contain filter drop-shadow-2xl"
                    />
                  ) : null}
                </div>
                
                <div className="w-full md:w-6/12 lg:w-5/12 p-8 flex flex-col justify-center space-y-8">
                  <div className="space-y-6 transform transition-all duration-500 delay-200">
                    <div className="flex items-center space-x-6 text-white/90">
                      <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        <span>{Math.floor(Math.random() * 20 + 5)}.{Math.floor(Math.random() * 10)}k playing</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                        <span className="text-red-400">♥</span>
                        <span>{Math.floor(Math.random() * 150 + 30)}%</span>
                      </div>
                    </div>
                    
                    <h2 className="text-5xl font-bold text-white leading-tight">{story.world_name}</h2>
                    
                    <p className="text-gray-200 text-lg leading-relaxed line-clamp-3">
                      {story.description}
                    </p>
                    
                    <div className="flex flex-col space-y-4">
                      <button 
                        onClick={() => router.push(`/story/${story.id}`)} 
                        className="group relative overflow-hidden bg-[#EC444B] hover:bg-[#d83a40] text-white px-8 py-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
                      >
                        <span className="relative z-10 flex items-center justify-center text-lg">
                          Play Now
                          <span className="ml-2">→</span>
                        </span>
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700"></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {featuredStories.length > 1 && (
            <>
              <button 
                onClick={handlePrevSlide}
                className="absolute left-8 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-4 z-20 backdrop-blur-sm transition-all duration-300 transform hover:scale-110"
              >
                <span className="sr-only">Previous</span>
                <span className="block w-6 h-6 border-l-2 border-b-2 transform -rotate-45"></span>
              </button>
              <button 
                onClick={handleNextSlide}
                className="absolute right-8 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-4 z-20 backdrop-blur-sm transition-all duration-300 transform hover:scale-110"
              >
                <span className="sr-only">Next</span>
                <span className="block w-6 h-6 border-r-2 border-t-2 transform rotate-45"></span>
              </button>
            </>
          )}
          
          {featuredStories.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-4 z-20">
              {featuredStories.map((_, index) => (
                <button 
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-12 h-1 rounded-full transition-all duration-300 transform hover:scale-110 ${
                    index === activeSlide 
                      ? 'bg-white scale-110' 
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                ></button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeaturedStoriesCarousel;