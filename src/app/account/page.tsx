"use client";

import { useState } from 'react';
import Layout from '@/components/Layout';
import useUser from '@/hooks/useUser';
import useSupabase from '@/hooks/useSupabase';
import Auth from '@/components/Auth';

const AccountPage = () => {
  const { user, loading } = useUser();
  const supabase = useSupabase();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;

    try {
      setUpdating(true);
      setError(null);
      setSuccess(false);

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setUpdating(false);
    }
  };

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
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-8">Account Settings</h1>

            {/* Profile Section */}
            <div className="mb-12">
              <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                  <div className="text-white bg-black/40 px-4 py-3 rounded-xl border border-gray-800">
                    {user.email}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Member Since</label>
                  <div className="text-white bg-black/40 px-4 py-3 rounded-xl border border-gray-800">
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Password Update Section */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Update Password</h2>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                {error && (
                  <div className="bg-red-900/20 border border-red-500/20 text-red-400 p-4 rounded-xl">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-900/20 border border-green-500/20 text-green-400 p-4 rounded-xl">
                    Password updated successfully!
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={updating || !newPassword}
                  className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
                    updating || !newPassword
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-[#EC444B] text-white hover:bg-[#d83a40]'
                  }`}
                >
                  {updating ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AccountPage;