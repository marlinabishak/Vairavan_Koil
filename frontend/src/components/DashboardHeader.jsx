import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import BugReportModal from './BugReportModal';

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

export default function DashboardHeader({ 
  date, 
  panchangam, 
  onDateChange, 
  view, 
  onViewChange, 
  lang, 
  onLangChange, 
  searchQuery, 
  onSearchChange,
  onSelectDevotee,
  customRange,
  onCustomRangeChange,
  activeRangeLabel
}) {
  const [yStr, mStr, dStr] = (date || '').split('-');
  const d = (yStr && mStr && dStr) 
    ? new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1, parseInt(dStr, 10)) 
    : new Date();

  const dayName = d.toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-US', { weekday: 'long' });
  const day = d.getDate();
  const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
  const year = d.getFullYear();

  // Format tamil year and prevent duplicate வருடம்
  const formattedTamilYear = (() => {
    if (!panchangam?.tamil_year) return '';
    let str = String(panchangam.tamil_year).trim();
    str = str.replace(/\s*வருடம்\s*வருடம்/g, ' வருடம்');
    if (!str.includes('வருடம்')) {
      str = `${str} வருடம்`;
    }
    return str;
  })();

  // Check if the selected date is strictly today in local time
  const today = new Date();
  const isToday = Boolean(
    date &&
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileSearchModalOpen, setIsMobileSearchModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Range picker popover state for custom range
  const [isRangePickerOpen, setIsRangePickerOpen] = useState(false);
  const [rangeFrom, setRangeFrom] = useState(customRange?.fromDate || '');
  const [rangeTo, setRangeTo] = useState(customRange?.toDate || '');

  useEffect(() => {
    setRangeFrom(customRange?.fromDate || '');
    setRangeTo(customRange?.toDate || '');
  }, [customRange?.fromDate, customRange?.toDate]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchInputRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const mobileSearchContainerRef = useRef(null);
  const rangeContainerRef = useRef(null);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isDevotee = user?.role === 'user';

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  // Live debounced search across all 365 days (immune to network race conditions)
  useEffect(() => {
    let isCurrent = true;
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setShowResults(false);
      setSelectedIndex(-1);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await api.searchBookings(searchQuery.trim(), 20);
        if (isCurrent) {
          setSearchResults(results || []);
          setShowResults(true);
          setSelectedIndex(-1);
        }
      } catch (err) {
        if (isCurrent) {
          console.error('Failed to search devotees:', err);
          setSearchResults([]);
        }
      } finally {
        if (isCurrent) {
          setIsSearching(false);
        }
      }
    }, 220);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Close dropdown and range picker on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      const inDesktop = searchContainerRef.current && searchContainerRef.current.contains(event.target);
      const inMobile = mobileSearchContainerRef.current && mobileSearchContainerRef.current.contains(event.target);
      if (!inDesktop && !inMobile) {
        setShowResults(false);
        if (!searchQuery) {
          setIsSearchExpanded(false);
        }
      }
      if (rangeContainerRef.current && !rangeContainerRef.current.contains(event.target)) {
        setIsRangePickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchQuery]);

  const handleDevoteeSelect = (devotee) => {
    setShowResults(false);
    setIsMobileSearchOpen(false);
    setIsMobileSearchModalOpen(false);
    setIsProfileOpen(false);
    if (onSelectDevotee) {
      onSelectDevotee(devotee);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowResults(false);
      if (!searchQuery) setIsSearchExpanded(false);
      return;
    }

    if (!showResults || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = selectedIndex >= 0 ? searchResults[selectedIndex] : searchResults[0];
      if (target) {
        handleDevoteeSelect(target);
      }
    }
  };

  const formatKattalaiDate = (monthNum, dateNum) => {
    if (!monthNum || !dateNum) return '-';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const tamilMonths = ['சித்திரை', 'வைகாசி', 'ஆனி', 'ஆடி', 'ஆவணி', 'புரட்டாசி', 'ஐப்பசி', 'கார்த்திகை', 'மார்கழி', 'தை', 'மாசி', 'பங்குனி'];
    const mName = lang === 'ta' && tamilMonths[monthNum - 1] ? tamilMonths[monthNum - 1] : months[monthNum - 1];
    return `${dateNum} ${mName}`;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  const renderResultsDropdown = (isMobile = false) => {
    if (!showResults) return null;

    return (
      <div 
        className={`bg-[#fbf9f6] rounded-[20px] shadow-[0_20px_50px_-10px_rgba(70,40,20,0.3)] border border-[#ebdccb] overflow-hidden font-barlow animate-fade-in ${
          isMobile 
            ? 'w-full mt-2' 
            : 'absolute right-0 top-[38px] w-[340px] sm:w-[420px] max-w-[95vw] z-[100]'
        }`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#f4ead7] to-[#ebdccb]/60 border-b border-[#ebdccb]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#5c292c] animate-pulse" />
            <span className="text-[13px] font-bold text-[#5c292c]">
              {isSearching ? 'Searching...' : `Devotees Found (${searchResults.length})`}
            </span>
          </div>
          <span className="text-[11px] text-[#8c7b70] hidden sm:inline">
            Click to jump to devotee
          </span>
        </div>

        {/* Scrollable list */}
        <div className="max-h-[420px] overflow-y-auto divide-y divide-[#ebdccb]/50 overscroll-contain">
          {isSearching ? (
            <div className="p-8 flex flex-col items-center justify-center gap-2 text-[#8c7b70]">
              <div className="w-6 h-6 border-2 border-[#5c292c] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Searching temple records...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-6 text-center text-[#8c7b70]">
              <p className="text-[14px] font-semibold text-gray-700">No devotees found for "{searchQuery}"</p>
              <p className="text-[11.5px] mt-1 text-[#8c7b70]">
                Try searching by Office Code, Devotee Name, Mobile number, or Place.
              </p>
            </div>
          ) : (
            searchResults.map((item, index) => {
              const isEvening = item.color_key?.includes('evening') || (item.code && (item.code.startsWith('A/') || item.code.startsWith('AJ/')));
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => handleDevoteeSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-3 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected ? 'bg-[#f0e4d2]' : 'hover:bg-[#f7efe6]'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    {/* Row 1: Name and Code */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[14px] text-[#5c292c] truncate">
                        {lang === 'ta' && item.name_ta ? (
                          <>
                            {item.title_ta ? `${item.title_ta} ` : ''}{item.name_ta}
                            <span className="text-xs font-normal text-gray-500 ml-1">({item.name})</span>
                          </>
                        ) : (
                          <>
                            {item.title ? `${item.title} ` : ''}{item.name}
                            {item.name_ta && (
                              <span className="text-xs font-normal text-gray-500 ml-1">({item.name_ta})</span>
                            )}
                          </>
                        )}
                      </span>

                      {item.code && (
                        <span 
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            isEvening 
                              ? 'bg-[#6f8ea8]/15 text-[#2c4e6a] border-[#6f8ea8]/40' 
                              : 'bg-[#f37435]/15 text-[#9e3f0f] border-[#f37435]/40'
                          }`}
                        >
                          {item.code}
                        </span>
                      )}
                    </div>

                    {/* Row 2: Date & Session */}
                    <div className="flex items-center gap-2 mt-1 text-[12px] text-gray-600 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold text-[#5c292c]">
                        <svg className="w-3.5 h-3.5 text-[#5c292c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatKattalaiDate(item.kattalai_month, item.kattalai_date)}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span 
                        className="font-medium text-[11px] px-1.5 py-0.5 rounded text-white"
                        style={{ backgroundColor: isEvening ? '#6f8ea8' : '#f37435' }}
                      >
                        {lang === 'ta' && item.kattalai_name_ta ? item.kattalai_name_ta : item.kattalai_name}
                      </span>
                    </div>

                    {/* Row 3: Meta (Place, Mobile, Star) */}
                    <div className="flex items-center gap-2.5 mt-1 text-[11px] text-[#7a6b61] truncate">
                      {item.place && (
                        <span className="truncate">📍 {lang === 'ta' && item.place_ta ? item.place_ta : item.place}</span>
                      )}
                      {item.mobile && (
                        <span className="shrink-0">📞 {item.mobile}</span>
                      )}
                      {item.star && (
                        <span className="shrink-0">⭐ {lang === 'ta' && item.star_ta ? item.star_ta : item.star}</span>
                      )}
                    </div>
                  </div>

                  {/* Jump button */}
                  <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#f4ead7] text-[#5c292c] hover:bg-[#5c292c] hover:text-white transition-colors shadow-xs" title="Jump to date">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <header className="w-full flex flex-col">
      {/* Row 1: Logo (centered on mobile, left on desktop) + Hamburger/Avatar */}
      <div className="flex items-start justify-between relative pt-3 md:pt-[20px]">
        <div className="w-full flex justify-center md:justify-start">
          <img
            src="/logo.svg"
            alt="Vairavan Koil"
            onClick={() => {
              window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
              if (document.documentElement) document.documentElement.scrollTop = 0;
              if (document.body) document.body.scrollTop = 0;
              const mainScroll = document.getElementById('main-content-scroll');
              if (mainScroll) mainScroll.scrollTop = 0;
            }}
            className="w-[190px] h-[72px] sm:w-[200px] sm:h-[75px] md:w-[247px] md:h-[90px] drop-shadow-xs cursor-pointer hover:opacity-95 transition-opacity"
            title="Vairavan Koil - Tap to return to top"
          />
        </div>

        <div className="absolute right-0 top-3 md:top-[40px] flex flex-col items-end">
          {/* Top Actions Row */}
          <div className="flex items-center">
            {/* Desktop Avatar */}
            <img
              src="/avatar.png"
              alt="Profile"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="hidden md:block object-cover cursor-pointer hover:opacity-90 transition-opacity w-[50px] h-[50px] rounded-[26.5px]"
            />
            
            {/* Mobile top button: Hamburger only (matches Figma Android Compact) */}
            <div className="md:hidden flex items-center">
              <button 
                className="p-1.5 text-[#5c292c] hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                aria-label="Menu"
                id="mobile-hamburger-btn"
              >
                <HamburgerIcon />
              </button>
            </div>
          </div>

          {/* Shared Dropdown / Mobile Drawer */}
          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-[calc(100vw-32px)] max-w-[340px] md:w-64 bg-[#fbf9f6] rounded-[22px] shadow-[0_20px_50px_-10px_rgba(70,40,20,0.25)] border border-[#ebdccb] z-50 p-3 md:p-2 font-barlow animate-fade-in">
              {/* Mobile In-Menu Search Bar (Staff Only) */}
              {!isDevotee && (
                <div className="md:hidden mb-2.5 pb-2.5 border-b border-[#ebdccb]">
                  <div className="flex items-center bg-white rounded-full border border-[#ebdccb] shadow-xs px-3 h-[38px] focus-within:border-[#5c292c]">
                    <svg width="15" height="15" viewBox="0 0 14 14" fill="none" className="shrink-0 mr-2 text-[#5c292c]">
                      <circle cx="6" cy="6" r="4.5" stroke="#5c292c" strokeWidth="1.8"/>
                      <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="#5c292c" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                    <input
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                      placeholder="Search devotees..."
                      className="bg-transparent border-none outline-none text-[13px] font-barlow text-black w-full placeholder:text-gray-400"
                    />
                    {isSearching && (
                      <div className="w-3.5 h-3.5 border-2 border-[#5c292c] border-t-transparent rounded-full animate-spin shrink-0 mx-1" />
                    )}
                    {searchQuery && (
                      <button
                        onClick={() => {
                          onSearchChange('');
                          setSearchResults([]);
                        }}
                        className="text-gray-400 hover:text-gray-700 text-lg px-1 font-bold"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Live Search Results inside Mobile Menu */}
                  {searchQuery && searchQuery.trim().length >= 2 && (
                    <div className="mt-2 bg-white rounded-xl border border-[#ebdccb] shadow-xs max-h-48 overflow-y-auto divide-y divide-gray-100 p-1">
                      {searchResults.length === 0 ? (
                        <div className="p-3 text-center text-xs text-gray-500">
                          {isSearching ? 'Searching devotees...' : 'No devotees found'}
                        </div>
                      ) : (
                        searchResults.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleDevoteeSelect(item)}
                            className="p-2 hover:bg-[#fbf9f6] rounded-lg cursor-pointer flex items-center justify-between gap-2 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-bold text-[#5c292c] truncate">
                                {lang === 'ta' && item.name_ta ? item.name_ta : item.name}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10.5px] text-[#7a6b61] truncate">
                                <span>{item.kattalai_type || 'Kattalai'}</span>
                                {item.kattalai_date && <span>• {item.kattalai_date}/{item.kattalai_month}</span>}
                                {item.mobile && <span>• 📞 {item.mobile}</span>}
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-[#f4ead7] text-[#5c292c] hover:bg-[#5c292c] hover:text-white transition-colors shadow-xs" title="Go to devotee">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

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
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate('/dashboard');
                      }}
                      className="flex items-center gap-2.5 w-full text-left px-3 h-[38px] rounded-[12px] text-[13px] font-semibold text-[#5c292c] hover:bg-white transition-all border border-transparent hover:border-[#ebdccb]"
                    >
                      <svg className="w-4 h-4 text-[#5c292c] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span className="truncate">Home (Dashboard)</span>
                    </button>

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
                      <>
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

                        <label className="flex items-center gap-2.5 w-full text-left px-3 h-[38px] rounded-[12px] text-[13px] font-medium text-gray-700 hover:text-[#5c292c] hover:bg-white transition-all cursor-pointer">
                          <svg className="w-4 h-4 text-[#8c7b70] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m4-8l4-4m0 0l4 4m-4-4v12" />
                          </svg>
                          <span className="truncate">Upload Panchangam (CSV)</span>
                          <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setIsProfileOpen(false);
                              try {
                                const text = await file.text();
                                const res = await api.uploadPanchangamCsv(text);
                                alert(res.message || 'Panchangam imported successfully!');
                                window.location.reload();
                              } catch (err) {
                                console.error('Panchangam upload error:', err);
                                alert(err.message || 'Failed to import panchangam CSV');
                              }
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </>
                    )}

                    {user.role === 'user' && (
                      <>
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            navigate('/profile');
                          }}
                          className="flex items-center gap-2.5 w-full text-left px-3 h-[38px] rounded-[12px] text-[13px] font-medium text-gray-700 hover:text-[#5c292c] hover:bg-white transition-all"
                        >
                          <svg className="w-4 h-4 text-[#8c7b70] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="truncate">My Profile & Password</span>
                        </button>

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
                      </>
                    )}

                    {/* Bug Reports viewer for staff roles */}
                    {(user.role === 'admin' || user.role === 'superadmin' || user.role === 'ulthurai') && (
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/bug-reports');
                        }}
                        className="flex items-center gap-2.5 w-full text-left px-3 h-[38px] rounded-[12px] text-[13px] font-medium text-gray-700 hover:text-[#5c292c] hover:bg-white transition-all"
                      >
                        <svg className="w-4 h-4 text-[#8c7b70] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <span className="truncate">Bug & Issue Reports</span>
                      </button>
                    )}

                    {/* Report Bug for all roles */}
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsBugModalOpen(true);
                      }}
                      className="flex items-center gap-2.5 w-full text-left px-3 h-[38px] rounded-[12px] text-[13px] font-medium text-rose-700 hover:bg-rose-50 transition-all"
                    >
                      <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="truncate font-semibold">Report an Issue / Bug</span>
                    </button>

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

      {/* First Divider: subtle 1px line on mobile, maroon on desktop */}
      <div className="w-full h-[1px] bg-[#c7b0a4]/70 mt-2.5 mb-2 md:my-0 md:bg-[#5c292c] md:mt-[10px]" />

      {/* Row 2: Date text + Toggles */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-1 md:mt-[8px] gap-2 md:gap-0">
        
        {/* Date string */}
        <div 
          className={`relative flex items-center justify-center md:justify-start flex-wrap text-center md:text-left text-[14px] md:text-[24px] font-barlow font-light text-black py-0.5 md:py-0 ${
            isDevotee ? 'cursor-default' : 'cursor-pointer group'
          }`}
          onClick={() => {
            if (isDevotee) return;
            if (searchInputRef.current && searchInputRef.current.id === 'date-picker') return;
            const picker = document.getElementById('mobile-date-picker');
            if (picker) {
              try { picker.showPicker(); } catch (e) { picker.focus(); }
            }
          }}
          title={isDevotee ? 'Your Kattalai Date' : 'Tap to change date'}
        >
          {/* Universal Date Picker (Staff Only) */}
          {!isDevotee && (
            <input 
              id="mobile-date-picker"
              type="date"
              tabIndex={-1}
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              style={{ top: 0, left: 0 }}
            />
          )}

          {/* Desktop date format */}
          <div className={`hidden md:flex items-center ${isDevotee ? '' : 'group-hover:opacity-70'} transition-opacity`}>
            <div className="flex items-center mr-[6px]">
              <span className="font-barlow font-light text-[24px] text-black">{day}</span>
              {!isDevotee && <DropdownArrow />}
            </div>
            <div className="flex items-center mr-[6px]">
              <span className="font-barlow font-light text-[24px] text-black">{monthShort}</span>
              {!isDevotee && <DropdownArrow />}
            </div>
            <div className="flex items-center mr-[12px]">
              <span className="font-barlow font-light text-[24px] text-black">{year}</span>
              {!isDevotee && <DropdownArrow />}
            </div>
            <span className="text-[18px] whitespace-nowrap group-hover:opacity-70 transition-opacity pointer-events-none">
              {dayName}
              {isToday && (
                <span className="text-[14px] font-normal ml-1">
                  {lang === 'ta' ? '(இன்று)' : '(Today)'}
                </span>
              )}
              {panchangam && (
                <>
                  {panchangam.tamil_month && (
                    <>
                      <span className="mx-2 opacity-40">|</span>
                      {panchangam.tamil_month}
                    </>
                  )}
                  {formattedTamilYear && (
                    <>
                      <span className="mx-2 opacity-40">|</span>
                      {formattedTamilYear}
                    </>
                  )}
                  {panchangam.tamil_day_number !== undefined && panchangam.tamil_day_number !== null && (
                    <>
                      <span className="mx-2 opacity-40">|</span>
                      {panchangam.tamil_day_number}
                    </>
                  )}
                </>
              )}
            </span>
          </div>
          
          {/* Mobile date format: Date above, Panchangam details below */}
          <div className="md:hidden flex flex-col items-center justify-center text-center font-barlow pointer-events-none py-0.5">
            {/* Above: 4 Nov 2026 */}
            <div className="text-[15.5px] sm:text-[16px] font-medium text-black tracking-normal leading-tight">
              {day} {monthShort} {year}
            </div>

            {/* Below: Wednesday | ஐப்பசி | குரோதி வருடம் | 19 */}
            <div className="flex items-center justify-center flex-wrap gap-x-1.5 text-[13px] sm:text-[13.5px] text-[#2b1810] mt-0.5 leading-normal">
              <span>{dayName}</span>
              {panchangam?.tamil_month && (
                <>
                  <span className="text-[#8c7b70]">|</span>
                  <span>{panchangam.tamil_month}</span>
                </>
              )}
              {formattedTamilYear && (
                <>
                  <span className="text-[#8c7b70]">|</span>
                  <span>{formattedTamilYear}</span>
                </>
              )}
              {panchangam?.tamil_day_number !== undefined && panchangam?.tamil_day_number !== null && (
                <>
                  <span className="text-[#8c7b70]">|</span>
                  <span>{panchangam.tamil_day_number}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Second Divider: subtle 1px line for mobile only */}
        <div className="w-full h-[1px] bg-[#c7b0a4]/70 my-2 md:hidden" />

        {/* Right side: Search + Toggles */}
        <div className="flex items-center justify-between md:justify-end gap-[12px] w-full md:w-auto">
          {/* Search bar: Desktop (Staff Only) */}
          {!isDevotee && (
            <div
              ref={searchContainerRef}
              className="relative hidden md:flex items-center"
            >
              <div
                className="flex items-center justify-end bg-white transition-all duration-300 ease-in-out shadow-sm"
                style={{ 
                  width: isSearchExpanded ? '280px' : '30px', 
                  height: '30px', 
                  borderRadius: '15px',
                  border: isSearchExpanded ? '1px solid #c7b0a4' : '1px solid transparent',
                  cursor: isSearchExpanded ? 'text' : 'pointer'
                }}
                onClick={() => {
                  if (!isSearchExpanded) {
                    setIsSearchExpanded(true);
                    setTimeout(() => searchInputRef.current?.focus(), 60);
                  }
                }}
              >
                {isSearchExpanded && (
                  <div className="flex items-center w-full h-full pl-3 pr-1">
                    <input 
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => {
                        if (searchResults.length > 0 || (searchQuery && searchQuery.trim().length >= 2)) {
                          setShowResults(true);
                        }
                      }}
                      className="bg-transparent border-none outline-none text-[13px] font-barlow text-black w-full h-full placeholder:text-[#a68a88]"
                      placeholder="Search name, office code, phone, place..."
                    />
                    {searchQuery && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSearchChange('');
                          setSearchResults([]);
                          setShowResults(false);
                        }}
                        className="text-gray-400 hover:text-gray-700 px-1 font-bold text-sm leading-none shrink-0"
                        title="Clear"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
                <div
                  className="flex items-center justify-center flex-shrink-0 cursor-pointer"
                  style={{ width: '30px', height: '30px', borderRadius: '15px', backgroundColor: isSearchExpanded ? 'transparent' : 'white' }}
                >
                  <div
                    className="flex items-center justify-center transition-colors hover:bg-[#967d7b]"
                    style={{ width: '22px', height: '22px', borderRadius: '11px', backgroundColor: '#a68a88' }}
                  >
                    {isSearching ? (
                      <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                        <circle cx="6" cy="6" r="4.5" stroke="white" strokeWidth="1.5"/>
                        <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop Results Dropdown */}
              {renderResultsDropdown(false)}
            </div>
          )}

          {/* Vertical divider - desktop only (Staff Only) */}
          {!isDevotee && (
            <div className="hidden md:block w-[1px] bg-[#c7b0a4] h-[20px]" />
          )}

          <div className="flex flex-1 md:flex-none gap-2.5 items-center w-full md:w-auto justify-end">
            {/* Daily / Weekly / Monthly toggle (Staff Only) */}
            {!isDevotee && (
              <div ref={rangeContainerRef} className="relative flex-1 md:flex-none">
                <div
                  className="flex items-center relative bg-white shadow-xs w-full md:w-[260px] p-[2px]"
                  style={{ height: '36px', borderRadius: '18px', border: '1px solid #c7b0a4' }}
                >
                {/* Animated active pill background - exact Figma mauve #8F6270 */}
                {(() => {
                  const viewTabs = ['daily', 'weekly', 'monthly'];
                  const activeIndex = Math.max(0, viewTabs.indexOf(view));
                  return (
                    <div 
                      className="absolute transition-all duration-200 ease-out h-[30px] rounded-[15px] bg-[#8F6270] top-[2px]"
                      style={{ 
                        width: 'calc(33.333% - 3px)',
                        left: `calc(${activeIndex * 33.333}% + 1.5px)`
                      }}
                    />
                  );
                })()}
                {['daily', 'weekly', 'monthly'].map((v) => {
                  const isActive = view === v;
                  const label = v.charAt(0).toUpperCase() + v.slice(1);
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        onViewChange(v);
                        if (v === 'monthly') {
                          setIsRangePickerOpen((prev) => (view === 'monthly' ? !prev : true));
                        } else {
                          setIsRangePickerOpen(false);
                        }
                      }}
                      className={`relative z-10 flex-1 text-center font-barlow text-[14px] md:text-[13px] transition-colors duration-150 cursor-pointer ${
                        isActive ? 'text-white font-bold' : 'text-[#222222] font-medium hover:text-[#5c292c]'
                      }`}
                      style={{ height: '32px' }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Monthly & Range Popover */}
              {view === 'monthly' && isRangePickerOpen && (
                <div className="absolute top-[42px] left-0 md:left-auto md:right-0 z-50 bg-white border border-[#cdb9ab] rounded-[14px] shadow-2xl p-3 text-[12px] font-barlow w-full md:w-auto min-w-[285px] animate-fadeIn">
                  <div className="font-bold text-[#5c292c] mb-2 flex items-center justify-between">
                    <span>Monthly & Range Options:</span>
                    <button type="button" onClick={() => setIsRangePickerOpen(false)} className="text-gray-400 hover:text-black font-bold cursor-pointer">✕</button>
                  </div>

                  {/* Month Switcher Header */}
                  <div className="flex items-center justify-between bg-[#f8f5f1] rounded-lg px-2.5 py-1.5 mb-2.5 border border-[#e2d8cb]">
                    <button
                      type="button"
                      onClick={() => {
                        const cur = new Date(d.getFullYear(), d.getMonth() - 1, 1);
                        const str = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-01`;
                        onDateChange(str);
                        if (onCustomRangeChange) onCustomRangeChange('', '');
                        setRangeFrom('');
                        setRangeTo('');
                      }}
                      className="px-2 py-0.5 rounded text-gray-700 hover:bg-gray-200 font-bold cursor-pointer"
                      title="Previous Month"
                    >
                      ‹
                    </button>
                    <span className="font-semibold text-[#5c292c] text-[13px]">
                      {d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = new Date(d.getFullYear(), d.getMonth() + 1, 1);
                        const str = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-01`;
                        onDateChange(str);
                        if (onCustomRangeChange) onCustomRangeChange('', '');
                        setRangeFrom('');
                        setRangeTo('');
                      }}
                      className="px-2 py-0.5 rounded text-gray-700 hover:bg-gray-200 font-bold cursor-pointer"
                      title="Next Month"
                    >
                      ›
                    </button>
                  </div>

                  {/* Range Inputs */}
                  <div className="grid grid-cols-2 gap-2 mb-2.5">
                    <div>
                      <span className="text-[9px] text-gray-400 font-semibold block mb-0.5">FROM DATE</span>
                      <input 
                        type="date" 
                        value={rangeFrom} 
                        onChange={(e) => setRangeFrom(e.target.value)} 
                        className="w-full border border-gray-300 rounded px-1.5 py-1 text-[11px] focus:outline-none focus:border-[#5c292c]" 
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 font-semibold block mb-0.5">TO DATE</span>
                      <input 
                        type="date" 
                        value={rangeTo} 
                        onChange={(e) => setRangeTo(e.target.value)} 
                        className="w-full border border-gray-300 rounded px-1.5 py-1 text-[11px] focus:outline-none focus:border-[#5c292c]" 
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end pt-1.5 border-t border-gray-100">
                    <button 
                      type="button" 
                      onClick={() => {
                        if (rangeFrom && rangeTo) {
                          if (onCustomRangeChange) onCustomRangeChange(rangeFrom, rangeTo);
                        } else {
                          // If no custom range entered, apply the full month shown in the month switcher
                          const curMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
                          onDateChange(curMonthStr);
                          if (onCustomRangeChange) onCustomRangeChange('', '');
                          setRangeFrom('');
                          setRangeTo('');
                        }
                        setIsRangePickerOpen(false);
                      }}
                      className="bg-[#5c292c] hover:bg-[#482022] text-white px-3 py-1 rounded text-[11px] font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
                    >
                      Apply Range
                    </button>
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Lang toggle - exact Figma styling */}
            <div
              className="flex items-center relative bg-white shadow-xs w-[76px] shrink-0 p-[2px]"
              style={{ height: '36px', borderRadius: '18px', border: '1px solid #c7b0a4' }}
            >
              <div 
                className="absolute transition-all duration-300 ease-in-out h-[30px] rounded-[15px] bg-[#8F6270] top-[2px] left-[2px]"
                style={{ 
                  width: 'calc(50% - 2px)',
                  transform: `translateX(${lang === 'en' ? 0 : '100%'})`
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
                    className={`relative z-10 flex-1 flex items-center justify-center font-barlow text-[15px] md:text-[14px] transition-colors duration-200 cursor-pointer ${
                      isActive ? 'text-white font-bold' : 'text-[#222222] font-medium hover:text-[#5c292c]'
                    }`}
                    style={{ height: '32px' }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Third Divider: subtle 1px line for mobile only - exactly matches Figma Android Compact */}
      <div className="w-full h-[1px] bg-[#c7b0a4]/70 mt-2 mb-3 md:hidden" />

      {/* Floating Action Button for Search (Mobile Only, Staff Only) */}
      {!isDevotee && (
        <div className="md:hidden fixed bottom-14 right-4 z-40">
          <button
            type="button"
            onClick={() => setIsMobileSearchModalOpen(true)}
            className="w-12 h-12 rounded-full bg-[#5c292c] hover:bg-[#482022] text-white shadow-2xl flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer border border-[#c7b0a4]/40"
            title="Search Devotees"
            aria-label="Search Devotees"
            id="mobile-fab-search-btn"
          >
            <svg width="20" height="20" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="white" strokeWidth="1.8"/>
              <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Full Mobile Search Modal */}
      {isMobileSearchModalOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-start p-4 animate-fade-in">
          <div className="bg-[#fbf9f6] rounded-2xl border border-[#ebdccb] shadow-2xl p-4 max-h-[85vh] flex flex-col mt-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#ebdccb]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#5c292c] text-white flex items-center justify-center shadow-xs">
                  <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
                    <circle cx="6" cy="6" r="4.5" stroke="white" strokeWidth="1.8"/>
                    <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-barlow font-bold text-[#5c292c] text-[16px] leading-tight">Search Devotees</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSearchModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white text-gray-500 hover:text-black flex items-center justify-center border border-[#ebdccb] font-bold text-sm shadow-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div className="flex items-center bg-white rounded-full border border-[#ebdccb] shadow-xs px-3.5 h-[42px] focus-within:border-[#5c292c] shrink-0">
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none" className="shrink-0 mr-2 text-[#5c292c]">
                <circle cx="6" cy="6" r="4.5" stroke="#5c292c" strokeWidth="1.8"/>
                <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="#5c292c" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by devotee name, phone, code, place..."
                className="bg-transparent border-none outline-none text-[14px] font-barlow text-black w-full placeholder:text-gray-400"
              />
              {isSearching && (
                <div className="w-4 h-4 border-2 border-[#5c292c] border-t-transparent rounded-full animate-spin shrink-0 mx-1" />
              )}
              {searchQuery && (
                <button
                  onClick={() => {
                    onSearchChange('');
                    setSearchResults([]);
                  }}
                  className="text-gray-400 hover:text-gray-700 text-xl px-1 font-bold cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            {/* Results List */}
            <div className="mt-3 overflow-y-auto flex-1 divide-y divide-[#ebdccb]/60">
              {searchQuery.trim().length < 2 ? null : searchResults.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#8c7b70]">
                  {isSearching ? 'Searching devotee records...' : 'No devotees found matching your query'}
                </div>
              ) : (
                searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleDevoteeSelect(item)}
                    className="py-3 px-2 hover:bg-white rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-bold text-[#5c292c] truncate">
                          {lang === 'ta' && item.name_ta ? item.name_ta : item.name}
                        </p>
                        {item.code && (
                          <span className="text-[10px] bg-[#f4ead7] text-[#5c292c] font-bold px-1.5 py-0.5 rounded">
                            {item.code}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#7a6b61] truncate">
                        <span className="font-semibold text-[#8c5d6b]">{item.kattalai_type || 'Kattalai'}</span>
                        {item.kattalai_date && (
                          <span>• 📅 {item.kattalai_date}/{item.kattalai_month}</span>
                        )}
                        {item.mobile && <span>• 📞 {item.mobile}</span>}
                        {item.place && <span>• 📍 {item.place}</span>}
                      </div>
                    </div>
                    <div
                      className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#f4ead7] text-[#5c292c] hover:bg-[#5c292c] hover:text-white transition-colors shadow-xs"
                      title="Go to devotee"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Modals for Bug Reporting and Password Change */}
      <BugReportModal
        isOpen={isBugModalOpen}
        onClose={() => setIsBugModalOpen(false)}
      />

    </header>
  );
}
