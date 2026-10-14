import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client.js';

export default function WhatsAppDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('campaign');
  
  // Campaign State
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [preview, setPreview] = useState(null);
  const [selectedUserPreview, setSelectedUserPreview] = useState(null);
  const [previewLang, setPreviewLang] = useState('en');
  const [modalLang, setModalLang] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [error, setError] = useState(null);

  // History State
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await api.whatsappHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePreview = async () => {
    const fDate = new Date(fromDate);
    const tDate = new Date(toDate);
    const diffTime = Math.abs(tDate - fDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (tDate < fDate) {
      setError('To Date cannot be before From Date');
      return;
    }
    if (diffDays > 5) {
      setError('You can only select a maximum range of 5 days at a time.');
      return;
    }

    setError(null);
    setPreviewLoading(true);
    setSendResult(null);

    try {
      const data = await api.whatsappPreview(fromDate, toDate);
      setPreview(data);
    } catch (err) {
      setError(err.message || 'Failed to load preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSend = async (lang) => {
    if (!preview || preview.count === 0) return;

    setSending(true);
    setError(null);
    
    try {
      const data = await api.whatsappSendBatch({ fromDate, toDate, lang });
      setSendResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (user?.role !== 'admin' && user?.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-[#faf8f7] p-8 flex items-center justify-center font-barlow">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-[20px] text-center max-w-md">
          <p className="font-bold text-lg mb-1">Unauthorized Access</p>
          <p className="text-sm">Only Admin and Super Admin can access the WhatsApp Reminder Dashboard.</p>
          <Link to="/dashboard" className="mt-4 inline-block text-xs font-bold text-[#5c292c] hover:underline">
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f7] p-4 sm:p-6 md:p-8 font-barlow relative z-10">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link
                to="/dashboard"
                className="text-[#5c292c] hover:underline font-semibold text-xs flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-[#ebdccb] shadow-sm transition-all self-start"
              >
                ← Back to Dashboard
              </Link>
              {user && (
                <span className="text-xs bg-[#5c292c]/10 text-[#5c292c] font-bold px-2.5 py-0.5 rounded-full capitalize">
                  {user.role}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#5c292c] tracking-tight">
              WhatsApp Reminder Dashboard
            </h1>
          </div>

          {/* Navigation Pill Tabs */}
          <div className="flex items-center bg-[#f7f1e5] p-1 rounded-full border border-[#ebdccb] self-start sm:self-auto shadow-sm">
            <button
              onClick={() => setActiveTab('campaign')}
              className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'campaign'
                  ? 'bg-[#5c292c] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              New Campaign
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-[#5c292c] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Send History
            </button>
          </div>
        </div>

        {activeTab === 'campaign' && (
          <div className="bg-white rounded-[22px] shadow-sm border border-[#ebdccb] p-5 sm:p-7 mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-[#5c292c] mb-1">Select Date Range</h2>
            <p className="text-xs text-gray-500 mb-5">Select a range of up to 5 days to preview upcoming pooja kattalais and trigger reminders.</p>
            
            {/* Date Inputs & Button */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 px-1">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setToDate(e.target.value);
                  }}
                  className="w-full h-[38px] px-4 rounded-full border border-[#e2d8cb] bg-[#faf8f7] text-xs sm:text-sm font-barlow text-gray-800 focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 px-1">To Date (Max 5 Days)</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full h-[38px] px-4 rounded-full border border-[#e2d8cb] bg-[#faf8f7] text-xs sm:text-sm font-barlow text-gray-800 focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c]"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handlePreview}
                  disabled={previewLoading || sending}
                  className="w-full h-[38px] bg-[#5c292c] hover:bg-[#482022] text-white rounded-full font-semibold text-xs sm:text-sm disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {previewLoading ? (
                    'Loading...'
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Load Devotees
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-[16px] text-xs sm:text-sm">
                <p>{error}</p>
              </div>
            )}

            {preview && !sending && !sendResult && (
              <div className="bg-[#faf8f7] rounded-[20px] p-4 sm:p-6 border border-[#ebdccb]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-[#ebdccb]/60">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#5c292c]">Campaign Preview</h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Found <strong className="text-[#5c292c]">{preview.count}</strong> devotee{preview.count === 1 ? '' : 's'} in selected range.
                    </p>
                    
                    {/* Language Switch */}
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-xs font-semibold text-gray-700">Display Language:</span>
                      <div className="flex items-center bg-white p-0.5 rounded-full border border-[#ebdccb]">
                        <button
                          type="button"
                          onClick={() => setPreviewLang('en')}
                          className={`px-3 py-0.5 text-xs font-bold rounded-full transition-all ${
                            previewLang === 'en'
                              ? 'bg-[#5c292c] text-white shadow-xs'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          English
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewLang('ta')}
                          className={`px-3 py-0.5 text-xs font-bold rounded-full transition-all ${
                            previewLang === 'ta'
                              ? 'bg-[#5c292c] text-white shadow-xs'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          தமிழ்
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Export CSV button - hidden for now, logic preserved for future use
                    <button
                      onClick={() => {
                        const isTa = previewLang === 'ta';
                        let headers = isTa
                          ? ['Country Code', 'Mobile Number', 'Contact Name', 'Office Code', 'Place', 'Title', 'Kattalai', 'Kattalai Date', 'Kattalai Month', "Pooja's Time", 'Star']
                          : ['Country Code', 'Mobile Number', 'Contact Name', 'Office Code', 'Place', 'Title', 'Kattalai', 'Kattalai Date', 'Kattalai Month', "Pooja's Time", 'Star', 'Regn.Date', 'Per.Add.1', 'Per.Add.2', 'Per.Add.3', 'KAT-TYPE', 'Comm.Add.1', 'Comm.Add.2', 'Comm.Add.3', 'Comm.Add.4', 'Amount', 'WhatsApp Number', 'Email', 'Let.Intimation'];

                        const csvRows = [headers.join(',')];
                        const sanitize = (str) => '"' + String(str || '').replace(/"/g, '""') + '"';

                        preview.users.forEach(u => {
                          const kDate = String(u.kattalai_date || '').padStart(2, '0');
                          const kMonth = String(u.kattalai_month || '').padStart(2, '0');
                          const ktName = (isTa ? u.kattalai_name_ta : u.kattalai_name) || u.kattalai_name || '';
                          let poojaTime = '-';
                          if (ktName.toLowerCase().includes('uchi') || ktName.includes('உச்சி')) poojaTime = '11:30 AM';
                          else if (ktName.toLowerCase().includes('artha') || ktName.includes('அர்த்த')) poojaTime = '07:30 PM';
                          
                          const name = isTa ? (u.name_ta || u.name) : u.name;
                          const place = isTa ? (u.place_ta || u.place) : u.place;
                          const title = isTa ? (u.title_ta || u.title) : u.title;
                          const star = isTa ? (u.star_ta || u.star) : u.star;

                          if (isTa) {
                            csvRows.push([
                              sanitize(u.country_code || '91'),
                              sanitize(u.whatsapp_number || u.mobile || ''),
                              sanitize(name),
                              sanitize(u.code),
                              sanitize(place),
                              sanitize(title),
                              sanitize(ktName),
                              sanitize(kDate),
                              sanitize(kMonth),
                              sanitize(poojaTime),
                              sanitize(star)
                            ].join(','));
                          } else {
                            const perAdd = (u.permanent_address || '').split(',');
                            const commAdd = (u.communication_address || '').split(',');
                            csvRows.push([
                              sanitize(u.country_code || '91'),
                              sanitize(u.mobile || ''),
                              sanitize(name),
                              sanitize(u.code),
                              sanitize(place),
                              sanitize(title),
                              sanitize(ktName),
                              sanitize(kDate),
                              sanitize(kMonth),
                              sanitize(poojaTime),
                              sanitize(star),
                              sanitize(u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB') : ''),
                              sanitize(perAdd[0]), sanitize(perAdd[1]), sanitize(perAdd[2]),
                              sanitize(u.kat_type || ''),
                              sanitize(commAdd[0]), sanitize(commAdd[1]), sanitize(commAdd[2]), sanitize(commAdd[3]),
                              sanitize(u.amount || '0'),
                              sanitize(u.whatsapp_number || ''),
                              sanitize(u.email || ''),
                              sanitize(u.let_intimation !== null ? u.let_intimation : '')
                            ].join(','));
                          }
                        });
                        
                        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.setAttribute('download', `vairavan_koil_${previewLang}_${fromDate}_${toDate}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      disabled={preview.count === 0}
                      className="px-4 py-2 bg-white border border-[#ebdccb] text-gray-700 hover:text-[#5c292c] rounded-full text-xs font-bold disabled:opacity-50 shadow-xs transition-all"
                    >
                      Export CSV
                    </button>
                    */}

                    <button
                      onClick={() => handleSend('en')}
                      disabled={preview.count === 0}
                      className="px-4 py-2 bg-[#1976d2] hover:bg-[#1565c0] text-white rounded-full text-xs font-bold disabled:opacity-50 shadow-sm transition-all"
                    >
                      Send English
                    </button>

                    <button
                      onClick={() => handleSend('ta')}
                      disabled={preview.count === 0}
                      className="px-4 py-2 bg-[#2e7d32] hover:bg-[#256828] text-white rounded-full text-xs font-bold disabled:opacity-50 shadow-sm transition-all"
                    >
                      Send Tamil
                    </button>
                  </div>
                </div>

                {preview.count > 0 && (
                  <div>
                    {/* Mobile View: Vertical Stacked Cards (Zero horizontal scroll) */}
                    <div className="md:hidden flex flex-col gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                      {preview.users.map((u) => {
                        const isTa = previewLang === 'ta';
                        const kDate = String(u.kattalai_date || '').padStart(2, '0');
                        const kMonth = String(u.kattalai_month || '').padStart(2, '0');
                        const ktName = (isTa ? u.kattalai_name_ta : u.kattalai_name) || u.kattalai_name || '';
                        let poojaTime = '-';
                        if (ktName.toLowerCase().includes('uchi') || ktName.includes('உச்சி')) poojaTime = '11:30 AM';
                        else if (ktName.toLowerCase().includes('artha') || ktName.includes('அர்த்த')) poojaTime = '07:30 PM';

                        const name = isTa ? (u.name_ta || u.name) : u.name;
                        const place = isTa ? (u.place_ta || u.place) : u.place;
                        const star = isTa ? (u.star_ta || u.star) : u.star;

                        return (
                          <div key={u.id} className="bg-white p-3.5 rounded-[16px] border border-[#ebdccb] shadow-2xs flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-bold text-gray-900 text-sm">{name}</p>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">
                                  {u.whatsapp_number || u.mobile || '-'} • <span className="text-[#5c292c] font-bold">{u.code}</span>
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedUserPreview(u);
                                  setModalLang(previewLang);
                                }}
                                className="px-2.5 py-1 text-xs font-semibold text-[#5c292c] bg-[#f7f1e5] hover:bg-[#ede3d5] rounded-full border border-[#ebdccb] shrink-0"
                              >
                                Preview
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-[#f0e6dc] text-[11px] text-gray-600">
                              <div>
                                <span className="font-semibold text-gray-500">Kattalai: </span>{ktName}
                              </div>
                              <div>
                                <span className="font-semibold text-gray-500">Date: </span>{kDate}/{kMonth} ({poojaTime})
                              </div>
                              <div>
                                <span className="font-semibold text-gray-500">Place: </span>{place || '-'}
                              </div>
                              <div>
                                <span className="font-semibold text-gray-500">Star: </span>{star || '-'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop View: Full Data Table */}
                    <div className="hidden md:block overflow-x-auto max-h-[500px] bg-white border border-[#ebdccb] rounded-[18px]">
                      <table className="min-w-full divide-y divide-[#ebdccb] text-xs">
                        <thead className="bg-[#f7f1e5] sticky top-0 text-[#5c292c]">
                          <tr>
                            {/* Hidden for now to avoid table scroll - re-enable later
                            <th className="px-3 py-2.5 text-left font-bold whitespace-nowrap">Mobile</th>
                            */}
                            <th className="px-3 py-2.5 text-left font-bold whitespace-nowrap">Contact Name</th>
                            {/* Hidden for now to avoid table scroll - re-enable later
                            <th className="px-3 py-2.5 text-left font-bold whitespace-nowrap">Office Code</th>
                            */}
                            <th className="px-3 py-2.5 text-left font-bold whitespace-nowrap">Place</th>
                            <th className="px-3 py-2.5 text-left font-bold whitespace-nowrap">Title</th>
                            <th className="px-3 py-2.5 text-left font-bold whitespace-nowrap">Kattalai</th>
                            <th className="px-3 py-2.5 text-center font-bold whitespace-nowrap">Date</th>
                            <th className="px-3 py-2.5 text-center font-bold whitespace-nowrap">Month</th>
                            {/* Hidden for now to avoid table scroll - re-enable later
                            <th className="px-3 py-2.5 text-left font-bold whitespace-nowrap">Pooja Time</th>
                            */}
                            <th className="px-3 py-2.5 text-left font-bold whitespace-nowrap">Star</th>
                            <th className="px-3 py-2.5 text-center font-bold whitespace-nowrap">Preview</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0e6dc]">
                          {preview.users.map((u) => {
                            const isTa = previewLang === 'ta';
                            const kDate = String(u.kattalai_date || '').padStart(2, '0');
                            const kMonth = String(u.kattalai_month || '').padStart(2, '0');
                            const ktName = (isTa ? u.kattalai_name_ta : u.kattalai_name) || u.kattalai_name || '';
                            let poojaTime = '-';
                            if (ktName.toLowerCase().includes('uchi') || ktName.includes('உச்சி')) poojaTime = '11:30 AM';
                            else if (ktName.toLowerCase().includes('artha') || ktName.includes('அர்த்த')) poojaTime = '07:30 PM';

                            return (
                              <tr key={u.id} className="hover:bg-[#faf6f0] transition-colors">
                                {/* Hidden for now to avoid table scroll - re-enable later
                                <td className="px-3 py-2 whitespace-nowrap font-mono text-gray-700">{u.whatsapp_number || u.mobile || '-'}</td>
                                */}
                                <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">{isTa ? (u.name_ta || u.name) : u.name || '-'}</td>
                                {/* Hidden for now to avoid table scroll - re-enable later
                                <td className="px-3 py-2 whitespace-nowrap font-mono font-bold text-[#5c292c]">{u.code || '-'}</td>
                                */}
                                <td className="px-3 py-2 whitespace-nowrap text-gray-700">{isTa ? (u.place_ta || u.place) : u.place || '-'}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-gray-600">{isTa ? (u.title_ta || u.title) : u.title || '-'}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-gray-800">{ktName || '-'}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-center text-gray-700">{kDate}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-center text-gray-700">{kMonth}</td>
                                {/* Hidden for now to avoid table scroll - re-enable later
                                <td className="px-3 py-2 whitespace-nowrap font-semibold text-[#5c292c]">{poojaTime}</td>
                                */}
                                <td className="px-3 py-2 whitespace-nowrap text-gray-700">{isTa ? (u.star_ta || u.star) : u.star || '-'}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                  <button
                                    onClick={() => {
                                      setSelectedUserPreview(u);
                                      setModalLang(previewLang);
                                    }}
                                    className="p-1 text-[#5c292c] hover:bg-[#5c292c]/10 rounded-full transition-colors"
                                    title="View Message Preview"
                                  >
                                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {sending && (
              <div className="flex flex-col items-center justify-center py-12 bg-[#faf8f7] rounded-[20px] border border-[#ebdccb]">
                <div className="w-12 h-12 border-4 border-[#5c292c] border-t-transparent rounded-full animate-spin mb-4"></div>
                <h3 className="text-lg font-bold text-[#5c292c] mb-1">Sending WhatsApp Reminders...</h3>
                <p className="text-xs text-gray-600 text-center max-w-md">
                  Please keep this page open. Dispatching messages in safe batches to avoid gateway throttling.
                </p>
              </div>
            )}

            {sendResult && (
              <div className="bg-green-50 rounded-[20px] p-6 sm:p-8 border border-green-200 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Campaign Complete!</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-5">
                  Reminders dispatched for <strong>{sendResult.targetDate}</strong> using <strong>{sendResult.lang === 'en' ? 'English' : 'Tamil'}</strong> template.
                </p>
                
                <div className="flex justify-center gap-6 sm:gap-10 mb-6">
                  <div>
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wide">Total Attempted</p>
                    <p className="text-xl font-bold text-gray-900">{sendResult.total}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-green-700 font-bold uppercase tracking-wide">Delivered</p>
                    <p className="text-xl font-bold text-green-600">{sendResult.sent}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-red-700 font-bold uppercase tracking-wide">Failed</p>
                    <p className="text-xl font-bold text-red-500">{sendResult.failed}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSendResult(null);
                    setPreview(null);
                  }}
                  className="px-6 py-2.5 bg-[#5c292c] hover:bg-[#482022] text-white rounded-full font-semibold text-xs sm:text-sm shadow-sm transition-all"
                >
                  Start New Campaign
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-[22px] shadow-sm border border-[#ebdccb] p-5 sm:p-7 mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-[#5c292c] mb-1">WhatsApp Send History</h2>
            <p className="text-xs text-gray-500 mb-5">Audit trail of automated and manual WhatsApp reminder dispatches.</p>

            {historyLoading ? (
              <div className="p-8 text-center text-gray-500 font-medium">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="p-8 text-center text-gray-500 font-medium bg-[#faf8f7] rounded-[18px] border border-[#ebdccb]">
                No campaigns have been sent yet.
              </div>
            ) : (
              <div>
                {/* Mobile View: Vertical Stacked Cards (Zero horizontal scroll) */}
                <div className="md:hidden flex flex-col gap-3">
                  {history.map((log) => (
                    <div key={log.id} className="bg-[#faf8f7] p-4 rounded-[18px] border border-[#ebdccb] flex flex-col gap-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{log.target_date}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Sent {new Date(log.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          log.failed > 0
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-green-100 text-green-800 border-green-200'
                        }`}>
                          {log.failed > 0 ? `${log.failed} Failed` : 'Success'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#ebdccb]/60 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="bg-white px-2 py-0.5 rounded-full border border-[#ebdccb] text-[11px] font-bold text-gray-700">
                            {log.lang === 'en' ? 'English' : 'Tamil'}
                          </span>
                          <span className="text-gray-500 capitalize text-[11px]">By {log.triggered_by}</span>
                        </div>
                        <div className="font-bold text-gray-800">
                          <span className="text-green-600">{log.sent}</span> / {log.total}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View: Full Data Table */}
                <div className="hidden md:block overflow-hidden border border-[#ebdccb] rounded-[18px]">
                  <table className="min-w-full divide-y divide-[#ebdccb] text-xs">
                    <thead className="bg-[#f7f1e5] text-[#5c292c]">
                      <tr>
                        <th className="px-5 py-3 text-left font-bold uppercase tracking-wider">Date Triggered</th>
                        <th className="px-5 py-3 text-left font-bold uppercase tracking-wider">Target Date(s)</th>
                        <th className="px-5 py-3 text-left font-bold uppercase tracking-wider">Language</th>
                        <th className="px-5 py-3 text-left font-bold uppercase tracking-wider">Triggered By</th>
                        <th className="px-5 py-3 text-left font-bold uppercase tracking-wider">Stats (Sent / Total)</th>
                        <th className="px-5 py-3 text-left font-bold uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#f0e6dc]">
                      {history.map((log) => (
                        <tr key={log.id} className="hover:bg-[#faf6f0] transition-colors">
                          <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">
                            {new Date(log.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-900">
                            {log.target_date}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap text-gray-800">
                            <span className="bg-[#f7f1e5] px-2 py-0.5 rounded-full border border-[#ebdccb] text-[11px] font-semibold">
                              {log.lang === 'en' ? 'English' : 'Tamil'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap text-gray-600 capitalize">
                            {log.triggered_by}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap font-bold">
                            <span className="text-green-600">{log.sent}</span> / {log.total}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {log.failed > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                                {log.failed} Failed
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-800 border border-green-200">
                                Success
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Individual User Preview Modal */}
      {selectedUserPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[100] p-3 sm:p-4 animate-fade-in overflow-y-auto">
          <div className="bg-[#f7f1e5] border border-[#ebdccb] rounded-[26px] shadow-2xl w-full max-w-[580px] my-auto overflow-hidden font-barlow relative flex flex-col">
            
            {/* Modal Header */}
            <div className="px-5 py-2.5 border-b border-[#ebdccb] bg-[#fbf9f6] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xs">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.06-2.146-.541-1.748-.724-2.884-2.496-2.971-2.612-.088-.117-.714-.951-.714-1.815 0-.865.454-1.29.615-1.465.162-.175.353-.219.47-.219.118 0 .236.002.338.007.108.005.253-.041.396.301.147.351.503 1.229.547 1.319.044.09.073.195.015.312-.059.117-.088.19-.176.293-.088.102-.186.228-.266.307-.088.087-.18.182-.077.359.103.175.458.756.983 1.224.676.602 1.246.788 1.423.876.176.088.279.073.382-.044.103-.117.441-.513.559-.689.118-.175.235-.146.397-.088.162.058 1.029.485 1.206.573.176.088.294.132.338.205.044.073.044.424-.1.829z" />
                  </svg>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-[#5c292c]">WhatsApp Message Preview</h2>
              </div>

              {/* Language Switcher pill & Close */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#f7f1e5] p-0.5 rounded-full border border-[#ebdccb]">
                  <button
                    type="button"
                    onClick={() => setModalLang('ta')}
                    className={`px-2.5 py-0.5 text-xs font-bold rounded-full transition-all ${
                      (modalLang || previewLang) === 'ta'
                        ? 'bg-[#5c292c] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    தமிழ்
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalLang('en')}
                    className={`px-2.5 py-0.5 text-xs font-bold rounded-full transition-all ${
                      (modalLang || previewLang) === 'en'
                        ? 'bg-[#5c292c] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    English
                  </button>
                </div>

                <button
                  onClick={() => setSelectedUserPreview(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:text-[#5c292c] hover:bg-black/5"
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Modal Body: Realistic WhatsApp chat container */}
            <div className="p-3.5 sm:p-4 bg-[#efeae2]">
              {(() => {
                const u = selectedUserPreview;
                const isTa = (modalLang || previewLang) === 'ta';
                const kDate = String(u.kattalai_date || '').padStart(2, '0');
                const kMonth = String(u.kattalai_month || '').padStart(2, '0');
                
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const previewYear = fromDate ? fromDate.split('-')[0] : String(new Date().getFullYear());
                const formattedDate = `${kDate}.${monthNames[parseInt(kMonth) - 1] || kMonth}.${previewYear.slice(2)}`;

                let finalKattalaiName = u.kattalai_name || '';
                let finalKattalaiNameTa = u.kattalai_name_ta || '';
                if (finalKattalaiName.toLowerCase().includes('uchi')) {
                  finalKattalaiName = 'Uchikkalam';
                  finalKattalaiNameTa = 'உச்சிக்காலம்';
                } else if (finalKattalaiName.toLowerCase().includes('artha')) {
                  finalKattalaiName = 'Arthajamam';
                  finalKattalaiNameTa = 'அர்த்தஜாமம்';
                }

                let poojaTime = '11:30 AM';
                if (finalKattalaiName.toLowerCase().includes('uchi') || finalKattalaiNameTa.includes('உச்சி')) poojaTime = '11:30 AM';
                else if (finalKattalaiName.toLowerCase().includes('artha') || finalKattalaiNameTa.includes('அர்த்த')) poojaTime = '07:30 PM';

                const name = (isTa ? (u.name_ta || u.name) : u.name || '').trim();
                const place = (isTa ? (u.place_ta || u.place) : u.place || '').trim();
                const title = (isTa ? (u.title_ta || u.title) : u.title || '').trim();
                const star = (isTa ? (u.star_ta || u.star) : u.star || '').trim();
                const code = u.code || '-';

                return (
                  <div className="bg-white rounded-[16px] rounded-tl-sm p-3.5 sm:p-4 shadow-sm border border-[#e1dad0] text-[12.5px] sm:text-[13px] leading-relaxed text-gray-800 font-barlow">
                    {isTa ? (
                      <div className="flex flex-col gap-1.5">
                        <p className="font-semibold text-gray-700">
                          (அலுவலக  குறியீடு எண்: <strong>{code}</strong>)
                        </p>

                        <p className="font-bold text-gray-900">
                          {place}.
                        </p>

                        <p>
                          <strong>{title ? `${title}.` : ''}{name}</strong> அவர்களுக்கு, வணக்கம்.<br />
                          🙏🏻🙏🏻🙏🏻
                        </p>

                        <p>
                          இப்பவும் தங்களது <strong>{finalKattalaiNameTa}</strong> கட்டளை அர்ச்சனை <strong>{formattedDate}</strong> அன்று நடைபெறயிருக்கிறது.
                        </p>

                        <p>
                          நட்சத்திரம் : <strong>{star}</strong>.
                        </p>

                        <p>
                          அதற்க்கும் தாங்கள் குடும்பத்தாருடன் அன்றைய தினம்  <strong>{poojaTime}</strong>  மணிக்குள் நமது திருக்கோயிலுக்கு வந்து ஸ்ரீவடிவுடையம்பாள் சமேத ஸ்ரீவளரொளிநாதர், ஸ்ரீவயிரவசுவாமியை வணங்கி அருட்பிரசாதம் பெற்றுசெல்ல வேண்டுகிறோம்.
                        </p>

                        <p>
                          இப்படிக்கு,<br />
                          <strong>செயலாளர்,</strong><br />
                          வயிரவன்கோயில் நகரத்தார் தர்மபரிபாலன சபை.
                        </p>

                        <div className="pt-1.5 border-t border-gray-100 text-[11.5px] text-gray-600">
                          <p className="font-bold text-gray-800 mb-0.5">பின்குறிப்பு:</p>
                          <p>தங்கள் வருகைக்கும் முன்கூட்டியே கீழ்காணும் எண்ணிற்க்கு தகவல் தெரிவிக்க வேண்டுகிறோம்.</p>
                          <p className="mt-0.5 font-semibold text-gray-800">கைபேசி : 9363691192/6381605927.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <p className="font-semibold text-gray-700">
                          (Office Reference Code: <strong>{code}</strong>)
                        </p>

                        <p>
                          <strong>{title ? `${title}.` : ''}{name}</strong> Avargal,
                        </p>

                        <p>
                          Vanakkam.<br />
                          🙏 🙏 🙏
                        </p>

                        <p>
                          Your <strong>{finalKattalaiName}</strong> Pooja Sponsor Date is on <strong>{formattedDate}</strong> at <strong>{poojaTime}</strong>.
                        </p>

                        <p>
                          Your Native Place: <strong>{place}</strong>.<br />
                          Your Star: <strong>{star}</strong>.
                        </p>

                        <p>
                          We request you to visit along with your Family to our Temple Arulmigu Sri Vadivudaiambaal Sameda Sri Valarolinathar Vairavar Swamy Temple to seek divine Blessings and Prasadam.
                        </p>

                        <p>
                          Om Nama Shivaya,<br />
                          <strong>Secretary,</strong><br />
                          Vairavan Koil Nagarathar Dharma Paribalana Sabai.
                        </p>

                        <div className="pt-1.5 border-t border-gray-100 text-[11.5px] text-gray-600">
                          <p className="font-bold text-gray-800 mb-0.5">NB:</p>
                          <p>Please inform your attendance in advance to the following Temple official numbers.</p>
                          <p className="mt-0.5"><strong>Ul Thurai:</strong> 6381605927.</p>
                          <p className="mt-0.5">To make any amendments/changes to your personal information please contact Secretary on <strong>9363691192</strong></p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
