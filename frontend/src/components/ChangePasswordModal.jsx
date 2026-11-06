import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword) {
      setError('Please enter your current password');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from current password');
      return;
    }

    setSaving(true);
    try {
      const res = await api.changePassword({
        currentPassword,
        newPassword
      });

      setSuccess(res.message || 'Password changed successfully!');
      setTimeout(() => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 p-4 flex items-center justify-center overflow-y-auto animate-fade-in font-barlow">
      <div className="relative shadow-2xl flex flex-col p-6 bg-[#f7f1e5] border border-[#ebdccb] rounded-[26px] max-w-[430px] w-full my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#ebdccb]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#5c292c] tracking-tight leading-none">
                Change Password
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Update your account sign-in password
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8c8075] hover:text-[#5c292c] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Info Pill */}
        <div className="mt-3 px-3 py-1.5 bg-white/70 rounded-full border border-[#ebdccb] text-[11.5px] text-gray-600 flex items-center justify-between">
          <span>Account: <strong className="text-[#5c292c]">{user?.name}</strong></span>
          <span className="font-mono text-gray-500">{user?.username}</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-3">

          {/* Current Password */}
          <div>
            <label className="block text-[#5c292c] font-bold text-xs mb-1 px-1">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={user?.role === 'user' ? 'Enter current password or mobile number' : 'Enter current password'}
                required
                className="h-[38px] px-4 pr-10 rounded-full border border-[#e2d8cb] bg-white font-barlow text-[13.5px] text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] w-full shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                {showCurrent ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {user?.role === 'user' && (
              <p className="text-[10.5px] text-gray-500 mt-1 px-1">
                Tip: If you haven't changed your password yet, use your registered 10-digit mobile number.
              </p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-[#5c292c] font-bold text-xs mb-1 px-1">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                className="h-[38px] px-4 pr-10 rounded-full border border-[#e2d8cb] bg-white font-barlow text-[13.5px] text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] w-full shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                {showNew ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-[#5c292c] font-bold text-xs mb-1 px-1">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
              className="h-[38px] px-4 rounded-full border border-[#e2d8cb] bg-white font-barlow text-[13.5px] text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] w-full shadow-sm"
            />
          </div>

          {/* Feedback */}
          {error && (
            <div className="bg-red-50 text-red-700 text-xs py-2 px-3 rounded-xl border border-red-200 font-medium">
              ⚠ {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 text-emerald-800 text-xs py-2 px-3.5 rounded-full border border-emerald-200 text-center font-medium animate-fade-in">
              ✓ {success}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ebdccb] mt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2 rounded-full border border-[#5c292c] text-[#5c292c] font-semibold text-xs bg-white hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-full bg-[#5c292c] hover:bg-[#482022] text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
