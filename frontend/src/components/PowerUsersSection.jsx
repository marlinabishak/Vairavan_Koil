import { useState, useEffect } from 'react';
import { api } from '../api/client';

const ROLE_CONFIG = {
  president: {
    title: 'President',
    icon: (
      <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    isOtpKeyholder: true,
    bgBadge: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  treasurer: {
    title: 'Treasurer',
    icon: (
      <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    isOtpKeyholder: true,
    bgBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  secretary: {
    title: 'Secretary',
    icon: (
      <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    isOtpKeyholder: true,
    bgBadge: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  vice_president: {
    title: 'Vice President',
    icon: (
      <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    isOtpKeyholder: false,
    bgBadge: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  joint_secretary: {
    title: 'Joint Secretary',
    icon: (
      <svg className="w-5 h-5 text-[#5c292c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    isOtpKeyholder: false,
    bgBadge: 'bg-[#5c292c]/10 text-[#5c292c] border-[#5c292c]/20'
  }
};

export default function PowerUsersSection() {
  const [powerUsers, setPowerUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Modal State
  const [editingRole, setEditingRole] = useState(null);
  const [form, setForm] = useState({
    name: '',
    country_code: '+91',
    phone: '',
    place: ''
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);

  // Office Code lookup state
  const [officeCodeInput, setOfficeCodeInput] = useState('');
  const [fetchingCode, setFetchingCode] = useState(false);
  const [codeLookupStatus, setCodeLookupStatus] = useState(null);

  const loadPowerUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPowerUsers();
      setPowerUsers(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load power users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPowerUsers();
  }, []);

  const openEdit = (u) => {
    setEditingRole(u);
    setForm({
      name: u.name || '',
      country_code: u.country_code || '+91',
      phone: u.phone || '',
      place: u.place || ''
    });
    setOfficeCodeInput('');
    setCodeLookupStatus(null);
    setSaveSuccess(null);
  };

  const handleFetchByCode = async (e) => {
    if (e) e.preventDefault();
    const code = officeCodeInput.trim();
    if (!code) {
      setCodeLookupStatus({ type: 'error', message: 'Please enter an Office Code' });
      return;
    }

    setFetchingCode(true);
    setCodeLookupStatus(null);
    try {
      const devotee = await api.getBookingByCode(code);
      if (!devotee) throw new Error('Devotee not found');

      // Normalize country code
      let cCode = devotee.country_code ? String(devotee.country_code).trim() : '+91';
      if (!cCode.startsWith('+')) cCode = `+${cCode}`;

      // Clean phone digits
      let phone = (devotee.whatsapp_number || devotee.mobile || '').trim();
      if (phone.startsWith(cCode)) {
        phone = phone.slice(cCode.length).trim();
      } else if (phone.startsWith('+91')) {
        phone = phone.replace(/^\+91/, '').trim();
      } else if (phone.startsWith('91') && phone.length === 12) {
        phone = phone.slice(2).trim();
      }

      setForm({
        name: devotee.name || '',
        country_code: cCode || '+91',
        phone: phone || '',
        place: devotee.place || ''
      });

      setCodeLookupStatus({
        type: 'success',
        message: `Found devotee: ${devotee.name}${devotee.place ? ` (${devotee.place})` : ''} • Code ${devotee.code || code}`
      });
    } catch (err) {
      console.error(err);
      setCodeLookupStatus({
        type: 'error',
        message: err.message || `No devotee found for Office Code "${code}"`
      });
    } finally {
      setFetchingCode(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingRole) return;

    setSaving(true);
    setSaveSuccess(null);
    try {
      await api.updatePowerUser(editingRole.role_key, {
        name: form.name.trim(),
        country_code: form.country_code.trim(),
        phone: form.phone.trim(),
        place: form.place.trim()
      });

      setSaveSuccess(`Updated ${editingRole.role_title} details successfully!`);
      await loadPowerUsers();
      setTimeout(() => {
        setEditingRole(null);
        setSaveSuccess(null);
      }, 1200);
    } catch (err) {
      console.error(err);
      alert('Failed to update: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 font-barlow animate-fade-in">
      
      {/* 5 Permanent Roles Cards */}
      {loading ? (
        <div className="bg-white rounded-[20px] border border-[#ebdccb] p-8 text-center text-gray-500 font-medium">
          Loading Power Users...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-[20px] text-center text-xs">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {powerUsers.map((u) => {
            const config = ROLE_CONFIG[u.role_key] || {
              title: u.role_title,
              icon: null,
              isOtpKeyholder: false,
              bgBadge: 'bg-gray-100 text-gray-800 border-gray-200'
            };

            const hasDetails = u.name && u.phone;

            return (
              <div
                key={u.id}
                className="bg-white rounded-[22px] border border-[#ebdccb] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                {/* Top: Role Badge & Icon */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-[#faf6f0] border border-[#ebdccb] flex items-center justify-center shrink-0">
                        {config.icon}
                      </div>
                      <div>
                        <h3 className="text-[16px] font-bold text-[#5c292c] leading-tight">
                          {config.title}
                        </h3>
                        <span className="text-[11px] text-gray-500 font-medium">
                          Permanent Executive
                        </span>
                      </div>
                    </div>

                    {config.isOtpKeyholder ? (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1 shrink-0">
                        <svg className="w-3 h-3 text-purple-700" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        OTP Keyholder
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 shrink-0">
                        Executive
                      </span>
                    )}
                  </div>

                  {/* Details Section */}
                  <div className="bg-[#faf8f7] rounded-[16px] border border-[#ebdccb]/70 p-3.5 flex flex-col gap-2 text-xs">
                    
                    {/* Name */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-medium">Full Name:</span>
                      <span className="font-bold text-gray-900 text-right truncate max-w-[170px]">
                        {u.name ? u.name : <em className="text-gray-400 font-normal">Not configured</em>}
                      </span>
                    </div>

                    {/* Phone Number */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-medium">WhatsApp Phone:</span>
                      {u.phone ? (
                        <span className="font-mono font-bold text-[#5c292c] bg-white px-2 py-0.5 rounded border border-[#ebdccb] text-[11px]">
                          {u.country_code || '+91'} {u.phone}
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Missing phone
                        </span>
                      )}
                    </div>

                    {/* Place */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-medium">Place / Town:</span>
                      <span className="font-semibold text-gray-800 text-right truncate max-w-[170px]">
                        {u.place ? u.place : <em className="text-gray-400 font-normal">Not configured</em>}
                      </span>
                    </div>

                  </div>
                </div>

                {/* Bottom Action */}
                <div className="pt-2 border-t border-[#f0e6dc] flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    {u.updated_at ? `Updated ${new Date(u.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` : 'Permanent'}
                  </span>
                  <button
                    onClick={() => openEdit(u)}
                    type="button"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#5c292c] bg-white hover:bg-[#5c292c] hover:text-white border border-[#ebdccb] shadow-sm transition-all cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit Details
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* EDIT POWER USER MODAL */}
      {editingRole && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 p-4 flex items-center justify-center overflow-y-auto animate-fade-in">
          <div className="relative shadow-2xl flex flex-col p-6 bg-[#f7f1e5] border border-[#ebdccb] rounded-[26px] max-w-[450px] w-full my-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#ebdccb]">
              <div>
                <h3 className="text-lg font-bold text-[#5c292c] font-barlow tracking-tight flex items-center gap-2">
                  <span>Edit {editingRole.role_title}</span>
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  Update contact information for permanent executive role
                </p>
              </div>
              <button
                onClick={() => setEditingRole(null)}
                type="button"
                className="w-7 h-7 rounded-full flex items-center justify-center text-[#8c8075] hover:text-[#5c292c] hover:bg-black/5 transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="flex flex-col gap-3.5 mt-4">

              {/* Quick Fetch by Office Code */}
              <div className="bg-white/80 rounded-2xl border border-[#ebdccb] p-3 shadow-xs">
                <label className="block text-[#5c292c] font-bold text-xs mb-1.5 px-0.5 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#5c292c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Fetch by Office Code</span>
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={officeCodeInput}
                    onChange={(e) => {
                      setOfficeCodeInput(e.target.value);
                      if (codeLookupStatus) setCodeLookupStatus(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleFetchByCode();
                      }
                    }}
                    className="flex-1 h-[36px] px-3.5 rounded-full border border-[#e2d8cb] bg-white font-barlow text-[13px] text-gray-800 focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] uppercase font-mono tracking-wide"
                  />
                  <button
                    type="button"
                    onClick={handleFetchByCode}
                    disabled={fetchingCode || !officeCodeInput.trim()}
                    className="px-4 h-[36px] rounded-full bg-[#5c292c] hover:bg-[#482022] text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {fetchingCode ? (
                      <>
                        <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        <span>Fetching...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span>Fetch</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Status feedback message */}
                {codeLookupStatus && (
                  <div
                    className={`mt-2 text-xs py-1.5 px-3 rounded-xl border flex items-center gap-1.5 font-medium animate-fade-in ${
                      codeLookupStatus.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {codeLookupStatus.type === 'success' ? (
                      <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-amber-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className="flex-1 leading-tight">{codeLookupStatus.message}</span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-2 my-0.5">
                <div className="h-px bg-[#ebdccb] flex-1"></div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">or edit directly</span>
                <div className="h-px bg-[#ebdccb] flex-1"></div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[#5c292c] font-bold text-xs mb-1 px-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  className="h-[38px] px-4 rounded-full border border-[#e2d8cb] bg-white font-barlow text-[13.5px] text-gray-800 focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] w-full shadow-sm"
                />
              </div>

              {/* Phone Number with Country Code */}
              <div>
                <label className="block text-[#5c292c] font-bold text-xs mb-1 px-1">
                  WhatsApp Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.country_code}
                    onChange={(e) => setForm(f => ({ ...f, country_code: e.target.value }))}
                    placeholder="+91"
                    className="w-20 shrink-0 h-[38px] px-3 rounded-full border border-[#e2d8cb] bg-white font-barlow text-[13px] text-center font-bold text-gray-700 shadow-sm"
                  />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                    required
                    className="flex-1 h-[38px] px-4 rounded-full border border-[#e2d8cb] bg-white font-barlow text-[13.5px] text-gray-800 focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] shadow-sm"
                  />
                </div>
              </div>

              {/* Place / Town */}
              <div>
                <label className="block text-[#5c292c] font-bold text-xs mb-1 px-1">
                  Place / Town Details <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.place}
                  onChange={(e) => setForm(f => ({ ...f, place: e.target.value }))}
                  required
                  className="h-[38px] px-4 rounded-full border border-[#e2d8cb] bg-white font-barlow text-[13.5px] text-gray-800 focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] w-full shadow-sm"
                />
              </div>

              {/* Success Notification */}
              {saveSuccess && (
                <div className="bg-emerald-50 text-emerald-800 text-xs py-2 px-3.5 rounded-full border border-emerald-200 text-center font-medium animate-fade-in">
                  ✓ {saveSuccess}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ebdccb] mt-1">
                <button
                  type="button"
                  onClick={() => setEditingRole(null)}
                  disabled={saving}
                  className="px-5 py-2 rounded-full border border-[#5c292c] text-[#5c292c] font-semibold text-xs bg-white hover:bg-gray-50 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-full bg-[#5c292c] hover:bg-[#482022] text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Details'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
