import { useState, useRef, useEffect } from 'react';

export default function Combobox({ value, onChange, options, placeholder, className, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setFilteredOptions(
      options.filter(o => o.toLowerCase().includes((value || '').toLowerCase()))
    );
  }, [value, options]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => { 
          onChange(e.target.value); 
          setIsOpen(true); 
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="h-full pl-4 pr-8 rounded-full border border-[#e2d8cb] bg-white font-barlow text-[14px] text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] transition-all w-full shadow-sm hover:border-[#cfc2b2] disabled:opacity-70 disabled:bg-[#f3ede3]"
      />
      <div 
        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#8c8075] hover:text-[#5c292c]"
        onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
      {isOpen && (
        <div className="absolute z-[9999] w-full mt-1 bg-white border border-[#ebdccb] rounded-[16px] shadow-xl max-h-[200px] overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => (
              <div 
                key={idx} 
                className="px-4 py-2 hover:bg-[#f8f3ea] cursor-pointer font-barlow text-[13.5px] text-gray-800 border-b border-[#f3ede3] last:border-0 transition-colors"
                onClick={() => { 
                  onChange(opt); 
                  setIsOpen(false); 
                }}
              >
                {opt}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-[#9c9186] font-barlow text-[13px] italic text-center">
              Type to add custom
            </div>
          )}
        </div>
      )}
    </div>
  );
}
