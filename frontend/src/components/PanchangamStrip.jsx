import React from 'react';

/**
 * Panchangam strip at the bottom of the dashboard.
 * Preserves the exact black font, bold styling, and layout from laptop,
 * with clean, razor-sharp alignment and divider lines on mobile.
 */
export default function PanchangamStrip({ panchangam, loading = false }) {
  // Graceful fallback for unseeded future dates or offline state so layout never collapses
  const data = panchangam || {
    nalla_neram: '-',
    yamagandam: '-',
    kuligai: '-',
    rahu_kalam: '-',
    thithi: '-',
    thithi_time: '-',
    natchathiram: '-',
    yogam: '-',
    chandrashtamam: '-',
    kulam: '-',
    parigaram: '-',
    special_note: loading ? 'பஞ்சாங்கம் ஏற்றப்படுகிறது...' : 'இந்த நாளுக்கான பஞ்சாங்கம் இன்னும் பதிவேற்றப்படவில்லை.',
    worship_note: loading ? 'Loading panchangam...' : 'Panchangam data for this date has not been uploaded yet.'
  };

  const formatRange = (ranges) => {
    if (!ranges) return '-';
    if (typeof ranges === 'string') {
      const trimmed = ranges.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            return parsed.map(r => (r.start && r.end ? `${r.start} - ${r.end}` : (r.text || JSON.stringify(r)))).join(', ');
          }
        } catch (e) {
          // not JSON, fallback to raw string
        }
      }
      return trimmed || '-';
    }
    if (Array.isArray(ranges)) {
      return ranges.map(r => (r.start && r.end ? `${r.start} - ${r.end}` : (r.text || String(r)))).join(', ');
    }
    return String(ranges);
  };

  return (
    <div id="mobile-panchangam-section" className={`w-full mt-7 sm:mt-9 md:mt-auto pb-1 md:pb-3 relative z-10 font-barlow text-[#5c292c] ${loading ? 'opacity-70 animate-pulse' : ''}`}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        
        {/* ======================================================== */}
        {/* Mobile View: Centered Brown Text with Crisp Alignment   */}
        {/* ======================================================== */}
        <div className="md:hidden flex flex-col w-full max-w-[340px] sm:max-w-[370px] mx-auto text-[12px] font-bold text-[#5c292c] leading-[1.75]">
          
          {/* Section 1: Timings */}
          <div className="grid grid-cols-[105px_1fr] gap-x-3 gap-y-[2px]">
            <span className="whitespace-nowrap">நல்ல நேரம் :</span>
            <span className="whitespace-nowrap">{formatRange(data.nalla_neram)}</span>
            
            <span className="whitespace-nowrap">எமகண்டம் :</span>
            <span className="whitespace-nowrap">{formatRange(data.yamagandam)}</span>
            
            <span className="whitespace-nowrap">குளிகை :</span>
            <span className="whitespace-nowrap">{formatRange(data.kuligai)}</span>
            
            <span className="whitespace-nowrap">ராகு :</span>
            <span className="whitespace-nowrap">{formatRange(data.rahu_kalam)}</span>
          </div>

          <div className="w-full h-[1px] bg-[#5c292c]/20 my-3" />

          {/* Section 2: Thithi & Stars */}
          <div className="grid grid-cols-[105px_1fr] gap-x-3 gap-y-[2px]">
            <span className="whitespace-nowrap">திதி :</span>
            <span className="break-words">{data.thithi || '-'}</span>
            
            <span className="whitespace-nowrap">திதி நேரம் :</span>
            <span className="break-words">{data.thithi_time || '-'}</span>
            
            <span className="whitespace-nowrap">நட்சத்திரம் :</span>
            <span className="break-words">{data.natchathiram || '-'}</span>
            
            <span className="whitespace-nowrap">யோகம் :</span>
            <span className="break-words">{data.yogam || '-'}</span>
          </div>

          <div className="w-full h-[1px] bg-[#5c292c]/20 my-3" />

          {/* Section 3: Chandrashtamam & Kulam */}
          <div className="grid grid-cols-[105px_1fr] gap-x-3 gap-y-[2px]">
            <span className="whitespace-nowrap">சந்திராஷ்டமம் :</span>
            <span className="break-words">{data.chandrashtamam || '-'}</span>
            
            <span className="whitespace-nowrap">குளம் :</span>
            <span className="break-words">{data.kulam || '-'}</span>
            
            <span className="whitespace-nowrap">பரிகாரம் :</span>
            <span className="break-words">{data.parigaram || '-'}</span>
          </div>

          {(data.special_note || data.worship_note) && (
            <>
              <div className="w-full h-[1px] bg-[#5c292c]/20 my-3" />

              {/* Section 4: Notes */}
              <div className="grid grid-cols-[105px_1fr] gap-x-3 gap-y-[4px]">
                <span className="whitespace-nowrap">சிறப்பு :</span>
                <span className="text-left whitespace-pre-wrap">{data.special_note || '-'}</span>
                
                <span className="whitespace-nowrap">வழிபாடு :</span>
                <span className="text-left whitespace-pre-wrap">{data.worship_note || '-'}</span>
              </div>
            </>
          )}

        </div>

        {/* ======================================================== */}
        {/* Desktop View: Preserved 4-Column Figma Strip            */}
        {/* ======================================================== */}
        <div className="hidden md:flex flex-row items-stretch justify-between w-full">
          
          {/* Column 1: Timings (approx 23%) */}
          <div className="md:w-[23%] md:pr-4 lg:pr-5 md:border-r border-[#5c292c]/35 text-[11px] md:text-[12px] font-bold leading-[1.7] min-w-0">
            <div className="grid grid-cols-[auto_1fr] gap-x-3 lg:gap-x-4 gap-y-[2px]">
              <span className="whitespace-nowrap">நல்ல நேரம் :</span>
              <span className="whitespace-nowrap">{formatRange(data.nalla_neram)}</span>
              
              <span className="whitespace-nowrap">எமகண்டம் :</span>
              <span className="whitespace-nowrap">{formatRange(data.yamagandam)}</span>
              
              <span className="whitespace-nowrap">குளிகை :</span>
              <span className="whitespace-nowrap">{formatRange(data.kuligai)}</span>
              
              <span className="whitespace-nowrap">ராகு :</span>
              <span className="whitespace-nowrap">{formatRange(data.rahu_kalam)}</span>
            </div>
          </div>

          {/* Column 2: Thithi & Stars (balanced to 26% to eliminate excess blank space) */}
          <div className="md:w-[26%] md:px-4 lg:px-5 md:border-r border-[#5c292c]/35 text-[11px] md:text-[12px] font-bold leading-[1.7] min-w-0">
            <div className="grid grid-cols-[auto_1fr] gap-x-3 lg:gap-x-4 gap-y-[2px]">
              <span className="whitespace-nowrap">திதி:</span>
              <span className="whitespace-nowrap">{data.thithi || '-'}</span>
              
              <span className="whitespace-nowrap">திதி நேரம்:</span>
              <span className="whitespace-nowrap">{data.thithi_time || '-'}</span>
              
              <span className="whitespace-nowrap">நட்சத்திரம்:</span>
              <span className="whitespace-nowrap">{data.natchathiram || '-'}</span>
              
              <span className="whitespace-nowrap">யோகம்:</span>
              <span className="whitespace-nowrap">{data.yogam || '-'}</span>
            </div>
          </div>

          {/* Column 3: Chandrashtamam & Kulam (balanced to 23% so values never truncate to ellipsis) */}
          <div className="md:w-[23%] md:px-4 lg:px-5 md:border-r border-[#5c292c]/35 text-[11px] md:text-[12px] font-bold leading-[1.7] min-w-0">
            <div className="grid grid-cols-[auto_1fr] gap-x-3 lg:gap-x-4 gap-y-[2px]">
              <span className="whitespace-nowrap">சந்திராஷ்டமம்:</span>
              <span className="whitespace-nowrap">{data.chandrashtamam || '-'}</span>
              
              <span className="whitespace-nowrap">குளம்:</span>
              <span className="whitespace-nowrap">{data.kulam || '-'}</span>
              
              <span className="whitespace-nowrap">பரிகாரம்:</span>
              <span className="whitespace-nowrap">{data.parigaram || '-'}</span>
            </div>
          </div>

          {/* Column 4: Notes (approx 28%) */}
          <div className="md:w-[28%] md:pl-4 lg:pl-5 text-[11px] md:text-[12px] font-bold leading-[1.7] min-w-0">
            <div className="grid grid-cols-[auto_1fr] gap-x-3 lg:gap-x-4 gap-y-[4px]">
              <span className="whitespace-nowrap">சிறப்பு :</span>
              <span className="text-left whitespace-pre-wrap">{data.special_note || '-'}</span>
              
              <span className="whitespace-nowrap">வழிபாடு :</span>
              <span className="text-left whitespace-pre-wrap">{data.worship_note || '-'}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
