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

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: oldPassword
      });

      if (signInError) throw new Error('Current password is incorrect');

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccess(true);
      setOldPassword('');
      setConfirmOldPassword('');
      setNewPassword('');
    } catch (error: any) {
      setError(error.message || 'An error occurred during authentication');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
        <span className="w-8 h-8 mr-3 rounded-full bg-[#EC444B] flex items-center justify-center shadow-sm">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </span>
        Security Settings
      </h2>
      
      <div className="bg-black/40 border border-gray-800 rounded-xl p-6 hover:border-[#EC444B]/50 transition-colors duration-300">
        <h3 className="text-xl font-semibold text-white mb-6">Change Password</h3>
        
        <form onSubmit={handleUpdatePassword} className="space-y-6">
          {success && (
            <div className="bg-green-900/20 border border-green-500/20 text-green-400 p-4 rounded-xl">
              Password updated successfully!
            </div>
          )}
          
          {error && (
            <div className="bg-red-900/20 border border-red-500/20 text-red-400 p-4 rounded-xl">
              {error}
            </div>
          )}
          
          {!passwordsMatch && (
            <div className="bg-red-900/20 border border-red-500/20 text-red-400 p-4 rounded-xl">
              The current passwords you entered do not match
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Current Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#EC444B] focus:border-transparent transition-colors"
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
                className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#EC444B] focus:border-transparent transition-colors"
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
                className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#EC444B] focus:border-transparent transition-colors"
                placeholder="Enter new password"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={updating || !oldPassword || !confirmOldPassword || !newPassword}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
              updating || !oldPassword || !confirmOldPassword || !newPassword
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-[#EC444B] text-white hover:bg-[#d83a40] transform hover:scale-[1.02]'
            }`}
          >
            {updating ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccountSecurity;