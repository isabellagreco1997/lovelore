import FeatureCard from './FeatureCard';

const FeaturesGrid = () => (
  <div className="relative py-24 px-4 sm:px-6 lg:px-8 bg-black/80 backdrop-blur-sm">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <FeatureCard 
          number={1}
          title="Choose your story"
          description="Select from our curated collection of characters and story scenarios. Enjoy pre-built worlds where the AI will guide your unique adventure."
        />
        <FeatureCard 
          number={2}
          title="Take actions"
          description="Decide what your character says or does within the story. The AI responds with engaging character interactions and world events for you to react to."
        />
        <FeatureCard 
          number={3}
          title="Enjoy the journey"
          description="Immerse yourself in professionally crafted narratives. Experience rich storytelling with unique characters and captivating plots designed for your entertainment."
        />
      </div>
    </div>
  </div>
);

export default FeaturesGrid;