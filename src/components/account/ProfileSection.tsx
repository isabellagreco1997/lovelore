import { User } from '@supabase/supabase-js';

interface ProfileSectionProps {
  user: User;
}

const ProfileSection = ({ user }: ProfileSectionProps) => {
  return (
    <div>
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
  );
};

export default ProfileSection;