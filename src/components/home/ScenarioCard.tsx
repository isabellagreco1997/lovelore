import { useRouter } from 'next/navigation';
import { Story } from '@/types/database';

interface ScenarioCardProps {
  story: Story;
}

const ScenarioCard = ({ story }: ScenarioCardProps) => {
  const router = useRouter();
  
  return (
    <div className="bg-gray-900/50 rounded-xl overflow-hidden backdrop-blur-sm border border-gray-800 group">
      {story.image && (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={story.image} 
            alt={story.world_name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
        </div>
      )}
      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-4">{story.world_name}</h3>
        <p className="text-gray-400 mb-6 line-clamp-3">
          {story.description}
        </p>
        <button 
          onClick={() => router.push('/login')}
          className="w-full bg-[#EC444B]/10 text-[#EC444B] border border-[#EC444B]/20 rounded-lg px-4 py-2 hover:bg-[#EC444B]/20 transition-colors"
        >
          Play Now
        </button>
      </div>
    </div>
  );
};

export default ScenarioCard;