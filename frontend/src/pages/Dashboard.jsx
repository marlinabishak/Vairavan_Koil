import React, { useEffect, useState, useCallback, useRef, useMemo, Fragment } from 'react';
import { api } from '../api/client.js';
import DashboardHeader from '../components/DashboardHeader.jsx';
import KattalaiColumn from '../components/KattalaiColumn.jsx';
import ToDoList from '../components/ToDoList.jsx';
import BookingModal from '../components/BookingModal.jsx';
import PrintModal from '../components/PrintModal.jsx';
import PanchangamStrip from '../components/PanchangamStrip.jsx';
import { useAuth } from '../context/AuthContext';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function getWeekRange(dateStr) {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const curr = new Date(y, m - 1, d, 12, 0, 0);
    const dayOfWeek = curr.getDay(); // 0 is Sunday, ..., 6 is Saturday
    const sunday = new Date(y, m - 1, d - dayOfWeek, 12, 0, 0);
    const saturday = new Date(y, m - 1, d - dayOfWeek + 6, 12, 0, 0);
    const fmt = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    return { fromDate: fmt(sunday), toDate: fmt(saturday) };
  } catch (e) {
    return { fromDate: dateStr, toDate: dateStr };
  }
}

function getMonthRange(dateStr) {
  try {
    const parts = dateStr.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const lastDay = new Date(y, m, 0).getDate();
    const mStr = String(m).padStart(2, '0');
    return { fromDate: `${y}-${mStr}-01`, toDate: `${y}-${mStr}-${String(lastDay).padStart(2, '0')}` };
  } catch (e) {
    return { fromDate: dateStr, toDate: dateStr };
  }
}

