import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import useSupabase from '@/hooks/useSupabase';

interface AccountSecurityProps {
  user: User;
}

const AccountSecurity = ({ user }: AccountSecurityProps) => {
  const supabase = useSupabase();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [confirmOldPassword, setConfirmOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;

    if (oldPassword !== confirmOldPassword) {
      setPasswordsMatch(false);
      return;
    }

    try {
      setUpdating(true);
      setError(null);
      setSuccess(false);
      setPasswordsMatch(true);

      // Sign in with the old password to verify it's correct
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: oldPassword
      });

      if (signInError) throw new Error('Current password is incorrect');

      // Update to the new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccess(true);
      setOldPassword('');
      setConfirmOldPassword('');
      setNewPassword('');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-6">Security Settings</h2>
      
      {error && (
        <div className="bg-red-900/20 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      <h3 className="text-lg font-medium text-white mb-4">Change Password</h3>
      <form onSubmit={handleUpdatePassword} className="space-y-4">
        {success && (
          <div className="bg-green-900/20 border border-green-500/20 text-green-400 p-4 rounded-xl">
            Password updated successfully!
          </div>
        )}
        
        {!passwordsMatch && (
          <div className="bg-red-900/20 border border-red-500/20 text-red-400 p-4 rounded-xl">
            The current passwords you entered do not match
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Current Password</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter current password"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Confirm Current Password</label>
          <input
            type="password"
            value={confirmOldPassword}
            onChange={(e) => setConfirmOldPassword(e.target.value)}
            className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter current password again"
            required
          />
        </div>
        
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
          disabled={updating || !oldPassword || !confirmOldPassword || !newPassword}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
            updating || !oldPassword || !confirmOldPassword || !newPassword
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-[#EC444B] text-white hover:bg-[#d83a40]'
          }`}
        >
          {updating ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};

export default AccountSecurity;