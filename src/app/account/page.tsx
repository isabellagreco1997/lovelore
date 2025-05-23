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
import LoadingSpinner from '@/components/LoadingSpinner';

const TabHandler = ({ setActiveTab }: { setActiveTab: (tab: 'profile' | 'subscription' | 'security') => void }) => {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'subscription' || tabParam === 'security' || tabParam === 'profile') {
      setActiveTab(tabParam);
    }
  }, [searchParams, setActiveTab]);
  
  return null;
};

const AccountPage = () => {
  const { user, loading } = useUser();
  const supabase = useSupabase();
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'security'>('profile');

  useEffect(() => {
    setActiveTab('profile');
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
            <div className="border-b border-gray-800">
              <nav className="flex animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="h-4 w-20 bg-gray-800 rounded"></div>
                  </div>
                ))}
              </nav>
            </div>
            <div className="p-6">
              <LoadingSpinner
                variant="skeleton"
                skeleton={{
                  lines: 4,
                  height: "h-[400px]"
                }}
                className="bg-black/40 rounded-xl border border-gray-800"
              />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <Layout>
      <Suspense fallback={<div>Loading...</div>}>
        <TabHandler setActiveTab={setActiveTab} />
      </Suspense>
      
      <div className="max-w-3xl mx-auto">
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
          <div className="border-b border-gray-800">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'text-white border-b-2 border-[#EC444B]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('subscription')}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'subscription'
                    ? 'text-white border-b-2 border-[#EC444B]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Subscription
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'security'
                    ? 'text-white border-b-2 border-[#EC444B]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Security
              </button>
            </nav>
          </div>

          <div className="p-6">
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