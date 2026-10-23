import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import TamilDetailsModal from '../components/TamilDetailsModal.jsx';
import Combobox from '../components/Combobox.jsx';

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
  { id: 'morning_default', name: 'Uchikala Kattalai', name_ta: 'உச்சிகால கட்டளை', color_key: 'morning', max_slots: 4, default_amount: 1000 },
  { id: 'evening_default', name: 'Arthajama Kattalai', name_ta: 'அர்த்தஜாம கட்டளை', color_key: 'evening-blue', max_slots: 4, default_amount: 1000 }
];

export default function Signup() {
  const [formData, setFormData] = useState({
    title: '', name: '', star: '', place: '',
    permanent_address: '', communication_address: '',
    mobile: '', whatsapp_number: '', code: '',
    whatsapp_same_as_mobile: false, email: '',
    regn_date: new Date().toISOString().slice(0, 10),
    kattalai_type_id: '', kat_type: 'Lifetime', country_code: '91'
  });
  
  const [selectedBookingDate, setSelectedBookingDate] = useState(new Date().toISOString().slice(0, 10));
  const [kattalaiTypes, setKattalaiTypes] = useState(DEFAULT_KATTALAI_TYPES);
  const [bookings, setBookings] = useState([]);
  const [dropdowns, setDropdowns] = useState({ 
    title: DEFAULT_OPTIONS.title, 
    star: DEFAULT_OPTIONS.star, 
    place: DEFAULT_OPTIONS.place, 
    kat_type: DEFAULT_OPTIONS.kat_type 
  });
  const [showTamilModal, setShowTamilModal] = useState(false);

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
  }, []);

  // Fetch bookings whenever the selected calendar date changes
  useEffect(() => {
    if (selectedBookingDate) {
      api.getBookings(selectedBookingDate).then(setBookings).catch(console.error);
    } else {
      setBookings([]);
    }
  }, [selectedBookingDate]);

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
    formData.permanent_address?.trim()
  );

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!selectedBookingDate) {
      alert("Please select a Booking Date.");
      return;
    }
    if (!formData.code || !formData.kattalai_type_id) {
      alert("Please pick an available Slot (Uchikala or Arthajama).");
      return;
    }
    if (!formData.title?.trim()) {
      alert("Please select a Title.");
      return;
    }
    if (!formData.name?.trim()) {
      alert("Please enter Full Name.");
      return;
    }
    if (!formData.star?.trim()) {
      alert("Please select a Star.");
      return;
    }
    if (!formData.place?.trim()) {
      alert("Please select a Place.");
      return;
    }
    if (!formData.mobile?.trim()) {
      alert("Please enter Mobile Number.");
      return;
    }
    if (!formData.permanent_address?.trim()) {
      alert("Please enter Permanent Address.");
      return;
    }
    if (!formData.kat_type?.trim()) {
      setFormData(f => ({ ...f, kat_type: 'Lifetime' }));
    }
    setShowTamilModal(true);
  };

  const handleFinalSubmit = async (tamilData) => {
    try {
      const perParts = (formData.permanent_address || '').split(',').map(s => s.trim());
      const commParts = (formData.communication_address || '').split(',').map(s => s.trim());
      
      const [bYear, bMonth, bDate] = selectedBookingDate 
        ? selectedBookingDate.split('-').map(Number) 
        : [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()];
      
      const bookingData = {
        ...formData,
        ...tamilData,
        kattalai_date: bDate,
        kattalai_month: bMonth,
        whatsapp_number: formData.whatsapp_same_as_mobile ? formData.mobile : (formData.whatsapp_number || formData.mobile),
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

      const selectedType = kattalaiTypes.find(t => t.id === bookingData.kattalai_type_id);
      const defaultAmt = selectedType?.default_amount ? parseFloat(selectedType.default_amount) : 0;
      const amountToPay = (tamilData.amount !== undefined && tamilData.amount !== '') 
        ? parseFloat(tamilData.amount) 
        : defaultAmt;

      bookingData.amount = amountToPay;
      bookingData.comments = tamilData.comments || '';

      const booking = await api.createBooking(bookingData);

      if (amountToPay > 0) {
        try {
          await api.createPayment({ booking_id: booking.id, amount: amountToPay, method: 'cash' });
        } catch (payErr) {
          console.warn('Payment recording note:', payErr);
        }
      }

      // Try Razorpay online payment if real keys are configured
      try {
        if (amountToPay > 0 && typeof window !== 'undefined' && window.Razorpay) {
          const orderData = await api.createRazorpayOrder({ booking_id: booking.id, amount: amountToPay });
          if (orderData && orderData.id && !orderData.is_mock) {
            const options = {
              key: 'dummy_key_id', 
              amount: orderData.amount,
              currency: orderData.currency,
              name: "Vairavan Kovil",
              description: "Kattalai Booking",
              order_id: orderData.id,
              handler: async function (response) {
                try {
                  await api.verifyRazorpaySignature({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    booking_id: booking.id,
                    amount: amountToPay
                  });
                } catch (vErr) {
                  console.warn('Payment verification note:', vErr);
                }
              },
              prefill: { name: formData.name, email: formData.email, contact: formData.mobile },
              theme: { color: "#5c292c" }
            };
            const rzp1 = new window.Razorpay(options);
            rzp1.open();
          }
        }
      } catch (rzpErr) {
        console.warn('Online payment gateway note:', rzpErr);
      }

      alert("Registration successful! The slot is now booked.");
      setShowTamilModal(false);
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
      alert(err.message || "Failed to register. Please try again.");
    }
  };

  const set = (field) => (e) =>
    setFormData((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const uchikalaType = kattalaiTypes.find(t => t.color_key === 'morning') || DEFAULT_KATTALAI_TYPES[0];
  const arthajamaType = kattalaiTypes.find(t => t.color_key === 'evening-blue' || t.color_key === 'evening') || DEFAULT_KATTALAI_TYPES[1];

  const renderSlots = (kattalaiType, prefix) => {
    if (!kattalaiType) return null;
    const typeBookings = bookings.filter(b => b.kattalai_type_id === kattalaiType.id);
    
    const highestBookedSlot = typeBookings.reduce((max, b) => {
      if (b.code && (b.code.startsWith(`${prefix}/`) || b.code.startsWith(`${prefix === 'U' ? 'UK' : 'AJ'}/`))) {
        const slotNum = parseInt(b.code.split('/')[1], 10);
        if (!isNaN(slotNum) && slotNum > max) return slotNum;
      }
      return max;
    }, 0);

    const totalSlots = Math.max(kattalaiType.max_slots || 4, highestBookedSlot);
    const slots = Array.from({ length: totalSlots }, (_, i) => i + 1);
    
    return (
      <div className="flex flex-col gap-2 items-center flex-1 min-w-0">
        <span className="text-[12.5px] sm:text-[13.5px] text-[#5c292c] font-bold text-center leading-tight mb-2 truncate max-w-full">
          {kattalaiType.name}
        </span>
        <div className="flex flex-wrap justify-center gap-2 max-w-[145px]">
          {slots.map(slotNum => {
            const bookedItem = typeBookings.find(b => b.code && (b.code.startsWith(`${prefix}/${slotNum}/`) || b.code.startsWith(`${prefix === 'U' ? 'UK' : 'AJ'}/${slotNum}/`)));
            const isBooked = !!bookedItem;
            const isSelected = (formData.code.startsWith(`${prefix}/${slotNum}/`) || formData.code.startsWith(`${prefix === 'U' ? 'UK' : 'AJ'}/${slotNum}/`)) && (formData.kattalai_type_id === kattalaiType.id || (!formData.kattalai_type_id && (prefix === 'U' ? kattalaiType.color_key === 'morning' : kattalaiType.color_key.includes('evening'))));
            
            const mainColor = kattalaiType.color_key === 'morning' ? '#f37435' : '#6b92a4';
            const lightBg = kattalaiType.color_key === 'morning' ? '#fef1eb' : '#f0f4f6';
            
            return (
              <button
                key={slotNum}
                type="button"
                onClick={() => {
                  if (!isBooked && selectedBookingDate) {
                    const dayOfYear = getDayOfYear(selectedBookingDate);
                    setFormData(f => ({
                      ...f,
                      kattalai_type_id: kattalaiType.id,
                      code: `${prefix}/${slotNum}/${dayOfYear}`,
                    }));
                  } else if (!isBooked) {
                    alert('Please select a Date first.');
                  }
                }}
                disabled={isBooked}
                className={`w-[36px] h-[36px] sm:w-[38px] sm:h-[38px] rounded-full border-2 flex items-center justify-center font-bold text-[14px] sm:text-[15px] transition-all duration-300 ${
                  isBooked 
                    ? 'opacity-35 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400' 
                    : isSelected 
                      ? 'shadow-lg scale-110' 
                      : 'hover:shadow-md hover:-translate-y-0.5'
                }`}
                style={(!isBooked) ? {
                  backgroundColor: isSelected ? mainColor : lightBg,
                  borderColor: mainColor,
                  color: isSelected ? 'white' : mainColor,
                } : {}}
              >
                {slotNum}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const inputClass = "h-[40px] px-4 rounded-full border border-[#e2d8cb] bg-white font-barlow text-[14px] text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] transition-all w-full shadow-sm hover:border-[#cfc2b2]";

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-2 sm:px-4 py-4 sm:py-8 relative z-10 w-full max-w-full overflow-x-hidden">
      <div className="bg-[#f7f1e5] border border-[#ebdccb] p-3 sm:p-6 md:p-8 rounded-[20px] sm:rounded-[28px] shadow-[0_20px_50px_-10px_rgba(70,40,20,0.2)] w-full max-w-[1080px] box-border transition-all">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-5 sm:mb-6">
          <img src="/logo.svg" alt="Vairavan Koil" className="w-[160px] sm:w-[180px] h-auto mb-2 drop-shadow-sm" />
          <h2 className="text-[22px] sm:text-[26px] font-barlow font-bold text-center text-[#5c292c] tracking-tight">
            Kattalaitharar Registration
          </h2>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col lg:flex-row items-stretch gap-4 sm:gap-6 font-barlow w-full mx-auto">
            
          {/* Left Column: Date & Slot Picker */}
          <div className="w-full lg:w-[38%] flex flex-col gap-4 bg-white/90 p-4 sm:p-5 rounded-[20px] sm:rounded-[22px] border border-[#e8ded2] shadow-sm">
            <label className="block text-[#5c292c] font-bold text-[14px]">1. Select Booking Date</label>
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
            
            <div className="border-t border-[#ebdccb] pt-4 mt-1 flex-1">
              <label className="block text-[#5c292c] font-bold text-[14px] mb-3">2. Pick an Available Slot</label>
              <div className="flex gap-2 sm:gap-4 justify-center items-start">
                {renderSlots(uchikalaType, 'U')}
                <div className="w-[1px] bg-[#e8ded2] self-stretch min-h-[100px]"></div>
                {renderSlots(arthajamaType, 'A')}
              </div>
            </div>
            
            {formData.code && (
              <div className="text-center text-[13px] sm:text-[13.5px] text-[#2c7a35] font-bold mt-2 bg-[#ebfaee] py-2 px-3 sm:px-4 rounded-full border border-[#bbf0c8] shadow-sm flex items-center justify-center gap-1.5 sm:gap-2">
                Selected Code: <span className="text-[15px] sm:text-[16px] tracking-wide font-extrabold">{formData.code}</span>
              </div>
            )}
          </div>

          {/* Right Column: Details */}
          <div className="w-full lg:w-[62%] flex flex-col justify-between bg-white/90 p-4 sm:p-5 md:p-6 rounded-[20px] sm:rounded-[22px] border border-[#e8ded2] shadow-sm">
            <div className="flex flex-col gap-3.5">
              <label className="block text-[#5c292c] font-bold text-[14px] border-b border-[#ebdccb] pb-2">3. Enter Your Details</label>

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

                {/* Sponsorship */}
                <div className="relative w-full h-[42px] z-20">
                  <select
                    className={`${inputClass} appearance-none h-full bg-white pr-8 text-gray-700 cursor-pointer`}
                    value={formData.kat_type || ''}
                    onChange={(e) => setFormData(f => ({ ...f, kat_type: e.target.value }))}
                    required
                  >
                    <option value="" disabled>Sponsorship</option>
                    {dropdowns.kat_type.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8075]">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                </div>

                {/* Mobile with +91 */}
                <div className="flex items-center w-full relative h-[42px] z-10">
                  <span className="absolute left-3.5 text-gray-500 font-semibold z-10 text-[13px]">+91</span>
                  <input className={`${inputClass} pl-[42px] h-full`} placeholder="Mobile Number" value={formData.mobile} onChange={set('mobile')} required />
                </div>

                {/* WhatsApp with 'Same as Mobile' toggle */}
                <div className="flex flex-col gap-1 z-10">
                  <div className={`flex items-center w-full h-[42px] rounded-full border border-[#e2d8cb] bg-white focus-within:border-[#5c292c] focus-within:ring-1 focus-within:ring-[#5c292c] transition-all shadow-sm ${formData.whatsapp_same_as_mobile ? 'opacity-70 bg-[#f8f3ea]' : ''}`}>
                    <input 
                      className="h-full flex-1 min-w-0 bg-transparent px-4 font-barlow text-[14px] text-gray-800 placeholder-[#9c9186] focus:outline-none disabled:text-gray-500" 
                      placeholder="WhatsApp No." 
                      value={formData.whatsapp_same_as_mobile ? formData.mobile : formData.whatsapp_number} 
                      onChange={set('whatsapp_number')} 
                      disabled={formData.whatsapp_same_as_mobile}
                    />
                    <div className="flex items-center gap-1.5 cursor-pointer px-3 h-full border-l border-[#ebdccb] shrink-0" onClick={() => setFormData(f => ({ ...f, whatsapp_same_as_mobile: !f.whatsapp_same_as_mobile, whatsapp_number: !f.whatsapp_same_as_mobile ? f.mobile : f.whatsapp_number }))}>
                      <input 
                        type="checkbox" 
                        className="w-3.5 h-3.5 rounded border-[#c7b0a4] accent-[#5c292c] cursor-pointer"
                        checked={formData.whatsapp_same_as_mobile}
                        readOnly
                      />
                      <span className="text-[11px] text-[#786c62] font-medium whitespace-nowrap">Same as Mobile</span>
                    </div>
                  </div>
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
              <div className="hidden sm:flex flex-col gap-3.5">
                {/* Row 1: Title, Name, Star */}
                <div className="flex gap-2.5 relative h-[40px] z-30">
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
                <div className="flex gap-2.5 relative h-[40px] z-20">
                  <Combobox 
                    className="w-[32%] h-full" 
                    placeholder="Place" 
                    value={formData.place} 
                    onChange={(val) => setFormData(f => ({ ...f, place: val }))} 
                    options={dropdowns.place} 
                  />

                  <div className="relative w-[28%] h-full">
                    <select
                      className={`${inputClass} appearance-none h-full bg-white pr-8 text-gray-700 cursor-pointer`}
                      value={formData.kat_type || 'Lifetime'}
                      onChange={(e) => setFormData(f => ({ ...f, kat_type: e.target.value }))}
                    >
                      <option value="Lifetime">Lifetime</option>
                      <option value="Inheritance">Inheritance</option>
                      {dropdowns.kat_type && dropdowns.kat_type.filter(opt => opt !== 'Lifetime' && opt !== 'Inheritance').map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8075]">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                    </div>
                  </div>

                  <div className="flex items-center w-[40%] relative h-full">
                    <span className="absolute left-3.5 text-gray-500 font-semibold z-10 text-[13px]">+91</span>
                    <input className={`${inputClass} pl-[42px] h-full`} placeholder="Mobile Number" value={formData.mobile} onChange={set('mobile')} required />
                  </div>
                </div>

                {/* Row 3: WhatsApp & Email */}
                <div className="flex gap-2.5 relative h-[40px] z-10">
                  <div className={`flex items-center w-[55%] h-full rounded-full border border-[#e2d8cb] bg-white focus-within:border-[#5c292c] focus-within:ring-1 focus-within:ring-[#5c292c] transition-all shadow-sm ${formData.whatsapp_same_as_mobile ? 'opacity-70 bg-[#f8f3ea]' : ''}`}>
                    <input 
                      className="h-full flex-1 min-w-0 bg-transparent px-4 font-barlow text-[14px] text-gray-800 placeholder-[#9c9186] focus:outline-none disabled:text-gray-500" 
                      placeholder="WhatsApp No." 
                      value={formData.whatsapp_same_as_mobile ? formData.mobile : formData.whatsapp_number} 
                      onChange={set('whatsapp_number')} 
                      disabled={formData.whatsapp_same_as_mobile}
                    />
                    <div className="flex items-center gap-1.5 cursor-pointer group px-3 h-full border-l border-[#ebdccb] shrink-0" onClick={() => setFormData(f => ({ ...f, whatsapp_same_as_mobile: !f.whatsapp_same_as_mobile, whatsapp_number: !f.whatsapp_same_as_mobile ? f.mobile : f.whatsapp_number }))}>
                      <input 
                        type="checkbox" 
                        className="w-3.5 h-3.5 rounded border-[#c7b0a4] accent-[#5c292c] cursor-pointer"
                        checked={formData.whatsapp_same_as_mobile}
                        readOnly
                      />
                      <span className="text-[11.5px] text-[#786c62] font-medium whitespace-nowrap">Same as Mobile</span>
                    </div>
                  </div>

                  <input 
                    className={`${inputClass} w-[45%] h-full`} 
                    placeholder="Email Address" 
                    type="email" 
                    value={formData.email} 
                    onChange={set('email')} 
                  />
                </div>

                {/* Combined Addresses */}
                <div className="flex flex-col gap-3 mt-0.5">
                  <input 
                    className={inputClass} 
                    placeholder="Permanent Address (e.g. Street, Area, City, Pin)" 
                    value={formData.permanent_address} 
                    onChange={set('permanent_address')} 
                    required 
                  />
                  
                  <div className="relative w-full h-[40px]">
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

            <div className="mt-5">
              <button 
                type="submit" 
                className={`w-full h-[42px] rounded-full font-barlow font-bold text-[16px] transition-all duration-300 shadow-sm ${
                  isFormValid 
                    ? 'bg-[#5c292c] hover:bg-[#4a2123] text-white hover:shadow cursor-pointer active:scale-[0.99]' 
                    : 'bg-[#5c292c] hover:bg-[#4a2123] text-white hover:shadow cursor-pointer'
                }`}
                title={isFormValid ? "Click to proceed to Tamil details & payment" : "Please select date, slot, and fill all required fields to register"}
              >
                Register
              </button>
              {!isFormValid && (
                <p className="text-center text-[12px] text-[#8c7b70] mt-1.5 font-medium">
                  * Please select date, slot, and fill all required details to register
                </p>
              )}
            </div>

          </div>
        </form>

        <div className="mt-6 text-center text-sm font-barlow">
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
            amount: kattalaiTypes.find(t => t.id === formData.kattalai_type_id)?.default_amount || ''
          }}
        />
      </div>
    </div>
  );
}
