import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

/**
 * Split a single combined address string into 2-3 logical lines:
 * (Door/Street, Area/Colony, City/Pincode)
 */
function splitSingleLineAddress(addr, place = '') {
  if (!addr) return [];
  if (addr.includes(',') || addr.includes('\n')) {
    return addr.split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean);
  }

  const trimmed = addr.trim();
  const words = trimmed.split(/\s+/);
  if (words.length <= 3) return [trimmed];

  const result = [];
  let remaining = trimmed;

  // 1. Extract Pincode (6 digits) or Place at the end
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

  // 2. Identify Street / Road / Nagar / Salai / Colony keyword to split Door+Street from Area
  const streetRegex = /^(.*?\b(?:street|st|road|rd|salai|nagar|colony|avenue|ave|lane|ln|cross|layout|apartment|apartments|flat|flats)\b\.?)\s*(.*)$/i;
  const match = remaining.match(streetRegex);
  if (match && match[1] && match[2]) {
    result.push(match[1].trim());
    if (match[2].trim()) result.push(match[2].trim());
  } else {
    // Fallback: split words proportionally into 2 lines
    const remWords = remaining.split(/\s+/);
    if (remWords.length >= 4) {
      const mid = Math.ceil(remWords.length / 2);
      result.push(remWords.slice(0, mid).join(' '));
      result.push(remWords.slice(mid).join(' '));
    } else if (remaining) {
      result.push(remaining);
    }
  }

  if (cityPart) {
    result.push(cityPart);
  }

  return result.filter(Boolean);
}

/**
 * Helper to format date into standard display: DD MMM YYYY
 */
