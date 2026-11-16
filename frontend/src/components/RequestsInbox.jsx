import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function RequestsInbox({ showEmptyMessage = false }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'rejected', 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Trigger Modal for complete request details
  const [selectedRequest, setSelectedRequest] = useState(null);


  const loadRequests = async () => {
    try {
      setError(null);
      const data = await api.getEditRequests();
      setRequests(data || []);
    } catch (err) {
      console.error('Failed to load kattalai edit requests:', err);
      setError(err.message || 'Failed to load kattalai edit requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (reqItem) => {
    const confirmMsg = `Are you sure you want to approve the edit request for "${reqItem.booking_name}" (${reqItem.booking_code})?\n\nThis will unlock their Nithiya Kattalai record so they can update their details.`;
    if (!window.confirm(confirmMsg)) return;

    setActionLoadingId(reqItem.id);
    try {
      const res = await api.updateEditRequestStatus(reqItem.id, 'approved');
      const updatedItem = {
        ...reqItem,
        ...res,
        status: 'approved',
        updated_at: new Date().toISOString()
      };
      setRequests(prev => prev.map(r => r.id === reqItem.id ? updatedItem : r));
      if (selectedRequest && selectedRequest.id === reqItem.id) {
        setSelectedRequest(updatedItem);
      }
      alert(`Edit permission granted for "${reqItem.booking_name}"! They can now edit their details.`);
    } catch (err) {
      alert(err.message || 'Failed to approve edit request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (reqItem) => {
    const confirmMsg = `Are you sure you want to reject the edit request for "${reqItem.booking_name}" (${reqItem.booking_code})?`;
    if (!window.confirm(confirmMsg)) return;

    setActionLoadingId(reqItem.id);
    try {
      const res = await api.updateEditRequestStatus(reqItem.id, 'rejected');
      const updatedItem = {
        ...reqItem,
        ...res,
        status: 'rejected',
        updated_at: new Date().toISOString()
      };
      setRequests(prev => prev.map(r => r.id === reqItem.id ? updatedItem : r));
      if (selectedRequest && selectedRequest.id === reqItem.id) {
        setSelectedRequest(updatedItem);
      }
      alert(`Edit request for "${reqItem.booking_name}" has been rejected.`);
    } catch (err) {
      alert(err.message || 'Failed to reject edit request');
    } finally {
      setActionLoadingId(null);
    }
  };


  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  const filteredRequests = requests.filter(r => {
    if (activeTab === 'pending' && r.status !== 'pending') return false;
    if (activeTab === 'approved' && r.status !== 'approved') return false;
    if (activeTab === 'rejected' && r.status !== 'rejected') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const code = (r.booking_code || '').toLowerCase();
      const name = (r.booking_name || '').toLowerCase();
      const place = (r.booking_place || '').toLowerCase();
      const star = (r.booking_star || '').toLowerCase();
      const mobile = (r.booking_mobile || '').toLowerCase();
      const type = (r.kattalai_type_name || '').toLowerCase();
      return code.includes(q) || name.includes(q) || place.includes(q) || star.includes(q) || mobile.includes(q) || type.includes(q);
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatDateTime = (dateVal) => {
    if (!dateVal) return { date: '-', time: '', full: '-' };
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return { date: String(dateVal), time: '', full: String(dateVal) };
    const date = d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const time = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return { date, time, full: `${date}, ${time}` };
  };

  const hasBeenUpdated = (r) => {
    if (r.status !== 'approved') return false;
    if (!r.booking_updated_at) return false;
    const reqTime = new Date(r.updated_at || r.created_at).getTime();
    const updateTime = new Date(r.booking_updated_at).getTime();
    return updateTime > reqTime + 2000;
  };

  const getStatusPill = (r) => {
    if (r.status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
          Pending Review
        </span>
      );
    }
    if (r.status === 'approved') {
      const isUpdated = hasBeenUpdated(r);
      if (isUpdated) {
        const uDt = formatDateTime(r.booking_updated_at);
        return (
          <div className="flex flex-col items-center">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
              <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              Details Updated
            </span>
            <span className="text-[10px] text-gray-500 mt-0.5">{uDt.date}</span>
          </div>
        );
      }
      return (
        <div className="flex flex-col items-center">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-green-50 text-green-800 border border-green-200">
            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            Permission Granted
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold mt-0.5">Edit Access Unlocked</span>
        </div>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-200">
        <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
        Rejected
      </span>
    );
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="w-full bg-white rounded-[22px] shadow-sm border border-[#ebdccb] p-8 text-center text-gray-500 font-barlow">
        <div className="w-8 h-8 border-3 border-[#5c292c] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        Loading kattalai edit requests...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white rounded-[22px] shadow-sm border border-red-200 p-8 text-center font-barlow">
        <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-2 font-bold">✕</div>
        <p className="text-red-700 font-bold mb-1">Failed to load kattalai edit requests</p>
        <p className="text-xs text-red-500 mb-3">{error}</p>
        <button
          onClick={loadRequests}
          className="px-4 py-1.5 bg-[#5c292c] text-white rounded-full text-xs font-bold hover:bg-[#4a2123] transition-all cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-[22px] shadow-sm border border-[#ebdccb] p-5 sm:p-6 font-barlow text-gray-800">
      
      {/* Top Header & Tabs Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#ebdccb]/70 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#f7f1e5] text-[#5c292c] border border-[#ebdccb] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-[#5c292c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-[19px] sm:text-[21px] font-bold text-[#5c292c] flex items-center gap-2">
              <span>Kattalai Edit Requests</span>
              {pendingCount > 0 && (
                <span className="bg-[#c2410c] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs animate-pulse">
                  {pendingCount} Pending
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500">Review and approve devotee permission requests to modify locked Nithiya Kattalai records</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#faf8f5] p-1 rounded-xl border border-[#ebdccb] shrink-0 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-[#5c292c] text-white shadow-xs font-bold'
                : 'text-gray-600 hover:text-[#5c292c]'
            }`}
          >
            <span>Pending</span>
            {pendingCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'pending' ? 'bg-white text-[#5c292c]' : 'bg-[#5c292c] text-white'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('approved'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'approved'
                ? 'bg-[#5c292c] text-white shadow-xs font-bold'
                : 'text-gray-600 hover:text-[#5c292c]'
            }`}
          >
            <span>Approved</span>
            <span className="text-[10px] opacity-80">({approvedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('rejected'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'rejected'
                ? 'bg-[#5c292c] text-white shadow-xs font-bold'
                : 'text-gray-600 hover:text-[#5c292c]'
            }`}
          >
            <span>Rejected</span>
            <span className="text-[10px] opacity-80">({rejectedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#5c292c] text-white shadow-xs font-bold'
                : 'text-gray-600 hover:text-[#5c292c]'
            }`}
          >
            All ({requests.length})
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="my-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search devotee, code (e.g. A/4/267), place, mobile..."
            className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-[#ebdccb] bg-[#faf8f5] focus:bg-white focus:outline-none focus:border-[#5c292c] text-gray-800 placeholder-gray-400 transition-all shadow-xs"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0118 0z" />
          </svg>
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
              className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 font-medium self-end sm:self-center">
          <div>
            Total: <strong className="text-gray-800">{filteredRequests.length}</strong> request{filteredRequests.length === 1 ? '' : 's'}
          </div>
          <div className="flex items-center gap-1.5">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="text-xs border border-[#ebdccb] rounded-lg px-2 py-1 bg-[#faf8f5] focus:outline-none focus:border-[#5c292c] cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      {filteredRequests.length === 0 ? (
        <div className="bg-[#faf8f5] border border-[#ebdccb] rounded-[18px] p-8 text-center text-gray-500 my-2">
          <div className="w-12 h-12 rounded-full bg-[#ede4d8] text-[#5c292c] flex items-center justify-center mx-auto mb-2.5">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-bold text-gray-700">No {activeTab} Kattalai edit requests found</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {searchQuery
              ? 'No requests matched your search query.'
              : activeTab === 'pending'
              ? 'All devotee edit permission requests have been reviewed and approved.'
              : 'No records found for this view.'}
          </p>
        </div>
      ) : (
        <div className="rounded-[18px] border border-[#ebdccb] overflow-hidden my-2 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f7f1e5] border-b border-[#ebdccb] text-[#5c292c] text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-3.5 w-12 text-center">S.No</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Requested Date</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Kattalai Code</th>
                  <th className="py-3 px-3.5">Devotee Information</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Kattalai Session</th>
                  <th className="py-3 px-3.5 whitespace-nowrap text-center">Permission Status</th>
                  <th className="py-3 px-3.5 whitespace-nowrap text-center">Actions</th>
                  <th className="py-3 px-3 w-16 text-center">Trigger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0e6dc] text-xs">
                {paginatedRequests.map((r, index) => {
                  const sNo = (currentPage - 1) * pageSize + index + 1;
                  const dt = formatDateTime(r.created_at);
                  const isUchikala = (r.booking_code && (r.booking_code.startsWith('U/') || r.booking_code.startsWith('UK/'))) || (r.kattalai_type_color && r.kattalai_type_color.includes('morning'));

                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedRequest(r)}
                      className="hover:bg-[#faf6f0] transition-colors cursor-pointer group"
                    >
                      {/* S.No */}
                      <td className="py-3 px-3.5 text-center font-medium text-gray-600 text-xs">
                        {sNo}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-semibold text-gray-900 text-xs">{dt.date}</div>
                        <div className="text-[10px] text-gray-500">{dt.time}</div>
                      </td>

                      {/* Code */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs bg-[#5c292c] text-white px-2.5 py-0.5 rounded-md tracking-wider shadow-2xs">
                          {r.booking_code || '-'}
                        </span>
                      </td>

                      {/* Devotee Information */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-gray-900 text-xs sm:text-[13px] flex items-center gap-1.5 flex-wrap">
                          <span>{r.booking_title ? `${r.booking_title} ` : ''}{r.booking_name}</span>
                          {r.booking_place && (
                            <span className="text-[10px] bg-[#f2eade] text-[#5c292c] font-semibold px-2 py-0.2 rounded-full border border-[#e2d8cb]">
                              {r.booking_place}
                            </span>
                          )}
                          {r.booking_star && (
                            <span className="text-[10px] bg-amber-50 text-amber-800 font-semibold px-2 py-0.2 rounded-full border border-amber-200">
                              ★ {r.booking_star}
                            </span>
                          )}
                        </div>
                        {r.booking_mobile && (
                          <div className="text-[11px] text-gray-500 font-mono mt-0.5 flex items-center gap-1">
                            <span>📞 +91 {r.booking_mobile}</span>
                          </div>
                        )}
                      </td>

                      {/* Kattalai Session */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isUchikala ? 'bg-[#f37435]' : 'bg-[#4b779a]'}`}></span>
                          <span className="font-semibold text-gray-800 text-xs">
                            {r.kattalai_date ? `${String(r.kattalai_date).padStart(2, '0')}/${String(r.kattalai_month).padStart(2, '0')}` : '-'}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-gray-500 mt-0.5 font-medium">
                          {r.kattalai_type_name || (isUchikala ? 'Uchikala Kattalai (11:30 AM)' : 'Arthajama Kattalai (7:30 PM)')}
                        </div>
                      </td>

                      {/* Permission Status */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-center">
                        {getStatusPill(r)}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                        {r.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              disabled={actionLoadingId === r.id}
                              onClick={() => handleApprove(r)}
                              className="px-3 py-1 bg-[#2e7d32] hover:bg-[#256828] text-white rounded-full text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                              title="Grant Edit Permission"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={actionLoadingId === r.id}
                              onClick={() => handleReject(r)}
                              className="px-2.5 py-1 bg-white border border-[#ebdccb] text-red-600 hover:bg-red-50 rounded-full text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                              title="Reject Request"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold text-gray-400">
                            Processed
                          </span>
                        )}
                      </td>

                      {/* Trigger / Inspect */}
                      <td className="py-3 px-3 text-center" onClick={(e) => { e.stopPropagation(); setSelectedRequest(r); }}>
                        <button
                          type="button"
                          className="w-7 h-7 rounded-full bg-[#f7f1e5] hover:bg-[#5c292c] text-[#5c292c] hover:text-white transition-all inline-flex items-center justify-center cursor-pointer shadow-2xs"
                          title="Trigger Details & Inspection"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Pagination Controls */}
      {filteredRequests.length > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#ebdccb]/60 mt-3 text-xs">
          <div className="text-gray-500">
            Showing <strong className="text-gray-800">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-gray-800">{Math.min(currentPage * pageSize, filteredRequests.length)}</strong> of{' '}
            <strong className="text-gray-800">{filteredRequests.length}</strong> requests
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-[#ebdccb] bg-[#faf8f5] hover:bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold cursor-pointer"
            >
              ‹ Prev
            </button>

            {getPageNumbers().map((p, idx) => (
              <button
                key={idx}
                type="button"
                disabled={p === '...'}
                onClick={() => typeof p === 'number' && setCurrentPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  p === currentPage
                    ? 'bg-[#5c292c] text-white shadow-xs'
                    : p === '...'
                    ? 'cursor-default text-gray-400'
                    : 'bg-[#faf8f5] hover:bg-white text-gray-700 border border-[#ebdccb]'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-[#ebdccb] bg-[#faf8f5] hover:bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold cursor-pointer"
            >
              Next ›
            </button>
          </div>
        </div>
      )}

      {/* Trigger Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-3 sm:p-4 animate-fade-in font-barlow">
          <div className="relative bg-[#faf8f5] border border-[#ebdccb] rounded-[24px] max-w-[620px] w-full p-5 sm:p-6 shadow-2xl my-auto flex flex-col gap-4 text-[#3d332a] max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#ebdccb]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#5c292c] text-white flex items-center justify-center text-lg font-bold shrink-0 shadow-sm">
                  📝
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-[#5c292c] tracking-tight">
                      Kattalai Edit Request
                    </h3>
                    <span className="font-mono font-bold text-xs bg-[#5c292c] text-white px-2.5 py-0.5 rounded-md">
                      {selectedRequest.booking_code || '-'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Requested on {formatDateTime(selectedRequest.created_at).full}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-black hover:bg-black/5 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Permission Status Banner */}
            <div className="p-3 rounded-xl border bg-white border-[#ebdccb]">
              <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider block">
                Current Status
              </span>
              <div className="mt-1">
                {getStatusPill(selectedRequest)}
              </div>
            </div>

            {/* Devotee Record Details Card */}
            <div className="bg-white p-4 rounded-xl border border-[#ebdccb] flex flex-col gap-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#5c292c] border-b border-[#ebdccb]/60 pb-1.5">
                Devotee & Kattalai Record
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 block">Full Name:</span>
                  <span className="font-bold text-gray-900 text-sm">
                    {selectedRequest.booking_title ? `${selectedRequest.booking_title} ` : ''}{selectedRequest.booking_name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Native Place (ஊர்):</span>
                  <span className="font-semibold text-gray-800">{selectedRequest.booking_place || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Star (நட்சத்திரம்):</span>
                  <span className="font-semibold text-gray-800">{selectedRequest.booking_star || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Mobile Number:</span>
                  <span className="font-mono font-bold text-gray-800">
                    {selectedRequest.booking_mobile ? `+91 ${selectedRequest.booking_mobile}` : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Kattalai Session:</span>
                  <span className="font-bold text-[#5c292c]">
                    {selectedRequest.kattalai_type_name || 'Nithiya Kattalai'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Annual Kattalai Date:</span>
                  <span className="font-bold text-gray-800">
                    {selectedRequest.kattalai_date ? `${String(selectedRequest.kattalai_date).padStart(2, '0')}/${String(selectedRequest.kattalai_month).padStart(2, '0')}` : '-'}
                  </span>
                </div>
              </div>

              {(selectedRequest.per_add_1 || selectedRequest.booking_email) && (
                <div className="border-t border-[#ebdccb]/60 pt-2 text-xs flex flex-col gap-1">
                  {selectedRequest.booking_email && (
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <span className="text-gray-400">Email:</span>
                      <span className="font-mono">{selectedRequest.booking_email}</span>
                    </div>
                  )}
                  {selectedRequest.per_add_1 && (
                    <div className="text-gray-600">
                      <span className="text-gray-400">Address: </span>
                      <span>{[selectedRequest.per_add_1, selectedRequest.per_add_2, selectedRequest.per_add_3].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#ebdccb]">
              {selectedRequest.status === 'pending' ? (
                <>
                  <button
                    type="button"
                    disabled={actionLoadingId === selectedRequest.id}
                    onClick={() => handleReject(selectedRequest)}
                    className="px-4 py-2 bg-white border border-[#ebdccb] text-red-600 hover:bg-red-50 rounded-full text-xs font-bold transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={actionLoadingId === selectedRequest.id}
                    onClick={() => handleApprove(selectedRequest)}
                    className="px-5 py-2 bg-[#2e7d32] hover:bg-[#256828] text-white rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    Approve Permission
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-5 py-2 bg-[#5c292c] hover:bg-[#4a2123] text-white rounded-full text-xs font-bold transition-all cursor-pointer"
                >
                  Close
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
