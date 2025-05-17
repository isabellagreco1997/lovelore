interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem = ({ question, answer }: FAQItemProps) => (
  <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm border border-gray-800">
    <h3 className="text-xl font-bold text-white mb-3">{question}</h3>
    <p className="text-gray-400">{answer}</p>
  </div>
);

export default FAQItem;