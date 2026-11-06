import { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext';
import TamilDetailsModal from './TamilDetailsModal.jsx';

export const COUNTRY_CODES = [
  { code: '91', name: 'India', flag: '🇮🇳' },
  { code: '60', name: 'Malaysia', flag: '🇲🇾' },
  { code: '65', name: 'Singapore', flag: '🇸🇬' },
  { code: '1', name: 'USA / Canada', flag: '🇺🇸' },
  { code: '44', name: 'UK', flag: '🇬🇧' },
  { code: '971', name: 'UAE', flag: '🇦🇪' },
  { code: '94', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: '61', name: 'Australia', flag: '🇦🇺' },
  { code: '968', name: 'Oman', flag: '🇴🇲' },
  { code: '974', name: 'Qatar', flag: '🇶🇦' },
  { code: '965', name: 'Kuwait', flag: '🇰🇼' },
  { code: '966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '973', name: 'Bahrain', flag: '🇧🇭' },
  { code: '49', name: 'Germany', flag: '🇩🇪' },
  { code: '33', name: 'France', flag: '🇫🇷' },
  { code: '41', name: 'Switzerland', flag: '🇨🇭' },
  { code: '64', name: 'New Zealand', flag: '🇳🇿' },
  { code: '852', name: 'Hong Kong', flag: '🇭🇰' },
  { code: '62', name: 'Indonesia', flag: '🇮🇩' },
  { code: '66', name: 'Thailand', flag: '🇹🇭' },
  { code: '95', name: 'Myanmar', flag: '🇲🇲' },
  { code: '27', name: 'South Africa', flag: '🇿🇦' },
  { code: '81', name: 'Japan', flag: '🇯🇵' },
  { code: '31', name: 'Netherlands', flag: '🇳🇱' },
  { code: '353', name: 'Ireland', flag: '🇮🇪' },
  { code: '39', name: 'Italy', flag: '🇮🇹' },
  { code: '47', name: 'Norway', flag: '🇳🇴' },
  { code: '46', name: 'Sweden', flag: '🇸🇪' },
  { code: '45', name: 'Denmark', flag: '🇩🇰' },
  { code: '230', name: 'Mauritius', flag: '🇲🇺' },
  { code: '977', name: 'Nepal', flag: '🇳🇵' },
  { code: '880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '34', name: 'Spain', flag: '🇪🇸' },
  { code: '55', name: 'Brazil', flag: '🇧🇷' },
  { code: '86', name: 'China', flag: '🇨🇳' },
  { code: '7', name: 'Russia', flag: '🇷🇺' },
  { code: '82', name: 'South Korea', flag: '🇰🇷' },
  { code: '63', name: 'Philippines', flag: '🇵🇭' },
  { code: '84', name: 'Vietnam', flag: '🇻🇳' },
  { code: '92', name: 'Pakistan', flag: '🇵🇰' },
  { code: '90', name: 'Turkey', flag: '🇹🇷' },
  { code: '254', name: 'Kenya', flag: '🇰🇪' },
  { code: '255', name: 'Tanzania', flag: '🇹🇿' },
  { code: '52', name: 'Mexico', flag: '🇲🇽' },
  { code: '32', name: 'Belgium', flag: '🇧🇪' },
  { code: '43', name: 'Austria', flag: '🇦🇹' },
  { code: '351', name: 'Portugal', flag: '🇵🇹' },
  { code: '30', name: 'Greece', flag: '🇬🇷' },
  { code: '48', name: 'Poland', flag: '🇵🇱' },
  { code: '358', name: 'Finland', flag: '🇫🇮' },
  { code: '962', name: 'Jordan', flag: '🇯🇴' },
  { code: '960', name: 'Maldives', flag: '🇲🇻' },
  { code: '975', name: 'Bhutan', flag: '🇧🇹' },
  { code: '673', name: 'Brunei', flag: '🇧🇳' },
  { code: '886', name: 'Taiwan', flag: '🇹🇼' },
  { code: '679', name: 'Fiji', flag: '🇫🇯' }
];

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
export default function BookingModal({ kattalaiType, existingBooking, onClose, onSaved, bookings, kattalaiTypes, date, initialSlot }) {
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
      const dayOfYear = getDayOfYear(date);

      if (initialSlot) {
        autoCode = `${prefix}/${initialSlot}/${dayOfYear}`;
      } else {
        const typeBookings = bookings.filter(b => b.kattalai_type_id === kattalaiType.id);
        const highestBookedSlot = typeBookings.reduce((max, b) => {
          if (b.code && b.code.startsWith(`${prefix}/`)) {
            const slotNum = parseInt(b.code.split('/')[1], 10);
            if (!isNaN(slotNum) && slotNum > max) return slotNum;
          }
          return max;
        }, 0);
        const nextSlot = highestBookedSlot + 1;
        autoCode = `${prefix}/${nextSlot}/${dayOfYear}`;
      }
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
  const [isTransferTamil, setIsTransferTamil] = useState(false);
  const [transferForm, setTransferForm] = useState({
    title: 'Selvan',
    title_ta: '',
    name: '',
    name_ta: '',
    star: '',
    star_ta: '',
    place: '',
    place_ta: '',
    country_code: existingBooking?.country_code || '91',
    mobile: '',
    whatsapp_number: '',
    email: '',
    address: '',
    payment_method: 'cash'
  });

  // Delete Kattalai Triple-OTP State (Superadmin Only)
  const isSuperAdmin = user && user.role === 'superadmin';
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteSession, setDeleteSession] = useState(null);
  const [deleteInitiating, setDeleteInitiating] = useState(false);
  const [deleteVerifying, setDeleteVerifying] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [otps, setOtps] = useState({
    president: '',
    treasurer: '',
    secretary: ''
  });

  const handleInitiateDelete = async () => {
    if (!existingBooking) return;
    const confirmMsg = `Permanently delete Kattalai for "${existingBooking.title || ''} ${existingBooking.name || ''}" (${existingBooking.code || '-'})?\n\nThis will send 3 WhatsApp authorization OTPs to the President, Treasurer, and Secretary.`;
    if (!window.confirm(confirmMsg)) return;

    setDeleteInitiating(true);
    setDeleteError(null);
    try {
      const res = await api.initiateKattalaiDeletion(existingBooking.id);
      setDeleteSession(res);
      setOtps({ president: '', treasurer: '', secretary: '' });
      setShowDeleteModal(true);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to initiate deletion request');
    } finally {
      setDeleteInitiating(false);
    }
  };

  const handleVerifyAndDelete = async (e) => {
    e?.preventDefault();
    if (!deleteSession) return;

    if (!otps.president.trim() || !otps.treasurer.trim() || !otps.secretary.trim()) {
      setDeleteError('Please enter all 3 authorization OTPs (President, Treasurer, and Secretary).');
      return;
    }

    setDeleteVerifying(true);
    setDeleteError(null);
    try {
      const res = await api.verifyAndDeleteKattalai({
        requestId: deleteSession.requestId,
        presidentOtp: otps.president.trim(),
        treasurerOtp: otps.treasurer.trim(),
        secretaryOtp: otps.secretary.trim()
      });

      alert(res.message || 'Kattalai permanently deleted.');
      setShowDeleteModal(false);
      if (onSaved) onSaved();
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      setDeleteError(err.message || 'Verification failed. Please check OTPs.');
    } finally {
      setDeleteVerifying(false);
    }
  };

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

  function handleStartTransferTamil(e) {
    if (e) e.preventDefault();
    if (!transferForm.name?.trim()) {
      setTransferError('Please enter the name of the son or daughter');
      return;
    }
    setTransferError(null);
    setIsTransferTamil(true);
    setShowTamilModal(true);
  }

  async function handleConfirmTransfer(tamilData = {}) {
    setTransferring(true);
    setTransferError(null);
    try {
      const payload = {
        title: transferForm.title,
        title_ta: tamilData.title_ta || transferForm.title_ta || '',
        name: transferForm.name.trim(),
        name_ta: (tamilData.name_ta || transferForm.name_ta || transferForm.name).trim(),
        star: transferForm.star,
        star_ta: tamilData.star_ta || transferForm.star_ta || '',
        place: transferForm.place,
        place_ta: tamilData.place_ta || transferForm.place_ta || '',
        country_code: transferForm.country_code || '91',
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
      setShowTamilModal(false);
      setIsTransferTamil(false);
      if (onSaved) onSaved(res.booking);
      onClose();
    } catch (err) {
      setTransferError(err.message || 'Failed to complete transfer');
      setTransferring(false);
      setShowTamilModal(false);
    }
  }

  const isUnlocked = editRequestStatus === 'approved';
  const isLockedForUser = user?.role === 'user' && !isUnlocked;

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => {
      const next = { ...f, [field]: val };
      if (field === 'booking_date' && val && !existingBooking && f.code) {
        const m = f.code.match(/^([A-Za-z]+)\/(\d+)/);
        if (m) {
          const newDoy = getDayOfYear(val);
          next.code = `${m[1]}/${m[2]}/${newDoy}`;
        }
      }
      return next;
    });
  };

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
      const smartSplitAddress = (addr, place = '') => {
        if (!addr) return [];
        if (addr.includes(',') || addr.includes('\n')) {
          return addr.split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean);
        }
        const trimmed = addr.trim();
        const words = trimmed.split(/\s+/);
        if (words.length <= 3) return [trimmed];

        const result = [];
        let remaining = trimmed;
        let cityPart = '';
        const pinMatch = remaining.match(/(\b\d{6}\b)\s*$/);
        if (pinMatch) {
          const beforePin = remaining.slice(0, pinMatch.index).trim();
          const cityWords = beforePin.split(/\s+/);
          const lastWord = cityWords.pop() || '';
          cityPart = (lastWord ? lastWord + ' ' : '') + pinMatch[1];
          remaining = cityWords.join(' ');
        } else if (place && remaining.toLowerCase().endsWith(place.toLowerCase().trim())) {
          const pTrim = place.trim();
          cityPart = remaining.slice(remaining.length - pTrim.length).trim();
          remaining = remaining.slice(0, remaining.length - pTrim.length).trim();
        }

        const streetRegex = /^(.*?\b(?:street|st|road|rd|salai|nagar|colony|avenue|ave|lane|ln|cross|layout|apartment|apartments|flat|flats)\b\.?)\s*(.*)$/i;
        const match = remaining.match(streetRegex);
        if (match && match[1] && match[2]) {
          result.push(match[1].trim());
          if (match[2].trim()) result.push(match[2].trim());
        } else {
          const remWords = remaining.split(/\s+/);
          if (remWords.length >= 4) {
            const mid = Math.ceil(remWords.length / 2);
            result.push(remWords.slice(0, mid).join(' '));
            result.push(remWords.slice(mid).join(' '));
          } else if (remaining) {
            result.push(remaining);
          }
        }
        if (cityPart) result.push(cityPart);
        return result.filter(Boolean);
      };

      const perParts = smartSplitAddress(form.permanent_address, form.place);
      const commParts = smartSplitAddress(form.communication_address, form.place);
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
    
    // Parse form.code to see which prefix and slot is currently selected
    const currentCode = (form.code || '').trim();
    const codeMatch = currentCode.match(/^([A-Za-z]+)\/(\d+)/);
    const selectedPrefix = codeMatch ? codeMatch[1].toUpperCase() : '';
    const selectedSlotNum = codeMatch ? parseInt(codeMatch[2], 10) : null;
    const isPrefixMatch = selectedPrefix === prefix || 
      (prefix === 'U' && (selectedPrefix === 'UK' || selectedPrefix === 'U')) || 
      (prefix === 'A' && (selectedPrefix === 'AJ' || selectedPrefix === 'A'));

    const highestBookedSlot = typeBookings.reduce((max, b) => {
      if (b.code) {
        const m = b.code.match(/^([A-Za-z]+)\/(\d+)/);
        if (m) {
          const p = m[1].toUpperCase();
          const s = parseInt(m[2], 10);
          if ((p === prefix || (prefix === 'U' && (p === 'UK' || p === 'U')) || (prefix === 'A' && (p === 'AJ' || p === 'A'))) && s > max) {
            return s;
          }
        }
      }
      return max;
    }, 0);

    const totalRender = Math.max(kType.max_slots || 4, highestBookedSlot, (isPrefixMatch && selectedSlotNum) ? selectedSlotNum : 0);
    const slots = [];
    
    for (let slotNum = 1; slotNum <= totalRender; slotNum++) {
      const isSelected = isPrefixMatch && selectedSlotNum === slotNum;
      
      const isBookedByOther = typeBookings.some(b => {
        if (existingBooking && (String(b.id) === String(existingBooking.id) || String(b.id) === String(form.id))) return false;
        if (!b.code) return false;
        const bm = b.code.trim().match(/^([A-Za-z]+)\/(\d+)/);
        if (!bm) return false;
        const bp = bm[1].toUpperCase();
        const bs = parseInt(bm[2], 10);
        const bpm = bp === prefix || (prefix === 'U' && (bp === 'UK' || bp === 'U')) || (prefix === 'A' && (bp === 'AJ' || bp === 'A'));
        return bpm && bs === slotNum;
      });

      // Style logic:
      // 1. isSelected -> DARK SHADE (Prominently highlighted, solid color, 100% opacity)
      // 2. isBookedByOther -> LIGHT SHADE (Muted background, 0.30 opacity)
      // 3. Available -> OUTLINE ONLY (transparent background, 100% border)
      let slotBg = 'transparent';
      let slotBorder = `1.8px solid ${color}`;
      let slotOpacity = 1;
      let slotShadow = 'none';
      let slotTransform = 'none';
      let slotTitle = `Slot ${slotNum} (Available)`;

      if (isSelected) {
        slotBg = prefix === 'U' ? '#ea580c' : '#456b8a';
        slotBorder = `2px solid ${prefix === 'U' ? '#9a3412' : '#274359'}`;
        slotOpacity = 1;
        slotShadow = `0 0 6px ${prefix === 'U' ? 'rgba(234, 88, 12, 0.65)' : 'rgba(69, 107, 138, 0.7)'}`;
        slotTransform = 'scale(1.15)';
        slotTitle = `Slot ${slotNum} (Selected: ${form.code || `${prefix}/${slotNum}`})`;
      } else if (isBookedByOther) {
        slotBg = color;
        slotBorder = `1.8px solid ${color}`;
        slotOpacity = 0.30;
        slotTitle = `Slot ${slotNum} (Booked)`;
      }

      slots.push(
        <button
          key={slotNum}
          type="button"
          onClick={() => {
            if (!isBookedByOther && !isSelected && !existingBooking) {
              const dayOfYear = getDayOfYear(form.booking_date);
              setForm(f => ({
                ...f,
                kattalai_type_id: kType.id,
                kat_type: kType.name,
                code: `${prefix}/${slotNum}/${dayOfYear}`
              }));
            }
          }}
          disabled={isBookedByOther || isSelected || !!existingBooking}
          className="transition-all"
          style={{
            width: '13px',
            height: '24px',
            borderRadius: '6.5px',
            backgroundColor: slotBg,
            border: slotBorder,
            opacity: slotOpacity,
            cursor: (isBookedByOther || !!existingBooking) ? 'default' : 'pointer',
            boxShadow: slotShadow,
            transform: slotTransform
          }}
          title={slotTitle}
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
          className="relative shadow-[0_20px_60px_-15px_rgba(70,40,20,0.25)] flex flex-col p-4 sm:p-6 bg-[#f7f1e5] border border-[#ebdccb] rounded-[24px] sm:rounded-[28px] max-w-[680px] w-full my-auto transition-all animate-fade-in max-h-[92vh] overflow-y-auto"
          style={{ maxWidth: '680px', width: '100%' }}
        >
          {!showTransferModal ? (
            <div className="w-full flex flex-col gap-2.5">
            
            {/* Header: New Booking / Edit Booking on Left, Office Code on Right */}
            <div className="flex items-center justify-between px-1 pb-1 border-b border-[#ebdccb]/60 mb-1">
              <h3 className="text-[17px] sm:text-[18px] font-bold text-[#5c292c] font-barlow tracking-wide">
                {existingBooking ? 'Edit Booking' : 'New Booking'}
              </h3>
              <div className="flex items-center gap-2">
                {form.code && (
                  <div 
                    className="px-3 py-0.5 rounded-full border border-dashed border-[#c7b0a4] bg-white font-barlow text-[12.5px] font-bold text-[#5c292c] shadow-xs flex items-center gap-1.5"
                    title="Office / Slot Code"
                  >
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Office Code:</span>
                    <span>{form.code}</span>
                  </div>
                )}
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
            </div>

            {/* Transferred Notice if already transferred */}
            {isAlreadyTransferred && (
              <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl px-3 py-2 flex items-center gap-2.5 text-xs text-[#0369a1] animate-fade-in mb-1">
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

            {/* Row 3: Permanent Address & Communication Address */}
            <div className="flex flex-col sm:flex-row gap-2.5 relative items-start">
              <div className="relative w-full sm:w-1/2">
                <input 
                  className={`${inputClass} ${isLockedForUser ? 'pr-9' : ''}`}
                  placeholder="Permanent Address"
                  value={form.permanent_address}
                  onChange={set('permanent_address')}
                  disabled={isLockedForUser}
                />
                <LockIcon />
              </div>

              <div className="w-full sm:w-1/2 flex flex-col">
                <div className="relative w-full">
                  <input 
                    className={inputClass}
                    placeholder="Communication Address"
                    value={form.communication_address}
                    onChange={set('communication_address')}
                  />
                </div>
                <label 
                  className="flex items-center justify-end gap-1.5 cursor-pointer text-[11.5px] text-[#6e6359] font-medium hover:text-[#5c292c] transition-colors mt-1 pr-1 self-end select-none"
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

            {/* Row 4: Whatsappnumber, Mobilenumber, Email, Sponsorshiptype */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 relative items-center">
              {/* 1. WhatsApp Number (compact dial code value alone) */}
              <div className="flex items-center relative">
                <div className="relative flex items-center w-[52px] shrink-0">
                  <select 
                    className="h-[38px] pl-1.5 pr-3 rounded-l-full border border-r-0 border-[#e2d8cb] bg-[#faf8f5] font-barlow text-[12.5px] font-bold text-[#5c292c] focus:outline-none focus:border-[#5c292c] w-full shadow-sm appearance-none cursor-pointer hover:bg-[#f3ede3] transition-colors text-center"
                    value={String(form.country_code || '91').replace(/\D/g, '')}
                    onChange={(e) => setForm(f => ({ ...f, country_code: e.target.value }))}
                    title="Country Code for WhatsApp"
                  >
                    {COUNTRY_CODES.map(c => (
                      <option key={c.code} value={c.code}>
                        +{c.code}
                      </option>
                    ))}
                    {form.country_code && !COUNTRY_CODES.some(c => c.code === String(form.country_code).replace(/\D/g, '')) && (
                      <option value={String(form.country_code).replace(/\D/g, '')}>
                        +{String(form.country_code).replace(/\D/g, '')}
                      </option>
                    )}
                  </select>
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8075]">
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                </div>
                <div className="relative flex-1 min-w-0">
                  <input 
                    className="h-[38px] rounded-r-full border border-[#e2d8cb] bg-white font-barlow text-[13.5px] text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] w-full shadow-sm px-2.5"
                    placeholder="WhatsApp"
                    title="WhatsApp Number"
                    value={form.whatsapp_number || ''}
                    onChange={set('whatsapp_number')}
                  />
                </div>
              </div>

              {/* 2. Mobile (fixed +91) */}
              <div className="flex items-center relative">
                <div className="h-[38px] w-[50px] rounded-l-full border border-r-0 border-[#e2d8cb] bg-[#faf8f5] font-barlow text-[13px] font-bold text-[#5c292c] flex items-center justify-center shrink-0 shadow-sm cursor-default">
                  +91
                </div>
                <div className="relative flex-1 min-w-0">
                  <input 
                    className={`h-[38px] rounded-r-full border border-[#e2d8cb] bg-white font-barlow text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] w-full shadow-sm ${isLockedForUser ? 'pl-2.5 pr-7 text-[13px] tracking-tight' : 'px-3 text-[13.5px]'}`}
                    placeholder="Mobile"
                    value={form.mobile || ''}
                    onChange={set('mobile')}
                    disabled={isLockedForUser}
                  />
                  <LockIcon className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#f37435]" />
                </div>
              </div>

              {/* 3. Email */}
              <div className="relative">
                <input 
                  className={inputClass}
                  placeholder="Email Address"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                />
              </div>

              {/* 4. Sponsorship Type */}
              <div className="relative">
                <select 
                  className={`${selectClass} ${isLockedForUser || isAlreadyTransferred ? 'pr-9 opacity-80 cursor-not-allowed bg-[#f7f2ea]' : ''}`}
                  value={form.kat_type || ''}
                  onChange={set('kat_type')}
                  disabled={isLockedForUser || isAlreadyTransferred}
                  title={isAlreadyTransferred ? "Transferred account is permanently set to Inheritance" : "Sponsorship Type"}
                >
                  <option value="" disabled>Sponsorship</option>
                  {dropdowns.kat_type.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8075]">
                  {!isLockedForUser && !isAlreadyTransferred && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>}
                </div>
                {(isLockedForUser || isAlreadyTransferred) && (
                  <LockIcon className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#f37435]" />
                )}
              </div>
            </div>

            {/* Row 5: Date of Registration, Office Code, Date of Transfer, Balance (Payment in DB) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative items-center">
              {/* 1. Date of Registration (Fixed DB value for Edit, Datepicker for New) */}
              <div className="relative flex flex-col">
                <span className="text-[10.5px] font-bold text-[#5c292c] mb-1 px-1">Date of Registration</span>
                {existingBooking ? (
                  <div 
                    className="h-[38px] px-3.5 rounded-full border border-[#e2d8cb] bg-[#f9f6f0] font-barlow text-xs sm:text-[13px] font-semibold text-gray-700 flex items-center justify-center shadow-xs cursor-default"
                    title="Date of Registration / Pooja Date recorded in Database"
                  >
                    <span>{existingBooking.booking_date ? new Date(existingBooking.booking_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : (formattedDate || '—')}</span>
                  </div>
                ) : (
                  <input 
                    type="date"
                    className={`${inputClass} text-xs sm:text-[13px] font-semibold text-[#5c292c] cursor-pointer`}
                    value={form.booking_date}
                    onChange={set('booking_date')}
                    title="Select Registration / Pooja Date"
                  />
                )}
              </div>

              {/* 2. Office Code */}
              <div className="relative flex flex-col">
                <span className="text-[10.5px] font-bold text-[#5c292c] mb-1 px-1">Office Code</span>
                <div 
                  className="h-[38px] px-3.5 rounded-full border border-dashed border-[#c7b0a4] bg-white font-barlow text-xs sm:text-[13px] font-bold text-[#5c292c] flex items-center justify-center shadow-xs cursor-default"
                  title="Office / Slot Code"
                >
                  <span>{form.code || '—'}</span>
                </div>
              </div>

              {/* 3. Date of Transfer (Fixed / Read-only DB value) */}
              <div className="relative flex flex-col">
                <span className="text-[10.5px] font-bold text-[#5c292c] mb-1 px-1">Date of Transfer</span>
                <div 
                  className="h-[38px] px-3 rounded-full border border-[#e2d8cb] bg-[#f9f6f0] font-barlow text-xs sm:text-[13px] font-semibold text-gray-700 flex items-center justify-center shadow-xs cursor-default"
                  title="1-Time Transfer Date recorded in Database"
                >
                  <span>{existingBooking?.transferred_at ? new Date(existingBooking.transferred_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                </div>
              </div>

              {/* 4. Balance (Payment in DB column - Fixed DB value for Edit, input for New) */}
              <div className="relative flex flex-col">
                <span className="text-[10.5px] font-bold text-[#5c292c] mb-1 px-1">Balance (Payment)</span>
                {existingBooking ? (
                  <div 
                    className="h-[38px] px-3 rounded-full border border-[#ebdccb] bg-[#fdfaf5] font-barlow text-xs sm:text-[13.5px] font-extrabold text-[#5c292c] flex items-center justify-center shadow-xs cursor-default"
                    title="Payment recorded in Database column"
                  >
                    <span>{form.amount !== '' && form.amount !== undefined ? `₹${parseFloat(form.amount || 0).toLocaleString('en-IN')}` : '₹0'}</span>
                  </div>
                ) : (
                  <div className="relative w-full">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                    <input 
                      className={`${inputClass} pl-7 font-bold text-[#5c292c]`}
                      placeholder="Amount"
                      type="number"
                      min="0"
                      step="1"
                      value={form.amount}
                      onChange={set('amount')}
                      title="Initial Payment Amount"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Row 6: Kattalai Slots (Centered) */}
            <div className="flex flex-col items-center justify-center gap-1 mt-1">
              <span className="text-[10.5px] font-bold text-[#8c8075] uppercase tracking-wider">Kattalai Slots</span>
              <div className="flex items-center justify-center gap-2 py-1.5 px-4 bg-white rounded-full border border-[#e2d8cb] shadow-sm">
                <div className="flex gap-1.5 items-center">
                  {renderSlots(uchikalaType, 'U', '#f37435')}
                </div>
                <div className="w-[1.5px] h-[18px] bg-[#d5c7b7] mx-1"></div>
                <div className="flex gap-1.5 items-center">
                  {renderSlots(arthajamaType, 'A', '#6f8ea8')}
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

            {/* Row 7: Action Buttons: Cancel, Transfer (if eligible), & Register / Update */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-3 pt-1 pb-1">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center font-barlow font-medium text-[15px] bg-white text-[#5c292c] border-2 border-[#5c292c] hover:bg-[#5c292c]/5 transition-all px-7 h-[38px] rounded-full shadow-sm"
              >
                Cancel
              </button>
              {existingBooking && isSuperAdmin && (
                <button
                  type="button"
                  onClick={handleInitiateDelete}
                  disabled={deleteInitiating}
                  className="flex items-center justify-center gap-1.5 font-barlow font-semibold text-[14px] bg-red-50 text-red-700 border border-red-300 hover:bg-red-100 transition-all px-4 sm:px-5 h-[38px] rounded-full shadow-sm cursor-pointer active:scale-[0.99] disabled:opacity-50"
                  title="Super Admin: Delete Kattalai (Requires President, Treasurer, Secretary WhatsApp OTPs)"
                >
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {deleteInitiating ? 'Sending OTPs...' : 'Delete Kattalai'}
                </button>
              )}
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
                title={isFormValid ? (existingBooking ? "Update Details" : "Pay") : "Please fill all required fields to proceed"}
              >
                {saving ? 'Saving...' : (existingBooking ? 'Update Details' : 'Pay')}
              </button>
            </div>
          </div>
        ) : (
          /* Transfer Modal View (Inline) - Clean & Compact without scrolling */
          <div className="w-full flex flex-col gap-2.5 font-barlow animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-1 pb-1 border-b border-[#ebdccb]/60 mb-0.5">
              <h3 className="text-[17px] sm:text-[18px] font-bold text-[#5c292c] tracking-wide flex items-center gap-2">
                <span>1-Time Account Transfer</span>
                <span className="text-[10px] font-bold bg-[#c2410c] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Son / Daughter</span>
              </h3>
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

            {/* Form Inputs for Child - Clean Compact Rows */}
            <div className="flex flex-col gap-2.5">
              {/* Row 1: Title & Child's Name */}
              <div className="flex gap-2.5 relative">
                <div className="relative w-[110px] shrink-0">
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
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8075]">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                </div>
                <div className="relative flex-1 min-w-0">
                  <input
                    className={inputClass}
                    placeholder="Child's Full Name (Son / Daughter) *"
                    value={transferForm.name}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Row 2: Star & Place */}
              <div className="flex gap-2.5 relative">
                <div className="relative w-1/2">
                  <select
                    className={selectClass}
                    value={transferForm.star || ''}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, star: e.target.value }))}
                  >
                    <option value="" disabled>Star (நட்சத்திரம்)</option>
                    {dropdowns.star.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8075]">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                </div>
                <div className="relative w-1/2">
                  <select
                    className={selectClass}
                    value={transferForm.place || ''}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, place: e.target.value }))}
                  >
                    <option value="" disabled>Place (ஊர்)</option>
                    {dropdowns.place.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8075]">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              {/* Row 3: Address & Email Address */}
              <div className="flex gap-2.5 relative">
                <div className="relative w-1/2">
                  <input
                    className={inputClass}
                    placeholder="Address"
                    value={transferForm.address}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div className="relative w-1/2">
                  <input
                    type="email"
                    className={inputClass}
                    placeholder="Email Address"
                    value={transferForm.email}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              {/* Row 4: WhatsApp, Mobile, Payment Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 relative">
                <div className="flex items-center relative">
                  <div className="relative flex items-center w-[52px] shrink-0">
                    <select
                      className="h-[38px] pl-1.5 pr-3 rounded-l-full border border-r-0 border-[#e2d8cb] bg-[#faf8f5] font-barlow text-[12.5px] font-bold text-[#5c292c] focus:outline-none focus:border-[#5c292c] w-full shadow-sm appearance-none cursor-pointer hover:bg-[#f3ede3] transition-colors text-center"
                      value={String(transferForm.country_code || '91').replace(/\D/g, '')}
                      onChange={(e) => setTransferForm(prev => ({ ...prev, country_code: e.target.value }))}
                      title="Country Code"
                    >
                      {COUNTRY_CODES.map(c => (
                        <option key={c.code} value={c.code}>
                          +{c.code}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8075]">
                      <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
                    </div>
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <input
                      className="h-[38px] rounded-r-full border border-[#e2d8cb] bg-white font-barlow text-[13.5px] text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] w-full shadow-sm px-2.5"
                      placeholder="WhatsApp"
                      title="WhatsApp Number"
                      value={transferForm.whatsapp_number}
                      onChange={(e) => setTransferForm(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex items-center relative">
                  <div className="h-[38px] w-[50px] rounded-l-full border border-r-0 border-[#e2d8cb] bg-[#faf8f5] font-barlow text-[13px] font-bold text-[#5c292c] flex items-center justify-center shrink-0 shadow-sm cursor-default">
                    +91
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <input
                      className="h-[38px] rounded-r-full border border-[#e2d8cb] bg-white font-barlow text-[13.5px] text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] w-full shadow-sm px-3"
                      placeholder="Mobile"
                      value={transferForm.mobile}
                      onChange={(e) => setTransferForm(prev => ({ ...prev, mobile: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="relative">
                  <select
                    value={transferForm.payment_method}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, payment_method: e.target.value }))}
                    className={selectClass}
                  >
                    <option value="cash">Cash Payment</option>
                    <option value="upi">GPay / UPI</option>
                    <option value="bank_transfer">Bank Transfer / NEFT</option>
                    <option value="cheque">Cheque</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8075]">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Error message */}
            {transferError && (
              <div className="text-red-600 text-xs font-semibold bg-red-50 p-2 rounded-lg border border-red-200 text-center">
                {transferError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 pt-2 border-t border-[#ebdccb]/60 mt-1">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="flex items-center justify-center font-barlow font-medium text-[15px] bg-white text-[#5c292c] border-2 border-[#5c292c] hover:bg-[#5c292c]/5 transition-all px-7 h-[38px] rounded-full shadow-sm"
              >
                Back to Edit
              </button>
              <button
                type="button"
                disabled={transferring || !transferForm.name.trim()}
                onClick={handleStartTransferTamil}
                className="flex items-center justify-center font-barlow font-semibold text-[15px] transition-all px-8 h-[38px] rounded-full shadow-sm bg-[#c2410c] hover:bg-[#9a3412] text-white hover:shadow cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                {transferring ? 'Transferring...' : `Proceed to Tamil Details (₹${transferDifferenceAmount.toLocaleString()})`}
              </button>
            </div>
          </div>
        )}
        </div>
      ) : (
        <TamilDetailsModal 
          isOpen={showTamilModal} 
          isInline={true}
          onClose={() => {
            setShowTamilModal(false);
            if (isTransferTamil) {
              setIsTransferTamil(false);
            }
          }}
          onSubmit={(tamilData) => {
            if (isTransferTamil) {
              handleConfirmTransfer(tamilData);
            } else {
              setShowTamilModal(false);
              handleFinalPayNow(tamilData);
            }
          }}
          initialData={isTransferTamil ? null : (existingBooking || null)}
          englishData={isTransferTamil ? {
            title: transferForm.title,
            name: transferForm.name,
            star: transferForm.star,
            place: transferForm.place,
            amount: transferDifferenceAmount,
            comments: `1-Time Account Transfer from ${existingBooking?.title || ''} ${existingBooking?.name || ''}`
          } : form}
        />
      )}

      {/* TRIPLE-OTP KATTALAI DELETION MODAL */}
      {showDeleteModal && deleteSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto animate-fade-in font-barlow">
          <div className="relative bg-[#f7f1e5] border-2 border-red-300 rounded-[28px] max-w-[500px] w-full p-6 sm:p-7 shadow-2xl my-auto flex flex-col gap-4">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#ebdccb]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 border border-red-300 flex items-center justify-center text-red-700 shrink-0 shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-900 tracking-tight">
                    Authorize Kattalai Deletion
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs bg-white text-[#5c292c] font-bold px-2 py-0.5 rounded border border-[#ebdccb]">
                      Office Code: {deleteSession.officeCode || existingBooking?.code}
                    </span>
                    <span className="text-xs text-gray-700 font-semibold truncate max-w-[170px]">
                      {deleteSession.bookingName || existingBooking?.name}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:text-red-800 hover:bg-red-50 transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Instruction Notice */}
            <div className="bg-red-50/70 border border-red-200 rounded-[16px] p-3 text-xs text-red-900 leading-relaxed">
              <strong>Triple-Party Verification:</strong> 3 distinct 6-digit random OTPs have been sent via WhatsApp to the registered leadership team. All 3 must match to permanently delete this Kattalai.
              <div className="mt-1 font-semibold text-red-800">⏱ Valid for 1 Hour (60 minutes).</div>
            </div>

            {/* OTP Inputs */}
            <form onSubmit={handleVerifyAndDelete} className="flex flex-col gap-3.5">
              
              {/* 1. President OTP */}
              <div className="bg-white rounded-[16px] border border-[#ebdccb] p-3 shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#5c292c] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                    President OTP
                  </label>
                  <span className="text-[11px] text-gray-500 font-medium truncate max-w-[200px]">
                    {deleteSession.powerUsers?.president?.name} ({deleteSession.powerUsers?.president?.phoneMasked})
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otps.president}
                  onChange={(e) => setOtps(o => ({ ...o, president: e.target.value.replace(/\D/g, '') }))}
                  className="w-full h-[38px] px-4 rounded-full border border-[#ebdccb] bg-[#faf8f7] font-mono text-center text-sm font-bold tracking-widest text-[#5c292c] focus:outline-none focus:border-red-500 focus:bg-white"
                  required
                />
              </div>

              {/* 2. Treasurer OTP */}
              <div className="bg-white rounded-[16px] border border-[#ebdccb] p-3 shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#5c292c] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Treasurer OTP
                  </label>
                  <span className="text-[11px] text-gray-500 font-medium truncate max-w-[200px]">
                    {deleteSession.powerUsers?.treasurer?.name} ({deleteSession.powerUsers?.treasurer?.phoneMasked})
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otps.treasurer}
                  onChange={(e) => setOtps(o => ({ ...o, treasurer: e.target.value.replace(/\D/g, '') }))}
                  className="w-full h-[38px] px-4 rounded-full border border-[#ebdccb] bg-[#faf8f7] font-mono text-center text-sm font-bold tracking-widest text-[#5c292c] focus:outline-none focus:border-red-500 focus:bg-white"
                  required
                />
              </div>

              {/* 3. Secretary OTP */}
              <div className="bg-white rounded-[16px] border border-[#ebdccb] p-3 shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#5c292c] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Secretary OTP
                  </label>
                  <span className="text-[11px] text-gray-500 font-medium truncate max-w-[200px]">
                    {deleteSession.powerUsers?.secretary?.name} ({deleteSession.powerUsers?.secretary?.phoneMasked})
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otps.secretary}
                  onChange={(e) => setOtps(o => ({ ...o, secretary: e.target.value.replace(/\D/g, '') }))}
                  className="w-full h-[38px] px-4 rounded-full border border-[#ebdccb] bg-[#faf8f7] font-mono text-center text-sm font-bold tracking-widest text-[#5c292c] focus:outline-none focus:border-red-500 focus:bg-white"
                  required
                />
              </div>

              {/* Development Mode Helper */}
              {deleteSession.debugOtps && (
                <div className="bg-amber-50 border border-amber-200 rounded-[14px] p-2.5 flex items-center justify-between text-xs">
                  <div className="text-amber-900 font-medium text-[11px]">
                    <span className="font-bold">Test Mode:</span> Pres: {deleteSession.debugOtps.president} | Treas: {deleteSession.debugOtps.treasurer} | Sec: {deleteSession.debugOtps.secretary}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtps({
                      president: deleteSession.debugOtps.president,
                      treasurer: deleteSession.debugOtps.treasurer,
                      secretary: deleteSession.debugOtps.secretary
                    })}
                    className="text-[10px] font-bold bg-amber-200 hover:bg-amber-300 text-amber-900 px-2 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              {/* Error notice */}
              {deleteError && (
                <div className="bg-red-100 text-red-900 text-xs py-2 px-3 rounded-full border border-red-300 text-center font-medium animate-fade-in">
                  ⚠️ {deleteError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ebdccb]">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteVerifying}
                  className="px-5 py-2 rounded-full border border-gray-400 text-gray-700 font-semibold text-xs bg-white hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteVerifying || !otps.president || !otps.treasurer || !otps.secretary}
                  className="px-6 py-2 rounded-full bg-red-700 hover:bg-red-800 text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {deleteVerifying ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      Verifying & Deleting...
                    </>
                  ) : (
                    'Verify & Permanently Delete'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
