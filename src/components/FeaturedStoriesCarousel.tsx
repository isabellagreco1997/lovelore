import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Story } from '@/types/database';
import ImageWithLoading from './ImageWithLoading';

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
    }, 6000);
    
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
    <div className="relative overflow-hidden h-[650px] md:h-[650px] w-full">
      {loading ? (
        <div className="absolute inset-0 bg-black/90 transition-opacity duration-500">
          <div className="h-full flex flex-col items-center justify-center">
            <div className="space-y-8 w-full max-w-2xl px-4">
              {/* Loading title */}
              <div className="h-12 bg-gray-800/50 rounded-lg animate-pulse"></div>
              
              {/* Loading description */}
              <div className="space-y-3">
                <div className="h-4 bg-gray-800/50 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-800/50 rounded animate-pulse w-5/6"></div>
                <div className="h-4 bg-gray-800/50 rounded animate-pulse w-4/6"></div>
              </div>
              
              {/* Loading button */}
              <div className="h-12 bg-gray-800/50 rounded-lg w-1/3 animate-pulse"></div>
            </div>
          </div>
        </div>
      ) : featuredStories.length === 0 ? (
        <div className="absolute inset-0 bg-black/90 transition-opacity duration-500 flex items-center justify-center">
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
              <div className="flex h-full flex-col md:flex-row">
                {/* Image Section - Full width on mobile, Left Half on desktop */}
                <div className="w-full h-1/2 md:w-1/2 md:h-full relative overflow-hidden">
                  {story.image && (
                    <div className="absolute inset-0">
                      <ImageWithLoading 
                        src={story.image} 
                        alt={story.world_name} 
                        className="w-full h-full object-cover"
                      />
                      {/* Multi-layer gradient */}
                      <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-transparent via-black/40 to-black/90"></div>
                      <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-transparent via-transparent to-black opacity-80"></div>
                      <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-r from-transparent to-black"></div>
                    </div>
                  )}
                </div>

                {/* Content Section - Bottom Half on mobile, Right Half on desktop */}
                <div className="w-full h-1/2 md:w-1/2 md:h-full flex items-center justify-center p-6 md:p-16 bg-black">
                  <div className="max-w-xl">
                    <div className="space-y-4 md:space-y-6 transform transition-all duration-500 delay-200">
                      <div className="flex flex-wrap gap-2 md:gap-4">
                        <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                          <span className="text-sm md:text-base">{Math.floor(Math.random() * 20 + 5)}.{Math.floor(Math.random() * 10)}k playing</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                          <span className="text-red-400">♥</span>
                          <span className="text-sm md:text-base">{Math.floor(Math.random() * 150 + 30)}%</span>
                        </div>
                      </div>

                      {story.logo_image ? (
                        <ImageWithLoading 
                          src={story.logo_image} 
                          alt={`${story.world_name} logo`}
                          className="h-16 md:h-24 object-contain mb-4 md:mb-6"
                        />
                      ) : (
                        <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4 md:mb-6 uppercase">{story.world_name}</h2>
                      )}
                      
                      <p className="text-gray-200 text-base md:text-lg leading-relaxed line-clamp-2 md:line-clamp-3">
                        {story.description}
                      </p>
                      
                      <div className="flex flex-col space-y-4 pt-4 md:pt-6">
                        <button 
                          onClick={() => router.push(`/story/${story.id}`)} 
                          className="group relative overflow-hidden bg-[#EC444B] hover:bg-[#d83a40] text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-2xl text-sm md:text-lg"
                        >
                          <span className="relative z-10 flex items-center justify-center">
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
            </div>
          ))}
          
          {featuredStories.length > 1 && (
            <>
              <button 
                onClick={handlePrevSlide}
                className="absolute left-4 md:left-8 top-1/4 md:top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-3 md:p-4 z-20 backdrop-blur-sm transition-all duration-300 hover:scale-110"
              >
                <span className="sr-only">Previous</span>
                <span className="block w-4 h-4 md:w-6 md:h-6 border-l-2 border-t-2 transform -rotate-45"></span>
              </button>
              <button 
                onClick={handleNextSlide}
                className="absolute right-4 md:right-8 top-1/4 md:top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-3 md:p-4 z-20 backdrop-blur-sm transition-all duration-300 hover:scale-110"
              >
                <span className="sr-only">Next</span>
                <span className="block w-4 h-4 md:w-6 md:h-6 border-r-2 border-t-2 transform rotate-45"></span>
              </button>
            </>
          )}
          
          {featuredStories.length > 1 && (
            <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex space-x-2 md:space-x-4 z-20">
              {featuredStories.map((_, index) => (
                <button 
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-8 md:w-12 h-1 rounded-full transition-all duration-300 transform hover:scale-110 ${
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