export default function Dashboard() {
  const { user } = useAuth();
  
  const isDevotee = user?.role === 'user';

  const [date, setDate] = useState(() => {
    if (user?.role === 'user' && user?.booking_date) {
      return user.booking_date; // strictly lock devotee to their own registered kattalai date
    }
    const params = new URLSearchParams(window.location.search);
    const qDate = params.get('date');
    if (qDate && /^\d{4}-\d{2}-\d{2}$/.test(qDate)) {
      return qDate;
    }
    if (user?.booking_date) {
      return user.booking_date;
    }
    return todayISO();
  });

  const handleDateChange = (newDate) => {
    if (user?.role === 'user') return; // Devotees cannot change dates
    setDate(newDate);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedBookingId, setHighlightedBookingId] = useState(null);
  const [view, setView] = useState('daily');
  const [lang, setLang] = useState('en');

  // Custom date range for Viboothi absentee printing
  const [customRange, setCustomRange] = useState({ fromDate: '', toDate: '' });
  const [rangeAbsentees, setRangeAbsentees] = useState([]);
  const [todoLoading, setTodoLoading] = useState(false);

  const [kattalaiTypes, setKattalaiTypes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [todos, setTodos] = useState([]);
  const [panchangam, setPanchangam] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [editBooking, setEditBooking] = useState(null);
  const [printList, setPrintList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const activeRange = useMemo(() => {
    if (view === 'weekly') {
      return getWeekRange(date);
    }
    if (view === 'monthly') {
      if (customRange.fromDate && customRange.toDate) {
        return customRange;
      }
      return getMonthRange(date);
    }
    return { fromDate: date, toDate: date };
  }, [view, date, customRange]);

  const activeRangeLabel = useMemo(() => {
    try {
      if (view === 'daily') {
        const d = new Date(date + 'T00:00:00');
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      if (view === 'weekly') {
        const { fromDate, toDate } = getWeekRange(date);
        const d1 = new Date(fromDate + 'T00:00:00');
        const d2 = new Date(toDate + 'T00:00:00');
        return `${d1.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – ${d2.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
      }
      if (view === 'monthly') {
        if (customRange.fromDate && customRange.toDate) {
          const d1 = new Date(customRange.fromDate + 'T00:00:00');
          const d2 = new Date(customRange.toDate + 'T00:00:00');
          return `${d1.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} – ${d2.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
        }
        const d = new Date(date + 'T00:00:00');
        return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      }
    } catch (e) {
      return `${activeRange.fromDate} to ${activeRange.toDate}`;
    }
    return `${activeRange.fromDate} to ${activeRange.toDate}`;
  }, [view, date, customRange, activeRange]);

  const handleCustomRangeChange = useCallback((from, to) => {
    setCustomRange({ fromDate: from, toDate: to });
    setView('monthly');
  }, []);

  const handleSelectDevotee = useCallback((devotee) => {
    if (!devotee || user?.role === 'user') return;
    const currentYear = date ? parseInt(date.split('-')[0], 10) : new Date().getFullYear();
    const m = String(devotee.kattalai_month || 1).padStart(2, '0');
    const d = String(devotee.kattalai_date || 1).padStart(2, '0');
    const targetDate = `${currentYear}-${m}-${d}`;

    setDate(targetDate);
    setView('daily');
    setHighlightedBookingId(devotee.id);

    // Give DOM time to update with new day's bookings, then scroll into view
    setTimeout(() => {
      const el = document.getElementById(`booking-pill-${devotee.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 450);

    // Auto-clear highlight ring after 4 seconds
    setTimeout(() => {
      setHighlightedBookingId((curr) => (curr === devotee.id ? null : curr));
    }, 4000);
  }, [date, user?.role]);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch data in parallel
      const [fetchedTypes, fetchedBookings, fetchedPanchangam, fetchedTodos] = await Promise.all([
        api.getKattalaiTypes().catch(() => []),
        api.getBookings(date).catch(() => []),
        api.getPanchangam(date).catch(() => null),
        api.getTodos().catch(() => [])
      ]);
      
      setKattalaiTypes(fetchedTypes);
      setBookings(fetchedBookings);
      setPanchangam(fetchedPanchangam);
      setTodos(fetchedTodos);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [date]);

  // Fetch absentees for the selected range (Daily, Weekly, Monthly)
  useEffect(() => {
    let cancelled = false;
    async function loadAbsentees() {
      if (view === 'daily') {
        const abs = bookings.filter(b => !b.present);
        setRangeAbsentees(abs);
        return;
      }
      try {
        setTodoLoading(true);
        setRangeAbsentees([]);
        const res = await api.getBookings({
          fromDate: activeRange.fromDate,
          toDate: activeRange.toDate,
          attendance: 'absent'
        });
        if (!cancelled) {
          setRangeAbsentees(Array.isArray(res) ? res : []);
        }
      } catch (err) {
        console.error('Failed to load range absentees:', err);
        if (!cancelled) setRangeAbsentees([]);
      } finally {
        if (!cancelled) setTodoLoading(false);
      }
    }
    loadAbsentees();
    return () => { cancelled = true; };
  }, [activeRange, view, bookings]);

  const initialLoadDone = useRef(false);

  const forceScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    const mainScroll = document.getElementById('main-content-scroll');
    if (mainScroll) mainScroll.scrollTop = 0;
    const root = document.getElementById('root');
    if (root) root.scrollTop = 0;
  }, []);

  useEffect(() => {
    forceScrollToTop();
    const t1 = setTimeout(forceScrollToTop, 50);
    const t2 = setTimeout(forceScrollToTop, 150);
    const t3 = setTimeout(forceScrollToTop, 350);
    const t4 = setTimeout(forceScrollToTop, 600);
    loadAll();
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [loadAll, forceScrollToTop]);

  useEffect(() => {
    if (!loading && !initialLoadDone.current && kattalaiTypes.length > 0) {
      initialLoadDone.current = true;
      forceScrollToTop();
      const t = setTimeout(forceScrollToTop, 50);
      const t2 = setTimeout(forceScrollToTop, 200);
      return () => {
        clearTimeout(t);
        clearTimeout(t2);
      };
    }
  }, [loading, kattalaiTypes.length, forceScrollToTop]);

  async function handleTogglePresent(id, present) {
    if (!user || (user.role !== 'ulthurai' && user.role !== 'admin' && user.role !== 'superadmin')) {
      alert("Only authorized staff can mark attendance.");
      return;
    }

    // Check +/- 5 days time restriction
    const booking = bookings.find(b => b.id === id);
    if (booking) {
      const today = new Date();
      // Derive date for current year
      const bDate = new Date(Date.UTC(today.getFullYear(), booking.kattalai_month - 1, booking.kattalai_date));
      const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
      const diffDays = Math.ceil(Math.abs(bDate - todayUTC) / (1000 * 60 * 60 * 24));
      
      if (diffDays > 5 && user.role !== 'superadmin') {
        alert("Only superadmin can modify attendance beyond the 5-day window.");
        return;
      }
    }

    try {
      // Optimistic update
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, present } : b)));
      if (present) {
        setRangeAbsentees((prev) => prev.filter((b) => b.id !== id));
      }
      const target_year = date ? parseInt(date.split("-")[0], 10) : new Date().getFullYear();
      await api.togglePresent(id, present, user.id, user.name, user.role, target_year);
    } catch (err) {
      console.error(err);
      alert("Failed to save attendance: " + (err.response?.data?.error || err.message));
      // Revert optimistic update
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, present: !present } : b)));
    }
  }

  function handleEdit(booking) {
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin' && user.role !== 'user')) {
      alert("Only admin/superadmin can edit Nithiya Kattalai details.");
      return;
    }
    // Devotees can only edit their own booking
    if (user.role === 'user' && booking.id !== user.id) {
      alert("You can only edit your own Nithiya Kattalai details.");
      return;
    }
    setEditBooking(booking);
  }

  function bookingsFor(kattalaiTypeId) {
    let filtered = bookings.filter((b) => b.kattalai_type_id === kattalaiTypeId);
    if (isDevotee && user) {
      filtered = filtered.filter((b) => b.id === user.id || (b.code && user.username && b.code.toLowerCase() === user.username.toLowerCase()));
    }
    return filtered;
  }

  async function handleAddTodoItem(listId) {
    const name = prompt('Name to add:');
    if (!name) return;
    setTodos(prev => prev.map(list => 
      list.id === listId 
        ? { ...list, items: [...list.items, { id: Date.now(), name, completed: false }] }
        : list
    ));
  }

  // Build the renderable blocks (columns + todo list)
  const renderBlocks = [];
  
  if (kattalaiTypes.length > 0) {
    kattalaiTypes.forEach((kt) => {
      const bks = bookingsFor(kt.id);
      // For devotees, hide columns where they have no bookings
      if (isDevotee && bks.length === 0) return;
      
      renderBlocks.push(
        <div key={`col-${kt.id}`} className="w-full md:w-[300px] flex-shrink-0">
          <KattalaiColumn
            kattalaiType={kt}
            bookings={bks}
            onTogglePresent={handleTogglePresent}
            onEdit={handleEdit}
            onAddNew={(type, slot) => setModalType({ kattalaiType: type, initialSlot: slot })}
            highlightedBookingId={highlightedBookingId}
          />
        </div>
      );
    });
  }

  // Hide ToDo list entirely for devotees
  if (!isDevotee && kattalaiTypes.length > 0) {
    const activeTodos = (todos && todos.length > 0) ? todos : [
      { id: 'viboothi-list', title: 'Viboothi to be sent to', items: [] },
      { id: 'reminder-list', title: 'Reminder Letter to send', items: [] }
    ];

    const mappedLists = activeTodos.map(list => {
      if (list.title === 'Viboothi to be sent to') {
        return {
          ...list,
          rangeLabel: activeRangeLabel,
          items: rangeAbsentees.map(b => ({
            id: b.id,
            name: b.name,
            code: b.code,
            completed: false,
            isDynamic: true,
            booking: b
          }))
        };
      }
      return list;
    });

    renderBlocks.push(
      <div key="todo-list" className="w-full md:w-[300px] flex-shrink-0 mt-4 md:mt-0">
        <ToDoList 
          lists={mappedLists} 
          onAddItem={handleAddTodoItem} 
          onPrintList={setPrintList}
        />
      </div>
    );
  }

  const formattedStickyDate = (() => {
    try {
      const d = new Date(date + 'T00:00:00');
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' | ' + d.toLocaleDateString('en-GB', { weekday: 'long' });
    } catch (e) {
      return date;
    }
  })();

  const scrollToPanchangam = () => {
    const el = document.getElementById('mobile-panchangam-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div 
      className="w-full min-h-screen md:min-h-0 md:h-screen md:max-h-screen md:overflow-hidden pb-[50px] md:pb-2 flex flex-col bg-cover bg-bottom bg-no-repeat"
      style={{ backgroundImage: "linear-gradient(rgba(244, 234, 215, 0.88), rgba(244, 234, 215, 0.88)), url('/background.png')" }}
    >
      <div className="relative md:sticky md:top-0 z-40 bg-[#f4ead7]/95 backdrop-blur-xs px-4 md:px-[120px]">
        <DashboardHeader
          date={date}
          panchangam={panchangam}
          onDateChange={handleDateChange}
          view={view}
          onViewChange={setView}
          customRange={customRange}
          onCustomRangeChange={handleCustomRangeChange}
          activeRangeLabel={activeRangeLabel}
          lang={lang}
          onLangChange={setLang}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectDevotee={handleSelectDevotee}
        />
      </div>

      <main className="w-full relative">
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
            <div className="text-[#5c292c] font-barlow text-xl">Loading...</div>
          </div>
        )}
        
        {renderBlocks.length > 0 && (
          <div className="flex flex-col md:flex-row px-[16px] md:px-[120px] gap-[16px] md:gap-0 mt-[12px]">
            {renderBlocks.map((block, index) => (
              <Fragment key={block.key}>
                {block}
                {index < renderBlocks.length - 1 && (
                  <>
                    <div className="md:hidden w-full h-[1px] bg-[#c7b0a4]" />
                    <div className="hidden md:block fig-col-divider mx-4" />
                  </>
                )}
              </Fragment>
            ))}
          </div>
        )}
      </main>

      {/* Render the Panchangam bottom strip */}
      <PanchangamStrip panchangam={panchangam} loading={loading} />

      {/* Mobile Sticky Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 w-full h-[48px] flex items-center justify-center pointer-events-none z-50">
        <button
          type="button"
          onClick={scrollToPanchangam}
          className="bg-[#5c292c] hover:bg-[#482022] text-white rounded-t-[18px] px-5 py-1.5 flex items-center gap-2.5 shadow-xl pointer-events-auto cursor-pointer font-barlow text-[13px] font-semibold transition-all active:scale-95"
          title="Tap to jump to Panchangam"
        >
          <span>{formattedStickyDate}</span>
          <svg width="12" height="7" viewBox="0 0 14 8" fill="none">
            <path d="M1 7L7 1L13 7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Modals */}
      {modalType && (
        <BookingModal
          kattalaiType={modalType.kattalaiType || modalType}
          initialSlot={modalType.initialSlot}
          date={date}
          kattalaiTypes={kattalaiTypes}
          bookings={bookings}
          onClose={() => setModalType(null)}
          onSaved={() => {
            setModalType(null);
            loadAll();
          }}
        />
      )}
      {editBooking && (
        <BookingModal
          existingBooking={editBooking}
          kattalaiType={kattalaiTypes.find(t => t.id === editBooking.kattalai_type_id)}
          date={date}
          kattalaiTypes={kattalaiTypes}
          bookings={bookings}
          onClose={() => setEditBooking(null)}
          onSaved={() => {
            setEditBooking(null);
            loadAll();
          }}
        />
      )}
      {printList && user && (user.role === 'admin' || user.role === 'superadmin') && (
        <PrintModal list={printList} date={date} onClose={() => setPrintList(null)} />
      )}
    </div>
  );
}
