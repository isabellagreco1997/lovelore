import { Story } from '@/types/database';
import ScenarioCard from './ScenarioCard';
import ScenarioLoadingCard from './ScenarioLoadingCard';

interface FeaturedScenariosProps {
  stories: Story[];
  loading: boolean;
}

const FeaturedScenarios = ({ stories, loading }: FeaturedScenariosProps) => (
  <div className="relative py-24 px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto">
      <h2 className="text-[3.5rem] leading-[0.9] mb-2 font-bold tracking-tight uppercase"">
        Try out one of these scenarios
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {loading ? (
          [...Array(3)].map((_, index) => <ScenarioLoadingCard key={index} />)
        ) : stories.length > 0 ? (
          stories.map((story) => <ScenarioCard key={story.id} story={story} />)
        ) : (
          <div className="col-span-3 text-center text-gray-400">
            No scenarios available at the moment.
          </div>
        )}
      </div>
    </div>
  </div>
);

export default FeaturedScenarios;