function formatDisplayDate(dateStr) {
  if (!dateStr) return 'General';
  try {
    const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

/**
 * PrintModal renders an authentic, clean, professional A4 post cover 
 * and letter for the absentee list. It prints strictly 1 page per booking.
 */
export default function PrintModal({ list, onClose, date }) {
  const printRef = useRef(null);
  const { user } = useAuth();
  const [printStatus, setPrintStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Strict access check: only admin and superadmin can access printing
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return null;
  }

  // Determine target date label
  const targetDateLabel = list?.rangeLabel || (date ? formatDisplayDate(date) : 'Today');

  // Fetch existing print status on mount or when target date changes
  useEffect(() => {
    let isMounted = true;
    setStatusLoading(true);
    api.getPrintStatus(targetDateLabel)
      .then((res) => {
        if (isMounted) {
          setPrintStatus(res);
        }
      })
      .catch((err) => {
        console.error('Failed to get print status:', err);
      })
      .finally(() => {
        if (isMounted) setStatusLoading(false);
      });
    return () => { isMounted = false; };
  }, [targetDateLabel]);

  const handlePrint = async () => {
    if (user) {
      const devoteeNames = (list?.items || []).map(it => it.name).filter(Boolean);
      const sampleNames = devoteeNames.slice(0, 4).join(', ');
      const extraCount = devoteeNames.length > 4 ? ` and ${devoteeNames.length - 4} more` : '';
      const formattedDevotees = sampleNames ? `${sampleNames}${extraCount}` : 'None';

      try {
        await api.logPrintRecord({
          user_id: user.id,
          user_name: user.name || (user.role === 'admin' ? 'marlin' : user.role),
          user_role: user.role,
          target_date: targetDateLabel,
          list_title: list?.title || 'Viboothi to be sent to',
          devotee_count: list?.items?.length || 0,
          devotee_names: formattedDevotees
        });
        
        // Refresh status in modal
        const refreshed = await api.getPrintStatus(targetDateLabel);
        setPrintStatus(refreshed);
      } catch (err) {
        console.error('Failed to record print log:', err);
      }
    }
    
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const getAddressLines = (b) => {
    // 1. Check separate communication address columns first
    const commLines = [b.comm_add_1, b.comm_add_2, b.comm_add_3, b.comm_add_4]
      .map(s => (s || '').trim())
      .filter(Boolean);

    // 2. Fallback to permanent address columns
    const perLines = [b.per_add_1, b.per_add_2, b.per_add_3]
      .map(s => (s || '').trim())
      .filter(Boolean);

    let rawLines = commLines.length > 0 ? commLines : perLines;

    // 3. Fallback to full address string if available
    if (rawLines.length === 0) {
      if (b.communication_address) {
        rawLines = [b.communication_address.trim()];
      } else if (b.permanent_address) {
        rawLines = [b.permanent_address.trim()];
      }
    }

    // 4. Split any lines that contain commas or newlines
    let lines = [];
    for (const line of rawLines) {
      if (line.includes(',') || line.includes('\n')) {
        const parts = line.split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean);
        lines.push(...parts);
      } else {
        lines.push(line);
      }
    }

    // 5. If only 1 combined line exists, split smartly into door/street, area, city
    if (lines.length === 1) {
      const smartParts = splitSingleLineAddress(lines[0], b.place);
      if (smartParts.length > 1) {
        lines = smartParts;
      }
    }

    // 6. Fallback to place if empty
    if (lines.length === 0 && b.place) {
      lines = [b.place.trim()];
    }

    return lines;
  };

  return createPortal(
    <div className="print-portal-root">
      <div className="print-modal-overlay fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-0 sm:p-4 md:p-6 print:bg-white print:p-0">
        <div className="print-modal-container bg-white w-full max-w-5xl h-full sm:h-auto sm:max-h-[92vh] sm:rounded-2xl shadow-2xl flex flex-col print:shadow-none print:w-full print:max-w-none print:h-auto print:rounded-none overflow-hidden">
          
          {/* Header - Non-printing */}
          <div className="px-3.5 py-3 sm:px-6 sm:py-4 border-b border-[#e2d8cb] bg-[#faf8f5] flex items-center justify-between gap-2 shrink-0 print:hidden">
            <div className="min-w-0 flex-1">
              <h2 className="text-[14px] sm:text-[17px] font-barlow font-bold text-[#5c292c] truncate flex items-center gap-2">
                <span>Print Post Covers:</span>
                <span className="font-semibold text-gray-700">{list.title}</span>
                {targetDateLabel && (
                  <span className="text-[11px] font-semibold text-[#5c292c] bg-[#5c292c]/10 border border-[#5c292c]/20 px-2.5 py-0.5 rounded-full inline-block">
                    {targetDateLabel}
                  </span>
                )}
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handlePrint}
                className={`whitespace-nowrap px-3.5 py-1.5 sm:px-5 sm:py-2 text-white rounded-full font-barlow text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  printStatus?.print_count > 0 ? 'bg-[#92400e] hover:bg-[#78350f]' : 'bg-[#5c292c] hover:bg-[#4a2123]'
                }`}
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>
                  {printStatus?.print_count > 0 
                    ? `Reprint (${printStatus.next_print_number}th Print)` 
                    : `Print All (${list.items.length})`}
                </span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Print Audit Tracking Status Banner - Non-printing */}
          {!statusLoading && printStatus && (
            <div className={`px-4 sm:px-6 py-2.5 border-b text-xs flex flex-wrap items-center justify-between gap-2 shrink-0 print:hidden ${
              printStatus.print_count > 0 
                ? 'bg-amber-50/95 text-amber-900 border-amber-200' 
                : 'bg-emerald-50/95 text-emerald-900 border-emerald-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  printStatus.print_count > 0 ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
                }`}>
                  {printStatus.print_count === 0 ? '1st Print' : `Reprint #${printStatus.next_print_number}`}
                </span>
                <span className="font-semibold">
                  {printStatus.print_count === 0 ? (
                    <>Target Date: <strong className="font-bold underline">{targetDateLabel}</strong> (Not yet printed)</>
                  ) : (
                    <>Target Date: <strong className="font-bold underline">{targetDateLabel}</strong> (Printed {printStatus.print_count} time{printStatus.print_count > 1 ? 's' : ''} previously)</>
                  )}
                </span>
              </div>
              {printStatus.print_count > 0 && printStatus.history?.length > 0 && (
                <div className="text-[11px] text-amber-800">
                  {printStatus.history.length === 1 ? (
                    <span>
                      1st time printed by: <strong>{printStatus.history[0].user_name}</strong> [{printStatus.history[0].user_role}]
                    </span>
                  ) : (
                    <span>
                      1st: <strong>{printStatus.history[0].user_name}</strong> [{printStatus.history[0].user_role}] • Last: <strong>{printStatus.history[printStatus.history.length - 1].user_name}</strong> [{printStatus.history[printStatus.history.length - 1].user_role}]
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Printable & Scrollable Content */}
          <div ref={printRef} className="print-area flex-1 overflow-y-auto p-2 sm:p-6 bg-[#f3ede3]/40 print:bg-white print:p-0 print:overflow-visible">
            {list.items.map((item, idx) => {
              const b = item.booking;
              const addressLines = getAddressLines(b);
              
              // Time logic based on kattalai name
              let poojaTime = '';
              if (b.kattalai_name && b.kattalai_name.toLowerCase().includes('uchi')) poojaTime = '11:30 AM';
              else if (b.kattalai_name && b.kattalai_name.toLowerCase().includes('artha')) poojaTime = '07:30 PM';
              
              const kattalaiTypeWithTime = `${b.kattalai_name_ta || b.kattalai_name || 'கட்டளை'} ${poojaTime}`;
              
              // Format date correctly: DD-MM-YYYY
              const formattedDate = b.kattalai_date ? 
                `${String(b.kattalai_date).padStart(2, '0')}-${String(b.kattalai_month).padStart(2, '0')}-${date ? date.split('-')[0] : new Date().getFullYear()}` : 
                '';

              // Clean title and recipient name
              const rawTitle = (b.title_ta || b.title || '').trim();
              const titleDisplay = rawTitle ? (rawTitle.endsWith('.') ? rawTitle + ' ' : rawTitle + '. ') : '';
              const nameDisplay = (b.name_ta || b.name || '').trim();

              return (
                <div 
                  key={idx} 
                  className="post-cover-card w-[210mm] max-w-full bg-white mx-auto my-3 sm:my-6 px-4 sm:px-[15mm] pt-5 sm:pt-[12mm] pb-5 sm:pb-[10mm] shadow-sm sm:shadow-lg border border-gray-200 print:border-none rounded-lg sm:rounded-none relative text-black print:overflow-hidden"
                  style={{
                    boxSizing: 'border-box',
                    fontFamily: "'Barlow', 'Noto Sans Tamil', 'Arial', sans-serif"
                  }}
                >
                  {/* SECTION 1: TOP (TO ADDRESS & STAMP) */}
                  <div className="w-full">
                    <div className="flex justify-between items-start mb-4 sm:mb-6">
                      <div className="font-bold text-[16px] sm:text-[17px] tracking-wider text-black pt-1">POST COVER</div>
                      <div className="w-[64px] h-[78px] sm:w-[80px] sm:h-[95px] print:w-[80px] print:h-[95px] border border-black shrink-0"></div>
                    </div>
                    
                    {/* Indented To section */}
                    <div className="mb-2 pl-2 sm:pl-[15mm] print:pl-[15mm]"> 
                      <div className="flex items-center gap-4 sm:gap-[15mm] print:gap-[15mm] mb-1.5 sm:mb-2 text-[15px] sm:text-[16px]">
                        <span className="font-bold text-black">To</span>
                        <span className="font-bold text-black">{b.code}</span>
                      </div>
                      <div className="pl-4 sm:pl-[25mm] print:pl-[25mm] uppercase text-[15px] sm:text-[16px] leading-relaxed">
                        <p className="font-bold text-black mb-1">
                          {titleDisplay}{nameDisplay}
                        </p>
                        {addressLines.map((line, i) => (
                          <p key={i} className="text-black font-medium leading-relaxed break-words">{line}</p>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: MIDDLE (FROM ADDRESS / TEMPLE - Indented matching To's structure) */}
                  <div className="w-full mt-6 sm:mt-[13mm] print:mt-[13mm]">
                    {/* Horizontal Line 1 */}
                    <div className="w-full border-b border-black"></div>
                    
                    {/* Sender header on left, details indented matching To */}
                    <div className="py-4 sm:py-[10mm] print:py-[10mm] pl-2 sm:pl-[15mm] print:pl-[15mm] text-[15px] sm:text-[16px] text-black">
                      <p className="font-bold text-black mb-1.5 sm:mb-2">அனுப்புனர் :</p>
                      <div className="pl-4 sm:pl-[25mm] print:pl-[25mm] leading-relaxed">
                        <p>வயிரவன் கோவில் நகரத்தார்</p>
                        <p>தர்ம பரிபாலன சபை</p>
                        <p>நகர வயிரவன்பட்டி</p>
                        <p className="flex flex-wrap gap-x-4">
                          <span>சிவகங்கை மாவட்டம்.</span>
                          <span>Pin : 630 212.</span>
                        </p>
                        <p>Ph : 04577 264237.</p>
                      </div>
                    </div>
                    
                    {/* Horizontal Line 2 */}
                    <div className="w-full border-b border-black"></div>
                  </div>

                  {/* SECTION 3: BOTTOM (LETTER - Symmetrically spaced below Line 2, aligned with To and அனுப்புனர்) */}
                  <div className="w-full mt-6 sm:mt-[13mm] print:mt-[13mm] text-[15px] sm:text-[16px] text-black">
                    <div className="pl-2 sm:pl-[15mm] print:pl-[15mm]">
                      <p className="mb-3.5 font-bold text-[16px]">அன்புடையீர்</p>
                      
                      <p className="indent-8 sm:indent-12 print:indent-12 text-justify leading-[2rem] sm:leading-[2.2rem] print:leading-[2.2rem] mb-7 sm:mb-9 font-normal pr-3 sm:pr-[15mm] print:pr-[15mm]">
                        வணக்கம். இப்பவும் நம்மள் கோவிலில் <span className="font-bold mx-1">{formattedDate}</span> அன்று ஸ்ரீ வடிவுடையம்பாள் சமேத ஸ்ரீ வளரொளிநாதர் ஸ்ரீ வயிரவசுவாமிக்கு தங்கள் நட்சத்திரம் நாமதேயத்துக்கு <span className="font-bold mx-1">{kattalaiTypeWithTime}</span> பூஜை அர்ச்சனை வகையறா செய்து விபூதி குங்குமப் பிரசாதங்கள் இத்துடன் அனுப்பி வைத்திருக்கிறோம்.
                      </p>
                      
                      <div className="flex flex-col items-end pr-3 sm:pr-[15mm] print:pr-[15mm] mb-7 sm:mb-9">
                        <p className="mr-12 sm:mr-16 print:mr-16 mb-2 text-[15px] sm:text-[16px]">வேணும்</p>
                        <p className="font-bold text-[15px] sm:text-[16px]">ஸ்ரீ வயிரவசுவாமி துணை.</p>
                      </div>
                    </div>
                    
                    <p className="mt-6 sm:mt-[12mm] print:mt-[12mm] text-[13px] sm:text-[14px] text-center text-gray-800">
                      குறிப்பு: சரியான முகவரி & SMS அனுப்ப செல்போன் நம்பரை தெரியப்படுத்தவும்
                    </p>
                  </div>
                </div>
              );
            })}
            
            {list.items.length === 0 && (
              <div className="text-center py-12 text-gray-500 font-barlow print:hidden bg-white rounded-lg">
                No absentees in this list to print.
              </div>
            )}
          </div>
        </div>

        {/* Global print styles: strictly 1 page per booking with guaranteed page-break */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            /* 1. Hide the main app entirely */
            #root {
              display: none !important;
            }

            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }

            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              overflow: visible !important;
              height: auto !important;
              min-height: auto !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* 2. Normal document flow for portal and modal containers */
            .print-portal-root,
            .print-modal-overlay,
            .print-modal-container,
            .print-area {
              position: static !important;
              display: block !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              overflow: visible !important;
              height: auto !important;
              min-height: auto !important;
              max-height: none !important;
              border: none !important;
              box-shadow: none !important;
            }

            /* 3. Strict 1-page per cover with forced page break */
            .post-cover-card {
              position: relative !important;
              display: block !important;
              width: 100% !important;
              max-width: 100% !important;
              min-height: 0 !important;
              height: auto !important;
              max-height: 275mm !important;
              box-sizing: border-box !important;
              overflow: hidden !important;
              margin: 0 !important;
              padding: 6mm 10mm !important;
              border: none !important;
              box-shadow: none !important;
              page-break-before: auto !important;
              break-before: auto !important;
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              clear: both !important;
            }

            .post-cover-card:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
          }
        `}} />
      </div>
    </div>,
    document.body
  );
}
