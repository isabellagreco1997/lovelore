"use client";

import Layout from '@/components/Layout';

const PrivacyPolicy = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          
          <p className="text-gray-300 mb-8">Last updated: February 2025</p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p className="text-gray-300">
              LoveLore ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. 
              This privacy policy explains how we collect, use, and safeguard your information when you use our interactive 
              storytelling platform.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            <p className="text-gray-300 mb-4">We collect several types of information, including:</p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Account information (email address, username)</li>
              <li>Usage data (story interactions, preferences)</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Device and browser information</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <p className="text-gray-300 mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Provide and improve our services</li>
              <li>Process your payments</li>
              <li>Personalize your experience</li>
              <li>Communicate with you about your account</li>
              <li>Ensure platform security</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Data Storage and Security</h2>
            <p className="text-gray-300">
              Your data is stored securely using industry-standard encryption and security measures. 
              We use Supabase for database management and Stripe for payment processing, both of which 
              maintain high security standards.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <p className="text-gray-300 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to data processing</li>
              <li>Data portability</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Cookies</h2>
            <p className="text-gray-300">
              We use cookies to enhance your experience on our platform. These cookies help us 
              understand how you use our service and allow us to remember your preferences.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
            <p className="text-gray-300">
              We use trusted third-party services for specific functions:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Stripe for payment processing</li>
              <li>Supabase for database management</li>
              <li>DeepSeek for AI story generation</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-300">
              If you have any questions about this Privacy Policy, please contact us at:
              lovelore.contact@gmail.com
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;