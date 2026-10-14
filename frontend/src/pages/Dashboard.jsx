import React, { useEffect, useState, useCallback, Fragment } from 'react';
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

export default function Dashboard() {
  const { user } = useAuth();
  
  const [date, setDate] = useState(() => {
    if (user?.booking_date) {
      return user.booking_date; // Backend now sends 'YYYY-MM-DD'
    }
    return todayISO();
  });

  const [showOnlyUser, setShowOnlyUser] = useState(user?.role === 'user');

  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState('daily');
  const [lang, setLang] = useState('en');

  const [kattalaiTypes, setKattalaiTypes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [todos, setTodos] = useState([]);
  const [panchangam, setPanchangam] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [editBooking, setEditBooking] = useState(null);
  const [printList, setPrintList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch data in parallel
      const [fetchedTypes, fetchedBookings, fetchedPanchangam, fetchedTodos] = await Promise.all([
        api.getKattalaiTypes().catch(() => []),
        api.getBookings(date, searchQuery).catch(() => []),
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
  }, [date, searchQuery]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

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
      alert("Only admin/superadmin can edit booking details.");
      return;
    }
    // Devotees can only edit their own booking
    if (user.role === 'user' && booking.id !== user.id) {
      alert("You can only edit your own details.");
      return;
    }
    setEditBooking(booking);
  }

  function bookingsFor(kattalaiTypeId) {
    let filtered = bookings.filter((b) => b.kattalai_type_id === kattalaiTypeId);
    if (showOnlyUser && user) {
      filtered = filtered.filter((b) => b.id === user.id);
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

  const isDevotee = user?.role === 'user';

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
            onAddNew={setModalType}
          />
        </div>
      );
    });
  }

  // Hide ToDo list entirely for devotees
  if (!isDevotee && kattalaiTypes.length > 0) {
    renderBlocks.push(
      <div key="todo-list" className="w-full md:w-[300px] flex-shrink-0 mt-4 md:mt-0">
        <ToDoList 
          lists={todos.map(list => {
            if (list.title === 'Viboothi to be sent to') {
              const absentees = bookings.filter(b => !b.present);
              return {
                ...list,
                items: absentees.map(b => ({
                  id: b.id,
                  name: b.name,
                  completed: false,
                  isDynamic: true,
                  booking: b
                }))
              };
            }
            return list;
          })} 
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
      className="w-full min-h-screen pb-[50px] md:pb-0 flex flex-col bg-cover bg-bottom bg-no-repeat"
      style={{ backgroundImage: "linear-gradient(rgba(244, 234, 215, 0.88), rgba(244, 234, 215, 0.88)), url('/background.png')" }}
    >
      <div className="px-4 md:px-[120px]">
        <DashboardHeader
          date={date}
          panchangam={panchangam}
          onDateChange={(newDate) => {
            setDate(newDate);
            setShowOnlyUser(false);
          }}
          view={view}
          onViewChange={setView}
          lang={lang}
          onLangChange={setLang}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
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
      <PanchangamStrip panchangam={panchangam} />

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
          kattalaiType={modalType}
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
      {printList && (
        <PrintModal list={printList} date={date} onClose={() => setPrintList(null)} />
      )}
    </div>
  );
}
