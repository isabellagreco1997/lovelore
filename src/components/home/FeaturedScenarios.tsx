import { useState, useEffect, useRef } from 'react';
import { Story } from '@/types/database';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../LoadingSpinner';

interface FeaturedScenariosProps {
  stories: Story[];
  loading: boolean;
}

const FeaturedScenarios = ({ stories, loading }: FeaturedScenariosProps) => {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Check if component is mounted to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
    // Clear any hover scrolling when dragging starts
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    // Also clear hover state when mouse leaves carousel
    setHoverSide(null);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !carouselRef.current) return;
    const x = e.touches[0].pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Auto-scroll when hovering on left or right side
  useEffect(() => {
    if (!carouselRef.current || isDragging || !hoverSide) return;

    // Clean up any existing interval
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }

    scrollIntervalRef.current = setInterval(() => {
      if (!carouselRef.current) return;
      
      // Scroll speed (pixels per tick)
      const scrollAmount = hoverSide === 'left' ? -8 : 8;
      carouselRef.current.scrollLeft += scrollAmount;
    }, 16); // ~60fps

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, [hoverSide, isDragging]);

  // Auto-rotate carousel slides
  useEffect(() => {
    const interval = setInterval(() => {
      if (stories.length > 1) {
        setActiveIndex(prevIndex => (prevIndex + 1) % stories.length);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [stories]);

  // Function to smoothly scroll to a specific card
  const scrollToCard = (index: number) => {
    if (!carouselRef.current) return;
    
    const cardWidth = carouselRef.current.querySelector('[data-carousel-item]')?.clientWidth || 0;
    const gap = 16; // 4 in tailwind = 16px
    const scrollPosition = index * (cardWidth + gap);
    
    carouselRef.current.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    if (isMounted) {
      scrollToCard(activeIndex);
    }
  }, [activeIndex, isMounted]);

  return (
    <div className="w-screen relative py-24">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12 uppercase">
          Try out one of these scenarios
        </h2>
      </div>
        
      {/* Full bleed carousel - extended to edges */}
      <div className="w-screen overflow-hidden relative">
        {loading ? (
          <div className="flex gap-4 px-4 hide-scrollbar overflow-x-auto">
            {[...Array(4)].map((_, index) => (
              <LoadingSpinner
                key={index}
                variant="skeleton"
                skeleton={{
                  image: true,
                  lines: 3,
                  button: true,
                  height: "h-32"
                }}
                className="min-w-[calc(50%-8px)] sm:min-w-[calc(50%-8px)] md:min-w-[280px] h-[280px] sm:h-[320px] md:h-[350px] bg-gray-800/50 rounded-xl flex-shrink-0"
              />
            ))}
            <div className="min-w-[80px] flex-shrink-0"></div>
          </div>
        ) : stories.length > 0 ? (
          <div className="relative">
            {/* Hover zones for automatic scrolling */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-[15%] z-10 hidden md:block"
              onMouseEnter={() => setHoverSide('left')}
              onMouseLeave={() => setHoverSide(null)}
            />
            <div 
              className="absolute right-0 top-0 bottom-0 w-[15%] z-10 hidden md:block"
              onMouseEnter={() => setHoverSide('right')}
              onMouseLeave={() => setHoverSide(null)}
            />
            
            <div 
              ref={carouselRef}
              className="flex gap-4 px-4 hide-scrollbar overflow-x-auto pb-4 cursor-grab snap-x snap-mandatory"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
            >
              {stories.map((story, index) => (
                <div 
                  key={story.id}
                  data-carousel-item
                  onClick={() => router.push(`/login`)}
                  className="min-w-[calc(50%-8px)] sm:min-w-[calc(50%-8px)] md:min-w-[280px] h-[280px] sm:h-[320px] md:h-[350px] rounded-xl overflow-hidden flex-shrink-0 relative group cursor-pointer transform transition-all duration-300 hover:scale-[1.02] snap-start"
                >
                  {/* Image */}
                  {story.image ? (
                    <img 
                      src={story.image} 
                      alt={story.world_name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
                      <span className="text-white text-3xl opacity-50">📚</span>
                    </div>
                  )}
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70"></div>
                  
                  {/* Story name at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                    <h3 className="text-base md:text-xl font-bold text-white transition-colors duration-300 group-hover:text-[#EC444B] line-clamp-2">
                      {story.world_name}
                    </h3>
                  </div>
                  
                  {/* Play button that appears on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-[#EC444B]/90 text-white rounded-full p-3 md:p-4 transform scale-75 group-hover:scale-100 transition-all duration-300">
                      <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
              {/* Extra space at the end for bleeding effect */}
              <div className="min-w-[80px] flex-shrink-0"></div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 px-4">
            No scenarios available at the moment.
          </div>
        )}
        
        {/* Visual indicators for hover zones (desktop only) */}
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${hoverSide === 'left' ? 'opacity-80' : 'opacity-0'}`}>
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </div>
        <div className={`absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${hoverSide === 'right' ? 'opacity-80' : 'opacity-0'}`}>
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        
        {/* Mobile swipe indicator (visible only on small screens) */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center md:hidden">
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white/80">
            Swipe to see more
          </div>
        </div>
        
        {/* Overlay gradient on right edge for the bleeding effect */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent pointer-events-none"></div>
      </div>
      
      {/* Pagination dots */}
      <div className="max-w-7xl mx-auto px-4">
        {stories.length > 1 && (
          <div className="flex justify-center mt-6 space-x-2">
            {stories.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === activeIndex ? 'bg-[#EC444B] w-6' : 'bg-white/40'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Add the CSS for hiding scrollbar */}
      <style jsx global>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        @media (max-width: 768px) {
          .snap-mandatory {
            scroll-snap-type: x mandatory;
          }
          .snap-start {
            scroll-snap-align: start;
          }
        }
      `}</style>
    </div>
  );
};

export default FeaturedScenarios;