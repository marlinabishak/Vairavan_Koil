import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const COLOR_MAP = {
  morning: '#f37435',
  evening: '#6f8ea8',
  'evening-blue': '#6f8ea8',
  archanai: '#fbb12f',
};

function truncateName(name) {
  if (name.length > 8) return name.substring(0, 6) + '...';
  return name;
}

export default function KattalaiPill({ booking, onTogglePresent, onEdit, compact = false }) {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const bgColor = COLOR_MAP[booking.color_key] || '#f37435';
  const pillWidth = compact ? 'w-[70px]' : 'w-full md:w-[300px]';

  const canEdit = user && (user.role === 'admin' || user.role === 'superadmin' || (user.role === 'user' && booking.id === user.id));

  // Format date correctly
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formattedDate = booking.kattalai_date ? `${String(booking.kattalai_date).padStart(2, '0')} ${monthNames[booking.kattalai_month - 1]} ${new Date().getFullYear()}` : '-';

  return (
    <div
      className={`relative flex items-center transition-all duration-300 hover:brightness-105 hover:shadow-md cursor-default ${pillWidth} ${isHovered ? 'z-50' : 'z-0'}`}
      style={{
        height: '30px',
        borderRadius: '15px',
        backgroundColor: bgColor,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Present toggle circle: 20x20, 2px stroke white, positioned 5px from left */}
      <button
        onClick={() => onTogglePresent(booking.id, !booking.present)}
        className="absolute flex items-center justify-center transition-transform duration-200 hover:scale-110"
        style={{
          left: '5px',
          top: '5px',
          width: '20px',
          height: '20px',
          borderRadius: '10px',
          border: '2px solid white',
          backgroundColor: booking.present ? '#45b653' : 'transparent',
          zIndex: 10,
        }}
        aria-label="Toggle present"
        title={booking.present ? 'Present' : 'Not marked present'}
      />

      {/* Sponsor name: Barlow 400, 14px, black, center-aligned */}
      <p
        className="font-barlow font-normal text-fig-14 text-fig-text text-center w-full truncate relative z-0 transition-colors"
        style={{ paddingLeft: '30px', paddingRight: compact ? '5px' : '25px', color: isHovered ? 'rgba(0,0,0,0.8)' : 'black' }}
      >
        {compact ? truncateName(booking.name) : booking.name}
      </p>

      {/* Edit pencil icon (only shows on hover for non-compact pills if admin) */}
      {!compact && canEdit && isHovered && (
        <button
          onClick={() => onEdit && onEdit(booking)}
          className="absolute right-[8px] transition-all duration-300 hover:scale-125"
          style={{ zIndex: 20 }}
          title="Edit Details"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="2">
            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Tooltip Popover */}
      {isHovered && !compact && (
        <div 
          className="absolute left-[30px] top-[100%] mt-1 bg-white border border-[#cdb9ab] rounded-[10px] shadow-lg z-50 overflow-hidden"
          style={{ width: '260px' }}
        >
          <div className="flex flex-col text-[12px] font-barlow text-fig-text">
            {/* Popover Rows */}
            <div className="flex items-start px-3 py-1.5 border-b border-[#cdb9ab]/30">
              <span className="w-[60px] flex-shrink-0">Name:</span>
              <span className="flex-1 truncate font-medium">{booking.name}</span>
            </div>
            <div className="flex items-start px-3 py-1.5 border-b border-[#cdb9ab]/30 bg-[#faf8f7]">
              <span className="w-[60px] flex-shrink-0">Star:</span>
              <span className="flex-1 truncate">{booking.star || '-'}</span>
            </div>
            <div className="flex items-start px-3 py-1.5 border-b border-[#cdb9ab]/30">
              <span className="w-[60px] flex-shrink-0">Place:</span>
              <span className="flex-1 truncate">{booking.place || '-'}</span>
            </div>
            <div className="flex items-start px-3 py-1.5 border-b border-[#cdb9ab]/30 bg-[#faf8f7]">
              <span className="w-[60px] flex-shrink-0">Date:</span>
              <span className="flex-1 truncate">{formattedDate} | {booking.kattalai_name}</span>
            </div>
            <div className="flex items-start px-3 py-1.5 border-b border-[#cdb9ab]/30">
              <span className="w-[60px] flex-shrink-0">Code:</span>
              <span className="flex-1 truncate">{booking.code || '-'}</span>
            </div>
            <div className="flex items-start px-3 py-1.5 border-b border-[#cdb9ab]/30 bg-[#faf8f7]">
              <span className="w-[60px] flex-shrink-0">Amt Paid:</span>
              <span className="flex-1 truncate">{booking.amount}</span>
            </div>
            <div className="flex items-start px-3 py-1.5">
              <span className="w-[60px] flex-shrink-0">Mobile:</span>
              <span className="flex-1 truncate">{booking.mobile || '-'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
