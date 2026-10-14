const COLOR_MAP = {
  morning: '#f37435',
  evening: '#6f8ea8',
  'evening-blue': '#6f8ea8',
  archanai: '#fbb12f',
};

export default function AddKattalaiButton({ onClick, colorKey }) {
  const themeColor = COLOR_MAP[colorKey] || '#f37435';

  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 group transition-all duration-300 hover:bg-[#e4dad0]/50 hover:shadow-sm w-full md:w-[300px]"
      style={{
        height: '30px',
        borderRadius: '15px',
        border: `1px solid ${themeColor}`, // Match Figma stroke based on column
        backgroundColor: 'white', // Ensure it is explicitly white for mobile
      }}
    >
      <div
        className="flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '9px',
          backgroundColor: themeColor,
        }}
      >
        {/* Plus Icon: 10x10, stroke 1.5, white */}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M5 1V9M1 5H9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <span 
        className="hidden md:inline font-barlow font-normal text-fig-14 transition-colors duration-300 group-hover:brightness-90"
        style={{ color: themeColor }}
      >
        Add a Kattalai
      </span>
    </button>
  );
}
