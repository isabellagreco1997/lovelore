"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import useUser from '@/hooks/useUser';
import useSupabase from '@/hooks/useSupabase';
import Auth from '@/components/Auth';
import SubscriptionManager from '@/components/account/SubscriptionManager';
import AccountSecurity from '@/components/account/AccountSecurity';
import ProfileSection from '@/components/account/ProfileSection';

// Extract the part that uses useSearchParams into a separate component
const TabHandler = ({ setActiveTab }: { setActiveTab: (tab: 'profile' | 'subscription' | 'security') => void }) => {
  const searchParams = useSearchParams();
  
  // Read tab parameter from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'subscription' || tabParam === 'security' || tabParam === 'profile') {
      setActiveTab(tabParam);
    }
  }, [searchParams, setActiveTab]);
  
  return null; // This component doesn't render anything
};

const AccountPage = () => {
  const { user, loading } = useUser();
  const supabase = useSupabase();
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'security'>('profile');

  // Suspense boundary around the component that uses useSearchParams
  useEffect(() => {
    // Set default tab (in case there's no URL param)
    setActiveTab('profile');
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <Layout>
      <Suspense fallback={null}>
        <TabHandler setActiveTab={setActiveTab} />
      </Suspense>
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden">
          <div className="border-b border-gray-800">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'text-white border-b-2 border-[#EC444B]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('subscription')}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'subscription'
                    ? 'text-white border-b-2 border-[#EC444B]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Subscription
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'security'
                    ? 'text-white border-b-2 border-[#EC444B]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Security
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'profile' && <ProfileSection user={user} />}
            {activeTab === 'subscription' && <SubscriptionManager user={user} />}
            {activeTab === 'security' && <AccountSecurity user={user} />}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AccountPage;