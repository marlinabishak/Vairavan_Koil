import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import BugReportModal from './BugReportModal';

function HamburgerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5c292c" strokeWidth="3" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

export default function SubpageLayout({ children, activePage = '' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const profileContainerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileContainerRef.current && !profileContainerRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  return (
    <div 
      className="w-full min-h-screen flex flex-col bg-cover bg-bottom bg-no-repeat font-barlow text-gray-800"
      style={{ backgroundImage: "linear-gradient(rgba(244, 234, 215, 0.90), rgba(244, 234, 215, 0.90)), url('/background.png')" }}
    >
      {/* Top Header matching Dashboard */}
      <header className="sticky top-0 z-40 bg-[#f4ead7]/95 backdrop-blur-xs px-4 md:px-[120px] pb-1 md:pb-2">
        <div className="flex items-start justify-between relative pt-3 md:pt-[20px]">
          
          {/* Temple Logo */}
          <Link to="/dashboard" className="flex items-center" title="Return to Dashboard">
            <img
              src="/logo.svg"
              alt="Vairavan Koil"
              className="w-[190px] h-[72px] sm:w-[200px] sm:h-[75px] md:w-[247px] md:h-[90px] drop-shadow-xs cursor-pointer hover:opacity-95 transition-opacity"
            />
          </Link>

          {/* Right Header Navigation & Profile Avatar */}
          <div ref={profileContainerRef} className="absolute right-0 top-3 md:top-[40px] flex flex-col items-end">
            <div className="flex items-center">
              {/* Desktop Avatar */}
              <img
                src="/avatar.png"
                alt="Profile"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="hidden md:block object-cover cursor-pointer hover:opacity-90 transition-opacity w-[50px] h-[50px] rounded-[26.5px]"
              />

              {/* Mobile Hamburger Button */}
              <div className="md:hidden flex items-center">
                <button 
                  className="p-1.5 text-[#5c292c] hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  aria-label="Menu"
                >
                  <HamburgerIcon />
                </button>
              </div>
            </div>

            {/* Shared Profile Dropdown Drawer */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-[calc(100vw-32px)] max-w-[320px] md:w-64 bg-[#fbf9f6] rounded-[22px] shadow-[0_20px_50px_-10px_rgba(70,40,20,0.25)] border border-[#ebdccb] z-50 p-3 md:p-2 font-barlow animate-fade-in">
                
                {/* Profile Card */}
                <div className="px-3.5 py-2.5 bg-white rounded-[16px] border border-[#ebdccb] mb-1.5 flex items-center gap-3 shadow-xs">
                  <div className="w-9 h-9 rounded-full bg-[#5c292c] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
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
                      {/* Home Button at the very top */}
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
                          className={`flex items-center gap-2.5 w-full text-left px-3 h-[38px] rounded-[12px] text-[13px] font-medium transition-all ${
                            activePage === 'profiles' ? 'bg-[#5c292c] text-white font-bold' : 'text-gray-700 hover:text-[#5c292c] hover:bg-white'
                          }`}
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
                            className={`flex items-center gap-2.5 w-full text-left px-3 h-[38px] rounded-[12px] text-[13px] font-medium transition-all ${
                              activePage === 'requests' ? 'bg-[#5c292c] text-white font-bold' : 'text-gray-700 hover:text-[#5c292c] hover:bg-white'
                            }`}
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
                            className={`flex items-center gap-2.5 w-full text-left px-3 h-[38px] rounded-[12px] text-[13px] font-medium transition-all ${
                              activePage === 'settings' ? 'bg-[#5c292c] text-white font-bold' : 'text-gray-700 hover:text-[#5c292c] hover:bg-white'
                            }`}
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
                            className={`flex items-center gap-2.5 w-full text-left px-3 h-[38px] rounded-[12px] text-[13px] font-medium transition-all ${
                              activePage === 'whatsapp' ? 'bg-[#5c292c] text-white font-bold' : 'text-gray-700 hover:text-[#5c292c] hover:bg-white'
                            }`}
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
                          className={`flex items-center gap-2.5 w-full text-left px-3 h-[38px] rounded-[12px] text-[13px] font-medium transition-all ${
                            activePage === 'history' ? 'bg-[#5c292c] text-white font-bold' : 'text-gray-700 hover:text-[#5c292c] hover:bg-white'
                          }`}
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
                            className={`flex items-center gap-2.5 w-full text-left px-3 h-[38px] rounded-[12px] text-[13px] font-medium transition-all ${
                              activePage === 'profile' ? 'bg-[#5c292c] text-white font-bold' : 'text-gray-700 hover:text-[#5c292c] hover:bg-white'
                            }`}
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
                            className={`flex items-center gap-2.5 w-full text-left px-3 h-[38px] rounded-[12px] text-[13px] font-medium transition-all ${
                              activePage === 'my-history' ? 'bg-[#5c292c] text-white font-bold' : 'text-gray-700 hover:text-[#5c292c] hover:bg-white'
                            }`}
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
                          className={`flex items-center gap-2.5 w-full text-left px-3 h-[38px] rounded-[12px] text-[13px] font-medium transition-all ${
                            activePage === 'bug-reports' ? 'bg-[#5c292c] text-white font-bold' : 'text-gray-700 hover:text-[#5c292c] hover:bg-white'
                          }`}
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
                        <span className="truncate">Report an Issue / Bug</span>
                      </button>

                      {/* Log Out */}
                      <div className="pt-1 mt-1 border-t border-[#ebdccb]">
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            logout();
                            navigate('/login');
                          }}
                          className="flex items-center gap-2.5 w-full text-left px-3 h-[38px] rounded-[12px] text-[13px] font-semibold text-rose-700 hover:bg-rose-50 transition-all"
                        >
                          <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Log Out</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate('/login');
                      }}
                      className="flex items-center gap-2.5 w-full text-left px-3 h-[38px] rounded-[12px] text-[13px] font-medium text-[#5c292c] hover:bg-white transition-all"
                    >
                      <span>Sign In</span>
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Divider: subtle 1px line on mobile, maroon on desktop (exact match to Dashboard) */}
        <div className="w-full h-[1px] bg-[#c7b0a4]/70 mt-2.5 mb-2 md:my-0 md:bg-[#5c292c] md:mt-[10px]" />
      </header>

      {/* Main Subpage Content */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-3 sm:px-6 md:px-8 py-5 sm:py-7">
        {children}
      </main>

      {/* Bug Report Modal */}
      <BugReportModal
        isOpen={isBugModalOpen}
        onClose={() => setIsBugModalOpen(false)}
      />
    </div>
  );
}
