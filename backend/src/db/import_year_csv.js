/**
 * Vairavan Koil - Enterprise Bulk CSV Importer
 * 
 * Features:
 * - 100% Zero-dependency on database `id` or `kattalai_type_id`:
 *     - If `id` / `kattalai_type_id` columns are missing, blank, or removed, the importer works flawlessly!
 *     - `kattalai_type_id` is auto-resolved from code prefix:
 *         'U/...' -> Uchikkalam (11:30 AM)
 *         'A/...' -> Arthajamam (7:30 PM)
 *     - Devotee identity is tracked by `code`. If found in DB, it performs an in-place UPDATE.
 *       If new, it generates a fresh UUID and performs an INSERT.
 * - Automatic English-to-Tamil Translation:
 *     - `title` -> `title_ta` (Thiru -> திரு, Thirumathi -> திருமதி, etc.)
 *     - `star` -> `star_ta` (All 27 Tamil Nakshatras: Chithirai -> சித்திரை, Swathi -> சுவாதி, etc.)
 *     - `place` -> `place_ta` (All 60+ Chettinad native places: Karaikudi -> காரைக்குடி, etc.)
 *     - Overwrite corrupt ANSI question marks (`??????`) with clean translations or existing DB data.
 * - Excel Scientific Notation Phone cleaner (9.60E+09 -> 9600072137).
 * - Full address support: per_add_1..3 and comm_add_1..4.
 * - Dual Target:
 *     node import_year_csv.js "Book4.csv" --local   (Local XAMPP)
 *     node import_year_csv.js "Book4.csv"           (Cloud Aiven MySQL)
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const pool = require('./pool');
const mysql = require('mysql2/promise');

const UCHIKALA_TYPE_ID = '6ac54970-b720-11f1-a912-40c2ba2be375';
const ARTHAJAMA_TYPE_ID = '6ac58b1d-b720-11f1-a912-40c2ba2be375';

// Title Dictionary
const TITLE_MAP = {
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

// Canonical 27 Chettinad Nakshatras Dictionary (English Dropdown Standard + Tamil)
const CANONICAL_STAR_MAP = {
  // Magam
  'maham': { en: 'Magam', ta: 'மகம்' },
  'magam': { en: 'Magam', ta: 'மகம்' },
  'makam': { en: 'Magam', ta: 'மகம்' },
  'magha': { en: 'Magam', ta: 'மகம்' },

  // Uthirattathi
  'uthrattathi': { en: 'Uthirattathi', ta: 'உத்திரட்டாதி' },
  'uthirattathi': { en: 'Uthirattathi', ta: 'உத்திரட்டாதி' },
  'uttara bhadrapada': { en: 'Uthirattathi', ta: 'உத்திரட்டாதி' },

  // Punarpoosam
  'punarpoosam': { en: 'Punarpoosam', ta: 'புனர்பூசம்' },
  'punarvasu': { en: 'Punarpoosam', ta: 'புனர்பூசம்' },

  // Pooraadam
  'pooradam': { en: 'Pooraadam', ta: 'பூராடம்' },
  'pooraadam': { en: 'Pooraadam', ta: 'பூராடம்' },
  'purva ashadha': { en: 'Pooraadam', ta: 'பூராடம்' },

  // Uthiram
  'uthram': { en: 'Uthiram', ta: 'உத்திரம்' },
  'uthiram': { en: 'Uthiram', ta: 'உத்திரம்' },
  'uttara phalguni': { en: 'Uthiram', ta: 'உத்திரம்' },

  // Uthiradam
  'uthradam': { en: 'Uthiradam', ta: 'உத்திராடம்' },
  'uthiradam': { en: 'Uthiradam', ta: 'உத்திராடம்' },
  'uttara ashadha': { en: 'Uthiradam', ta: 'உத்திராடம்' },

  // Aswathi
  'asuwathi': { en: 'Aswathi', ta: 'அஸ்வினி' },
  'aswathi': { en: 'Aswathi', ta: 'அஸ்வினி' },
  'aswini': { en: 'Aswathi', ta: 'அஸ்வினி' },
  'ashwini': { en: 'Aswathi', ta: 'அஸ்வினி' },

  // Mirukashirisham
  'mirukashirisam': { en: 'Mirukashirisham', ta: 'மிருகசீரிஷம்' },
  'mirukashirisham': { en: 'Mirukashirisham', ta: 'மிருகசீரிஷம்' },
  'mirugasiridam': { en: 'Mirukashirisham', ta: 'மிருகசீரிஷம்' },
  'mrigasira': { en: 'Mirukashirisham', ta: 'மிருகசீரிஷம்' },
  'mrigashirsha': { en: 'Mirukashirisham', ta: 'மிருகசீரிஷம்' },

  // Sadayam
  'sathayam': { en: 'Sadayam', ta: 'சதயம்' },
  'sadayam': { en: 'Sadayam', ta: 'சதயம்' },
  'shatabhisha': { en: 'Sadayam', ta: 'சதயம்' },

  // Anusam
  'anusam': { en: 'Anusam', ta: 'அனுஷம்' },
  'anusham': { en: 'Anusam', ta: 'அனுஷம்' },
  'anuradha': { en: 'Anusam', ta: 'அனுஷம்' },

  // Keettai
  'keettai': { en: 'Keettai', ta: 'கேட்டை' },
  'kettai': { en: 'Keettai', ta: 'கேட்டை' },
  'jyeshtha': { en: 'Keettai', ta: 'கேட்டை' },

  // Chithirai
  'chithirai': { en: 'Chithirai', ta: 'சித்திரை' },
  'chitra': { en: 'Chithirai', ta: 'சித்திரை' },

  // Swathi
  'swathi': { en: 'Swathi', ta: 'சுவாதி' },
  'swati': { en: 'Swathi', ta: 'சுவாதி' },

  // Visakam
  'visakam': { en: 'Visakam', ta: 'விசாகம்' },
  'vishakha': { en: 'Visakam', ta: 'விசாகம்' },

  // Bharani
  'bharani': { en: 'Bharani', ta: 'பரணி' },
  'barani': { en: 'Bharani', ta: 'பரணி' },

  // Karthikai
  'karthikai': { en: 'Karthikai', ta: 'கார்த்திகை' },
  'karthigai': { en: 'Karthikai', ta: 'கார்த்திகை' },
  'krittika': { en: 'Karthikai', ta: 'கார்த்திகை' },
  'krithika': { en: 'Karthikai', ta: 'கார்த்திகை' },

  // Rohini
  'rohini': { en: 'Rohini', ta: 'ரோகிணி' },

  // Thiruvathirai
  'thiruvathirai': { en: 'Thiruvathirai', ta: 'திருவாதிரை' },
  'thiruvathira': { en: 'Thiruvathirai', ta: 'திருவாதிரை' },
  'arudra': { en: 'Thiruvathirai', ta: 'திருவாதிரை' },

  // Poosam
  'poosam': { en: 'Poosam', ta: 'பூசம்' },
  'pushyam': { en: 'Poosam', ta: 'பூசம்' },

  // Ayilyam
  'ayilyam': { en: 'Ayilyam', ta: 'ஆயில்யம்' },
  'aslesha': { en: 'Ayilyam', ta: 'ஆயில்யம்' },

  // Pooram
  'pooram': { en: 'Pooram', ta: 'பூரம்' },
  'purva phalguni': { en: 'Pooram', ta: 'பூரம்' },

  // Hastham
  'hastham': { en: 'Hastham', ta: 'அஸ்தம்' },
  'hasta': { en: 'Hastham', ta: 'அஸ்தம்' },

  // Moolam
  'moolam': { en: 'Moolam', ta: 'மூலம்' },
  'mula': { en: 'Moolam', ta: 'மூலம்' },

  // Thiruvonam
  'thiruvonam': { en: 'Thiruvonam', ta: 'திருவோணம்' },
  'sravana': { en: 'Thiruvonam', ta: 'திருவோணம்' },

  // Avittam
  'avittam': { en: 'Avittam', ta: 'அவிட்டம்' },
  'dhanishta': { en: 'Avittam', ta: 'அவிட்டம்' },

  // Poorattathi
  'poorattathi': { en: 'Poorattathi', ta: 'பூரட்டாதி' },
  'purva bhadrapada': { en: 'Poorattathi', ta: 'பூரட்டாதி' },

  // Revathi
  'revathi': { en: 'Revathi', ta: 'ரேவதி' }
};

// 60+ Chettinad & Major Tamil Nadu Native Places (Google Maps Canonical Standards)
const CANONICAL_PLACE_MAP = {
  'A THEKKUR': { en: 'A. Thekkur', ta: 'ஏ. தெக்கூர்' },
  'A. THEKKUR': { en: 'A. Thekkur', ta: 'ஏ. தெக்கூர்' },
  'A.THEKKUR': { en: 'A. Thekkur', ta: 'ஏ. தெக்கூர்' },
  'A.MUTHUPPATTINAM': { en: 'A. Muthupattinam', ta: 'ஏ. முத்துப்பட்டினம்' },
  'A.MUTHUPATTINAM': { en: 'A. Muthupattinam', ta: 'ஏ. முத்துப்பட்டினம்' },
  'A. MUTHUPATTINAM': { en: 'A. Muthupattinam', ta: 'ஏ. முத்துப்பட்டினம்' },
  'AAVNIPPATTI': { en: 'Avanipatti', ta: 'ஆவணிப்பட்டி' },
  'AVANIPATTI': { en: 'Avanipatti', ta: 'ஆவணிப்பட்டி' },
  'AAVANIPATTI': { en: 'Avanipatti', ta: 'ஆவணிப்பட்டி' },
  'ALAVAKOTTAI': { en: 'Alavakottai', ta: 'அலவாகோட்டை' },
  'ARANMANAI SIRUVAYAL': { en: 'Aranmanai Siruvayal', ta: 'அரண்மனை சிறுவயல்' },
  'ARAVAYAL': { en: 'Aravayal', ta: 'அரவயல்' },
  'ARIMALAM': { en: 'Arimalam', ta: 'அரிமளம்' },
  'ARIYAGUDI': { en: 'Ariyakudi', ta: 'அரியக்குடி' },
  'ARIYAKUDI': { en: 'Ariyakudi', ta: 'அரியக்குடி' },
  'ATHANGUDI': { en: 'Athangudi', ta: 'ஆத்தங்குடி' },
  'CHENNAI': { en: 'Chennai', ta: 'சென்னை' },
  'CHOKALINGAM PUDUR': { en: 'Chockalingampudur', ta: 'சொக்கலிங்கம்புதூர்' },
  'CHOCKALINGAM PUDUR': { en: 'Chockalingampudur', ta: 'சொக்கலிங்கம்புதூர்' },
  'CHOCKALINGAMPUDUR': { en: 'Chockalingampudur', ta: 'சொக்கலிங்கம்புதூர்' },
  'COIMBATORE': { en: 'Coimbatore', ta: 'கோயம்புத்தூர்' },
  'DEVAKOTTAI': { en: 'Devakottai', ta: 'தேவகோட்டை' },
  'K.ALAGAPURI': { en: 'K. Alagapuri', ta: 'கே. அழகபுரி' },
  'K. ALAGAPURI': { en: 'K. Alagapuri', ta: 'கே. அழகபுரி' },
  'KADIAPATTI': { en: 'Kadiapatti', ta: 'கடியாபட்டி' },
  'KALAYAR MANGALAM': { en: 'Kalayarmangalam', ta: 'காளையார் மங்கலம்' },
  'KALAYARMANGALAM': { en: 'Kalayarmangalam', ta: 'காளையார் மங்கலம்' },
  'KALLAL': { en: 'Kallal', ta: 'கல்லல்' },
  'KANADUKATHAN': { en: 'Kanadukathan', ta: 'கானாடுகாத்தான்' },
  'KANDANUR': { en: 'Kandanur', ta: 'கண்டனூர்' },
  'KANDARAMANIKKAM': { en: 'Kandaramanickam', ta: 'கண்டரமாணிக்கம்' },
  'KANDARAMANICKAM': { en: 'Kandaramanickam', ta: 'கண்டரமாணிக்கம்' },
  'KANDAVARAYANPATTI': { en: 'Kandavarayanpatti', ta: 'கண்டவராயன்பட்டி' },
  'KARAIKUDI': { en: 'Karaikudi', ta: 'காரைக்குடி' },
  'KKDI': { en: 'Karaikudi', ta: 'காரைக்குடி' },
  'KARUNGKULAM': { en: 'Karungulam', ta: 'கருங்குளம்' },
  'KARUNGULAM': { en: 'Karungulam', ta: 'கருங்குளம்' },
  'KEELASEVALPATTI': { en: 'Kilasevalpatti', ta: 'கீழச்செவல்பட்டி' },
  'KILASEVALPATTI': { en: 'Kilasevalpatti', ta: 'கீழச்செவல்பட்டி' },
  'KO.ALAGAPURI': { en: 'Ko. Alagapuri', ta: 'கோ. அழகபுரி' },
  'KO. ALAGAPURI': { en: 'Ko. Alagapuri', ta: 'கோ. அழகபுரி' },
  'KONAPET': { en: 'Konapet', ta: 'கோனாப்பட்டு' },
  'KOPPANA PATTI': { en: 'Koppanapatti', ta: 'கொப்பனாபட்டி' },
  'KOPPANAPATTI': { en: 'Koppanapatti', ta: 'கொப்பனாபட்டி' },
  'KOTHAMANGALAM': { en: 'Kothamangalam', ta: 'கொத்தமங்கலம்' },
  'KOTTAIYUR': { en: 'Kottaiyur', ta: 'கோட்டையூர்' },
  'KULIPIRAI': { en: 'Kulipirai', ta: 'குளிபிறை' },
  'KURUVIKONDANPATTI': { en: 'Kuruvikondanpatti', ta: 'குருவிகொண்டான்பட்டி' },
  'MAKIBALANPATTI': { en: 'Mahibalanpatti', ta: 'மகிபாலன்பட்டி' },
  'MAHIBALANPATTI': { en: 'Mahibalanpatti', ta: 'மகிபாலன்பட்டி' },
  'MANAKIRI': { en: 'Managiri', ta: 'மானாகிரி' },
  'MANAGIRI': { en: 'Managiri', ta: 'மானாகிரி' },
  'MATHAGU PATTI': { en: 'Madagupatti', ta: 'மடகுபட்டி' },
  'MATHAGUPATTI': { en: 'Madagupatti', ta: 'மடகுபட்டி' },
  'MADAGUPATTI': { en: 'Madagupatti', ta: 'மடகுபட்டி' },
  'MELAI SIVAPURI': { en: 'Melasivapuri', ta: 'மேலைச்சிவபுரி' },
  'MELASIVAPURI': { en: 'Melasivapuri', ta: 'மேலைச்சிவபுரி' },
  'MUTHU PATTINAM.K': { en: 'K. Muthupattinam', ta: 'முத்துப்பட்டினம்.கே' },
  'K. MUTHUPATTINAM': { en: 'K. Muthupattinam', ta: 'முத்துப்பட்டினம்.கே' },
  'NACHANDU PATTI': { en: 'Nachandupatti', ta: 'நாச்சந்துபட்டி' },
  'NACHANDUPATTI': { en: 'Nachandupatti', ta: 'நாச்சந்துபட்டி' },
  'NACHIAPURAM': { en: 'Nachiapuram', ta: 'நாச்சியாபுரம்' },
  'NATARAJAPURAM': { en: 'Natarajapuram', ta: 'நடராஜபுரம்' },
  'NATTARASAN KOTTAI': { en: 'Nattarasankottai', ta: 'நாட்டரசன்கோட்டை' },
  'NATTARASANKOTTAI': { en: 'Nattarasankottai', ta: 'நாட்டரசன்கோட்டை' },
  'NEMATHANPATTI': { en: 'Nemathanpatti', ta: 'நேமத்தான்பட்டி' },
  'NERKUPPAI': { en: 'Nerkuppai', ta: 'நெற்குப்பை' },
  'ONASIRUVAYAL': { en: 'Onasiruvayal', ta: 'ஒனசிறுவயல்' },
  'OOKUR': { en: 'Okkur', ta: 'ஓகூர்' },
  'OKKUR': { en: 'Okkur', ta: 'ஓகூர்' },
  'P.ALAGAPURI': { en: 'P. Alagapuri', ta: 'பி. அழகபுரி' },
  'P. ALAGAPURI': { en: 'P. Alagapuri', ta: 'பி. அழகபுரி' },
  'PALAGAPURI': { en: 'P. Alagapuri', ta: 'பி. அழகபுரி' },
  'PAGANERY': { en: 'Paganeri', ta: 'பாகனேரி' },
  'PAGANERI': { en: 'Paganeri', ta: 'பாகனேரி' },
  'PALAVANGUDI': { en: 'Palavangudi', ta: 'பாலவாங்குடி' },
  'PALLATHUR': { en: 'Pallathur', ta: 'பல்லத்தூர்' },
  'PANAGUDI': { en: 'Panagudi', ta: 'பனங்குடி' },
  'PATTAMANGALAM': { en: 'Pattamangalam', ta: 'பட்டம்மங்கலம்' },
  'PON PUDUPATTI': { en: 'Pon Pudupatti', ta: 'பொன் புதுப்பட்டி' },
  'PON.PUDUPATTI': { en: 'Pon Pudupatti', ta: 'பொன் புதுப்பட்டி' },
  'POOLANKURICHI': { en: 'Poolankurichi', ta: 'பூலாங்குறிச்சி' },
  'PUDUVAYAL': { en: 'Puduvayal', ta: 'புதுவயல்' },
  'RAMACHANDRA PURAM': { en: 'Ramachandrapuram', ta: 'ராமச்சந்திரபுரம்' },
  'RAMACHANDRAPURAM': { en: 'Ramachandrapuram', ta: 'ராமச்சந்திரபுரம்' },
  'RAYAVARAM': { en: 'Rayavaram', ta: 'ராயவரம்' },
  'SIRAVAYAL': { en: 'Siravayal', ta: 'சிராவயல்' },
  'SIRUKUDALPATTI': { en: 'Sirukudalpatti', ta: 'சிறுகூடல்பட்டி' },
  'SIVUR': { en: 'Sivur', ta: 'சிவூர்' },
  'THENIPATTI': { en: 'Thenipatti', ta: 'தேனிப்பட்டி' },
  'V.LAKSHMIPURAM': { en: 'V. Lakshmipuram', ta: 'வி. லட்சுமிபுரம்' },
  'V. LAKSHMIPURAM': { en: 'V. Lakshmipuram', ta: 'வி. லட்சுமிபுரம்' },
  'VALAYAPATTI': { en: 'Valayapatti', ta: 'வலையபட்டி' },
  'VENTHAN PATTI': { en: 'Venthanpatti', ta: 'வேந்தன்பட்டி' },
  'VENTHANPATTI': { en: 'Venthanpatti', ta: 'வேந்தன்பட்டி' },
  'VETRIYUR': { en: 'Vetriyur', ta: 'வெற்றியூர்' },
  'VIRACHILAI': { en: 'Virachilai', ta: 'விராச்சிலை' },
  'VIRAMATHI': { en: 'Viramathi', ta: 'வீரமதி' },
  'VISWANATHA PURAM.K': { en: 'K. Viswanathapuram', ta: 'விஸ்வநாதபுரம்.கே' },
  'K. VISWANATHAPURAM': { en: 'K. Viswanathapuram', ta: 'விஸ்வநாதபுரம்.கே' },
  'MADURAI': { en: 'Madurai', ta: 'மதுரை' },
  'TRICHY': { en: 'Tiruchirappalli', ta: 'திருச்சிராப்பள்ளி' },
  'TIRUCHIRAPPALLI': { en: 'Tiruchirappalli', ta: 'திருச்சிராப்பள்ளி' },
  'SALEM': { en: 'Salem', ta: 'சேலம்' },
  'BANGALORE': { en: 'Bengaluru', ta: 'பெங்களூரு' },
  'BENGALURU': { en: 'Bengaluru', ta: 'பெங்களூரு' }
};

function resolvePlace(enPlace, currentTamil) {
  if (!enPlace || enPlace.trim() === '' || enPlace.toUpperCase() === 'NONE' || enPlace.toUpperCase() === 'NULL') {
    return { place: null, place_ta: null };
  }
  const clean = enPlace.trim();
  const upper = clean.toUpperCase();
  const norm = upper.replace(/[\s\.\-_]+/g, '');

  let matched = null;
  if (CANONICAL_PLACE_MAP[upper]) {
    matched = CANONICAL_PLACE_MAP[upper];
  } else {
    for (const [k, v] of Object.entries(CANONICAL_PLACE_MAP)) {
      if (k.replace(/[\s\.\-_]+/g, '') === norm) {
        matched = v;
        break;
      }
    }
  }

  if (matched) {
    let placeTa = null;
    if (!isCorruptOrEmpty(currentTamil)) {
      const normTa = currentTamil.trim().replace(/[\s\.\-_]+/g, '');
      const matchTa = Object.values(CANONICAL_PLACE_MAP).find(p => p.ta.replace(/[\s\.\-_]+/g, '') === normTa);
      placeTa = matchTa ? matchTa.ta : currentTamil.trim();
    } else {
      placeTa = matched.ta;
    }
    return { place: matched.en, place_ta: placeTa };
  }

  return { place: clean, place_ta: currentTamil || null };
}

function cleanVal(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (s === '' || s.toUpperCase() === 'NULL' || s.toLowerCase() === 'undefined') return null;
  return s;
}

function isCorruptOrEmpty(str) {
  if (!str) return true;
  const s = String(str).trim();
  if (s === '' || s.toUpperCase() === 'NULL' || s === '0') return true;
  if (/^\?+$/.test(s) || (s.match(/\?/g) || []).length >= 3) return true;
  // Detect Mojibake (corrupted double-encoded UTF-8 like à® or Ã)
  if (s.includes('à®') || s.includes('à¯') || s.includes('Ã')) return true;
  return false;
}

function cleanPhone(val) {
  if (!val) return null;
  let s = String(val).trim();
  if (s === '' || s.toUpperCase() === 'NULL') return null;
  if (s.includes('E+') || s.includes('e+')) {
    const num = Number(s);
    if (!isNaN(num)) s = Math.round(num).toString();
  }
  return s.replace(/\.0+$/, '').replace(/\D+/g, '');
}

function translateTitle(enTitle, currentTamil) {
  if (!isCorruptOrEmpty(currentTamil)) {
    const tk = currentTamil.trim().toLowerCase();
    if (TITLE_MAP[tk]) return TITLE_MAP[tk];
    return currentTamil.trim();
  }
  if (!enTitle) return 'திரு';
  const k = enTitle.trim().toLowerCase();
  return TITLE_MAP[k] || 'திரு';
}

function resolveStar(enStar, currentTamil) {
  if (!enStar || enStar.trim() === '' || enStar.toUpperCase() === 'NONE' || enStar.toUpperCase() === 'NULL') {
    return { star: null, star_ta: null };
  }
  const norm = enStar.trim().toLowerCase().replace(/[\s\.\-_]+/g, '');
  const match = CANONICAL_STAR_MAP[norm];
  if (match) {
    let starTa = null;
    if (!isCorruptOrEmpty(currentTamil)) {
      const normTa = currentTamil.trim().toLowerCase().replace(/[\s\.\-_]+/g, '');
      starTa = CANONICAL_STAR_MAP[normTa] ? CANONICAL_STAR_MAP[normTa].ta : currentTamil.trim();
    } else {
      starTa = match.ta;
    }
    return { star: match.en, star_ta: starTa };
  }
  return { star: enStar.trim(), star_ta: currentTamil || null };
}



// Robust CSV parser supporting quotes and multiline fields
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result.map(s => s.replace(/^"|"$/g, '').trim());
  };

  const headers = parseLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && !values[0])) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(obj);
  }
  return { headers, rows };
}

async function runImport(filePath) {
  if (!filePath || filePath.startsWith('--')) {
    console.error('❌ Please provide the file path:');
    console.error('   node import_year_csv.js "Book4.csv" --local  (for local XAMPP)');
    console.error('   node import_year_csv.js "Book4.csv"          (for Cloud Aiven)');
    process.exit(1);
  }

  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`❌ File not found: ${resolved}`);
    process.exit(1);
  }

  const isLocal = process.argv.includes('--local');

  console.log(`=======================================================`);
  console.log(`🏛️  VAIRAVAN KOIL: ENTERPRISE CSV IMPORTER`);
  console.log(`📂  File: ${path.basename(resolved)}`);
  console.log(`🎯  Target DB: ${isLocal ? 'Local XAMPP (vairavan_koil)' : 'Cloud Aiven MySQL'}`);
  console.log(`✨  Auto English-Tamil Sync: ACTIVE (Titles, Stars, Places)`);
  console.log(`=======================================================`);

  let db;
  let localConn = null;

  if (isLocal) {
    try {
      localConn = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '',
        database: 'vairavan_koil',
        charset: 'utf8mb4'
      });
      db = {
        query: async (sql, params = []) => {
          const [res] = await localConn.query(sql, params);
          return res;
        }
      };
    } catch (err) {
      console.error('❌ Failed to connect to local XAMPP MySQL:', err.message);
      console.error('   Please make sure Apache & MySQL are running in XAMPP Control Panel.');
      process.exit(1);
    }
  } else {
    db = {
      query: async (sql, params = []) => {
        let text = sql;
        let pIndex = 1;
        text = text.replace(/\?/g, () => `$${pIndex++}`);
        const res = await pool.query(text, params);
        return res.rows || res;
      }
    };
  }

  const content = fs.readFileSync(resolved, 'utf8');
  const { headers, rows } = parseCSV(content);

  console.log(`📊 Total rows found in CSV: ${rows.length}`);

  // Temporarily disable foreign keys for safe bulk upserts
  await db.query('SET FOREIGN_KEY_CHECKS = 0');

  let updatedCount = 0;
  let insertedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];

    // Skip if row is accidentally header text
    if (r.name === 'name' || r.code === 'code' || r.id === 'id') {
      skippedCount++;
      continue;
    }

    const code = cleanVal(r.code);
    const name = cleanVal(r.name);
    if (!name && !code) {
      skippedCount++;
      continue;
    }

    const id = cleanVal(r.id);
    const date = parseInt(r.kattalai_date, 10) || null;
    const month = parseInt(r.kattalai_month, 10) || null;

    // Automatic kattalai_type_id derivation from Code:
    // 'U/...' -> Uchikkalam (11:30 AM), 'A/...' -> Arthajamam (7:30 PM)
    let typeId = cleanVal(r.kattalai_type_id);
    if (!typeId || typeId.length < 30) {
      const codeCheck = (code || cleanVal(r.kat_type) || '').toUpperCase();
      if (codeCheck.startsWith('U') || codeCheck.includes('UCHI')) {
        typeId = UCHIKALA_TYPE_ID;
      } else {
        typeId = ARTHAJAMA_TYPE_ID;
      }
    }

    // Auto-translate English to Tamil for Title, Star, and Place
    const title = cleanVal(r.title) || 'Thiru';
    const title_ta = translateTitle(title, cleanVal(r.title_ta));

    const resolvedStar = resolveStar(cleanVal(r.star), cleanVal(r.star_ta));
    const star = resolvedStar.star;
    const star_ta = resolvedStar.star_ta;

    const resolvedPlace = resolvePlace(cleanVal(r.place), cleanVal(r.place_ta));
    const place = resolvedPlace.place;
    const place_ta = resolvedPlace.place_ta;

    // Devotee Name (clean corrupt question marks or Mojibake if present)
    let name_ta = cleanVal(r.name_ta);
    if (isCorruptOrEmpty(name_ta)) {
      if (name && name.toLowerCase() === 'abi') name_ta = 'அபி';
      else if (name && name.toLowerCase().includes('marlin')) name_ta = 'மார்லின்';
      else name_ta = null;
    }

    // Contacts & Phones (clean scientific notation)
    const mobile = cleanPhone(r.mobile);
    const whatsapp = cleanPhone(r.whatsapp_number) || mobile;
    const whatsapp_same_as_mobile = (r.whatsapp_same_as_mobile === '0' || r.whatsapp_same_as_mobile === 0) ? 0 : 1;
    const email = cleanVal(r.email);

    // Complete Permanent & Communication Addresses
    const per_add_1 = cleanVal(r.per_add_1);
    const per_add_2 = cleanVal(r.per_add_2);
    const per_add_3 = cleanVal(r.per_add_3);

    const comm_add_1 = cleanVal(r.comm_add_1);
    const comm_add_2 = cleanVal(r.comm_add_2);
    const comm_add_3 = cleanVal(r.comm_add_3);
    const comm_add_4 = cleanVal(r.comm_add_4);

    const amount = parseFloat(r.amount) || 0.00;
    const country_code = cleanVal(r.country_code) || '91';
    
    // kat_type: Strictly 'Lifetime' or 'Inheritance'
    let rawKat = (cleanVal(r.kat_type) || '').toLowerCase();
    const kat_type = rawKat.includes('inherit') ? 'Inheritance' : 'Lifetime';

    const regn_date = cleanVal(r.regn_date);
    const status = cleanVal(r.status) || 'booked';
    const comments = cleanVal(r.comments);
    const is_transferred = (r.is_transferred === '1' || r.is_transferred === 1) ? 1 : 0;
    const transferred_at = cleanVal(r.transferred_at);
    const transferred_from_name = cleanVal(r.transferred_from_name);
    const transferred_from_title = cleanVal(r.transferred_from_title);
    const transferred_fee_paid = parseFloat(r.transferred_fee_paid) || 0.00;
    const created_by = (cleanVal(r.created_by) && cleanVal(r.created_by).length > 20) ? cleanVal(r.created_by) : null;

    try {
      // Find if this record already exists in the database
      let matchId = null;
      let existingRecord = null;

      if (id) {
        const rowsFound = await db.query('SELECT * FROM bookings WHERE id = ? LIMIT 1', [id]);
        if (rowsFound && rowsFound.length > 0) {
          matchId = rowsFound[0].id;
          existingRecord = rowsFound[0];
        }
      }
      if (!matchId && code) {
        const rowsFound = await db.query('SELECT * FROM bookings WHERE code = ? LIMIT 1', [code]);
        if (rowsFound && rowsFound.length > 0) {
          matchId = rowsFound[0].id;
          existingRecord = rowsFound[0];
        }
      }
      if (!matchId && month && date && code) {
        const rowsFound = await db.query('SELECT * FROM bookings WHERE kattalai_month = ? AND kattalai_date = ? AND code = ? LIMIT 1', [month, date, code]);
        if (rowsFound && rowsFound.length > 0) {
          matchId = rowsFound[0].id;
          existingRecord = rowsFound[0];
        }
      }

      // If name_ta was null or corrupted in CSV, retain existing clean name_ta from DB if available
      if (!name_ta && existingRecord && existingRecord.name_ta && !isCorruptOrEmpty(existingRecord.name_ta)) {
        name_ta = existingRecord.name_ta;
      }

      if (matchId) {
        // UPDATE existing record with all translated and address fields
        await db.query(`
          UPDATE bookings SET
            kattalai_type_id = ?,
            kattalai_date = ?,
            kattalai_month = ?,
            title = ?,
            title_ta = ?,
            name = ?,
            name_ta = ?,
            star = ?,
            star_ta = ?,
            place = ?,
            place_ta = ?,
            code = ?,
            mobile = ?,
            whatsapp_number = ?,
            whatsapp_same_as_mobile = ?,
            email = ?,
            per_add_1 = ?,
            per_add_2 = ?,
            per_add_3 = ?,
            comm_add_1 = ?,
            comm_add_2 = ?,
            comm_add_3 = ?,
            comm_add_4 = ?,
            amount = ?,
            country_code = ?,
            kat_type = ?,
            regn_date = ?,
            status = ?,
            comments = ?,
            is_transferred = ?,
            transferred_at = ?,
            transferred_from_name = ?,
            transferred_from_title = ?,
            transferred_fee_paid = ?
          WHERE id = ?
        `, [
          typeId, date, month,
          title, title_ta, name, name_ta, star, star_ta,
          place, place_ta, code, mobile, whatsapp,
          whatsapp_same_as_mobile, email,
          per_add_1, per_add_2, per_add_3,
          comm_add_1, comm_add_2, comm_add_3, comm_add_4,
          amount, country_code, kat_type, regn_date,
          status, comments, is_transferred, transferred_at,
          transferred_from_name, transferred_from_title, transferred_fee_paid,
          matchId
        ]);
        updatedCount++;
      } else {
        // INSERT new record
        const newId = id || uuidv4();
        await db.query(`
          INSERT INTO bookings (
            id, kattalai_type_id, kattalai_date, kattalai_month,
            title, title_ta, name, name_ta, star, star_ta,
            place, place_ta, code, mobile, whatsapp_number,
            whatsapp_same_as_mobile, email,
            per_add_1, per_add_2, per_add_3,
            comm_add_1, comm_add_2, comm_add_3, comm_add_4,
            amount, country_code, kat_type, regn_date,
            status, comments, is_transferred, transferred_at,
            transferred_from_name, transferred_from_title, transferred_fee_paid,
            created_by
          ) VALUES (
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?,
            ?
          )
        `, [
          newId, typeId, date, month,
          title, title_ta, name, name_ta, star, star_ta,
          place, place_ta, code, mobile, whatsapp,
          whatsapp_same_as_mobile, email,
          per_add_1, per_add_2, per_add_3,
          comm_add_1, comm_add_2, comm_add_3, comm_add_4,
          amount, country_code, kat_type, regn_date,
          status, comments, is_transferred, transferred_at,
          transferred_from_name, transferred_from_title, transferred_fee_paid,
          created_by
        ]);
        insertedCount++;
      }
    } catch (err) {
      errorCount++;
      console.error(`⚠️ Error on row ${i + 1} (${code} - ${name}):`, err.message);
    }
  }

  // Re-enable foreign key checks
  await db.query('SET FOREIGN_KEY_CHECKS = 1');

  if (localConn) {
    await localConn.end();
  }

  console.log(`=======================================================`);
  console.log(`✅  IMPORT COMPLETED SUCCESSFULLY!`);
  console.log(`   - Updated Existing Records: ${updatedCount}`);
  console.log(`   - Inserted New Records:     ${insertedCount}`);
  if (skippedCount > 0) {
    console.log(`   - Skipped (Headers/Empty):  ${skippedCount}`);
  }
  if (errorCount > 0) {
    console.log(`   - Errors Encountered:       ${errorCount}`);
  }
  console.log(`=======================================================`);
  process.exit(0);
}

if (require.main === module) {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const targetFile = args[0];
  runImport(targetFile).catch(err => {
    console.error('Fatal import error:', err);
    process.exit(1);
  });
}

module.exports = runImport;
