"use client";

import { useState } from 'react';
import Layout from '@/components/Layout';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    try {
      // Here you would typically send the email using your preferred method
      // For now, we'll simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-8">Contact Us</h1>

          <div className="mb-12">
            <p className="text-gray-300">
              Have a question, suggestion, or found an issue? We'd love to hear from you! Fill out the form below
              or email us directly at <a href="mailto:lovelore.contact@gmail.com" className="text-[#EC444B] hover:text-[#d83a40]">
              lovelore.contact@gmail.com</a>
            </p>
          </div>

          <div className="bg-gray-900/50 rounded-xl p-8 backdrop-blur-sm border border-gray-800">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#EC444B] focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#EC444B] focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#EC444B] focus:border-transparent"
                  placeholder="What's this about?"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#EC444B] focus:border-transparent resize-none"
                  placeholder="Tell us what's on your mind..."
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className={`w-full py-4 px-6 rounded-xl font-medium text-lg transition-all duration-300 ${
                    status === 'sending'
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-[#EC444B] text-white hover:bg-[#d83a40] transform hover:scale-105'
                  }`}
                >
                  {status === 'sending' ? 'Sending...' : 'Send Message'}
                </button>
              </div>

              {status === 'success' && (
                <div className="bg-green-900/20 border border-green-500/20 text-green-400 p-4 rounded-xl">
                  Thank you for your message! We'll get back to you soon.
                </div>
              )}

              {status === 'error' && (
                <div className="bg-red-900/20 border border-red-500/20 text-red-400 p-4 rounded-xl">
                  Something went wrong. Please try again or email us directly.
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactPage;