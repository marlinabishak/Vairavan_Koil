import React from 'react';
import { api } from '../api/client';

// Dictionaries and Mappings
export const TITLE_MAP = {
  'thiru': 'திரு',
  'mr': 'திரு',
  'thirumathi': 'திருமதி',
  'tmt': 'திருமதி',
  'mrs': 'திருமதி',
  'selvi': 'செல்வி',
  'ms': 'செல்வி',
  'miss': 'செல்வி',
  'selvan': 'செல்வன்',
  'master': 'செல்வன்',
};

export const TAMIL_TITLES = ['திரு', 'திருமதி', 'செல்வி', 'செல்வன்'];

export const STAR_MAP = {
  'aswathi': 'அஸ்வினி',
  'aswini': 'அஸ்வினி',
  'ashwini': 'அஸ்வினி',
  'bharani': 'பரணி',
  'barani': 'பரணி',
  'karthigai': 'கார்த்திகை',
  'karthikai': 'கார்த்திகை',
  'krithika': 'கார்த்திகை',
  'krittika': 'கார்த்திகை',
  'rohini': 'ரோகிணி',
  'mirukashirisham': 'மிருகசீரிஷம்',
  'mirugasiridam': 'மிருகசீரிஷம்',
  'mrigasira': 'மிருகசீரிஷம்',
  'mrigashirsha': 'மிருகசீரிஷம்',
  'thiruvathirai': 'திருவாதிரை',
  'arudra': 'திருவாதிரை',
  'thiruvathira': 'திருவாதிரை',
  'punarpoosam': 'புனர்பூசம்',
  'punarvasu': 'புனர்பூசம்',
  'poosam': 'பூசம்',
  'pushyam': 'பூசம்',
  'pushya': 'பூசம்',
  'ayilyam': 'ஆயில்யம்',
  'aslesha': 'ஆயில்யம்',
  'magam': 'மகம்',
  'makam': 'மகம்',
  'magha': 'மகம்',
  'pooram': 'பூரம்',
  'purva phalguni': 'பூரம்',
  'uthiram': 'உத்திரம்',
  'uttara phalguni': 'உத்திரம்',
  'hastham': 'அஸ்தம்',
  'hasta': 'அஸ்தம்',
  'chithirai': 'சித்திரை',
  'chitra': 'சித்திரை',
  'swathi': 'சுவாதி',
  'swati': 'சுவாதி',
  'visakam': 'விசாகம்',
  'vishakha': 'விசாகம்',
  'anusam': 'அனுஷம்',
  'anuradha': 'அனுஷம்',
  'keettai': 'கேட்டை',
  'kettai': 'கேட்டை',
  'jyeshtha': 'கேட்டை',
  'moolam': 'மூலம்',
  'mula': 'மூலம்',
  'pooraadam': 'பூராடம்',
  'pooradam': 'பூராடம்',
  'purva ashadha': 'பூராடம்',
  'uthiradam': 'உத்திராடம்',
  'uttara ashadha': 'உத்திராடம்',
  'thiruvonam': 'திருவோணம்',
  'sravana': 'திருவோணம்',
  'avittam': 'அவிட்டம்',
  'dhanishta': 'அவிட்டம்',
  'sadayam': 'சதயம்',
  'sathayam': 'சதயம்',
  'shatabhisha': 'சதயம்',
  'poorattathi': 'பூரட்டாதி',
  'purva bhadrapada': 'பூரட்டாதி',
  'uthirattathi': 'உத்திரட்டாதி',
  'uttara bhadrapada': 'உத்திரட்டாதி',
  'revathi': 'ரேவதி',
};

export const TAMIL_STARS = [
  "அஸ்வினி", "பரணி", "கார்த்திகை", "ரோகிணி", "மிருகசீரிஷம்",
  "திருவாதிரை", "புனர்பூசம்", "பூசம்", "ஆயில்யம்", "மகம்",
  "பூரம்", "உத்திரம்", "அஸ்தம்", "சித்திரை", "சுவாதி",
  "விசாகம்", "அனுஷம்", "கேட்டை", "மூலம்", "பூராடம்",
  "உத்திராடம்", "திருவோணம்", "அவிட்டம்", "சதயம்", "பூரட்டாதி",
  "உத்திரட்டாதி", "ரேவதி"
];

export const PLACE_MAP = {
  'A THEKKUR': 'ஏ. தெக்கூர்',
  'A.MUTHUPPATTINAM': 'ஏ. முத்துப்பட்டினம்',
  'AAVNIPPATTI': 'ஆவணிப்பட்டி',
  'ALAVAKOTTAI': 'அலவாகோட்டை',
  'ARANMANAI SIRUVAYAL': 'அரண்மனை சிறுவயல்',
  'ARAVAYAL': 'அரவயல்',
  'ARIMALAM': 'அரிமளம்',
  'ARIYAGUDI': 'அரியக்குடி',
  'ATHANGUDI': 'ஆத்தங்குடி',
  'CHENNAI': 'சென்னை',
  'CHOKALINGAM PUDUR': 'சொக்கலிங்கம்புதூர்',
  'COIMBATORE': 'கோயம்புத்தூர்',
  'DEVAKOTTAI': 'தேவகோட்டை',
  'K.ALAGAPURI': 'கே. அழகபுரி',
  'KADIAPATTI': 'கடியாபட்டி',
  'KALAYAR MANGALAM': 'காளையார் மங்கலம்',
  'KALLAL': 'கல்லல்',
  'KANADUKATHAN': 'கானாடுகாத்தான்',
  'KANDANUR': 'கண்டனூர்',
  'KANDARAMANIKKAM': 'கண்டரமாணிக்கம்',
  'KANDAVARAYANPATTI': 'கண்டவராயன்பட்டி',
  'KARAIKUDI': 'காரைக்குடி',
  'KARUNGKULAM': 'கருங்குளம்',
  'KEELASEVALPATTI': 'கீழச்செவல்பட்டி',
  'KO.ALAGAPURI': 'கோ. அழகபுரி',
  'KONAPET': 'கோனாப்பட்டு',
  'KOPPANA PATTI': 'கொப்பனாபட்டி',
  'KOTHAMANGALAM': 'கொத்தமங்கலம்',
  'KOTTAIYUR': 'கோட்டையூர்',
  'KULIPIRAI': 'குளிபிறை',
  'KURUVIKONDANPATTI': 'குருவிகொண்டான்பட்டி',
  'MAKIBALANPATTI': 'மகிபாலன்பட்டி',
  'MANAKIRI': 'மானாகிரி',
  'MATHAGU PATTI': 'மடகுபட்டி',
  'MELAI SIVAPURI': 'மேலைச்சிவபுரி',
  'MUTHU PATTINAM.K': 'முத்துப்பட்டினம்.கே',
  'NACHANDU PATTI': 'நாச்சந்துபட்டி',
  'NACHIAPURAM': 'நாச்சியாபுரம்',
  'NATARAJAPURAM': 'நடராஜபுரம்',
  'NATTARASAN KOTTAI': 'நாட்டரசன்கோட்டை',
  'NEMATHANPATTI': 'நேமத்தான்பட்டி',
  'NERKUPPAI': 'நெற்குப்பை',
  'ONASIRUVAYAL': 'ஒனசிறுவயல்',
  'OOKUR': 'ஓகூர்',
  'P.ALAGAPURI': 'பி. அழகபுரி',
  'PAGANERY': 'பாகனேரி',
  'PALAVANGUDI': 'பாலவாங்குடி',
  'PALLATHUR': 'பல்லத்தூர்',
  'PANAGUDI': 'பனங்குடி',
  'PATTAMANGALAM': 'பட்டம்மங்கலம்',
  'PON PUDUPATTI': 'பொன் புதுப்பட்டி',
  'POOLANKURICHI': 'பூலாங்குறிச்சி',
  'PUDUVAYAL': 'புதுவயல்',
  'RAMACHANDRA PURAM': 'ராமச்சந்திரபுரம்',
  'RAYAVARAM': 'ராயவரம்',
  'SIRAVAYAL': 'சிராவயல்',
  'SIRUKUDALPATTI': 'சிறுகூடல்பட்டி',
  'SIVUR': 'சிவூர்',
  'THENIPATTI': 'தேனிப்பட்டி',
  'V.LAKSHMIPURAM': 'வி. லட்சுமிபுரம்',
  'VALAYAPATTI': 'வலையபட்டி',
  'VENTHAN PATTI': 'வேந்தன்பட்டி',
  'VETRIYUR': 'வெற்றியூர்',
  'VIRACHILAI': 'விராச்சிலை',
  'VIRAMATHI': 'வீரமதி',
  'VISWANATHA PURAM.K': 'விஸ்வநாதபுரம்.கே',
  'MADURAI': 'மதுரை',
  'TRICHY': 'திருச்சி',
  'TIRUCHIRAPPALLI': 'திருச்சிராப்பள்ளி',
  'SALEM': 'சேலம்',
  'BANGALORE': 'பெங்களூரு',
  'BENGALURU': 'பெங்களூரு'
};

export const TAMIL_PLACES = Array.from(new Set(Object.values(PLACE_MAP))).sort((a, b) => a.localeCompare(b, 'ta'));

// Translation helper functions
export function translateTitleToTamil(enTitle) {
  if (!enTitle) return '';
  if (TAMIL_TITLES.includes(enTitle)) return enTitle;
  const key = enTitle.trim().toLowerCase();
  return TITLE_MAP[key] || '';
}

export function translateStarToTamil(enStar) {
  if (!enStar) return '';
  if (TAMIL_STARS.includes(enStar)) return enStar;
  const key = enStar.trim().toLowerCase().replace(/[\s\.\-_]+/g, '');
  for (const [k, v] of Object.entries(STAR_MAP)) {
    if (k.replace(/[\s\.\-_]+/g, '') === key) return v;
  }
  return '';
}

export function translatePlaceToTamil(enPlace) {
  if (!enPlace) return '';
  if (TAMIL_PLACES.includes(enPlace)) return enPlace;
  const cleanKey = enPlace.trim().toUpperCase();
  if (PLACE_MAP[cleanKey]) return PLACE_MAP[cleanKey];
  const normKey = cleanKey.replace(/[\s\.\-_]+/g, '');
  for (const [k, v] of Object.entries(PLACE_MAP)) {
    if (k.replace(/[\s\.\-_]+/g, '') === normKey) return v;
  }
  return enPlace;
}

export default function TamilDetailsModal({ isOpen, onClose, onSubmit, initialData, englishData, isInline = false }) {
  const getInitialFormData = () => {
    const t_ta = initialData?.title_ta || translateTitleToTamil(englishData?.title) || 'திரு';
    const s_ta = initialData?.star_ta || translateStarToTamil(englishData?.star) || '';
    const p_ta = initialData?.place_ta || translatePlaceToTamil(englishData?.place) || '';
    const n_ta = initialData?.name_ta || englishData?.name || '';
    const amt = initialData?.amount || englishData?.amount || 1000;
    const cmt = initialData?.comments || englishData?.comments || 'Online Devotee Registration';
    return {
      title_ta: t_ta,
      name_ta: n_ta,
      star_ta: s_ta,
      place_ta: p_ta,
      amount: amt,
      comments: cmt
    };
  };

  const [formData, setFormData] = React.useState(getInitialFormData);
  const [customPlaceMode, setCustomPlaceMode] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  const [dbTitles, setDbTitles] = React.useState(TAMIL_TITLES);
  const [dbStars, setDbStars] = React.useState(TAMIL_STARS);
  const [dbPlaces, setDbPlaces] = React.useState(TAMIL_PLACES);

  React.useEffect(() => {
    api.getDropdownOptions().then(options => {
      const titles = options.filter(o => o.category === 'title_ta').map(o => o.value);
      const stars = options.filter(o => o.category === 'star_ta').map(o => o.value);
      const places = options.filter(o => o.category === 'place_ta').map(o => o.value);
      if (titles.length > 0) setDbTitles(titles);
      if (stars.length > 0) setDbStars(stars);
      if (places.length > 0) setDbPlaces(places);
    }).catch(console.error);
  }, []);

  // Sync state if initialData or englishData changes
  React.useEffect(() => {
    const initial = getInitialFormData();
    setFormData(initial);
    // If the translated place is not in the standard list, open custom mode so devotee sees it clearly
    if (initial.place_ta && !dbPlaces.includes(initial.place_ta)) {
      setCustomPlaceMode(true);
    } else {
      setCustomPlaceMode(false);
    }
    setErrors({});
  }, [initialData, englishData, dbPlaces]);

  // Build place options dynamically to ensure any existing custom value is included (must be before early return)
  const placeOptions = React.useMemo(() => {
    const places = [...dbPlaces];
    if (formData.place_ta && !places.includes(formData.place_ta)) {
      places.unshift(formData.place_ta);
    }
    return places;
  }, [formData.place_ta, dbPlaces]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title_ta?.trim()) newErrors.title_ta = "Title in Tamil is required";
    if (!formData.name_ta?.trim()) newErrors.name_ta = "Full Name is required";
    if (!formData.star_ta?.trim()) newErrors.star_ta = "Star in Tamil is required";
    if (!formData.place_ta?.trim()) newErrors.place_ta = "Place in Tamil is required";
    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Valid Kattalai amount is required";
    }
    return newErrors;
  };

  const isFormValid = Boolean(
    formData.title_ta?.trim() &&
    formData.name_ta?.trim() &&
    formData.star_ta?.trim() &&
    formData.place_ta?.trim() &&
    formData.amount &&
    !isNaN(formData.amount) &&
    parseFloat(formData.amount) > 0
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    onSubmit(formData);
  };

  const getInputClass = (hasError) => 
    `h-[38px] px-4 rounded-full border ${hasError ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400 bg-red-50/20' : 'border-[#e2d8cb] focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] bg-white'} font-barlow text-[14px] text-gray-800 placeholder-[#9c9186] focus:outline-none transition-all w-full shadow-sm hover:border-[#cfc2b2]`;

  const getSelectClass = (hasError) => 
    `h-[38px] px-4 rounded-full border ${hasError ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400 bg-red-50/20' : 'border-[#e2d8cb] focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] bg-white'} font-barlow text-[14px] text-gray-800 focus:outline-none transition-all w-full appearance-none pr-8 shadow-sm hover:border-[#cfc2b2] cursor-pointer`;

  const cardContent = (
    <div className="relative shadow-[0_20px_60px_-15px_rgba(70,40,20,0.25)] flex flex-col p-4 sm:p-6 bg-[#f7f1e5] border border-[#ebdccb] rounded-[24px] sm:rounded-[28px] max-w-[620px] w-full my-auto transition-all animate-fade-in max-h-[92vh] overflow-y-auto">
      <div className="w-full flex flex-col gap-3">
        
        {/* Header */}
        <div className="flex items-center justify-between px-1 pb-1">
          <h3 className="text-[17px] sm:text-[18px] font-bold text-[#5c292c] font-barlow tracking-wide">
            Step 2: Tamil Details & Payment
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-1">
          {/* Row 1: Title & Full Name (Exact 110px dropdown + flex-1 matching English Row 1!) */}
          <div className="flex gap-2.5">
            <div className="w-[100px] sm:w-[110px] shrink-0">
              <label className="flex items-center justify-between text-[#5c292c] font-barlow font-semibold text-[12px] sm:text-[12.5px] mb-1 px-1">
                <span>Title (தமிழ்) <span className="text-red-500">*</span></span>
              </label>
              <div className="relative">
                <select
                  name="title_ta"
                  value={formData.title_ta}
                  onChange={handleChange}
                  className={getSelectClass(!!errors.title_ta)}
                >
                  <option value="" disabled>Title</option>
                  {dbTitles.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8075]">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <label className="flex items-center justify-between text-[#5c292c] font-barlow font-semibold text-[12px] sm:text-[12.5px] mb-1 px-1">
                <span>Full Name (தமிழ்) <span className="text-red-500">*</span></span>
                {englishData?.name && (
                  <span className="text-[#786c62] text-[10.5px] sm:text-[11px] font-normal bg-[#ede4d8] px-2 py-0.2 rounded-full truncate max-w-[120px] sm:max-w-[150px]">
                    {englishData.name}
                  </span>
                )}
              </label>
              <input
                type="text"
                name="name_ta"
                value={formData.name_ta}
                onChange={handleChange}
                placeholder="e.g. சோமசுந்தரம் செட்டியார்"
                className={getInputClass(!!errors.name_ta)}
              />
            </div>
          </div>

          {/* Row 2: Star & Place (Exact 50% / 50% dropdowns matching English Row 2!) */}
          <div className="flex gap-2.5">
            <div className="w-1/2">
              <label className="flex items-center justify-between text-[#5c292c] font-barlow font-semibold text-[12px] sm:text-[12.5px] mb-1 px-1">
                <span>Star (தமிழ்) <span className="text-red-500">*</span></span>
                {englishData?.star && (
                  <span className="text-[#786c62] text-[10.5px] sm:text-[11px] font-normal bg-[#ede4d8] px-2 py-0.2 rounded-full">
                    {englishData.star}
                  </span>
                )}
              </label>
              <div className="relative">
                <select
                  name="star_ta"
                  value={formData.star_ta}
                  onChange={handleChange}
                  className={getSelectClass(!!errors.star_ta)}
                >
                  <option value="" disabled>நட்சத்திரம் தேர்வு</option>
                  {dbStars.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8075]">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="w-1/2">
              <label className="flex items-center justify-between text-[#5c292c] font-barlow font-semibold text-[12px] sm:text-[12.5px] mb-1 px-1">
                <span>Place (தமிழ்) <span className="text-red-500">*</span></span>
                <div className="flex items-center gap-1">
                  {englishData?.place && (
                    <span className="text-[#786c62] text-[10.5px] sm:text-[11px] font-normal bg-[#ede4d8] px-1.5 py-0.2 rounded-full truncate max-w-[65px] sm:max-w-[80px]" title={englishData.place}>
                      {englishData.place}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setCustomPlaceMode(!customPlaceMode);
                      if (!customPlaceMode) {
                        setFormData(prev => ({ ...prev, place_ta: '' }));
                      }
                    }}
                    className="text-[10px] text-[#5c292c] font-semibold hover:underline bg-[#ebdccb]/60 px-1 py-0.5 rounded"
                    title="Toggle between Chettinad village dropdown and custom typing"
                  >
                    {customPlaceMode ? "பட்டியல்" : "தட்டச்சு"}
                  </button>
                </div>
              </label>
              {customPlaceMode ? (
                <input
                  type="text"
                  name="place_ta"
                  value={formData.place_ta}
                  onChange={handleChange}
                  placeholder="e.g. காரைக்குடி / மற்ற ஊர்"
                  className={getInputClass(!!errors.place_ta)}
                />
              ) : (
                <div className="relative">
                  <select
                    name="place_ta"
                    value={formData.place_ta}
                    onChange={handleChange}
                    className={getSelectClass(!!errors.place_ta)}
                  >
                    <option value="" disabled>ஊர் தேர்வு</option>
                    {placeOptions.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8c8075]">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Kattalai Amount & Comments (Responsive flex-col on mobile, flex-row on desktop) */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="w-full sm:w-[150px] shrink-0">
              <label className="flex items-center justify-between text-[#5c292c] font-barlow font-semibold text-[12px] sm:text-[12.5px] mb-1 px-1">
                <span>Kattalai Amount (₹) <span className="text-red-500">*</span></span>
              </label>
              <input
                type="text"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="e.g. 1200"
                className={getInputClass(!!errors.amount)}
              />
            </div>

            <div className="flex-1 min-w-0">
              <label className="flex items-center justify-between text-[#5c292c] font-barlow font-semibold text-[12px] sm:text-[12.5px] mb-1 px-1">
                <span>Comments / Remarks</span>
              </label>
              <input
                type="text"
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                placeholder="e.g. Online Devotee Registration / Special Notes"
                className={getInputClass(!!errors.comments)}
              />
            </div>
          </div>

          {/* Validation Banner if errors exist */}
          {Object.keys(errors).length > 0 && (
            <div className="flex items-center justify-center gap-1.5 text-red-600 text-[12px] font-barlow font-medium bg-red-50/90 py-1.5 px-3.5 rounded-full border border-red-200 self-center mt-0.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <span>Please fill in all required fields marked with * before proceeding to pay.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center items-center gap-4 mt-2 pt-2.5 border-t border-[#ebdccb]">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center font-barlow font-medium text-[15px] bg-white text-[#5c292c] border-2 border-[#5c292c] hover:bg-[#5c292c]/5 transition-all px-8 h-[38px] rounded-full shadow-sm cursor-pointer"
            >
              Back to Details
            </button>
            <button
              type="submit"
              className="flex items-center justify-center font-barlow font-semibold text-[15px] transition-all px-9 h-[38px] rounded-full shadow-md bg-[#5c292c] hover:bg-[#4a2123] text-white hover:shadow-lg cursor-pointer active:scale-[0.99]"
              title="Proceed to payment"
            >
              Pay Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (isInline) {
    return cardContent;
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] p-4 flex items-center justify-center overflow-y-auto animate-fade-in">
      {cardContent}
    </div>
  );
}
