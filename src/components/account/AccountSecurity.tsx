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
  );
};

export default AccountSecurity;