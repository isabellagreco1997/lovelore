import FAQItem from './FAQItem';

const FAQSection = () => (
  <div className="relative py-24 px-4 sm:px-6 lg:px-8 bg-black/80 backdrop-blur-sm">
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12 uppercase">
        Frequently Asked Questions
      </h2>
      <div className="space-y-8">
        <FAQItem 
          question="What is LoveLore?"
          answer="LoveLore is an interactive storytelling platform where you can experience and create unique romantic narratives. Our AI-powered system adapts to your choices, creating personalized story experiences."
        />
        <FAQItem 
          question="Is it free to use?"
          answer="LoveLore offers both free and premium content. You can start with free scenarios and upgrade to access exclusive stories, advanced customization options, and more features."
        />
        <FAQItem 
          question="How does the AI storytelling work?"
          answer="Our advanced AI understands context and creates dynamic responses to your choices. It remembers your previous decisions and adapts the story accordingly, ensuring each playthrough is unique and personalized."
        />
        <FAQItem 
          question="Can I create my own stories?"
          answer="Yes! LoveLore provides tools for creating and sharing your own interactive stories. You can customize characters, settings, and plot points, then share them with the community."
        />
        <FAQItem 
          question="Is my data secure?"
          answer="We take privacy seriously. Your personal information and story progress are protected with industry-standard encryption. You can enjoy our platform knowing your data is safe and secure."
        />
      </div>
    </div>
  </div>
);

export default FAQSection;