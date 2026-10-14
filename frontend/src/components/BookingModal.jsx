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
  }, []);

  useEffect(() => {
    if (existingBooking && user?.role === 'user') {
      api.getEditRequestForBooking(existingBooking.id)
        .then(req => {
          if (req) setEditRequestStatus(req.status);
        })
        .catch(err => console.error("Failed to load edit request status", err));
    }
  }, [existingBooking, user]);

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
    if (!form.title?.trim()) {
      setError("Please select Title.");
      return;
    }
    if (!form.name?.trim()) {
      setError("Please enter Full Name.");
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
    if (!form.kat_type?.trim()) {
      form.kat_type = 'Lifetime';
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
    setError(null);
    // Intercept with Tamil Details modal
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
        await api.createPayment({ booking_id: booking.id, amount: finalAmount, method: 'cash' });
      }
      
      // Once booking is registered, trigger Razorpay
      if (!finalAmount || parseFloat(finalAmount) === 0) {
        setShowTamilModal(false);
        onSaved(booking);
        onClose();
        return;
      }
      
      const orderData = await api.createRazorpayOrder({ booking_id: booking.id, amount: finalAmount });
      
      const options = {
        key: 'dummy_key_id',
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Vairavan Koil",
        description: "Kattalai Booking",
        order_id: orderData.id,
        handler: async function (response) {
          try {
            await api.verifyRazorpaySignature({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: booking.id,
              amount: finalAmount
            });
            setShowTamilModal(false);
            onSaved(booking);
            onClose();
          } catch (err) {
            setError('Payment verification failed: ' + err.message);
            setSaving(false);
          }
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.mobile
        },
        theme: {
          color: "#5c292c"
        },
        modal: {
          ondismiss: function() {
            setSaving(false);
            setShowTamilModal(false);
            onSaved(booking);
            onClose();
          }
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response){
        setError("Payment failed: " + response.error.description);
        setSaving(false);
      });
      rzp1.open();
      
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

  const LockIcon = () => (
    isLockedForUser ? (
      <button type="button" onClick={handleRequestChange} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#f37435]" title="Locked - Request Full Edit Access">
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

  const inputClass = "h-[38px] px-4 rounded-full border border-[#e2d8cb] bg-white font-barlow text-[14px] text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] transition-all w-full shadow-sm hover:border-[#cfc2b2] disabled:opacity-70 disabled:bg-[#f3ede3]";
  const selectClass = "h-[38px] px-4 rounded-full border border-[#e2d8cb] bg-white font-barlow text-[14px] text-gray-800 focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] transition-all w-full appearance-none pr-8 shadow-sm hover:border-[#cfc2b2] disabled:opacity-70 disabled:bg-[#f3ede3] cursor-pointer";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 p-3 sm:p-4 flex items-center justify-center overflow-y-auto">
      {!showTamilModal ? (
        <div 
          className="relative shadow-[0_20px_60px_-15px_rgba(70,40,20,0.25)] flex flex-col p-4 sm:p-6 bg-[#f7f1e5] border border-[#ebdccb] rounded-[24px] sm:rounded-[28px] max-w-[620px] w-full my-auto transition-all animate-fade-in max-h-[92vh] overflow-y-auto"
        >
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
              <label 
                className="flex items-center justify-end gap-1.5 cursor-pointer text-[11.5px] text-[#6e6359] font-medium hover:text-[#5c292c] transition-colors pr-1 self-end" 
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

              <div className="relative w-[110px] shrink-0">
                <input 
                  className="h-[38px] px-2 rounded-full border border-dashed border-[#c7b0a4] bg-white font-barlow text-[13px] font-bold text-[#5c292c] text-center w-full shadow-sm placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] transition-all disabled:opacity-75 disabled:bg-[#f8f4ec]"
                  placeholder="Office Code"
                  title="Office / Slot Code"
                  value={form.code || ''}
                  onChange={set('code')}
                  disabled={isLockedForUser}
                />
                <LockIcon />
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
                  className="h-full flex-1 min-w-0 bg-transparent px-3.5 font-barlow text-[13.5px] text-gray-800 placeholder-[#9c9186] focus:outline-none"
                  placeholder="WhatsApp Number"
                  value={form.whatsapp_number || ''}
                  onChange={set('whatsapp_number')}
                />
                <label 
                  className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[#6e6359] font-medium hover:text-[#5c292c] transition-colors px-3 h-full border-l border-[#ebdccb] shrink-0" 
                  onClick={() => {
                    const isSame = form.whatsapp_number === form.mobile && form.mobile !== '';
                    setForm(f => ({ ...f, whatsapp_number: isSame ? '' : f.mobile }));
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={form.whatsapp_number === form.mobile && form.mobile !== ''} 
                    readOnly 
                    className="w-3.5 h-3.5 rounded border-[#c7b0a4] accent-[#5c292c] cursor-pointer" 
                  />
                  <span>Same as Mobile</span>
                </label>
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

            {/* Row 2: Star, Place & Sponsorship */}
            <div className="flex gap-2.5 relative">
              <div className="relative w-1/3">
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

              <div className="relative w-1/3">
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

              <div className="relative w-1/3">
                <select 
                  className={`${selectClass} ${isLockedForUser ? 'pr-9' : ''}`}
                  value={form.kat_type || 'Lifetime'}
                  onChange={set('kat_type')}
                  disabled={isLockedForUser}
                >
                  <option value="Lifetime">Lifetime</option>
                  <option value="Inheritance">Inheritance</option>
                  {dropdowns.kat_type && dropdowns.kat_type.filter(o => o !== 'Lifetime' && o !== 'Inheritance').map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
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

            {/* Row 4: Sponsorship, Mobile (+91), WhatsApp, Office Code */}
            <div className="flex gap-2 relative items-start">
              {/* Sponsorship */}
              <div className="relative w-[135px] shrink-0">
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

              {/* Mobile with +91 */}
              <div className="flex w-[150px] shrink-0 items-center relative">
                <div className="relative flex items-center w-[50px] shrink-0">
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
                    className={`h-[38px] px-3 rounded-r-full border border-[#e2d8cb] bg-white font-barlow text-[13.5px] text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] w-full shadow-sm ${isLockedForUser ? 'pr-9' : ''}`}
                    placeholder="Mobile"
                    value={form.mobile || ''}
                    onChange={set('mobile')}
                    disabled={isLockedForUser}
                  />
                  <LockIcon />
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
                <label 
                  className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[#6e6359] font-medium hover:text-[#5c292c] transition-colors mt-1 px-1 whitespace-nowrap" 
                  onClick={() => {
                    const isSame = form.whatsapp_number === form.mobile && form.mobile !== '';
                    setForm(f => ({ ...f, whatsapp_number: isSame ? '' : f.mobile }));
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={form.whatsapp_number === form.mobile && form.mobile !== ''} 
                    readOnly 
                    className="w-3.5 h-3.5 rounded border-[#c7b0a4] accent-[#5c292c] cursor-pointer" 
                  />
                  <span>Same as Mobile</span>
                </label>
              </div>

              {/* Office Code */}
              <div className="relative w-[95px] shrink-0">
                <input 
                  className="h-[38px] px-2 rounded-full border border-dashed border-[#c7b0a4] bg-white font-barlow text-[13px] font-bold text-[#5c292c] text-center w-full shadow-sm placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] transition-all disabled:opacity-75 disabled:bg-[#f8f4ec]"
                  placeholder="Office Code"
                  title="Office / Slot Code"
                  value={form.code || ''}
                  onChange={set('code')}
                  disabled={isLockedForUser}
                />
                <LockIcon />
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

          {/* Action Buttons: Cancel & Register */}
          <div className="flex items-center justify-center gap-4 mt-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center font-barlow font-medium text-[15px] bg-white text-[#5c292c] border-2 border-[#5c292c] hover:bg-[#5c292c]/5 transition-all px-8 h-[38px] rounded-full shadow-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePayNow}
              disabled={saving}
              className="flex items-center justify-center font-barlow font-semibold text-[15px] transition-all px-9 h-[38px] rounded-full shadow-sm bg-[#5c292c] hover:bg-[#4a2123] text-white hover:shadow cursor-pointer active:scale-[0.99]"
              title={isFormValid ? "Proceed" : "Please fill all required fields to proceed"}
            >
              {saving ? 'Saving...' : (existingBooking ? (isUnlocked ? 'Update All Details' : 'Update Allowed Details') : 'Register')}
            </button>
          </div>
        </div>
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
