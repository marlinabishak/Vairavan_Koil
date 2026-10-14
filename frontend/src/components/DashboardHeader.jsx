import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

function DropdownArrow() {
  return (
    <svg width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1">
      <path d="M1 1L4 4L7 1" stroke="#333" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5c292c" strokeWidth="3" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

export default function DashboardHeader({ date, panchangam, onDateChange, view, onViewChange, lang, onLangChange, searchQuery, onSearchChange }) {
  const d = new Date(date);
  const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
  const day = d.getDate();
  const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
  const year = d.getFullYear();

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const searchInputRef = useRef(null);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  return (
    <header className="w-full flex flex-col">
      {/* Row 1: Logo (centered on mobile, left on desktop) + Hamburger/Avatar */}
      <div className="flex items-start justify-between relative pt-3 md:pt-[20px]">
        <div className="w-full flex justify-center md:justify-start">
          <img
            src="/logo.svg"
            alt="Vairavan Koil"
            className="w-[190px] h-[72px] sm:w-[200px] sm:h-[75px] md:w-[247px] md:h-[90px] drop-shadow-xs"
          />
        </div>

        <div className="absolute right-0 top-3 md:top-[40px] flex flex-col items-end">
          {/* Desktop Avatar */}
          <img
            src="/avatar.png"
            alt="Profile"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="hidden md:block object-cover cursor-pointer hover:opacity-90 transition-opacity w-[50px] h-[50px] rounded-[26.5px]"
          />
          
          {/* Hamburger — visible on mobile only */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <HamburgerIcon />
          </button>

          {/* Shared Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-[#fbf9f6] rounded-[22px] shadow-[0_20px_50px_-10px_rgba(70,40,20,0.22)] border border-[#ebdccb] z-50 p-2 font-barlow animate-fade-in">
              {/* Profile Card */}
              <div className="px-3.5 py-2.5 bg-white rounded-[16px] border border-[#ebdccb] mb-1.5 flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-[#5c292c] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  {user ? (user.name ? user.name.slice(0, 2).toUpperCase() : 'U') : 'G'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold text-[#5c292c] truncate leading-tight">
                    {user ? user.name : 'Guest'}
                  </p>
                  <p className="text-[11px] font-semibold text-[#8c7b70] capitalize mt-0.5 truncate">
                    {user ? user.role : 'Not signed in'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                {user ? (
                  <>
                    {user.role === 'superadmin' && (
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/profiles');
                        }}
                        className="flex items-center gap-2.5 w-full text-left px-3 h-[38px] rounded-[12px] text-[13px] font-medium text-gray-700 hover:text-[#5c292c] hover:bg-white transition-all"
                      >
                        <svg className="w-4 h-4 text-[#8c7b70] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span className="truncate">Staff Profiles & Roles</span>
                      </button>
                    )}

                    {(user.role === 'admin' || user.role === 'superadmin') && (
                      <>
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            navigate('/requests');
                          }}
                          className="flex items-center gap-2.5 w-full text-left px-3 h-[38px] rounded-[12px] text-[13px] font-medium text-gray-700 hover:text-[#5c292c] hover:bg-white transition-all"
                        >
                          <svg className="w-4 h-4 text-[#8c7b70] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="truncate">Devotee Edit Requests</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            navigate('/settings');
                          }}
                          className="flex items-center gap-2.5 w-full text-left px-3 h-[38px] rounded-[12px] text-[13px] font-medium text-gray-700 hover:text-[#5c292c] hover:bg-white transition-all"
                        >
                          <svg className="w-4 h-4 text-[#8c7b70] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">System Settings</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            navigate('/whatsapp');
                          }}
                          className="flex items-center gap-2.5 w-full text-left px-3 h-[38px] rounded-[12px] text-[13px] font-medium text-gray-700 hover:text-[#5c292c] hover:bg-white transition-all"
                        >
                          <svg className="w-4 h-4 text-[#8c7b70] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span className="truncate">WhatsApp Reminders</span>
                        </button>
                      </>
                    )}

                    {(user.role === 'admin' || user.role === 'superadmin' || user.role === 'ulthurai') && (
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/history');
                        }}
                        className="flex items-center gap-2.5 w-full text-left px-3 h-[38px] rounded-[12px] text-[13px] font-medium text-gray-700 hover:text-[#5c292c] hover:bg-white transition-all"
                      >
                        <svg className="w-4 h-4 text-[#8c7b70] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="truncate">Activity History Log</span>
                      </button>
                    )}

                    {user.role === 'superadmin' && (
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          api.downloadBookings().catch(err => {
                            console.error(err);
                            alert('Failed to download database');
                          });
                        }}
                        className="flex items-center gap-2.5 w-full text-left px-3 h-[38px] rounded-[12px] text-[13px] font-medium text-gray-700 hover:text-[#5c292c] hover:bg-white transition-all"
                      >
                        <svg className="w-4 h-4 text-[#8c7b70] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span className="truncate">Download Database (CSV)</span>
                      </button>
                    )}

                    {user.role === 'user' && (
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/my-history');
                        }}
                        className="flex items-center gap-2.5 w-full text-left px-3 h-[38px] rounded-[12px] text-[13px] font-medium text-gray-700 hover:text-[#5c292c] hover:bg-white transition-all"
                      >
                        <svg className="w-4 h-4 text-[#8c7b70] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">My Attendance History</span>
                      </button>
                    )}

                    <div className="my-1 border-t border-[#ebdccb]/60" />

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full text-left px-3 h-[38px] rounded-[12px] text-[13px] font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all"
                    >
                      <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Log Out</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleSignIn}
                    className="flex items-center gap-2.5 w-full text-left px-3 h-[38px] rounded-[12px] text-[13px] font-semibold text-[#5c292c] hover:bg-white transition-all"
                  >
                    <svg className="w-4 h-4 text-[#5c292c] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Maroon underline — 1px #5c292c */}
      <div className="w-full bg-[#5c292c] h-[1px] mt-2 md:mt-[10px]" />

      {/* Row 2: Date text + Toggles */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-2 md:mt-[8px] gap-2 md:gap-0">
        
        {/* Left side: Date string */}
        <div 
          className="relative flex items-center justify-center md:justify-start flex-wrap text-center md:text-left text-[14px] md:text-[24px] font-barlow font-light text-black cursor-pointer group"
          onClick={() => {
            if (searchInputRef.current && searchInputRef.current.id === 'date-picker') return; // Just safety
            const picker = document.getElementById('mobile-date-picker');
            if (picker) {
              try { picker.showPicker(); } catch (e) { picker.focus(); }
            }
          }}
        >
          
          {/* Universal Date Picker */}
          <input 
            id="mobile-date-picker"
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            style={{ top: 0, left: 0 }}
          />

          {/* Desktop date format */}
          <div className="hidden md:flex items-center group-hover:opacity-70 transition-opacity">
            <div className="flex items-center mr-[6px]">
              <span className="font-barlow font-light text-[24px] text-black">{day}</span><DropdownArrow />
            </div>
            <div className="flex items-center mr-[6px]">
              <span className="font-barlow font-light text-[24px] text-black">{monthShort}</span><DropdownArrow />
            </div>
            <div className="flex items-center mr-[12px]">
              <span className="font-barlow font-light text-[24px] text-black">{year}</span><DropdownArrow />
            </div>
          </div>
          
          {/* Mobile date format */}
          <div className="md:hidden flex items-center group-hover:opacity-70 transition-opacity pointer-events-none">
            <span>{day} {monthShort} {year}</span>
            <DropdownArrow />
            <span className="mx-1 opacity-40">|</span>
          </div>
          
          <span className="text-[14px] md:text-[18px] whitespace-nowrap group-hover:opacity-70 transition-opacity pointer-events-none">
            {dayName} <span className="hidden md:inline text-[14px] font-normal">(Today)</span>
            {panchangam && (
              <>
                <span className="mx-1 md:mx-2 opacity-40">|</span>
                {panchangam.tamil_month}
                <span className="mx-1 md:mx-2 opacity-40">|</span>
                {panchangam.tamil_year} வருடம்
                <span className="mx-1 md:mx-2 opacity-40">|</span>
                {panchangam.tamil_day_number}
              </>
            )}
          </span>
        </div>

        {/* Second maroon underline for mobile only */}
        <div className="w-full bg-[#5c292c] h-[1px] md:hidden my-1" />

        {/* Right side: Search + Toggles */}
        <div className="flex items-center justify-between md:justify-end gap-[12px] w-full md:w-auto">
          {/* Search bar: Hidden on mobile */}
          <div
            className="hidden md:flex items-center justify-end bg-white overflow-hidden transition-all duration-300 ease-in-out shadow-sm"
            style={{ 
              width: isSearchExpanded ? '196px' : '30px', 
              height: '30px', 
              borderRadius: '15px',
              border: isSearchExpanded ? '1px solid #d1d5db' : '1px solid transparent',
              cursor: isSearchExpanded ? 'text' : 'pointer'
            }}
            onClick={() => {
              if (!isSearchExpanded) setIsSearchExpanded(true);
            }}
          >
            {isSearchExpanded && (
              <input 
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-transparent border-none outline-none text-[14px] font-barlow text-black pl-4 w-full h-full"
                placeholder="Search..."
                onBlur={(e) => {
                  if (!e.target.value) setIsSearchExpanded(false);
                }}
              />
            )}
            <div
              className="flex items-center justify-center flex-shrink-0 cursor-pointer"
              style={{ width: '30px', height: '30px', borderRadius: '15px', backgroundColor: isSearchExpanded ? 'transparent' : 'white' }}
            >
              <div
                className="flex items-center justify-center transition-colors hover:bg-[#967d7b]"
                style={{ width: '22px', height: '22px', borderRadius: '11px', backgroundColor: '#a68a88' }}
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <circle cx="6" cy="6" r="4.5" stroke="white" strokeWidth="1.5"/>
                  <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Vertical divider - desktop only */}
          <div className="hidden md:block w-[1px] bg-[#c7b0a4] h-[20px]" />

          <div className="flex flex-1 md:flex-none gap-2 items-center">
            {/* Week toggle */}
            <div
              className="flex items-center relative bg-white shadow-sm flex-1 md:flex-none w-full md:w-[312px]"
              style={{ height: '30px', borderRadius: '15px', border: '1px solid #e5e7eb' }}
            >
              {/* Animated active pill background */}
              <div 
                className="absolute transition-all duration-300 ease-in-out h-[22px] rounded-[11px] bg-[#a68a88] top-[3px] left-[4px]"
                style={{ 
                  width: 'calc(33.33% - 6px)',
                  transform: `translateX(${view === 'daily' ? 0 : view === 'weekly' ? '100%' : '200%'})`,
                  marginLeft: view === 'weekly' ? '6px' : view === 'monthly' ? '12px' : '0'
                }}
              />
              {['daily', 'weekly', 'monthly'].map((v) => {
                const isActive = view === v;
                const label = v.charAt(0).toUpperCase() + v.slice(1);
                return (
                  <button
                    key={v}
                    onClick={() => onViewChange(v)}
                    className={`relative z-10 flex-1 text-center font-barlow text-[12px] md:text-[14px] transition-colors duration-200 ${isActive ? 'text-white' : 'text-black'}`}
                    style={{ height: '30px' }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Lang toggle */}
            <div
              className="flex items-center relative bg-white shadow-sm w-[60px] md:w-[76px]"
              style={{ height: '30px', borderRadius: '15px', border: '1px solid #e5e7eb' }}
            >
              <div 
                className="absolute transition-all duration-300 ease-in-out h-[22px] rounded-[11px] bg-[#a68a88] top-[3px] left-[4px]"
                style={{ 
                  width: 'calc(50% - 6px)',
                  transform: `translateX(${lang === 'en' ? 0 : '100%'})`,
                  marginLeft: lang === 'ta' ? '4px' : '0'
                }}
              />
              {[
                { id: 'en', label: 'A', weight: 'bold' },
                { id: 'ta', label: 'அ', weight: 'normal' },
              ].map(({ id, label, weight }) => {
                const isActive = lang === id;
                return (
                  <button
                    key={id}
                    onClick={() => onLangChange(id)}
                    className={`relative z-10 flex-1 flex items-center justify-center font-barlow text-[12px] md:text-[14px] transition-colors duration-200 ${isActive ? 'text-white' : 'text-black'}`}
                    style={{ height: '30px', fontWeight: weight }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
