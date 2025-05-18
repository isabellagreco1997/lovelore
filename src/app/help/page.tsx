"use client";

import Layout from '@/components/Layout';

const HelpCenter = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-8">Help Center</h1>
          
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
            <div className="space-y-6">
              <div className="bg-gray-900/50 rounded-xl p-6">
                <h3 className="text-xl font-medium mb-3">Creating Your Account</h3>
                <p className="text-gray-300">
                  To begin your journey with LoveLore, simply click the "Sign In" button and create an account 
                  using your email address. Once verified, you'll have access to our collection of interactive stories.
                </p>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-6">
                <h3 className="text-xl font-medium mb-3">Choosing Your First Story</h3>
                <p className="text-gray-300">
                  Browse our collection of stories and select one that interests you. Each story includes a 
                  description and preview to help you choose. Click "Play Now" to begin your adventure.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Subscription & Payment</h2>
            <div className="space-y-6">
              <div className="bg-gray-900/50 rounded-xl p-6">
                <h3 className="text-xl font-medium mb-3">Subscription Plans</h3>
                <p className="text-gray-300 mb-4">We offer several subscription options:</p>
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li>Free Plan: Access to basic stories and features</li>
                  <li>Monthly Plan: Full access with monthly billing</li>
                  <li>Annual Plan: Our best value with yearly billing</li>
                  <li>One-Time Pass: 30-day access without subscription</li>
                </ul>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-6">
                <h3 className="text-xl font-medium mb-3">Managing Your Subscription</h3>
                <p className="text-gray-300">
                  You can manage your subscription settings, including upgrades, downgrades, and cancellations, 
                  from your Account page. Changes to your subscription will take effect at the end of your 
                  current billing period.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Using the Platform</h2>
            <div className="space-y-6">
              <div className="bg-gray-900/50 rounded-xl p-6">
                <h3 className="text-xl font-medium mb-3">Story Navigation</h3>
                <p className="text-gray-300">
                  Each story is divided into chapters. Complete the objective in each chapter to unlock the next one. 
                  You can track your progress and replay completed chapters at any time.
                </p>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-6">
                <h3 className="text-xl font-medium mb-3">Interacting with Stories</h3>
                <p className="text-gray-300">
                  Type your responses naturally to interact with the story. Our AI will understand your intent 
                  and respond accordingly, creating a unique narrative experience based on your choices.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div className="bg-gray-900/50 rounded-xl p-6">
                <h3 className="text-xl font-medium mb-3">Can I reset my story progress?</h3>
                <p className="text-gray-300">
                  Yes, you can reset your progress for any story from the story's main page. This will delete 
                  all conversations and chapter progress for that story.
                </p>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-6">
                <h3 className="text-xl font-medium mb-3">How do I change my password?</h3>
                <p className="text-gray-300">
                  Go to your Account page and select the "Security" tab. From there, you can update your 
                  password and manage other security settings.
                </p>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-6">
                <h3 className="text-xl font-medium mb-3">What payment methods do you accept?</h3>
                <p className="text-gray-300">
                  We accept all major credit and debit cards through our secure payment processor, Stripe.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Contact Support</h2>
            <div className="bg-gray-900/50 rounded-xl p-6">
              <p className="text-gray-300 mb-4">
                Need additional help? Our support team is here to assist you. Contact us at:
              </p>
              <p className="text-white font-medium">lovelore.contact@gmail.com</p>
              <p className="text-gray-400 mt-2 text-sm">
                We typically respond within 24 hours during business days.
              </p>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default HelpCenter;