import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

function formatDateDDMMYYYY(val) {
  if (!val) return '—';
  if (typeof val === 'string' && val.includes('-')) {
    const clean = val.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
    }
  }
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
  return String(val);
}

export default function ThurithaKattalaiModal({
  isOpen,
  onClose,
  date,
  slot = 1,
  onSaved,
  existingRecord = null
}) {
  const { user } = useAuth();
  const isStaff = user && (user.role === 'admin' || user.role === 'superadmin' || user.role === 'ulthurai');

  const [title, setTitle] = useState('');
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [star, setStar] = useState('');
  const [amount, setAmount] = useState(200);

  const [dropdowns, setDropdowns] = useState({ title: [], star: [], place: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch dropdown options identically to BookingModal (Arthajama / Uchikala)
  useEffect(() => {
    api.getDropdownOptions().then(options => {
      setDropdowns({
        title: options.filter(o => o.category === 'title').map(o => o.value),
        star: options.filter(o => o.category === 'star').map(o => o.value),
        place: options.filter(o => o.category === 'place').map(o => o.value),
      });
    }).catch(err => {
      console.error('Failed to load dropdown options:', err);
    });
  }, []);

  useEffect(() => {
    if (existingRecord) {
      let recTitle = existingRecord.title || '';
      let recName = existingRecord.name || '';
      if (!recTitle && dropdowns.title && dropdowns.title.length > 0) {
        for (const t of dropdowns.title) {
          if (recName.startsWith(t + ' ')) {
            recTitle = t;
            recName = recName.slice(t.length + 1);
            break;
          }
        }
      }
      setTitle(recTitle);
      setName(recName);
      setPlace(existingRecord.place || '');
      setPhone(existingRecord.phone || '');
      setEmail(existingRecord.email || '');
      setStar(existingRecord.star || '');
      setAmount(parseFloat(existingRecord.amount) || 200);
    } else {
      setTitle('');
      setName('');
      setPlace('');
      setPhone('');
      setEmail('');
      setStar('');
      api.getSettings().then(s => {
        const fee = parseFloat(s.thuritha_kattalai_amount || s.thani_archanai_amount || s.archanai_fee || 200);
        if (!isNaN(fee) && fee >= 0) setAmount(fee);
      }).catch(() => {});
    }
    setError('');
  }, [existingRecord, isOpen, dropdowns.title]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter devotee full name');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter a valid mobile number');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const formattedFullName = title ? `${title} ${name.trim()}` : name.trim();
      const payload = {
        title: title || undefined,
        name: formattedFullName,
        place: (place || '').trim(),
        phone: phone.trim(),
        email: (email || '').trim(),
        star: (star || '').trim(),
        booking_date: date,
        slot,
        amount,
        payment_mode: existingRecord?.payment_mode || 'Cash'
      };

      if (existingRecord && existingRecord.id) {
        await api.updateThurithaKattalai(existingRecord.id, payload);
      } else {
        await api.createThurithaKattalai(payload);
      }

      onClose();
      if (onSaved) onSaved();
    } catch (err) {
      console.error('Failed to save Thuritha Kattalai:', err);
      setError(err.message || 'Failed to save Thuritha Kattalai');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "h-[38px] px-4 rounded-full border border-[#e2d8cb] bg-white font-barlow text-[16px] sm:text-[14px] text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] transition-all w-full shadow-sm hover:border-[#cfc2b2] disabled:opacity-70 disabled:bg-[#f3ede3]";
  const selectClass = "h-[38px] px-4 rounded-full border border-[#e2d8cb] bg-white font-barlow text-[16px] sm:text-[14px] text-gray-800 focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] transition-all w-full appearance-none pr-8 shadow-sm hover:border-[#cfc2b2] disabled:opacity-70 disabled:bg-[#f3ede3] cursor-pointer";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 p-2 sm:p-4 flex items-start sm:items-center justify-center overflow-y-auto">
      <div 
        className="relative shadow-[0_20px_60px_-15px_rgba(70,40,20,0.25)] flex flex-col p-4 sm:p-6 bg-[#f7f1e5] border border-[#ebdccb] rounded-[24px] sm:rounded-[28px] max-w-[680px] w-full my-auto transition-all animate-fade-in max-h-[92vh] overflow-y-auto"
        style={{ maxWidth: '680px', width: '100%' }}
      >
        <div className="w-full flex flex-col gap-2.5 font-barlow">
          
          {/* Header matching Arthajama / Uchikala Registration Modal - Title on left, Close button on right */}
          <div className="flex items-center justify-between px-1 pb-1 border-b border-[#ebdccb]/60 mb-1">
            <h3 className="text-[17px] sm:text-[18px] font-bold text-[#5c292c] font-barlow tracking-wide">
              {existingRecord ? 'Edit Thuritha Kattalai' : 'New Thuritha Kattalai'}
            </h3>
            <button
              onClick={onClose}
              type="button"
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#8c8075] hover:text-[#5c292c] hover:bg-black/5 transition-colors cursor-pointer"
              title="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            {error && (
              <p className="text-red-600 text-[13px] text-center font-medium bg-red-50 border border-red-200 rounded-xl py-1.5 px-3">
                {error}
              </p>
            )}

            {/* Row 1: Title & Full Name */}
            <div className="flex gap-2.5 relative">
              <div className="relative w-[138px] shrink-0">
                <select 
                  className={`${selectClass} pl-3.5 pr-7`}
                  value={title || ''}
                  onChange={(e) => setTitle(e.target.value)}
                >
                  <option value="" disabled>Title</option>
                  {dropdowns.title.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8075]">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </div>

              <div className="relative flex-1 min-w-0">
                <input 
                  className={inputClass}
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Row 2: Star & Place (Matching Arthajama / Uchikala Dropdowns) */}
            <div className="flex gap-2.5 relative">
              <div className="relative w-1/2">
                <select 
                  className={selectClass}
                  value={star || ''}
                  onChange={(e) => setStar(e.target.value)}
                >
                  <option value="" disabled>Star</option>
                  {dropdowns.star.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8075]">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </div>

              <div className="relative w-1/2">
                <select 
                  className={selectClass}
                  value={place || ''}
                  onChange={(e) => setPlace(e.target.value)}
                >
                  <option value="" disabled>Place</option>
                  {dropdowns.place.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  {place && !dropdowns.place.includes(place) && (
                    <option value={place}>{place}</option>
                  )}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8075]">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            {/* Row 3: Mobile (+91) & Email Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 relative items-center">
              <div className="flex items-center relative">
                <div className="h-[38px] w-[50px] rounded-l-full border border-r-0 border-[#e2d8cb] bg-[#faf8f5] font-barlow text-[13px] font-bold text-[#5c292c] flex items-center justify-center shrink-0 shadow-sm cursor-default">
                  +91
                </div>
                <div className="relative flex-1 min-w-0">
                  <input 
                    className="h-[38px] rounded-r-full border border-[#e2d8cb] bg-white font-barlow text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] w-full shadow-sm px-3 text-[13.5px]"
                    placeholder="Mobile"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="relative">
                <input 
                  className={inputClass}
                  placeholder="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Row 4: Dashed Info Pills matching BookingModal (Date of Registration & Payment) */}
            <div className="grid grid-cols-2 gap-2.5 relative items-center pt-1">
              {/* Date of Registration */}
              <div className="relative flex flex-col">
                <span className="text-[10.5px] font-bold text-[#5c292c] mb-1 px-1">Date of Registration</span>
                <div 
                  className="h-[38px] px-3.5 rounded-full border border-dashed border-[#c7b0a4] bg-white font-barlow text-xs sm:text-[13px] font-bold text-[#5c292c] flex items-center justify-center shadow-xs cursor-default select-none"
                  title="Date of Registration"
                >
                  <span>{formatDateDDMMYYYY(date || new Date())}</span>
                </div>
              </div>

              {/* Payment */}
              <div className="relative flex flex-col">
                <span className="text-[10.5px] font-bold text-[#5c292c] mb-1 px-1">Payment</span>
                <div 
                  className="h-[38px] px-3.5 rounded-full border border-dashed border-[#c7b0a4] bg-white font-barlow text-xs sm:text-[13px] font-bold text-[#5c292c] flex items-center justify-center shadow-xs cursor-default select-none"
                  title="Payment Amount"
                >
                  <span>₹{parseFloat(amount || 200).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Row 5: Action Buttons matching BookingModal (Cancel & Pay) */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-3 pt-1 pb-1">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center font-barlow font-medium text-[15px] bg-white text-[#5c292c] border-2 border-[#5c292c] hover:bg-[#5c292c]/5 transition-all px-7 h-[38px] rounded-full shadow-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center font-barlow font-semibold text-[15px] transition-all px-8 h-[38px] rounded-full shadow-sm bg-[#5c292c] hover:bg-[#4a2123] text-white hover:shadow cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? 'Saving...' : (existingRecord ? 'Update Details' : 'Pay')}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
