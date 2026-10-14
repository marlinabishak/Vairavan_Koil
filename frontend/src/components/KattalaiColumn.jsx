import KattalaiPill from './KattalaiPill.jsx';
import AddKattalaiButton from './AddKattalaiButton.jsx';
import { useAuth } from '../context/AuthContext';

/**
 * Figma layout:
 *   Label: Barlow 400, 12px, black, left-aligned
 *   Pills stacked vertically with ~10px gap
 *   No background on the column itself
 */
export default function KattalaiColumn({ kattalaiType, bookings, onTogglePresent, onEdit, onAddNew }) {
  const { user } = useAuth();
  const canAdd = user && user.role !== 'user' && user.role !== 'ulthurai';

  return (
    <div>
      {/* Section label: Barlow 400, 12px/14.4px, black */}
      <p className="font-barlow font-normal text-fig-12 text-fig-text" style={{ marginBottom: '5px' }}>
        {kattalaiType.name}
      </p>

      {/* Stacked pills — 10px vertical gap between each */}
      <div className="flex flex-col" style={{ gap: '10px' }}>
        {bookings.map((b) => (
          <KattalaiPill key={b.id} booking={b} onTogglePresent={onTogglePresent} onEdit={onEdit} />
        ))}
        {canAdd && Array.from({ length: Math.max(0, (kattalaiType.max_slots || 0) - bookings.length) }).map((_, i) => (
          <AddKattalaiButton key={`empty-${i}`} colorKey={kattalaiType.color_key} onClick={() => onAddNew(kattalaiType)} />
        ))}
        {/* If the admin wants to add beyond max_slots, they can do so in the settings by increasing max_slots */}
      </div>
    </div>
  );
}
