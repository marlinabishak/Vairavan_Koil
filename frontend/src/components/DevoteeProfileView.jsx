import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import SubpageLayout from './SubpageLayout';

export default function DevoteeProfileView() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword) {
      setError('Please enter your current password or registered mobile number');
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
      setError('New password must be different from your current password');
      return;
    }

    setSaving(true);
    try {
      const res = await api.changePassword({
        currentPassword,
        newPassword
      });

      setSuccess(res.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to change password. Please check your current password or registered mobile number.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SubpageLayout activePage="profile">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs bg-[#5c292c]/10 text-[#5c292c] font-bold px-2.5 py-0.5 rounded-full capitalize">
                Devotee Account
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#5c292c] tracking-tight">
              My Profile & Password
            </h1>
          </div>
        </div>

        {/* Section 1: Devotee Information Card */}
        <div className="bg-white rounded-[22px] shadow-sm border border-[#ebdccb] p-5 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#ebdccb]/60">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#5c292c]">Devotee Account Details</h2>
            </div>
            <Link
              to="/my-history"
              className="bg-[#5c292c] hover:bg-[#482022] text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm self-start sm:self-auto flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>View Attendance History →</span>
            </Link>
          </div>

          <div className="bg-[#faf8f7] p-4 sm:p-5 rounded-[18px] border border-[#ebdccb] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="block text-[11px] font-bold text-[#8c7b70] uppercase tracking-wider mb-1">
                Office Code / ID
              </span>
              <span className="inline-block font-mono font-bold text-sm text-[#5c292c] bg-white px-2.5 py-1 rounded-full border border-[#ebdccb]">
                {user?.username || '—'}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-bold text-[#8c7b70] uppercase tracking-wider mb-1">
                Devotee Full Name
              </span>
              <span className="font-semibold text-sm text-gray-800">
                {user?.name || '—'}
              </span>
            </div>

            {user?.email && (
              <div>
                <span className="block text-[11px] font-bold text-[#8c7b70] uppercase tracking-wider mb-1">
                  Registered Email
                </span>
                <span className="font-semibold text-sm text-gray-800 break-all">
                  {user.email}
                </span>
              </div>
            )}

            {user?.booking_date && (
              <div>
                <span className="block text-[11px] font-bold text-[#8c7b70] uppercase tracking-wider mb-1">
                  Kattalai Date
                </span>
                <span className="font-semibold text-sm text-gray-800">
                  {user.booking_date}
                </span>
              </div>
            )}

            {user?.star && (
              <div>
                <span className="block text-[11px] font-bold text-[#8c7b70] uppercase tracking-wider mb-1">
                  Star (நட்சத்திரம்)
                </span>
                <span className="font-semibold text-sm text-gray-800">
                  {user.star}
                </span>
              </div>
            )}

            {user?.place && (
              <div>
                <span className="block text-[11px] font-bold text-[#8c7b70] uppercase tracking-wider mb-1">
                  Native Place (ஊர்)
                </span>
                <span className="font-semibold text-sm text-gray-800">
                  {user.place}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Change Sign-in Password Card */}
        <div className="bg-white rounded-[22px] shadow-sm border border-[#ebdccb] p-5 sm:p-6 mb-6">
          <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[#ebdccb]/60">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#5c292c]">Change Sign-in Password</h2>
            </div>
            {success && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full animate-fade-in">
                ✓ {success}
              </span>
            )}
          </div>

          <form onSubmit={handlePasswordSubmit} className="bg-[#faf8f7] p-5 sm:p-6 rounded-[18px] border border-[#ebdccb] flex flex-col gap-4">
            
            {/* Current Password Field */}
            <div>
              <label className="block text-xs font-bold text-[#5c292c] mb-1.5 px-1">
                Current Password or Registered Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password or 10-digit mobile number"
                  required
                  className="w-full h-[40px] px-4 pr-10 rounded-full border border-[#e2d8cb] bg-white text-sm text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
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
            </div>

            {/* New Password & Confirm Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#5c292c] mb-1.5 px-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="w-full h-[40px] px-4 pr-10 rounded-full border border-[#e2d8cb] bg-white text-sm text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
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

              <div>
                <label className="block text-xs font-bold text-[#5c292c] mb-1.5 px-1">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  required
                  className="w-full h-[40px] px-4 rounded-full border border-[#e2d8cb] bg-white text-sm text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] shadow-xs"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-700 text-xs py-2 px-3.5 rounded-[12px] border border-red-200 font-medium">
                ⚠ {error}
              </div>
            )}



            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={saving}
                className="h-[40px] px-6 rounded-full bg-[#5c292c] hover:bg-[#482022] text-white font-semibold text-xs sm:text-sm transition-all shadow-sm shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Saving Password...' : 'Save New Password'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </SubpageLayout>
  );
}
