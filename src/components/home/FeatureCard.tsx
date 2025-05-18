interface FeatureCardProps {
  number: number;
  title: string;
  description: string;
}

const FeatureCard = ({ number, title, description }: FeatureCardProps) => (
  <div className="text-center">
    <div className="w-12 h-12 bg-[#EC444B] rounded-full flex items-center justify-center mx-auto mb-6">
      <span className="text-2xl">{number}</span>
    </div>
    <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);

export default FeatureCard;