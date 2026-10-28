import { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext';
import TamilDetailsModal from './TamilDetailsModal.jsx';

const emptyForm = {
  title: '', name: '', star: '', place: '', 
  permanent_address: '', communication_address: '', 
  country_code: '91', mobile: '', whatsapp_number: '', code: '', 
  whatsapp_same_as_mobile: true, email: '', booking_date: '', amount: '', kat_type: '', comments: ''
};

function getDayOfYear(dateObj) {
  const date = new Date(dateObj);
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = (date - start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Booking / payment form matching Figma design aesthetics (warm cream card, pill inputs, inline slots, single-page view).
 */
export default function BookingModal({ kattalaiType, existingBooking, onClose, onSaved, bookings, kattalaiTypes, date }) {
  const { user } = useAuth();
  
  const [form, setForm] = useState(() => {
    if (existingBooking) {
      return {
        title: existingBooking.title || '',
        name: existingBooking.name || '',
        star: existingBooking.star || '',
        place: existingBooking.place || '',
        permanent_address: [existingBooking.per_add_1, existingBooking.per_add_2, existingBooking.per_add_3].filter(Boolean).join(', ') || '',
        communication_address: [existingBooking.comm_add_1, existingBooking.comm_add_2, existingBooking.comm_add_3, existingBooking.comm_add_4].filter(Boolean).join(', ') || '',
        country_code: existingBooking.country_code || '91',
        mobile: existingBooking.mobile || '',
        whatsapp_number: existingBooking.whatsapp_number || '',
        code: existingBooking.code || '',
        whatsapp_same_as_mobile: existingBooking.whatsapp_same_as_mobile ?? true,
        email: existingBooking.email || '',
        booking_date: existingBooking.kattalai_month && existingBooking.kattalai_date ? `${(date ? date.split('-')[0] : new Date().getFullYear())}-${String(existingBooking.kattalai_month).padStart(2, '0')}-${String(existingBooking.kattalai_date).padStart(2, '0')}` : (date ? new Date(date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)),
        amount: existingBooking.amount || '',
        kattalai_type_id: existingBooking.kattalai_type_id || (kattalaiType?.id || ''),
        kat_type: existingBooking.kat_type || '',
        comments: existingBooking.comments || '',
      };
    }
    let autoCode = '';
    if (kattalaiType && bookings && date) {
      const prefix = kattalaiType.color_key === 'morning' ? 'U' : 'A';
      const typeBookings = bookings.filter(b => b.kattalai_type_id === kattalaiType.id);
      const highestBookedSlot = typeBookings.reduce((max, b) => {
        if (b.code && b.code.startsWith(`${prefix}/`)) {
          const slotNum = parseInt(b.code.split('/')[1], 10);
          if (!isNaN(slotNum) && slotNum > max) return slotNum;
        }
        return max;
      }, 0);
      const nextSlot = highestBookedSlot + 1;
      const dayOfYear = getDayOfYear(date);
      autoCode = `${prefix}/${nextSlot}/${dayOfYear}`;
    }

    return {
      ...emptyForm,
      kattalai_type_id: kattalaiType?.id || '',
      booking_date: date ? new Date(date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      amount: kattalaiType?.default_amount || '',
      code: autoCode,
      kat_type: 'Lifetime',
      comments: '',
    };
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editRequestStatus, setEditRequestStatus] = useState(null); // 'pending', 'approved', 'rejected'
  const [dropdowns, setDropdowns] = useState({ title: [], star: [], place: [], kat_type: ['Lifetime', 'Inheritance'] });
  const [showTamilModal, setShowTamilModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferBaseRate, setTransferBaseRate] = useState(3500);
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState(null);
  const [transferForm, setTransferForm] = useState({
    title: 'Selvan',
    title_ta: '',
    name: '',
    name_ta: '',
    star: '',
    star_ta: '',
    place: '',
    place_ta: '',
    mobile: '',
    whatsapp_number: '',
    email: '',
    address: '',
    payment_method: 'cash'
  });

  useEffect(() => {
    api.getDropdownOptions().then(options => {
      const katTypes = options.filter(o => o.category === 'kat_type').map(o => o.value);
      setDropdowns({
        title: options.filter(o => o.category === 'title').map(o => o.value),
        star: options.filter(o => o.category === 'star').map(o => o.value),
        place: options.filter(o => o.category === 'place').map(o => o.value),
        kat_type: katTypes.length > 0 ? katTypes : ['Lifetime', 'Inheritance']
      });
    }).catch(console.error);

    api.getSettings().then(s => {
      if (s && s.transfer_base_amount) {
        const val = parseFloat(s.transfer_base_amount);
        if (!isNaN(val)) setTransferBaseRate(val);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (existingBooking) {
      setTransferForm(prev => ({
        ...prev,
        place: existingBooking.place || '',
        mobile: existingBooking.mobile || '',
        whatsapp_number: existingBooking.whatsapp_number || existingBooking.mobile || '',
        address: [existingBooking.per_add_1, existingBooking.per_add_2, existingBooking.per_add_3].filter(Boolean).join(', ') || ''
      }));
    }
  }, [existingBooking]);

  useEffect(() => {
    if (existingBooking && user?.role === 'user') {
      api.getEditRequestForBooking(existingBooking.id)
        .then(req => {
          if (req) setEditRequestStatus(req.status);
        })
        .catch(err => console.error("Failed to load edit request status", err));
    }
  }, [existingBooking, user]);

  const rawBookingTitle = (existingBooking?.title || '').trim().toLowerCase();
  const rawBookingTitleTa = (existingBooking?.title_ta || '').trim();
  const isEligibleForTransfer = 
    Boolean(existingBooking) &&
    (rawBookingTitle === 'thiru' || rawBookingTitle === 'selvan' || rawBookingTitleTa === 'திரு' || rawBookingTitleTa === 'செல்வன்') && 
    !existingBooking?.is_transferred && 
    !existingBooking?.transferred_at;

  const isAlreadyTransferred = Boolean(existingBooking?.is_transferred || existingBooking?.transferred_at);
  const oldPaidAmount = parseFloat(existingBooking?.amount || 0);
  const transferDifferenceAmount = Math.max(0, transferBaseRate - oldPaidAmount);

  async function handleConfirmTransfer() {
    if (!transferForm.name.trim()) {
      setTransferError('Please enter the name of the son or daughter');
      return;
    }
    setTransferring(true);
    setTransferError(null);
    try {
      const payload = {
        title: transferForm.title,
        title_ta: transferForm.title_ta || '',
        name: transferForm.name.trim(),
        name_ta: transferForm.name_ta ? transferForm.name_ta.trim() : '',
        star: transferForm.star,
        star_ta: transferForm.star_ta || '',
        place: transferForm.place,
        place_ta: transferForm.place_ta || '',
        mobile: transferForm.mobile,
        whatsapp_number: transferForm.whatsapp_number || transferForm.mobile,
        email: transferForm.email,
        per_add_1: transferForm.address,
        comm_add_1: transferForm.address,
        payment_method: transferForm.payment_method,
        user_id: user?.id,
        user_name: user?.name
      };

      const res = await api.transferBooking(existingBooking.id, payload);
      setTransferring(false);
      setShowTransferModal(false);
      if (onSaved) onSaved(res.booking);
      onClose();
    } catch (err) {
      setTransferError(err.message || 'Failed to complete transfer');
      setTransferring(false);
    }
  }

  const isUnlocked = editRequestStatus === 'approved';
  const isLockedForUser = user?.role === 'user' && !isUnlocked;

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const isFormValid = existingBooking
    ? Boolean(form.name?.trim())
    : Boolean(
        form.title?.trim() &&
        form.name?.trim() &&
        form.star?.trim() &&
        form.place?.trim() &&
        (form.kat_type?.trim() || 'Lifetime') &&
        form.mobile?.trim() &&
        form.permanent_address?.trim() &&
        form.booking_date &&
        form.code
      );

  async function handlePayNow() {
    if (!form.name?.trim()) {
      setError("Please enter Full Name.");
      return;
    }
    if (!existingBooking) {
      if (!form.title?.trim()) {
        setError("Please select Title.");
        return;
      }
      if (!form.star?.trim()) {
        setError("Please select Star.");
        return;
      }
      if (!form.place?.trim()) {
        setError("Please select Place.");
        return;
      }
      if (!form.mobile?.trim()) {
        setError("Please enter Mobile Number.");
        return;
      }
      if (!form.permanent_address?.trim()) {
        setError("Please enter Permanent Address.");
        return;
      }
      if (!form.booking_date) {
        setError("Please select Booking Date.");
        return;
      }
      if (!form.code) {
        setError("Please select an available slot.");
        return;
      }
    }
    if (!form.kat_type?.trim()) {
      form.kat_type = 'Lifetime';
    }
    setError(null);
    // Intercept with Tamil Details modal
    setShowTamilModal(true);
  }

  async function handleFinalPayNow(tamilData) {
    setSaving(true);
    setError(null);
    try {
      const smartSplitAddress = (addr) => {
        if (!addr) return [];
        if (addr.includes(',')) return addr.split(',').map(s => s.trim()).filter(Boolean);
        if (addr.includes('\n')) return addr.split('\n').map(s => s.trim()).filter(Boolean);
        
        const words = addr.trim().split(/\s+/);
        if (words.length <= 3) return words;

        const result = [];
        let cityPinIdx = -1;
        
        for (let i = words.length - 1; i >= Math.max(0, words.length - 3); i--) {
          if (/^\d{6}$/.test(words[i])) {
            cityPinIdx = Math.max(0, i - 1);
            break;
          }
        }

        if (cityPinIdx !== -1 && cityPinIdx > 0) {
          const part3 = words.slice(cityPinIdx).join(' ');
          const remaining = words.slice(0, cityPinIdx);
          
          if (remaining.length <= 2) {
            result.push(remaining.join(' '));
          } else {
            const areaWords = remaining.length > 4 ? 2 : 1;
            const splitIdx = remaining.length - areaWords;
            result.push(remaining.slice(0, splitIdx).join(' '));
            result.push(remaining.slice(splitIdx).join(' '));
          }
          result.push(part3);
        } else {
          const baseSize = Math.floor(words.length / 3);
          const remainder = words.length % 3;
          let start = 0;
          for (let i = 0; i < 3; i++) {
            const extra = i < remainder ? 1 : 0;
            const size = baseSize + extra;
            if (size > 0) {
              result.push(words.slice(start, start + size).join(' '));
              start += size;
            }
          }
        }
        return result;
      };

      const perParts = smartSplitAddress(form.permanent_address);
      const commParts = smartSplitAddress(form.communication_address);
      const [bYear, bMonth, bDate] = form.booking_date ? form.booking_date.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()];
      const finalAmount = (tamilData?.amount !== undefined && tamilData?.amount !== '') 
        ? parseFloat(tamilData.amount) 
        : (form.amount ? parseFloat(form.amount) : 0);
      const finalComments = tamilData?.comments !== undefined ? tamilData.comments : (form.comments || '');

      const payload = { 
        ...form, 
        ...tamilData, 
        amount: finalAmount,
        comments: finalComments,
        userRole: user?.role, 
        isUnlocked,
        kattalai_date: bDate,
        kattalai_month: bMonth,
        target_year: bYear,
        per_add_1: perParts[0] || '',
        per_add_2: perParts[1] || '',
        per_add_3: perParts.slice(2).join(', ') || '',
        comm_add_1: commParts[0] || '',
        comm_add_2: commParts[1] || '',
        comm_add_3: commParts[2] || '',
        comm_add_4: commParts.slice(3).join(', ') || ''
      };

      let booking;
      if (existingBooking) {
        payload.kattalai_type_id = form.kattalai_type_id || existingBooking.kattalai_type_id || (kattalaiType?.id);
        booking = await api.updateBooking(existingBooking.id, payload);
      } else {
        payload.kattalai_type_id = form.kattalai_type_id || (kattalaiType?.id);
        booking = await api.createBooking(payload);
        if (finalAmount > 0) {
          try {
            await api.createPayment({ booking_id: booking.id, amount: finalAmount, method: 'cash' });
          } catch (payErr) {
            console.warn('Payment recording note:', payErr);
          }
        }
      }

      setSaving(false);
      setShowTamilModal(false);
      onSaved(booking);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save booking');
      setSaving(false);
    }
  }

  async function handleRequestChange() {
    try {
      await api.createEditRequest({ booking_id: existingBooking?.id });
      await api.createHistoryLog({
        user_id: user.role === 'user' ? null : user.id,
        action: 'REQUESTED_EDIT',
        details: `Devotee requested permission to edit their locked details.`,
        booking_id: existingBooking?.id
      });
      setEditRequestStatus('pending');
    } catch (err) {
      console.error(err);
    }
  }

  const LockIcon = ({ className = "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#f37435]" }) => (
    isLockedForUser ? (
      <button type="button" onClick={handleRequestChange} className={className} title="Locked - Request Full Edit Access">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
      </button>
    ) : null
  );

  // Format date for the placeholder "24 05 2026"
  const d = new Date(form.booking_date);
  const formattedDate = !isNaN(d.getTime()) ? `${String(d.getDate()).padStart(2, '0')} ${String(d.getMonth() + 1).padStart(2, '0')} ${d.getFullYear()}` : '24 05 2026';

  // Dynamic capacity counting
  let uchikalaType = null;
  let arthajamaType = null;
  if (kattalaiTypes) {
    uchikalaType = kattalaiTypes.find(t => t.color_key === 'morning');
    arthajamaType = kattalaiTypes.find(t => t.color_key === 'evening-blue' || t.color_key === 'evening');
  }

  const renderSlots = (kType, prefix, color) => {
    if (!kType || !bookings) return null;
    const typeBookings = bookings.filter(b => b.kattalai_type_id === kType.id);
    
    const highestBookedSlot = typeBookings.reduce((max, b) => {
      if (b.code && b.code.startsWith(`${prefix}/`)) {
        const slotNum = parseInt(b.code.split('/')[1], 10);
        if (!isNaN(slotNum) && slotNum > max) return slotNum;
      }
      return max;
    }, 0);

    const totalRender = Math.max(kType.max_slots || 4, highestBookedSlot);
    const slots = [];
    
    for (let slotNum = 1; slotNum <= totalRender; slotNum++) {
      const bookedItem = typeBookings.find(b => b.code && b.code.startsWith(`${prefix}/${slotNum}/`));
      const isBooked = !!bookedItem;
      const isSelected = form.code && form.code.startsWith(`${prefix}/${slotNum}/`) && form.kattalai_type_id === kType.id;
      
      slots.push(
        <button
          key={slotNum}
          type="button"
          onClick={() => {
            if (!isBooked && !existingBooking) {
              const dayOfYear = getDayOfYear(form.booking_date);
              setForm(f => ({
                ...f,
                kattalai_type_id: kType.id,
                kat_type: kType.name,
                code: `${prefix}/${slotNum}/${dayOfYear}`
              }));
            }
          }}
          disabled={isBooked || !!existingBooking}
          className="transition-all"
          style={{
            width: '13px',
            height: '24px',
            borderRadius: '6.5px',
            backgroundColor: isBooked ? color : isSelected ? color : 'transparent',
            border: `1.8px solid ${color}`,
            opacity: isBooked ? 0.35 : 1,
            cursor: isBooked || !!existingBooking ? 'not-allowed' : 'pointer',
            boxShadow: isSelected ? `0 0 6px ${color}` : 'none',
            transform: isSelected ? 'scale(1.15)' : 'none'
          }}
          title={isBooked ? `Slot ${slotNum} (Booked)` : `Slot ${slotNum} (Available)`}
        />
      );
    }
    return slots;
  };

  const inputClass = "h-[38px] px-4 rounded-full border border-[#e2d8cb] bg-white font-barlow text-[16px] sm:text-[14px] text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] transition-all w-full shadow-sm hover:border-[#cfc2b2] disabled:opacity-70 disabled:bg-[#f3ede3]";
  const selectClass = "h-[38px] px-4 rounded-full border border-[#e2d8cb] bg-white font-barlow text-[16px] sm:text-[14px] text-gray-800 focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] transition-all w-full appearance-none pr-8 shadow-sm hover:border-[#cfc2b2] disabled:opacity-70 disabled:bg-[#f3ede3] cursor-pointer";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 p-2 sm:p-4 flex items-start sm:items-center justify-center overflow-y-auto">
      {!showTamilModal ? (
        <div 
          className="relative shadow-[0_20px_60px_-15px_rgba(70,40,20,0.25)] flex flex-col p-4 sm:p-6 bg-[#f7f1e5] border border-[#ebdccb] rounded-[24px] sm:rounded-[28px] max-w-[620px] w-full my-auto transition-all animate-fade-in max-h-[92vh] overflow-y-auto"
          style={{ maxWidth: '620px', width: '100%' }}
        >
          {!showTransferModal ? (
            <div className="w-full flex flex-col gap-2.5">
            
            {/* Header */}
            <div className="flex items-center justify-between px-1 pb-0.5">
              <h3 className="text-[17px] sm:text-[18px] font-bold text-[#5c292c] font-barlow tracking-wide">
                {existingBooking ? 'Edit Booking' : 'New Booking'}
              </h3>
              <button
                onClick={onClose}
                type="button"
                className="w-7 h-7 rounded-full flex items-center justify-center text-[#8c8075] hover:text-[#5c292c] hover:bg-black/5 transition-colors"
                title="Close"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Transferred Notice if already transferred */}
            {isAlreadyTransferred && (
              <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl px-3 py-2 flex items-center gap-2.5 text-xs text-[#0369a1] animate-fade-in">
                <svg className="w-4 h-4 shrink-0 text-[#0284c7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <span className="font-bold">1-Time Account Transfer Completed:</span>
                  <span className="text-[11.5px] text-[#0c4a6e] ml-1">
                    Transferred on {existingBooking.transferred_at ? new Date(existingBooking.transferred_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Record'}
                    {existingBooking.transferred_from_name ? ` (from ${existingBooking.transferred_from_title || ''} ${existingBooking.transferred_from_name})` : ''}.
                    1-time limit reached.
                  </span>
                </div>
              </div>
            )}

          {/* Mobile View: Dedicated touch-optimized layout (< sm screens, zero overflow) */}
          <div className="sm:hidden flex flex-col gap-2.5">
            {/* Row 1: Title & Name */}
            <div className="flex gap-2 relative">
              <div className="relative w-[95px] shrink-0">
                <select 
                  className={`${selectClass} ${isLockedForUser ? 'pr-9' : ''}`}
                  value={form.title || ''}
                  onChange={set('title')}
                  disabled={isLockedForUser}
                >
                  <option value="" disabled>Title</option>
                  {dropdowns.title.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8075]">
                  {!isLockedForUser && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>}
                </div>
                <LockIcon />
              </div>

              <div className="relative flex-1 min-w-0">
                <input 
                  className={`${inputClass} ${isLockedForUser ? 'pr-9' : ''}`}
                  placeholder="Full Name"
                  value={form.name}
                  onChange={set('name')}
                  disabled={isLockedForUser}
                />
                <LockIcon />
              </div>
            </div>

            {/* Row 2: Star & Place */}
            <div className="flex gap-2 relative">
              <div className="relative w-1/2">
                <select 
                  className={`${selectClass} ${isLockedForUser ? 'pr-9' : ''}`}
                  value={form.star || ''}
                  onChange={set('star')}
                  disabled={isLockedForUser}
                >
                  <option value="" disabled>Star</option>
                  {dropdowns.star.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8075]">
                  {!isLockedForUser && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>}
                </div>
                <LockIcon />
              </div>

              <div className="relative w-1/2">
                <select 
                  className={`${selectClass} ${isLockedForUser ? 'pr-9' : ''}`}
                  value={form.place || ''}
                  onChange={set('place')}
                  disabled={isLockedForUser}
                >
                  <option value="" disabled>Place</option>
                  {dropdowns.place.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8075]">
                  {!isLockedForUser && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>}
                </div>
                <LockIcon />
              </div>
            </div>

            {/* Row 3: Permanent Address */}
            <div className="relative w-full">
              <input 
                className={`${inputClass} ${isLockedForUser ? 'pr-9' : ''}`}
                placeholder="Permanent Address"
                value={form.permanent_address}
                onChange={set('permanent_address')}
                disabled={isLockedForUser}
              />
              <LockIcon />
            </div>

            {/* Row 4: Communication Address */}
            <div className="flex flex-col gap-1 w-full">
              <input 
                className={inputClass}
                placeholder="Communication Address"
                value={form.communication_address}
                onChange={set('communication_address')}
              />
              <div 
                className="flex items-center justify-end gap-1.5 cursor-pointer text-[11.5px] text-[#6e6359] font-medium hover:text-[#5c292c] transition-colors pr-1 self-end select-none" 
                onClick={() => {
                  const isSame = form.communication_address === form.permanent_address && form.permanent_address !== '';
                  setForm(f => ({ ...f, communication_address: isSame ? '' : f.permanent_address }));
                }}
              >
                <input 
                  type="checkbox" 
                  checked={form.communication_address === form.permanent_address && form.permanent_address !== ''} 
                  onChange={(e) => {
                    e.stopPropagation();
                    setForm(f => ({ ...f, communication_address: e.target.checked ? f.permanent_address : '' }));
                  }}
                  className="w-3.5 h-3.5 rounded border-[#c7b0a4] accent-[#5c292c] cursor-pointer" 
                />
                <span>Use same for Communication</span>
              </div>
            </div>

            {/* Row 5: Sponsorship & Office Code */}
            <div className="flex gap-2 relative items-center">
              <div className="relative flex-1 min-w-0">
                <select 
                  className="h-[38px] pl-3.5 pr-7 rounded-full border border-[#e2d8cb] bg-white font-barlow text-[13.5px] text-gray-800 focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] transition-all w-full appearance-none shadow-sm hover:border-[#cfc2b2] disabled:opacity-70 disabled:bg-[#f3ede3] cursor-pointer"
                  value={form.kat_type || ''}
                  onChange={set('kat_type')}
                  disabled={isLockedForUser}
                >
                  <option value="" disabled>Sponsorship</option>
                  {dropdowns.kat_type.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8075]">
                  {!isLockedForUser && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>}
                </div>
                <LockIcon />
              </div>

              <div className={`relative ${isLockedForUser ? 'w-[124px]' : 'w-[110px]'} shrink-0`}>
                <input 
                  className={`h-[38px] rounded-full border border-dashed border-[#c7b0a4] bg-white font-barlow text-[13px] font-bold text-[#5c292c] text-center w-full shadow-sm placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] transition-all disabled:opacity-75 disabled:bg-[#f8f4ec] ${isLockedForUser ? 'pl-3 pr-8' : 'px-2'}`}
                  placeholder="Office Code"
                  title="Office / Slot Code"
                  value={form.code || ''}
                  onChange={set('code')}
                  disabled={isLockedForUser}
                />
                <LockIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#f37435]" />
              </div>
            </div>

            {/* Row 6: Mobile with +91 */}
            <div className="flex w-full items-center relative">
              <div className="relative flex items-center w-[52px] shrink-0">
                <span className="absolute left-2.5 text-gray-500 font-semibold text-[13px] z-10">+</span>
                <input 
                  className="h-[38px] pl-5 pr-1 rounded-l-full border border-r-0 border-[#e2d8cb] bg-white font-barlow text-[13.5px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#5c292c] w-full shadow-sm"
                  placeholder="91"
                  value={form.country_code || '91'}
                  onChange={set('country_code')}
                  disabled={isLockedForUser}
                />
              </div>
              <div className="relative flex-1 min-w-0">
                <input 
                  className={`h-[38px] px-3.5 rounded-r-full border border-[#e2d8cb] bg-white font-barlow text-[13.5px] text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] w-full shadow-sm ${isLockedForUser ? 'pr-9' : ''}`}
                  placeholder="Mobile Number"
                  value={form.mobile || ''}
                  onChange={set('mobile')}
                  disabled={isLockedForUser}
                />
                <LockIcon />
              </div>
            </div>

            {/* Row 7: WhatsApp with 'Same as Mobile' toggle */}
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center w-full h-[38px] rounded-full border border-[#e2d8cb] bg-white focus-within:border-[#5c292c] focus-within:ring-1 focus-within:ring-[#5c292c] transition-all shadow-sm">
                <input 
                  className="h-full flex-1 min-w-0 bg-transparent px-3.5 font-barlow text-[16px] sm:text-[13.5px] text-gray-800 placeholder-[#9c9186] focus:outline-none"
                  placeholder="WhatsApp Number"
                  value={form.whatsapp_number || ''}
                  onChange={set('whatsapp_number')}
                />
                <div 
                  className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[#6e6359] font-medium hover:text-[#5c292c] transition-colors px-3 h-full border-l border-[#ebdccb] shrink-0 select-none" 
                  onClick={() => {
                    const isSame = form.whatsapp_number === form.mobile && form.mobile !== '';
                    setForm(f => ({ ...f, whatsapp_number: isSame ? '' : f.mobile }));
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={form.whatsapp_number === form.mobile && form.mobile !== ''} 
                    onChange={(e) => {
                      e.stopPropagation();
                      setForm(f => ({ ...f, whatsapp_number: e.target.checked ? f.mobile : '' }));
                    }}
                    className="w-3.5 h-3.5 rounded border-[#c7b0a4] accent-[#5c292c] cursor-pointer" 
                  />
                  <span>Same as Mobile</span>
                </div>
              </div>
            </div>

            {/* Row 8: Email Address */}
            <div className="relative w-full">
              <input 
                className={inputClass}
                placeholder="Email Address"
                type="email"
                value={form.email}
                onChange={set('email')}
              />
            </div>

            {/* Row 9: Date Picker */}
            <div className="relative w-full">
              <input 
                className={`${inputClass} ${isLockedForUser ? 'pr-9' : ''}`}
                placeholder={formattedDate || "Date"}
                type="text"
                onFocus={(e) => { if (!isLockedForUser) e.target.type = 'date'; }}
                onBlur={(e) => {
                  if (!e.target.value) e.target.type = 'text';
                }}
                value={form.booking_date}
                onChange={set('booking_date')}
                disabled={isLockedForUser}
              />
              <LockIcon />
            </div>

            {/* Row 10: Slot Capsules (Centered, spacious) */}
            <div className="flex items-center justify-center gap-2 py-1.5 px-3 bg-white rounded-full border border-[#e2d8cb] shadow-sm w-full">
              <div className="flex gap-1.5 items-center">
                {renderSlots(uchikalaType, 'U', '#f37435')}
              </div>
              <div className="w-[1.5px] h-[18px] bg-[#d5c7b7] mx-1"></div>
              <div className="flex gap-1.5 items-center">
                {renderSlots(arthajamaType, 'A', '#6f8ea8')}
              </div>
            </div>
          </div>

          {/* Desktop View (sm and above: preserves original compact layout) */}
          <div className="hidden sm:flex flex-col gap-2.5">
            {/* Row 1: Title & Name */}
            <div className="flex gap-2.5 relative">
              <div className="relative w-[110px] shrink-0">
                <select 
                  className={`${selectClass} ${isLockedForUser ? 'pr-9' : ''}`}
                  value={form.title || ''}
                  onChange={set('title')}
                  disabled={isLockedForUser}
                >
                  <option value="" disabled>Title</option>
                  {dropdowns.title.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8075]">
                  {!isLockedForUser && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>}
                </div>
                <LockIcon />
              </div>

              <div className="relative flex-1">
                <input 
                  className={`${inputClass} ${isLockedForUser ? 'pr-9' : ''}`}
                  placeholder="Full Name"
                  value={form.name}
                  onChange={set('name')}
                  disabled={isLockedForUser}
                />
                <LockIcon />
              </div>
            </div>

            {/* Row 2: Star & Place */}
            <div className="flex gap-2.5 relative">
              <div className="relative w-1/2">
                <select 
                  className={`${selectClass} ${isLockedForUser ? 'pr-9' : ''}`}
                  value={form.star || ''}
                  onChange={set('star')}
                  disabled={isLockedForUser}
                >
                  <option value="" disabled>Star</option>
                  {dropdowns.star.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8075]">
                  {!isLockedForUser && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>}
                </div>
                <LockIcon />
              </div>

              <div className="relative w-1/2">
                <select 
                  className={`${selectClass} ${isLockedForUser ? 'pr-9' : ''}`}
                  value={form.place || ''}
                  onChange={set('place')}
                  disabled={isLockedForUser}
                >
                  <option value="" disabled>Place</option>
                  {dropdowns.place.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8075]">
                  {!isLockedForUser && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>}
                </div>
                <LockIcon />
              </div>
            </div>

            {/* Row 3: Addresses with neatly anchored Communication checkbox */}
            <div className="flex gap-2.5 relative items-start">
              <div className="relative w-1/2">
                <input 
                  className={`${inputClass} ${isLockedForUser ? 'pr-9' : ''}`}
                  placeholder="Permanent Address"
                  value={form.permanent_address}
                  onChange={set('permanent_address')}
                  disabled={isLockedForUser}
                />
                <LockIcon />
              </div>

              <div className="w-1/2 flex flex-col">
                <div className="relative w-full">
                  <input 
                    className={inputClass}
                    placeholder="Communication Address"
                    value={form.communication_address}
                    onChange={set('communication_address')}
                  />
                </div>
                <label 
                  className="flex items-center justify-end gap-1.5 cursor-pointer text-[11.5px] text-[#6e6359] font-medium hover:text-[#5c292c] transition-colors mt-1 pr-1 self-end" 
                  onClick={() => {
                    const isSame = form.communication_address === form.permanent_address && form.permanent_address !== '';
                    setForm(f => ({ ...f, communication_address: isSame ? '' : f.permanent_address }));
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={form.communication_address === form.permanent_address && form.permanent_address !== ''} 
                    readOnly 
                    className="w-3.5 h-3.5 rounded border-[#c7b0a4] accent-[#5c292c] cursor-pointer" 
                  />
                  <span>Use same for Communication</span>
                </label>
              </div>
            </div>

            {/* Row 4: Sponsorship, Mobile (+91), WhatsApp, Office Code (exact compact 620px layout matching Firefox) */}
            <div className="flex gap-2 relative items-start">
              {/* Sponsorship */}
              <div className={`relative ${isLockedForUser ? 'w-[118px]' : 'w-[122px]'} shrink-0`}>
                <select 
                  className="h-[38px] pl-3 pr-7 rounded-full border border-[#e2d8cb] bg-white font-barlow text-[13.5px] text-gray-800 focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] transition-all w-full appearance-none shadow-sm hover:border-[#cfc2b2] disabled:opacity-70 disabled:bg-[#f3ede3] cursor-pointer"
                  value={form.kat_type || ''}
                  onChange={set('kat_type')}
                  disabled={isLockedForUser}
                >
                  <option value="" disabled>Sponsorship</option>
                  {dropdowns.kat_type.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8075]">
                  {!isLockedForUser && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>}
                </div>
                <LockIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#f37435]" />
              </div>

              {/* Mobile with +91 */}
              <div className={`flex ${isLockedForUser ? 'w-[188px]' : 'w-[172px]'} shrink-0 items-center relative`}>
                <div className="relative flex items-center w-[40px] shrink-0">
                  <span className="absolute left-2.5 text-gray-500 font-semibold text-[13px] z-10">+</span>
                  <input 
                    className="h-[38px] pl-4 pr-0.5 rounded-l-full border border-r-0 border-[#e2d8cb] bg-white font-barlow text-[13.5px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#5c292c] w-full shadow-sm text-center"
                    placeholder="91"
                    value={form.country_code || '91'}
                    onChange={set('country_code')}
                    disabled={isLockedForUser}
                  />
                </div>
                <div className="relative flex-1 min-w-0">
                  <input 
                    className={`h-[38px] rounded-r-full border border-[#e2d8cb] bg-white font-barlow text-[13.5px] text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] w-full shadow-sm ${isLockedForUser ? 'pl-2.5 pr-8 tracking-wide font-medium' : 'pl-2.5 pr-3'}`}
                    placeholder="Mobile"
                    value={form.mobile || ''}
                    onChange={set('mobile')}
                    disabled={isLockedForUser}
                  />
                  <LockIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#f37435]" />
                </div>
              </div>

              {/* WhatsApp with attached checkbox */}
              <div className="flex-1 min-w-0 flex flex-col">
                <input 
                  className={inputClass}
                  placeholder="WhatsApp"
                  value={form.whatsapp_number || ''}
                  onChange={set('whatsapp_number')}
                />
                <div 
                  className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[#6e6359] font-medium hover:text-[#5c292c] transition-colors mt-1 px-1 whitespace-nowrap select-none" 
                  onClick={() => {
                    const isSame = form.whatsapp_number === form.mobile && form.mobile !== '';
                    setForm(f => ({ ...f, whatsapp_number: isSame ? '' : f.mobile }));
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={form.whatsapp_number === form.mobile && form.mobile !== ''} 
                    onChange={(e) => {
                      e.stopPropagation();
                      setForm(f => ({ ...f, whatsapp_number: e.target.checked ? f.mobile : '' }));
                    }}
                    className="w-3.5 h-3.5 rounded border-[#c7b0a4] accent-[#5c292c] cursor-pointer" 
                  />
                  <span>Same as Mobile</span>
                </div>
              </div>

              {/* Office Code */}
              <div className={`relative ${isLockedForUser ? 'w-[116px]' : 'w-[108px]'} shrink-0`}>
                <input 
                  className={`h-[38px] rounded-full border border-dashed border-[#c7b0a4] bg-white font-barlow text-[13px] font-bold text-[#5c292c] text-center w-full shadow-sm placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] transition-all disabled:opacity-75 disabled:bg-[#f8f4ec] ${isLockedForUser ? 'pl-2.5 pr-7' : 'px-2'}`}
                  placeholder="Office Code"
                  title="Office / Slot Code"
                  value={form.code || ''}
                  onChange={set('code')}
                  disabled={isLockedForUser}
                />
                <LockIcon className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#f37435]" />
              </div>
            </div>

            {/* Row 5: Email, Date, Slot Capsules */}
            <div className="flex gap-2.5 relative items-center">
              {/* Email */}
              <div className="relative flex-1">
                <input 
                  className={inputClass}
                  placeholder="Email Address"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                />
              </div>

              {/* Date */}
              <div className="relative w-[150px] shrink-0">
                <input 
                  className={`${inputClass} ${isLockedForUser ? 'pr-9' : ''}`}
                  placeholder={formattedDate || "Date"}
                  type="text"
                  onFocus={(e) => { if (!isLockedForUser) e.target.type = 'date'; }}
                  onBlur={(e) => {
                    if (!e.target.value) e.target.type = 'text';
                  }}
                  value={form.booking_date}
                  onChange={set('booking_date')}
                  disabled={isLockedForUser}
                />
                <LockIcon />
              </div>

              {/* Slot Capsules */}
              <div className="flex items-center gap-1.5 px-3 bg-white rounded-full border border-[#e2d8cb] shadow-sm h-[38px] shrink-0 justify-center">
                <div className="flex gap-1 items-center">
                  {renderSlots(uchikalaType, 'U', '#f37435')}
                </div>
                <div className="w-[1.5px] h-[18px] bg-[#d5c7b7] mx-0.5"></div>
                <div className="flex gap-1 items-center">
                  {renderSlots(arthajamaType, 'A', '#6f8ea8')}
                </div>
              </div>
            </div>
          </div>

          {/* Errors / Status */}
          {error && <p className="text-red-600 text-[13px] text-center">{error}</p>}
          {editRequestStatus === 'pending' && (
            <p className="text-[#d97706] text-[13px] text-center font-medium flex items-center justify-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              Edit Request Pending Admin Approval
            </p>
          )}

          {/* Action Buttons: Cancel, Transfer (if eligible), & Register */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-3 pt-1 pb-2 sm:pb-0">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center font-barlow font-medium text-[15px] bg-white text-[#5c292c] border-2 border-[#5c292c] hover:bg-[#5c292c]/5 transition-all px-7 h-[38px] rounded-full shadow-sm"
            >
              Cancel
            </button>
            {isEligibleForTransfer && (
              <button
                type="button"
                onClick={() => setShowTransferModal(true)}
                className="flex items-center justify-center gap-1.5 font-barlow font-semibold text-[14px] bg-[#fdf2e9] text-[#c2410c] border border-[#fed7aa] hover:bg-[#ffedd5] transition-all px-5 h-[38px] rounded-full shadow-sm cursor-pointer active:scale-[0.99]"
                title="1-time transfer of this account to son or daughter"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Account Transfer
              </button>
            )}
            <button
              type="button"
              onClick={handlePayNow}
              disabled={saving}
              className="flex items-center justify-center font-barlow font-semibold text-[15px] transition-all px-8 h-[38px] rounded-full shadow-sm bg-[#5c292c] hover:bg-[#4a2123] text-white hover:shadow cursor-pointer active:scale-[0.99]"
              title={isFormValid ? "Proceed" : "Please fill all required fields to proceed"}
            >
              {saving ? 'Saving...' : (existingBooking ? (isUnlocked ? 'Update All Details' : 'Update Allowed Details') : 'Register')}
            </button>
          </div>
        </div>
        ) : (
          /* Transfer Modal View (Inline) */
          <div className="w-full flex flex-col gap-3 font-barlow animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#ebdccb]/80 pb-2">
              <div>
                <h3 className="text-[17px] sm:text-[18px] font-bold text-[#5c292c] tracking-wide flex items-center gap-2">
                  <span>1-Time Account Transfer</span>
                  <span className="text-[10px] font-bold bg-[#c2410c] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Son / Daughter</span>
                </h3>
                <p className="text-xs text-[#7c6f64] mt-0.5">
                  Transferring sponsorship from <strong className="text-[#5c292c]">{existingBooking?.title} {existingBooking?.name}</strong> to child.
                </p>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                type="button"
                className="w-7 h-7 rounded-full flex items-center justify-center text-[#8c8075] hover:text-[#5c292c] hover:bg-black/5 transition-colors"
                title="Back to Edit"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Dynamic Calculation Card */}
            <div className="bg-[#fcfaf7] border border-[#e6d8c7] rounded-[18px] p-3 shadow-xs">
              <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 mb-2 border-b border-[#ebdccb]/60 pb-1.5">
                <span>Dynamic Fee Calculation</span>
                <span className="text-[10px] bg-[#5c292c]/10 text-[#5c292c] px-2 py-0.5 rounded-full font-bold">1-Time Inheritance</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2 rounded-xl border border-[#e8ded1]">
                  <span className="block text-[10.5px] text-gray-500 font-medium">Standard Base Fee</span>
                  <span className="text-sm font-bold text-[#5c292c]">₹{transferBaseRate.toLocaleString()}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-[#e8ded1]">
                  <span className="block text-[10.5px] text-gray-500 font-medium">Previous Paid</span>
                  <span className="text-sm font-bold text-gray-600">₹{oldPaidAmount.toLocaleString()}</span>
                </div>
                <div className="bg-[#ecfdf5] p-2 rounded-xl border border-[#a7f3d0]">
                  <span className="block text-[10.5px] text-[#047857] font-bold">Amount to Pay</span>
                  <span className="text-sm font-extrabold text-[#065f46]">
                    ₹{transferDifferenceAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Inputs for Child */}
            <div className="flex flex-col gap-2.5">
              {/* Row: Title & Name */}
              <div className="flex gap-2">
                <div className="w-[105px] shrink-0">
                  <label className="block text-[11px] font-bold text-[#5c292c] mb-1">Title</label>
                  <select
                    className={selectClass}
                    value={transferForm.title}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, title: e.target.value }))}
                  >
                    <option value="Selvan">Selvan</option>
                    <option value="Thiru">Thiru</option>
                    <option value="Selvi">Selvi</option>
                    <option value="Thirumathi">Thirumathi</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-[#5c292c] mb-1">Child's Full Name (Son / Daughter) *</label>
                  <input
                    className={inputClass}
                    placeholder="Full Name"
                    value={transferForm.name}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Row: Star & Place */}
              <div className="flex gap-2">
                <div className="w-1/2">
                  <label className="block text-[11px] font-bold text-[#5c292c] mb-1">Star (நட்சத்திரம்)</label>
                  <select
                    className={selectClass}
                    value={transferForm.star}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, star: e.target.value }))}
                  >
                    <option value="">Select Star</option>
                    {dropdowns.star.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="w-1/2">
                  <label className="block text-[11px] font-bold text-[#5c292c] mb-1">Place (ஊர்)</label>
                  <select
                    className={selectClass}
                    value={transferForm.place}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, place: e.target.value }))}
                  >
                    <option value="">Select Place</option>
                    {dropdowns.place.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              {/* Row: Mobile & WhatsApp */}
              <div className="flex gap-2">
                <div className="w-1/2">
                  <label className="block text-[11px] font-bold text-[#5c292c] mb-1">Mobile Number</label>
                  <input
                    className={inputClass}
                    placeholder="Mobile Number"
                    value={transferForm.mobile}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, mobile: e.target.value }))}
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-[11px] font-bold text-[#5c292c] mb-1">WhatsApp Number</label>
                  <input
                    className={inputClass}
                    placeholder="WhatsApp Number"
                    value={transferForm.whatsapp_number}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                  />
                </div>
              </div>

              {/* Row: Email */}
              <div>
                <label className="block text-[11px] font-bold text-[#5c292c] mb-1">Email Address</label>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="Email Address"
                  value={transferForm.email}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              {/* Row: Address */}
              <div>
                <label className="block text-[11px] font-bold text-[#5c292c] mb-1">Address</label>
                <input
                  className={inputClass}
                  placeholder="Permanent / Communication Address"
                  value={transferForm.address}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              {/* Row: Payment Method */}
              <div className="bg-[#faf8f7] p-2.5 rounded-xl border border-[#ebdccb] flex items-center justify-between">
                <span className="text-xs font-bold text-[#5c292c]">Payment Mode (for ₹{transferDifferenceAmount}):</span>
                <select
                  value={transferForm.payment_method}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, payment_method: e.target.value }))}
                  className="h-[32px] px-3 rounded-lg border border-[#e2d8cb] bg-white text-xs font-bold text-gray-800 focus:outline-none"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">GPay / UPI</option>
                  <option value="bank_transfer">Bank Transfer / NEFT</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
            </div>

            {/* Error message */}
            {transferError && (
              <div className="text-red-600 text-xs font-semibold bg-red-50 p-2 rounded-lg border border-red-200 text-center">
                {transferError}
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-center gap-3 pt-2 border-t border-[#ebdccb]/60">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="px-6 h-[38px] rounded-full bg-white text-[#5c292c] border-2 border-[#5c292c] hover:bg-[#5c292c]/5 text-[14px] font-medium transition-all shadow-sm"
              >
                Back to Edit
              </button>
              <button
                type="button"
                disabled={transferring || !transferForm.name.trim()}
                onClick={handleConfirmTransfer}
                className="px-7 h-[38px] rounded-full bg-[#c2410c] hover:bg-[#9a3412] text-white text-[14px] font-bold transition-all shadow-sm hover:shadow flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
              >
                {transferring ? 'Transferring...' : `Confirm Transfer (₹${transferDifferenceAmount})`}
              </button>
            </div>
          </div>
        )}
        </div>
      ) : (
        <TamilDetailsModal 
          isOpen={showTamilModal} 
          isInline={true}
          onClose={() => setShowTamilModal(false)}
          onSubmit={(tamilData) => {
            setShowTamilModal(false);
            handleFinalPayNow(tamilData);
          }}
          initialData={existingBooking || null}
          englishData={form}
        />
      )}
    </div>
  );
}
