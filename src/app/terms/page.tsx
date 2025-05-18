"use client";

import Layout from '@/components/Layout';

const TermsOfService = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          
          <p className="text-gray-300 mb-8">Last updated: February 2025</p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300">
              By accessing and using LoveLore ("the Platform"), you agree to be bound by these Terms of Service 
              and all applicable laws and regulations. If you do not agree with any of these terms, you are 
              prohibited from using the Platform.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">2. User Accounts</h2>
            <p className="text-gray-300 mb-4">When creating an account, you agree to:</p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">3. Subscription and Payments</h2>
            <p className="text-gray-300 mb-4">
              Our subscription services and payment terms include:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Automatic renewal unless cancelled before the renewal date</li>
              <li>No refunds for partial subscription periods</li>
              <li>Right to modify pricing with advance notice</li>
              <li>Payment processing through Stripe</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">4. Content and Conduct</h2>
            <p className="text-gray-300 mb-4">Users must not:</p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Share inappropriate or harmful content</li>
              <li>Attempt to breach platform security</li>
              <li>Use the service for unauthorized commercial purposes</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
            <p className="text-gray-300">
              All content on the Platform, including but not limited to text, graphics, logos, and story content, 
              is the property of LoveLore or its content suppliers and is protected by international copyright laws.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">6. Platform Availability</h2>
            <p className="text-gray-300">
              We strive to provide uninterrupted service but do not guarantee the Platform will be available 
              at all times. We reserve the right to modify, suspend, or discontinue any part of the service 
              without prior notice.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-300">
              LoveLore shall not be liable for any indirect, incidental, special, consequential, or punitive 
              damages resulting from your use or inability to use the Platform.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">8. Changes to Terms</h2>
            <p className="text-gray-300">
              We reserve the right to modify these terms at any time. We will notify users of any material 
              changes via email or through the Platform.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
            <p className="text-gray-300">
              We reserve the right to terminate or suspend access to our service immediately, without prior 
              notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
            <p className="text-gray-300">
              For any questions about these Terms of Service, please contact us at:
              lovelore.contact@gmail.com
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default TermsOfService;