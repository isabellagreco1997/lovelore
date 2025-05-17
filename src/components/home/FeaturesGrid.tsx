import FeatureCard from './FeatureCard';

const FeaturesGrid = () => (
  <div className="relative py-24 px-4 sm:px-6 lg:px-8 bg-black/80 backdrop-blur-sm">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <FeatureCard 
          number={1}
          title="Define your world"
          description="Pick a character, a world, or a story from thousands of community-made scenarios, or create your own! The AI will fill in the details for your unique adventure."
        />
        <FeatureCard 
          number={2}
          title="Take actions"
          description="You can decide what your character says or does. The AI will produce responses from other characters or world events for you to respond to."
        />
        <FeatureCard 
          number={3}
          title="Make it yours"
          description="Customize your adventure with custom theme combinations and advanced AI tweaks. Create cards for characters, locations, and more!"
        />
      </div>
    </div>
  </div>
);

export default FeaturesGrid;