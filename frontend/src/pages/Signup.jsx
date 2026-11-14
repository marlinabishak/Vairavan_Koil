import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import TamilDetailsModal from '../components/TamilDetailsModal.jsx';
import OnlinePaymentModal from '../components/OnlinePaymentModal.jsx';
import Combobox from '../components/Combobox.jsx';
import { COUNTRY_CODES } from '../components/BookingModal.jsx';
import { calculateKattalaiFee } from '../utils/kattalaiFee.js';

function getDayOfYear(dateString) {
  if (!dateString) return 0;
  const date = new Date(dateString);
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = (date - start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

const DEFAULT_OPTIONS = {
  title: [
    "Thiru", "Thirumathi", "Selvi", "Selvan"
  ],
  star: [
    "Anusam", "Aswathi", "Avittam", "Ayilyam", "Bharani", "Chithirai",
    "Hastham", "Karthikai", "Keettai", "Magam", "Mirukashirisham",
    "Moolam", "Pooraadam", "Pooram", "Poorattathi", "Poosam",
    "Punarpoosam", "Revathi", "Rohini", "Sadayam", "Swathi",
    "Thiruvathirai", "Thiruvonam", "Uthiradam", "Uthiram", "Uthirattathi", "Visakam"
  ],
  place: [
    "A THEKKUR", "A.MUTHUPPATTINAM", "AAVNIPPATTI", "ALAVAKOTTAI", "ARANMANAI SIRUVAYAL",
    "ARAVAYAL", "ARIMALAM", "ARIYAGUDI", "ATHANGUDI", "CHENNAI", "CHOKALINGAM PUDUR",
    "COIMBATORE", "DEVAKOTTAI", "K.ALAGAPURI", "KADIAPATTI", "KALAYAR MANGALAM",
    "KALLAL", "KANADUKATHAN", "KANDANUR", "KANDARAMANIKKAM", "KANDAVARAYANPATTI",
    "KARAIKUDI", "KARUNGKULAM", "KEELASEVALPATTI", "KO.ALAGAPURI", "KONAPET",
    "KOPPANA PATTI", "KOTHAMANGALAM", "KOTTAIYUR", "KULIPIRAI", "KURUVIKONDANPATTI",
    "MAKIBALANPATTI", "MANAKIRI", "MATHAGU PATTI", "MELAI SIVAPURI", "MUTHU PATTINAM.K",
    "NACHANDU PATTI", "NACHIAPURAM", "NATARAJAPURAM", "NATTARASAN KOTTAI", "NEMATHANPATTI",
    "NERKUPPAI", "ONASIRUVAYAL", "OOKUR", "P.ALAGAPURI", "PAGANERY", "PALAVANGUDI",
    "PALLATHUR", "PANAGUDI", "PATTAMANGALAM", "PON PUDUPATTI", "POOLANKURICHI",
    "PUDUVAYAL", "RAMACHANDRA PURAM", "RAYAVARAM", "SIRAVAYAL", "SIRUKUDALPATTI",
    "SIVUR", "THENIPATTI", "V.LAKSHMIPURAM", "VALAYAPATTI", "VENTHAN PATTI",
    "VETRIYUR", "VIRACHILAI", "VIRAMATHI", "VISWANATHA PURAM.K"
  ],
  kat_type: [
    "Lifetime", "Inheritance"
  ]
};

const DEFAULT_KATTALAI_TYPES = [
  { id: 'morning_default', name: 'Uchikala Kattalai', name_ta: 'உச்சிக்கால கட்டளை', color_key: 'morning', max_slots: 4, default_amount: 1000 },
  { id: 'evening_default', name: 'Arthajama Kattalai', name_ta: 'அர்த்தஜாம கட்டளை', color_key: 'evening-blue', max_slots: 4, default_amount: 1000 }
];

export default function Signup() {
  const [formData, setFormData] = useState({
    title: '', name: '', star: '', place: '',
    permanent_address: '', communication_address: '',
    mobile: '', whatsapp_number: '', code: '',
    email: '',
    regn_date: new Date().toISOString().slice(0, 10),
    kattalai_type_id: '', kat_type: 'Lifetime', country_code: '91'
  });

  const [selectedBookingDate, setSelectedBookingDate] = useState(new Date().toISOString().slice(0, 10));
  const [kattalaiTypes, setKattalaiTypes] = useState(DEFAULT_KATTALAI_TYPES);
  const [bookings, setBookings] = useState([]);
  const [formError, setFormError] = useState('');
  const [dropdowns, setDropdowns] = useState({
    title: DEFAULT_OPTIONS.title,
    star: DEFAULT_OPTIONS.star,
    place: DEFAULT_OPTIONS.place,
    kat_type: DEFAULT_OPTIONS.kat_type
  });
  const [showTamilModal, setShowTamilModal] = useState(false);
  const [onlinePaymentConfig, setOnlinePaymentConfig] = useState(null);
  const [feeSettings, setFeeSettings] = useState({
    baseAmount: 3500,
    archanaiFee: 200
  });

  const feeDetails = useMemo(() => {
    return calculateKattalaiFee({
      kattalaiDate: selectedBookingDate,
      regnDate: formData.regn_date,
      baseAmount: feeSettings.baseAmount,
      archanaiFee: feeSettings.archanaiFee
    });
  }, [selectedBookingDate, formData.regn_date, feeSettings]);

  useEffect(() => {
    api.getKattalaiTypes().then((types) => {
      if (Array.isArray(types) && types.length > 0) {
        setKattalaiTypes(types);
        setFormData(f => {
          if (f.code.startsWith('U/')) {
            const realU = types.find(t => t.color_key === 'morning');
            if (realU && f.kattalai_type_id !== realU.id) return { ...f, kattalai_type_id: realU.id };
          }
          if (f.code.startsWith('A/')) {
            const realA = types.find(t => t.color_key === 'evening-blue' || t.color_key === 'evening');
            if (realA && f.kattalai_type_id !== realA.id) return { ...f, kattalai_type_id: realA.id };
          }
          return f;
        });
      }
    }).catch(console.error);

    api.getDropdownOptions().then(options => {
      const titles = options.filter(o => o.category === 'title').map(o => o.value);
      const stars = options.filter(o => o.category === 'star').map(o => o.value);
      const places = options.filter(o => o.category === 'place').map(o => o.value);
      const katTypes = options.filter(o => o.category === 'kat_type').map(o => o.value);

      setDropdowns({
        title: titles.length > 0 ? titles : DEFAULT_OPTIONS.title,
        star: stars.length > 0 ? stars : DEFAULT_OPTIONS.star,
        place: places.length > 0 ? places : DEFAULT_OPTIONS.place,
        kat_type: katTypes.length > 0 ? katTypes : DEFAULT_OPTIONS.kat_type
      });
    }).catch((err) => {
      console.error(err);
      setDropdowns(DEFAULT_OPTIONS);
    });

    api.getSettings().then(s => {
      if (s) {
        setFeeSettings({
          baseAmount: s.kattalai_base_amount ? parseFloat(s.kattalai_base_amount) : 3500,
          archanaiFee: s.archanai_fee ? parseFloat(s.archanai_fee) : 200
        });
      }
    }).catch(console.error);
  }, []);

  // Fetch bookings whenever the selected calendar date changes
  useEffect(() => {
    if (selectedBookingDate) {
      api.getBookings(selectedBookingDate).then(setBookings).catch(console.error);
    } else {
      setBookings([]);
    }
  }, [selectedBookingDate]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = !formData.email?.trim() || emailRegex.test(formData.email.trim());
  const waDigits = (formData.whatsapp_number || '').replace(/\D/g, '');
  const isWaValid = !formData.whatsapp_number?.trim() || (
    String(formData.country_code || '91').replace(/\D/g, '') === '91'
      ? waDigits.length === 10
      : (waDigits.length >= 6 && waDigits.length <= 15)
  );

  const isFormValid = Boolean(
    selectedBookingDate &&
    formData.code &&
    formData.kattalai_type_id &&
    formData.title?.trim() &&
    formData.name?.trim() &&
    formData.star?.trim() &&
    formData.place?.trim() &&
    (formData.kat_type?.trim() || 'Lifetime') &&
    formData.mobile?.trim() &&
    formData.mobile.replace(/\D/g, '').length === 10 &&
    isWaValid &&
    isEmailValid &&
    formData.permanent_address?.trim()
  );

  const handleSignup = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!selectedBookingDate) {
      const msg = "Please select a Nithiya Kattalai Date.";
      setFormError(msg);
      alert(msg);
      return;
    }
    if (!formData.code || !formData.kattalai_type_id) {
      const msg = "Please pick an available Slot (Uchikala or Arthajama).";
      setFormError(msg);
      alert(msg);
      return;
    }
    if (!formData.title?.trim()) {
      const msg = "Please select a Title.";
      setFormError(msg);
      alert(msg);
      return;
    }
    if (!formData.name?.trim()) {
      const msg = "Please enter Full Name.";
      setFormError(msg);
      alert(msg);
      return;
    }
    if (!formData.star?.trim()) {
      const msg = "Please select a Star.";
      setFormError(msg);
      alert(msg);
      return;
    }
    if (!formData.place?.trim()) {
      const msg = "Please select a Place.";
      setFormError(msg);
      alert(msg);
      return;
    }

    // Strict Mobile Number Validation (India +91 -> Exactly 10 digits)
    const mobileDigits = (formData.mobile || '').replace(/\D/g, '');
    if (!mobileDigits) {
      const msg = "Please enter Mobile Number.";
      setFormError(msg);
      alert(msg);
      return;
    }
    if (mobileDigits.length !== 10) {
      const msg = `Invalid Mobile Number: India (+91) mobile number must be exactly 10 digits (currently ${mobileDigits.length} digits). Please enter a valid 10-digit mobile number before proceeding.`;
      setFormError(msg);
      alert(msg);
      return;
    }

    // Strict WhatsApp Number Validation (if entered)
    if (formData.whatsapp_number && formData.whatsapp_number.trim()) {
      const waDigits = formData.whatsapp_number.replace(/\D/g, '');
      const countryCode = String(formData.country_code || '91').replace(/\D/g, '');
      if (countryCode === '91') {
        if (waDigits.length !== 10) {
          const msg = `Invalid WhatsApp Number: India (+91) WhatsApp number must be exactly 10 digits (currently ${waDigits.length} digits).`;
          setFormError(msg);
          alert(msg);
          return;
        }
      } else {
        if (waDigits.length < 6 || waDigits.length > 15) {
          const msg = `Invalid WhatsApp Number: Foreign WhatsApp number must be between 6 and 15 digits (currently ${waDigits.length} digits).`;
          setFormError(msg);
          alert(msg);
          return;
        }
      }
    }

    // Email validation (if entered)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        const msg = "Please enter a valid Email Address.";
        setFormError(msg);
        alert(msg);
        return;
      }
    }

    if (!formData.permanent_address?.trim()) {
      const msg = "Please enter Permanent Address.";
      setFormError(msg);
      alert(msg);
      return;
    }
    if (!formData.kat_type?.trim()) {
      setFormData(f => ({ ...f, kat_type: 'Lifetime' }));
    }
    setFormError('');
    setShowTamilModal(true);
  };

  const handleFinalSubmit = (tamilData) => {
    const amountToPay = (tamilData.amount !== undefined && tamilData.amount !== '')
      ? parseFloat(tamilData.amount)
      : feeDetails.totalAmount;

    setOnlinePaymentConfig({
      isOpen: true,
      amount: amountToPay,
      purpose: `Nithiya Kattalai Registration (${formData.code || 'Slot'})`,
      devoteeName: formData.name,
      officeCode: formData.code,
      onSuccess: async (paymentDetails) => {
        await executeBookingRegistration(tamilData, amountToPay, paymentDetails);
      }
    });
  };

  const executeBookingRegistration = async (tamilData, amountToPay, paymentDetails) => {
    try {
      const smartSplit = (addr, place = '') => {
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

      const perParts = smartSplit(formData.permanent_address, formData.place);
      const effectiveComm = formData.communication_address?.trim() || formData.permanent_address?.trim() || '';
      const commParts = smartSplit(effectiveComm, formData.place);

      const [bYear, bMonth, bDate] = selectedBookingDate
        ? selectedBookingDate.split('-').map(Number)
        : [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()];

      const bookingData = {
        ...formData,
        ...tamilData,
        kattalai_date: bDate,
        kattalai_month: bMonth,
        country_code: String(formData.country_code || '91').replace(/\D/g, ''),
        whatsapp_number: formData.whatsapp_number || formData.mobile,
        regn_date: formData.regn_date || new Date().toISOString().slice(0, 10),
        per_add_1: perParts[0] || '',
        per_add_2: perParts[1] || '',
        per_add_3: perParts.slice(2).join(', ') || '',
        comm_add_1: commParts[0] || '',
        comm_add_2: commParts[1] || '',
        comm_add_3: commParts[2] || '',
        comm_add_4: commParts.slice(3).join(', ') || ''
      };

      // Ensure proper kattalai_type_id mapping from active kattalaiTypes
      let selectedTypeId = formData.kattalai_type_id;
      if (!selectedTypeId || selectedTypeId === 'morning_default' || selectedTypeId === 'evening_default') {
        const isEvening = (formData.code && (formData.code.startsWith('A/') || formData.code.startsWith('AJ/'))) || selectedTypeId === 'evening_default';
        const found = kattalaiTypes.find(t => isEvening ? (t.color_key === 'evening-blue' || t.color_key === 'evening') : t.color_key === 'morning');
        if (found) {
          selectedTypeId = found.id;
        } else if (kattalaiTypes.length > 0) {
          selectedTypeId = kattalaiTypes[0].id;
        }
      }
      bookingData.kattalai_type_id = selectedTypeId;
      bookingData.amount = amountToPay;
      bookingData.comments = tamilData.comments || '';

      const booking = await api.createBooking(bookingData);

      if (amountToPay > 0) {
        try {
          await api.createPayment({
            booking_id: booking.id,
            amount: amountToPay,
            method: 'online',
            transaction_ref: paymentDetails?.paymentId || `pay_${Date.now()}`
          });
        } catch (payErr) {
          console.warn('Payment recording note:', payErr);
        }
      }

      setOnlinePaymentConfig(null);
      setShowTamilModal(false);
      alert(`Nithiya Kattalai registration successful! Online Payment of ₹${amountToPay.toLocaleString('en-IN')} confirmed (Ref: ${paymentDetails?.paymentId || 'Verified'}). Office Code: ${booking.code || formData.code}. The slot is now confirmed.`);
      setFormData(f => ({
        ...f,
        title: '',
        name: '',
        star: '',
        place: '',
        permanent_address: '',
        communication_address: '',
        mobile: '',
        whatsapp_number: '',
        code: '',
        email: '',
        kattalai_type_id: ''
      }));
      if (selectedBookingDate) {
        api.getBookings(selectedBookingDate).then(setBookings).catch(console.error);
      }
    } catch (err) {
      console.error('Registration failed:', err);
      alert(err.message || "Failed to register Nithiya Kattalai. Please try again.");
    }
  };

  const set = (field) => (e) => {
    if (formError) setFormError('');
    setFormData((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  };

  const sanitizeMobile = (val, isIndian = true) => {
    if (!val) return '';
    let digits = String(val).replace(/\D/g, '');
    if (isIndian) {
      if (digits.length === 12 && digits.startsWith('91')) {
        digits = digits.slice(2);
      } else if (digits.length === 11 && digits.startsWith('0')) {
        digits = digits.slice(1);
      }
      return digits.slice(0, 10);
    }
    return digits.slice(0, 15);
  };

  const handleMobileChange = (e) => {
    if (formError) setFormError('');
    const digitsOnly = sanitizeMobile(e.target.value, true);
    setFormData(f => ({ ...f, mobile: digitsOnly }));
  };

  const handleWhatsAppChange = (e) => {
    if (formError) setFormError('');
    const isIndia = String(formData.country_code || '91').replace(/\D/g, '') === '91';
    const digitsOnly = sanitizeMobile(e.target.value, isIndia);
    setFormData(f => ({ ...f, whatsapp_number: digitsOnly }));
  };

  const handleCountryCodeChange = (e) => {
    if (formError) setFormError('');
    const newCode = e.target.value.replace(/\D/g, '');
    const isIndia = newCode === '91';
    setFormData(f => {
      const trimmedWa = sanitizeMobile(f.whatsapp_number || '', isIndia);
      return { ...f, country_code: newCode, whatsapp_number: trimmedWa };
    });
  };

  const uchikalaType = kattalaiTypes.find(t => t.color_key === 'morning') || DEFAULT_KATTALAI_TYPES[0];
  const arthajamaType = kattalaiTypes.find(t => t.color_key === 'evening-blue' || t.color_key === 'evening') || DEFAULT_KATTALAI_TYPES[1];

  const renderSlots = (kattalaiType, prefix) => {
    if (!kattalaiType) return null;
    const typeBookings = bookings.filter(b =>
      b.kattalai_type_id === kattalaiType.id ||
      (prefix === 'U' && b.code && (b.code.startsWith('U/') || b.code.startsWith('UK/'))) ||
      (prefix === 'A' && b.code && (b.code.startsWith('A/') || b.code.startsWith('AJ/')))
    );

    // Find all booked slot numbers
    const bookedSlotNumbers = new Set();
    typeBookings.forEach(b => {
      if (!b.code) return;
      const m = b.code.trim().match(/^([A-Za-z]+)\/(\d+)/);
      if (!m) return;
      const p = m[1].toUpperCase();
      const s = parseInt(m[2], 10);
      const isPMatch = p === prefix ||
        (prefix === 'U' && (p === 'UK' || p === 'U')) ||
        (prefix === 'A' && (p === 'AJ' || p === 'A'));
      if (isPMatch && !isNaN(s)) {
        bookedSlotNumbers.add(s);
      }
    });

    const highestBookedSlot = Array.from(bookedSlotNumbers).reduce((max, s) => s > max ? s : max, 0);
    const totalSlots = Math.max(kattalaiType.max_slots || 4, highestBookedSlot);
    const slots = Array.from({ length: totalSlots }, (_, i) => i + 1);

    // Lowest unbooked slot is the next available sequential slot
    let nextAvailableSlot = null;
    for (let s = 1; s <= totalSlots; s++) {
      if (!bookedSlotNumbers.has(s)) {
        nextAvailableSlot = s;
        break;
      }
    }

    const poojaTime = prefix === 'U' ? '11:30AM' : '7:30PM';

    return (
      <div className="flex flex-col gap-1 items-center flex-1 min-w-0">
        <span className="text-[12.5px] sm:text-[13.5px] text-[#5c292c] font-bold text-center leading-tight truncate max-w-full">
          {kattalaiType.name}
        </span>
        <span className="text-[14px] sm:text-[15px] font-extrabold text-[#7c3f1d] mb-2 tracking-wide">
          {poojaTime}
        </span>
        <div className="flex flex-wrap justify-center gap-2 max-w-[145px]">
          {slots.map(slotNum => {
            const isBooked = bookedSlotNumbers.has(slotNum);
            const isNextAvailable = !isBooked && slotNum === nextAvailableSlot;
            const isLocked = !isBooked && slotNum !== nextAvailableSlot;

            const isSelected = (formData.code.startsWith(`${prefix}/${slotNum}/`) || formData.code.startsWith(`${prefix === 'U' ? 'UK' : 'AJ'}/${slotNum}/`)) && (formData.kattalai_type_id === kattalaiType.id || (!formData.kattalai_type_id && (prefix === 'U' ? kattalaiType.color_key === 'morning' : kattalaiType.color_key.includes('evening'))));

            const mainColor = kattalaiType.color_key === 'morning' ? '#f37435' : '#4b779a';
            const lightBg = kattalaiType.color_key === 'morning' ? '#fff7ed' : '#f0f6fa';

            return (
              <button
                key={slotNum}
                type="button"
                onClick={() => {
                  if (isBooked) return;
                  if (!selectedBookingDate) {
                    alert('Please select a Date first.');
                    return;
                  }
                  const targetSlot = isLocked ? nextAvailableSlot : slotNum;
                  if (isLocked) {
                    alert(`Slots are booked in sequential order. Selecting Slot ${targetSlot} for ${kattalaiType.name}.`);
                  }
                  const dayOfYear = getDayOfYear(selectedBookingDate);
                  setFormData(f => ({
                    ...f,
                    kattalai_type_id: kattalaiType.id,
                    code: `${prefix}/${targetSlot}/${dayOfYear}`,
                  }));
                }}
                disabled={isBooked}
                className={`relative w-[34px] h-[34px] sm:w-[36px] sm:h-[36px] rounded-full border-2 flex items-center justify-center font-bold text-[13.5px] sm:text-[14px] transition-all duration-300 ${isBooked
                  ? 'opacity-40 cursor-not-allowed bg-[#eee8e0] border-[#d8cec2] text-[#8c8075] pointer-events-none'
                  : isLocked
                    ? 'cursor-pointer bg-amber-50/70 border-dashed border-amber-300/90 text-amber-900/60 hover:bg-amber-100 hover:border-amber-400'
                    : isSelected
                      ? 'shadow-lg scale-110 ring-2 ring-offset-1 ring-[#5c292c] z-10'
                      : 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer shadow-xs'
                  }`}
                title={
                  isBooked
                    ? `Slot ${slotNum}: Already Booked`
                    : isLocked
                      ? `Slot ${slotNum}: In Queue (Click to select open Slot ${nextAvailableSlot})`
                      : `Slot ${slotNum}: Open & Available`
                }
                style={isBooked ? {} : isLocked ? {} : {
                  backgroundColor: isSelected ? mainColor : lightBg,
                  borderColor: mainColor,
                  color: isSelected ? 'white' : mainColor,
                }}
              >
                {/* Booked: Show strikethrough */}
                {isBooked ? (
                  <span className="line-through decoration-[#b91c1c]/50 text-gray-500 font-medium">
                    {slotNum}
                  </span>
                ) : isLocked ? (
                  /* Locked in queue: Show number with subtle lock */
                  <span className="relative flex items-center justify-center">
                    <span className="font-semibold text-amber-900/70">{slotNum}</span>
                    <svg className="w-2.5 h-2.5 text-amber-600 absolute -top-1.5 -right-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                ) : (
                  /* Available: Vibrant number with glowing emerald open dot indicator */
                  <>
                    <span>{slotNum}</span>
                    {!isSelected && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white shadow-xs"></span>
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const inputClass = "h-[38px] px-3.5 rounded-full border border-[#e2d8cb] bg-white font-barlow text-[13.5px] text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] transition-all w-full shadow-sm hover:border-[#cfc2b2]";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen md:min-h-full md:h-full py-2 sm:py-3 px-2 sm:px-4 relative z-10 w-full max-w-full">
      <div className="bg-[#f7f1e5] border border-[#ebdccb] p-3 sm:p-4.5 lg:p-5 rounded-[20px] sm:rounded-[24px] shadow-[0_20px_50px_-10px_rgba(70,40,20,0.2)] w-full max-w-[1020px] box-border transition-all my-auto">

        {/* Header */}
        <div className="flex flex-col items-center mb-2.5 sm:mb-3">
          <img src="/logo.svg" alt="Vairavan Koil" className="w-[140px] sm:w-[155px] h-auto mb-1.5 drop-shadow-sm" />
          <h2 className="text-[20px] sm:text-[22px] font-barlow font-bold text-center text-[#5c292c] tracking-tight">
            Kattalaithaarar Registration
          </h2>
        </div>

        <form onSubmit={handleSignup} noValidate className="flex flex-col lg:flex-row items-stretch gap-3 sm:gap-4 font-barlow w-full mx-auto">

          {/* Left Column: Date & Slot Picker */}
          <div className="w-full lg:w-[36%] flex flex-col justify-between gap-2.5 bg-white/90 p-3.5 sm:p-4 rounded-[18px] sm:rounded-[20px] border border-[#e8ded2] shadow-sm">
            <div>
              <label className="block text-[#5c292c] font-bold text-[13px] mb-1">1. Select Nithiya Kattalai Date</label>
              <div className="flex">
                <input
                  type="date"
                  className={`${inputClass} cursor-pointer w-full`}
                  value={selectedBookingDate}
                  onChange={(e) => {
                    setSelectedBookingDate(e.target.value);
                    setFormData(f => ({ ...f, code: '', kattalai_type_id: '' }));
                  }}
                  required
                />
              </div>
            </div>

            <div className="border-t border-[#ebdccb] pt-2.5 mt-0.5 flex-1">
              <label className="block text-[#5c292c] font-bold text-[13px] mb-2">2. Pick an Available Slot</label>
              <div className="flex gap-2 sm:gap-4 justify-center items-start">
                {renderSlots(uchikalaType, 'U')}
                <div className="w-[1px] bg-[#e8ded2] self-stretch min-h-[90px]"></div>
                {renderSlots(arthajamaType, 'A')}
              </div>

              {/* Legend placed at bottom where the pills were */}
              <div className="flex items-center justify-center gap-3 sm:gap-4 mt-3 pt-2 border-t border-[#ebdccb]/60 text-[11px] font-semibold text-gray-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs"></span> Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span> Booked
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-amber-700 text-xs">🔒</span> In Queue
                </span>
              </div>
            </div>

            {formData.code && (
              <div className="text-center text-[12.5px] sm:text-[13px] text-[#2c7a35] font-bold mt-1 bg-[#ebfaee] py-1.5 px-3 rounded-full border border-[#bbf0c8] shadow-sm flex items-center justify-center gap-1.5">
                Assigned Code: <span className="text-[14.5px] sm:text-[15px] tracking-wide font-extrabold">{formData.code}</span>
              </div>
            )}
          </div>

          {/* Right Column: Details */}
          <div className="w-full lg:w-[64%] flex flex-col justify-between bg-white/90 p-3.5 sm:p-4.5 rounded-[18px] sm:rounded-[20px] border border-[#e8ded2] shadow-sm">
            <div className="flex flex-col gap-2.5">
              <label className="block text-[#5c292c] font-bold text-[13px] border-b border-[#ebdccb] pb-1.5">3. Enter Your Details</label>

              {/* Mobile View: Dedicated touch-friendly layout (< sm screens, no cramped fields) */}
              <div className="sm:hidden flex flex-col gap-3">
                {/* Title & Full Name */}
                <div className="flex gap-2 relative h-[42px] z-30">
                  <Combobox
                    className="w-[100px] shrink-0 h-full"
                    placeholder="Title"
                    value={formData.title}
                    onChange={(val) => setFormData(f => ({ ...f, title: val }))}
                    options={dropdowns.title}
                  />
                  <input
                    className={`${inputClass} flex-1 min-w-0 h-full`}
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={set('name')}
                    required
                  />
                </div>

                {/* Star & Place */}
                <div className="flex gap-2 relative h-[42px] z-25">
                  <Combobox
                    className="w-1/2 h-full"
                    placeholder="Star"
                    value={formData.star}
                    onChange={(val) => setFormData(f => ({ ...f, star: val }))}
                    options={dropdowns.star}
                  />
                  <Combobox
                    className="w-1/2 h-full"
                    placeholder="Place"
                    value={formData.place}
                    onChange={(val) => setFormData(f => ({ ...f, place: val }))}
                    options={dropdowns.place}
                  />
                </div>

                {/* Sponsorship (Fixed as Lifetime) */}
                <div className="relative w-full h-[42px] z-20">
                  <div
                    className="h-full px-4 rounded-full border border-dashed border-[#c7b0a4] bg-white font-barlow text-[14px] font-bold text-[#5c292c] flex items-center justify-center shadow-xs cursor-default select-none"
                    title="Sponsorship Type: Lifetime (Fixed for new registrations)"
                  >
                    <span>Lifetime</span>
                  </div>
                </div>

                {/* Mobile with +91 */}
                <div className="flex items-center w-full relative h-[42px] z-10">
                  <span className="absolute left-3.5 text-gray-500 font-semibold z-10 text-[13px]">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    className={`${inputClass} pl-[42px] pr-14 h-full`}
                    placeholder="10-digit Mobile"
                    value={formData.mobile}
                    onChange={handleMobileChange}
                    required
                  />
                  {formData.mobile && (
                    <span className={`absolute right-3.5 text-[10.5px] font-bold ${formData.mobile.length === 10 ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                      {formData.mobile.length === 10 ? '✓ 10' : `${formData.mobile.length}/10`}
                    </span>
                  )}
                </div>

                {/* WhatsApp with compact country code */}
                <div className="flex items-center w-full h-[42px] rounded-full border border-[#e2d8cb] bg-white focus-within:border-[#5c292c] focus-within:ring-1 focus-within:ring-[#5c292c] transition-all shadow-sm z-10">
                  <div className="relative flex items-center w-[54px] shrink-0 h-full border-r border-[#ebdccb]">
                    <select
                      className="h-full pl-2 pr-3.5 rounded-l-full bg-[#faf8f5] font-barlow text-[13px] font-bold text-[#5c292c] focus:outline-none w-full appearance-none cursor-pointer hover:bg-[#f3ede3] transition-colors text-center"
                      value={String(formData.country_code || '91').replace(/\D/g, '')}
                      onChange={handleCountryCodeChange}
                      title="Country Code for WhatsApp"
                    >
                      {COUNTRY_CODES.map(c => (
                        <option key={c.code} value={c.code}>
                          +{c.code}
                        </option>
                      ))}
                      {formData.country_code && !COUNTRY_CODES.some(c => c.code === String(formData.country_code).replace(/\D/g, '')) && (
                        <option value={String(formData.country_code).replace(/\D/g, '')}>
                          +{String(formData.country_code).replace(/\D/g, '')}
                        </option>
                      )}
                    </select>
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8075]">
                      <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
                    </div>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={String(formData.country_code || '91').replace(/\D/g, '') === '91' ? 10 : 15}
                    className="h-full flex-1 min-w-0 bg-transparent px-3 font-barlow text-[13.5px] text-gray-800 placeholder-[#9c9186] focus:outline-none"
                    placeholder={String(formData.country_code || '91').replace(/\D/g, '') === '91' ? "WhatsApp (10 digits)" : "WhatsApp (up to 15 digits)"}
                    value={formData.whatsapp_number || ''}
                    onChange={handleWhatsAppChange}
                  />
                </div>

                {/* Email Address */}
                <div className="w-full h-[42px] z-10">
                  <input
                    className={`${inputClass} h-full`}
                    placeholder="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={set('email')}
                  />
                </div>

                {/* Permanent Address */}
                <div className="w-full">
                  <input
                    className={`${inputClass} h-[42px]`}
                    placeholder="Permanent Address (e.g. Street, Area, City, Pin)"
                    value={formData.permanent_address}
                    onChange={set('permanent_address')}
                    required
                  />
                </div>

                {/* Communication Address with neat bottom toggle */}
                <div className="flex flex-col gap-1.5 w-full">
                  <input
                    className={`${inputClass} h-[42px]`}
                    placeholder="Communication Address"
                    value={formData.communication_address}
                    onChange={set('communication_address')}
                  />
                  <label
                    className="flex items-center justify-end gap-1.5 cursor-pointer text-[12px] text-[#6e6359] font-medium hover:text-[#5c292c] transition-colors pr-1 self-end"
                    onClick={() => setFormData(f => ({ ...f, communication_address: f.permanent_address }))}
                  >
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 rounded border-[#c7b0a4] accent-[#5c292c] cursor-pointer"
                      checked={formData.communication_address === formData.permanent_address && formData.permanent_address !== ''}
                      readOnly
                    />
                    <span>Use same for Communication</span>
                  </label>
                </div>
              </div>

              {/* Desktop / Tablet View (sm and above) */}
              <div className="hidden sm:flex flex-col gap-2.5">
                {/* Row 1: Title, Name, Star */}
                <div className="flex gap-2.5 relative h-[38px] z-30">
                  <Combobox
                    className="w-[28%] h-full"
                    placeholder="Title"
                    value={formData.title}
                    onChange={(val) => setFormData(f => ({ ...f, title: val }))}
                    options={dropdowns.title}
                  />

                  <input className={`${inputClass} w-[38%] h-full`} placeholder="Full Name" value={formData.name} onChange={set('name')} required />

                  <Combobox
                    className="w-[34%] h-full"
                    placeholder="Star"
                    value={formData.star}
                    onChange={(val) => setFormData(f => ({ ...f, star: val }))}
                    options={dropdowns.star}
                  />
                </div>

                {/* Row 2: Place, Sponsorship, Mobile */}
                <div className="flex gap-2.5 relative h-[38px] z-20">
                  <Combobox
                    className="w-[32%] h-full"
                    placeholder="Place"
                    value={formData.place}
                    onChange={(val) => setFormData(f => ({ ...f, place: val }))}
                    options={dropdowns.place}
                  />

                  <div className="relative w-[28%] h-full">
                    <div
                      className="h-full px-3.5 rounded-full border border-dashed border-[#c7b0a4] bg-white font-barlow text-xs sm:text-[13.5px] font-bold text-[#5c292c] flex items-center justify-center shadow-xs cursor-default select-none"
                      title="Sponsorship Type: Lifetime (Fixed for new registrations)"
                    >
                      <span>Lifetime</span>
                    </div>
                  </div>

                  <div className="flex items-center w-[40%] relative h-full">
                    <span className="absolute left-3.5 text-gray-500 font-semibold z-10 text-[13px]">+91</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      className={`${inputClass} pl-[42px] pr-14 h-full`}
                      placeholder="10-digit Mobile"
                      value={formData.mobile}
                      onChange={handleMobileChange}
                      required
                    />
                    {formData.mobile && (
                      <span className={`absolute right-3 text-[10px] font-bold ${formData.mobile.length === 10 ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                        {formData.mobile.length === 10 ? '✓ 10' : `${formData.mobile.length}/10`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 3: WhatsApp & Email (Balanced 50/50) */}
                <div className="grid grid-cols-2 gap-2.5 relative h-[38px] z-10">
                  <div className="flex items-center w-full h-full rounded-full border border-[#e2d8cb] bg-white focus-within:border-[#5c292c] focus-within:ring-1 focus-within:ring-[#5c292c] transition-all shadow-sm">
                    <div className="relative flex items-center w-[54px] shrink-0 h-full border-r border-[#ebdccb]">
                      <select
                        className="h-full pl-2 pr-3.5 rounded-l-full bg-[#faf8f5] font-barlow text-[13px] font-bold text-[#5c292c] focus:outline-none w-full appearance-none cursor-pointer hover:bg-[#f3ede3] transition-colors text-center"
                        value={String(formData.country_code || '91').replace(/\D/g, '')}
                        onChange={handleCountryCodeChange}
                        title="Country Code for WhatsApp"
                      >
                        {COUNTRY_CODES.map(c => (
                          <option key={c.code} value={c.code}>
                            +{c.code}
                          </option>
                        ))}
                        {formData.country_code && !COUNTRY_CODES.some(c => c.code === String(formData.country_code).replace(/\D/g, '')) && (
                          <option value={String(formData.country_code).replace(/\D/g, '')}>
                            +{String(formData.country_code).replace(/\D/g, '')}
                          </option>
                        )}
                      </select>
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8075]">
                        <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
                      </div>
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={String(formData.country_code || '91').replace(/\D/g, '') === '91' ? 10 : 15}
                      className="h-full flex-1 min-w-0 bg-transparent px-3.5 font-barlow text-[13.5px] text-gray-800 placeholder-[#9c9186] focus:outline-none rounded-r-full"
                      placeholder={String(formData.country_code || '91').replace(/\D/g, '') === '91' ? "WhatsApp (10 digits)" : "WhatsApp (up to 15 digits)"}
                      value={formData.whatsapp_number || ''}
                      onChange={handleWhatsAppChange}
                    />
                  </div>

                  <input
                    className={`${inputClass} w-full h-full`}
                    placeholder="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={set('email')}
                  />
                </div>

                {/* Combined Addresses */}
                <div className="flex flex-col gap-2 mt-0.5">
                  <input
                    className={inputClass}
                    placeholder="Permanent Address (e.g. Street, Area, City, Pin)"
                    value={formData.permanent_address}
                    onChange={set('permanent_address')}
                    required
                  />

                  <div className="relative w-full h-[38px]">
                    <input
                      className={`${inputClass} pr-[165px] h-full`}
                      placeholder="Communication Address"
                      value={formData.communication_address}
                      onChange={set('communication_address')}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 cursor-pointer group bg-white pl-2" onClick={() => setFormData(f => ({ ...f, communication_address: f.permanent_address }))}>
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 rounded border-[#c7b0a4] accent-[#5c292c] cursor-pointer"
                        checked={formData.communication_address === formData.permanent_address && formData.permanent_address !== ''}
                        readOnly
                      />
                      <span className="text-[11.5px] text-[#786c62] font-medium group-hover:text-[#5c292c] transition-colors whitespace-nowrap">Use same for Comm.</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {formError && (
              <div className="w-full mt-2.5 p-2.5 bg-red-50 text-red-700 rounded-xl text-xs sm:text-[13px] font-semibold text-center border border-red-200">
                ⚠️ {formError}
              </div>
            )}

            <div className="mt-3 flex flex-col items-center">
              <button
                type="submit"
                className={`w-full h-[40px] rounded-full font-barlow font-bold text-[15px] sm:text-[16px] transition-all duration-300 shadow-sm flex items-center justify-center gap-2 ${isFormValid
                  ? 'bg-[#5c292c] hover:bg-[#4a2123] text-white hover:shadow cursor-pointer active:scale-[0.99]'
                  : 'bg-[#5c292c] hover:bg-[#4a2123] text-white hover:shadow cursor-pointer'
                  }`}
                title={isFormValid ? "Click to proceed to Tamil details & payment" : "Fill required fields to proceed"}
              >
                Register நித்திய Kattalai
              </button>
            </div>

          </div>
        </form>

        <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm font-barlow">
          <span className="text-[#786c62]">Already registered as a devotee? </span>
          <Link to="/login" className="text-[#f37435] hover:text-[#d05c24] font-semibold transition-colors">
            Sign In here
          </Link>
        </div>

        <TamilDetailsModal
          isOpen={showTamilModal}
          onClose={() => setShowTamilModal(false)}
          onSubmit={handleFinalSubmit}
          initialData={{}}
          englishData={{
            ...formData,
            amount: feeDetails.totalAmount,
            baseAmount: feeDetails.baseAmount,
            archanaiCharge: feeDetails.archanaiCharge,
            isWithinSixMonths: feeDetails.isWithinSixMonths
          }}
        />

        {onlinePaymentConfig && (
          <OnlinePaymentModal
            isOpen={onlinePaymentConfig.isOpen}
            onClose={() => setOnlinePaymentConfig(null)}
            onSuccess={onlinePaymentConfig.onSuccess}
            amount={onlinePaymentConfig.amount}
            purpose={onlinePaymentConfig.purpose}
            devoteeName={onlinePaymentConfig.devoteeName}
            officeCode={onlinePaymentConfig.officeCode}
          />
        )}
      </div>
    </div>
  );
}
