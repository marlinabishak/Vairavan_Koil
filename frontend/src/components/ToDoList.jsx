import React from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Figma "To do List" card - Exact visual reproduction from Figma.
 *
 * Card: white fill (#ffffff), border 2px #cdb9ab, rounded corners (8px)
 * "To do List" label: Barlow 400, 12px, black, top-left
 * Plus icon: top-right corner
 * Sub-headers: 14px tall pill, bg #cdb9ab, text Barlow 400 9px black
 * Items: Barlow 400, 14px, line-height 21px, center-aligned
 * Horizontal lines: 1px #5c292c between sections
 * Vertical line: 3px wide #cdb9ab on right side
 */
export default function ToDoList({ lists, onAddItem, onPrintList }) {
  const { user } = useAuth();
  const canPrint = user && (user.role === 'admin' || user.role === 'superadmin');
  return (
    <div
      className="flex flex-col"
      style={{
        backgroundColor: '#ffffff',
        border: '2px solid #cdb9ab',
        borderRadius: '8px',
        padding: '10px 12px',
        position: 'relative',
        maxHeight: 'min(555px, calc(100vh - 215px))',
      }}
    >
      {/* Header row: "To do List" + plus icon (fixed, non-scrolling) */}
      <div className="flex items-center justify-between shrink-0" style={{ marginBottom: '8px' }}>
        <span className="font-barlow font-normal text-fig-12 text-fig-text">To do List</span>
        <div
          className="flex items-center justify-center"
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '8px',
            border: '1px solid #000',
          }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M4 1v6M1 4h6" stroke="#000" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Todo sub-sections: scrollable area when items exceed 23 */}
      <div
        className="overflow-y-auto flex-1 custom-todo-scroll pr-1"
        style={{
          scrollBehavior: 'smooth',
          overscrollBehavior: 'contain',
        }}
      >
        {lists.map((list, listIndex) => (
          <div key={list.id} className="relative">
            {/* Sub-header pill: bg #cdb9ab, height 14px, text 9px */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between bg-white pt-1"
              style={{ paddingBottom: '4px' }}
            >
              <div
                className="flex items-center justify-between w-full"
                style={{
                  backgroundColor: '#cdb9ab',
                  borderRadius: '7px',
                  height: '14px',
                  paddingLeft: '6px',
                  paddingRight: '6px',
                }}
              >
                <span className="font-barlow font-normal text-fig-9 text-fig-text leading-none">
                  {list.title}
                </span>
                <div className="flex items-center gap-1">
                  {canPrint && list.title === 'Viboothi to be sent to' && list.items?.length > 0 && onPrintList && (
                    <button
                      type="button"
                      onClick={() => onPrintList(list)}
                      className="flex items-center justify-center text-[8px] bg-white text-[#5c292c] rounded-[4px] px-1 hover:bg-gray-100 border border-[#5c292c] cursor-pointer"
                      style={{ height: '10px', lineHeight: '8px' }}
                      title="Print Labels"
                    >
                      Print
                    </button>
                  )}
                  {canPrint && list.title === 'Reminder Letter to send' && list.items?.length > 0 && onPrintList && (
                    <button
                      type="button"
                      onClick={() => onPrintList(list)}
                      className="flex items-center justify-center text-[8px] bg-white text-[#5c292c] rounded-[4px] px-1 hover:bg-gray-100 border border-[#5c292c] cursor-pointer"
                      style={{ height: '10px', lineHeight: '8px' }}
                      title="Print Reminder Letters"
                    >
                      Print
                    </button>
                  )}
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '5px',
                      border: '1px solid #000',
                    }}
                  >
                    <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
                      <path d="M3 1v4M1 3h4" stroke="#000" strokeWidth="0.8" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Items: Barlow 400, 14px, line-height 21px */}
            <div style={{ paddingLeft: '4px', marginBottom: '4px' }}>
              {list.items && list.items.length > 0 ? (
                list.items.map((item, i) => (
                  <p
                    key={item.id}
                    className={`font-barlow font-normal text-fig-14-todo text-fig-text ${item.completed ? 'line-through opacity-50' : ''}`}
                  >
                    {i + 1}, {item.name}
                  </p>
                ))
              ) : (
                <p className="font-barlow font-normal text-fig-14-todo text-fig-text opacity-40 italic">
                  No entries yet
                </p>
              )}
            </div>

            {/* Horizontal divider line: 1px #5c292c */}
            {listIndex < lists.length - 1 && (
              <div style={{ height: '1px', backgroundColor: '#5c292c', marginTop: '4px', marginBottom: '4px' }} />
            )}
          </div>
        ))}
      </div>

      {/* Vertical accent line on right side: 3px wide #cdb9ab */}
      <div
        style={{
          position: 'absolute',
          right: '-2px',
          top: '20%',
          bottom: '20%',
          width: '3px',
          backgroundColor: '#cdb9ab',
          borderRadius: '2px',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
