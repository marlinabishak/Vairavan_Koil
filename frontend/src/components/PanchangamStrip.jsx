import React from 'react';

/**
 * Panchangam strip at the bottom of the dashboard.
 * Preserves the exact black font, bold styling, and layout from laptop,
 * with clean, razor-sharp alignment and divider lines on mobile.
 */
export default function PanchangamStrip({ panchangam }) {
  if (!panchangam) return null;

  const formatRange = (ranges) => {
    let arr = ranges;
    if (typeof ranges === 'string') {
      try { arr = JSON.parse(ranges); } catch(e) { return '-'; }
    }
    if (!arr || !Array.isArray(arr)) return '-';
    return arr.map(r => `${r.start} - ${r.end}`).join(', ');
  };

  return (
    <div id="mobile-panchangam-section" className="w-full mt-7 sm:mt-9 md:mt-auto pb-1 md:pb-6 relative z-10 font-barlow text-black">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 md:px-[60px] lg:px-[100px]">
        
        {/* ======================================================== */}
        {/* Mobile View: Centered Black Text with Crisp Alignment   */}
        {/* ======================================================== */}
        <div className="md:hidden flex flex-col w-full max-w-[340px] sm:max-w-[370px] mx-auto text-[12px] font-bold text-black leading-[1.75]">
          
          {/* Section 1: Timings */}
          <div className="grid grid-cols-[105px_1fr] gap-x-3 gap-y-[2px]">
            <span className="whitespace-nowrap">நல்ல நேரம் :</span>
            <span className="whitespace-nowrap">{formatRange(panchangam.nalla_neram)}</span>
            
            <span className="whitespace-nowrap">எமகண்டம் :</span>
            <span className="whitespace-nowrap">{formatRange(panchangam.yamagandam)}</span>
            
            <span className="whitespace-nowrap">குளிகை :</span>
            <span className="whitespace-nowrap">{formatRange(panchangam.kuligai)}</span>
            
            <span className="whitespace-nowrap">ராகு :</span>
            <span className="whitespace-nowrap">{formatRange(panchangam.rahu_kalam)}</span>
          </div>

          <div className="w-full h-[1px] bg-[#666666]/35 my-3" />

          {/* Section 2: Thithi & Stars */}
          <div className="grid grid-cols-[105px_1fr] gap-x-3 gap-y-[2px]">
            <span className="whitespace-nowrap">திதி :</span>
            <span className="whitespace-nowrap">{panchangam.thithi || '-'}</span>
            
            <span className="whitespace-nowrap">திதி நேரம் :</span>
            <span className="whitespace-nowrap">{panchangam.thithi_time || '-'}</span>
            
            <span className="whitespace-nowrap">நட்சத்திரம் :</span>
            <span className="whitespace-nowrap">{panchangam.natchathiram || '-'}</span>
            
            <span className="whitespace-nowrap">யோகம் :</span>
            <span className="whitespace-nowrap">{panchangam.yogam || '-'}</span>
          </div>

          <div className="w-full h-[1px] bg-[#666666]/35 my-3" />

          {/* Section 3: Chandrashtamam & Kulam */}
          <div className="grid grid-cols-[105px_1fr] gap-x-3 gap-y-[2px]">
            <span className="whitespace-nowrap">சந்திராஷ்டமம் :</span>
            <span className="whitespace-nowrap">{panchangam.chandrashtamam || '-'}</span>
            
            <span className="whitespace-nowrap">குளம் :</span>
            <span className="whitespace-nowrap">{panchangam.kulam || '-'}</span>
            
            <span className="whitespace-nowrap">பரிகாரம் :</span>
            <span className="whitespace-nowrap">{panchangam.parigaram || '-'}</span>
          </div>

          {(panchangam.special_note || panchangam.worship_note) && (
            <>
              <div className="w-full h-[1px] bg-[#666666]/35 my-3" />

              {/* Section 4: Notes */}
              <div className="grid grid-cols-[105px_1fr] gap-x-3 gap-y-[4px]">
                <span className="whitespace-nowrap">சிறப்பு :</span>
                <span className="text-left whitespace-pre-wrap">{panchangam.special_note || '-'}</span>
                
                <span className="whitespace-nowrap">வழிபாடு :</span>
                <span className="text-left whitespace-pre-wrap">{panchangam.worship_note || '-'}</span>
              </div>
            </>
          )}

        </div>

        {/* ======================================================== */}
        {/* Desktop View: Preserved 4-Column Figma Strip            */}
        {/* ======================================================== */}
        <div className="hidden md:flex flex-row items-stretch justify-between w-full">
          
          {/* Column 1: Timings (approx 27%) */}
          <div className="md:w-[27%] md:pr-6 md:border-r border-[#666666] text-[11px] md:text-[12px] font-bold leading-[1.7]">
            <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-[2px]">
              <span className="whitespace-nowrap">நல்ல நேரம் :</span>
              <span className="whitespace-nowrap">{formatRange(panchangam.nalla_neram)}</span>
              
              <span className="whitespace-nowrap">எமகண்டம் :</span>
              <span className="whitespace-nowrap">{formatRange(panchangam.yamagandam)}</span>
              
              <span className="whitespace-nowrap">குளிகை :</span>
              <span className="whitespace-nowrap">{formatRange(panchangam.kuligai)}</span>
              
              <span className="whitespace-nowrap">ராகு :</span>
              <span className="whitespace-nowrap">{formatRange(panchangam.rahu_kalam)}</span>
            </div>
          </div>

          {/* Column 2: Thithi & Stars (approx 21%) */}
          <div className="md:w-[21%] md:px-6 md:border-r border-[#666666] text-[11px] md:text-[12px] font-bold leading-[1.7]">
            <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-[2px]">
              <span className="whitespace-nowrap">திதி:</span>
              <span className="whitespace-nowrap">{panchangam.thithi || '-'}</span>
              
              <span className="whitespace-nowrap">திதி நேரம்:</span>
              <span className="whitespace-nowrap">{panchangam.thithi_time || '-'}</span>
              
              <span className="whitespace-nowrap">நட்சத்திரம்:</span>
              <span className="whitespace-nowrap">{panchangam.natchathiram || '-'}</span>
              
              <span className="whitespace-nowrap">யோகம்:</span>
              <span className="whitespace-nowrap">{panchangam.yogam || '-'}</span>
            </div>
          </div>

          {/* Column 3: Chandrashtamam & Kulam (approx 21%) */}
          <div className="md:w-[21%] md:px-6 md:border-r border-[#666666] text-[11px] md:text-[12px] font-bold leading-[1.7]">
            <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-[2px]">
              <span className="whitespace-nowrap">சந்திராஷ்டமம்:</span>
              <span className="whitespace-nowrap">{panchangam.chandrashtamam || '-'}</span>
              
              <span className="whitespace-nowrap">குளம்:</span>
              <span className="whitespace-nowrap">{panchangam.kulam || '-'}</span>
              
              <span className="whitespace-nowrap">பரிகாரம்:</span>
              <span className="whitespace-nowrap">{panchangam.parigaram || '-'}</span>
            </div>
          </div>

          {/* Column 4: Notes (approx 31%) */}
          <div className="md:w-[31%] md:pl-6 text-[11px] md:text-[12px] font-bold leading-[1.7]">
            <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-[4px]">
              <span className="whitespace-nowrap">சிறப்பு :</span>
              <span className="text-left whitespace-pre-wrap">{panchangam.special_note || '-'}</span>
              
              <span className="whitespace-nowrap">வழிபாடு :</span>
              <span className="text-left whitespace-pre-wrap">{panchangam.worship_note || '-'}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
