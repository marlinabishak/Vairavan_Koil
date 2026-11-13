import KattalaiPill from './KattalaiPill.jsx';
import AddKattalaiButton from './AddKattalaiButton.jsx';
import { useAuth } from '../context/AuthContext';

/**
 * Figma layout:
 *   Label: Barlow 400, 12px, black, left-aligned
 *   Pills stacked vertically with ~10px gap
 *   No background on the column itself
 */
export default function KattalaiColumn({ kattalaiType, bookings = [], onTogglePresent, onEdit, onAddNew, highlightedBookingId }) {
  const { user } = useAuth();
  const isArchanai = kattalaiType.color_key === 'archanai';
  // Staff can add new slots; for Thuritha Kattalai, ulthurai can also add walk-ins
  const canAdd = user && user.role !== 'user' && (user.role !== 'ulthurai' || isArchanai);

  const maxSlots = Math.max(kattalaiType.max_slots || 4, bookings.length);
  const prefix = kattalaiType.color_key === 'morning' ? 'U' : (isArchanai ? 'TK' : 'A');

  // Map each slot 1..maxSlots to an existing booking or empty
  const slotMap = {};
  const unassigned = [];

  bookings.forEach((b) => {
    let assigned = false;
    if (isArchanai && b.slot) {
      const s = parseInt(b.slot, 10);
      if (s >= 1 && s <= maxSlots && !slotMap[s]) {
        slotMap[s] = b;
        assigned = true;
      }
    } else if (b.code) {
      const m = b.code.trim().match(/^([A-Za-z]+)\/(\d+)/);
      if (m) {
        const p = m[1].toUpperCase();
        const s = parseInt(m[2], 10);
        const isPrefixMatch = p === prefix || 
          (prefix === 'U' && (p === 'UK' || p === 'U')) || 
          (prefix === 'A' && (p === 'AJ' || p === 'A')) ||
          (prefix === 'TK' && (p === 'TK' || p === 'T'));
        if (isPrefixMatch && s >= 1 && s <= maxSlots && !slotMap[s]) {
          slotMap[s] = b;
          assigned = true;
        }
      }
    }
    if (!assigned) {
      unassigned.push(b);
    }
  });

  // Assign any remaining unassigned bookings into the first available slots
  for (let s = 1; s <= maxSlots; s++) {
    if (!slotMap[s] && unassigned.length > 0) {
      slotMap[s] = unassigned.shift();
    }
  }

  const slotItems = [];
  for (let s = 1; s <= maxSlots; s++) {
    const booking = slotMap[s];
    if (booking) {
      slotItems.push(
        <KattalaiPill 
          key={`booking-${booking.id}`} 
          booking={booking} 
          onTogglePresent={onTogglePresent} 
          onEdit={onEdit} 
          isHighlighted={booking.id === highlightedBookingId}
        />
      );
    } else if (canAdd) {
      slotItems.push(
        <AddKattalaiButton 
          key={`slot-${s}`} 
          colorKey={kattalaiType.color_key} 
          label={isArchanai ? 'New Thuritha Kattalai' : 'New Nithiya Kattalai'}
          onClick={() => onAddNew(kattalaiType, s)} 
        />
      );
    }
  }

  // Any remaining overflow bookings (if any)
  while (unassigned.length > 0) {
    const b = unassigned.shift();
    slotItems.push(
      <KattalaiPill 
        key={`overflow-${b.id}`} 
        booking={b} 
        onTogglePresent={onTogglePresent} 
        onEdit={onEdit} 
        isHighlighted={b.id === highlightedBookingId}
      />
    );
  }

  const columnTitle = isArchanai ? 'Thuritha Kattalai' : kattalaiType.name;

  return (
    <div>
      {/* Section label: Barlow 400, 12px/14.4px, black */}
      <p className="font-barlow font-normal text-fig-12 text-fig-text" style={{ marginBottom: '5px' }}>
        {columnTitle}
      </p>

      {/* Stacked pills — 10px vertical gap between each */}
      <div className="flex flex-col" style={{ gap: '10px' }}>
        {slotItems}
      </div>
    </div>
  );
}
