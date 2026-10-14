import { useRef } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

/**
 * PrintModal renders a clean, A4-sized post cover and letter 
 * for the absentee list. It triggers the browser's print dialog.
 */
export default function PrintModal({ list, onClose, date }) {
  const printRef = useRef(null);
  const { user } = useAuth();

  const handlePrint = () => {
    if (user) {
      api.createHistoryLog({
        user_id: user.id,
        action: 'Printed Labels',
        details: `${user.name || user.role} printed ${list.items.length} Prasatham letters.`,
      }).catch(err => console.error('Failed to log print action', err));
    }
    
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const getAddressLines = (b) => {
    const commLines = [b.comm_add_1, b.comm_add_2, b.comm_add_3, b.comm_add_4].filter(Boolean);
    if (commLines.length > 0) return commLines;
    const perLines = [b.per_add_1, b.per_add_2, b.per_add_3].filter(Boolean);
    if (perLines.length > 0) return perLines;
    return [b.place || ''];
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto print:bg-white print:p-0">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl flex flex-col print:shadow-none print:w-full print:max-w-none print:block">
        
        {/* Header - Hidden when printing */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between print:hidden">
          <h2 className="text-xl font-barlow font-semibold text-gray-800">
            Print Post Covers: {list.title}
          </h2>
          <div className="flex gap-4">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#5c292c] text-white rounded-[20px] font-barlow text-sm hover:bg-[#4a2123] transition-colors shadow-sm"
            >
              Print All ({list.items.length})
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div ref={printRef} className="print:p-0 bg-gray-100 print:bg-white max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible">
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

            return (
              <div 
                key={idx} 
                className="w-[210mm] min-h-[297mm] print:w-full print:h-auto bg-white mx-auto my-8 print:my-0 px-[15mm] pb-[15mm] pt-[50px] shadow-md print:shadow-none relative text-black print:overflow-hidden"
                style={{ pageBreakAfter: 'always', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif' }}
              >
                {/* SECTION 1: TOP (TO ADDRESS) */}
                <div className="w-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="font-bold text-[17px] tracking-wide">POST COVER</div>
                    <div className="w-[80px] h-[95px] border border-black"></div>
                  </div>
                  
                  {/* Indented 1 tab */}
                  <div className="mb-4 pl-[15mm]"> 
                    <div className="flex gap-[15mm] mb-2 text-[16px]">
                      <span>To</span>
                      <span>{b.code}</span>
                    </div>
                    <div className="pl-[25mm] leading-relaxed uppercase text-[16px]">
                      <p>{b.title_ta || b.title ? (b.title_ta || b.title) + '. ' : ''}{b.name_ta || b.name}</p>
                      {addressLines.map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SECTION 2: MIDDLE (FROM ADDRESS) */}
                <div className="w-full mt-[15mm]">
                  <div className="w-full border-b border-black mb-[12mm]"></div>
                  
                  {/* Indented 1 tab */}
                  <div className="pl-[15mm] leading-relaxed text-[16px] mb-[12mm]">
                    <p>அனுப்புனர் :</p>
                    <p>வயிரவன் கோவில் நகரத்தார்</p>
                    <p>தர்ம பரிபாலன சபை</p>
                    <p>நகர வயிரவன்பட்டி</p>
                    <p className="flex gap-4"><span>சிவகங்கை மாவட்டம்.</span> <span>Pin : 630 212.</span></p>
                    <p>Ph : 04577 264237.</p>
                  </div>
                  
                  <div className="w-full border-b border-black"></div>
                </div>

                {/* SECTION 3: BOTTOM (LETTER) */}
                <div className="w-full mt-[12mm]">
                  <div className="text-[16px] leading-[2.4rem]">
                    
                    {/* No indent (flush left) */}
                    <p className="mb-6 font-medium">அன்புடையீர்</p>
                    
                    {/* Paragraph indented */}
                    <p className="indent-12 text-justify mb-8 pr-4">
                      வணக்கம். இப்பவும் நம்மள் கோவிலில் <span className="font-semibold mx-1">{formattedDate}</span> அன்று ஸ்ரீ வடிவுடையம்பாள் சமேத ஸ்ரீ வளரொளிநாதர் ஸ்ரீ வயிரவசுவாமிக்கு தங்கள் நட்சத்திரம் நாமதேயத்துக்கு <span className="font-semibold mx-1">{kattalaiTypeWithTime}</span> பூஜை அர்ச்சனை வகையறா செய்து விபூதி குங்குமப் பிரசாதங்கள் இத்துடன் அனுப்பி வைத்திருக்கிறோம்.
                    </p>
                    
                    <div className="flex flex-col items-end pr-8 mb-8 mt-12">
                      <p className="mr-16 mb-2">வேணும்</p>
                      <p className="font-bold">ஸ்ரீ வயிரவசுவாமி துணை.</p>
                    </div>
                    
                    <p className="mt-[15mm] text-[14px] text-center text-gray-800">
                      குறிப்பு: சரியான முகவரி & SMS அனுப்ப செல்போன் நம்பரை தெரியபடுத்தவும்
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          
          {list.items.length === 0 && (
            <div className="text-center py-12 text-gray-500 font-barlow print:hidden bg-white">
              No absentees in this list to print.
            </div>
          )}
        </div>
      </div>

      {/* Global print styles to hide everything except the modal content */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* FORCE all containers to allow page breaks by removing hidden overflows */
          html, body, #root, .overflow-hidden, .min-h-screen {
            overflow: visible !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
          }
          body * {
            visibility: hidden;
          }
          .fixed.inset-0, .fixed.inset-0 * {
            visibility: visible;
          }
          .fixed.inset-0 {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            background: white !important;
            overflow: visible !important;
            height: auto !important;
            min-height: 100vh !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .bg-white.rounded-lg {
            box-shadow: none !important;
            max-width: none !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}} />
    </div>
  );
}
