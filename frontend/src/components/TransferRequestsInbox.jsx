import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function TransferRequestsInbox({ showEmptyMessage = false }) {
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
      const data = await api.getTransferRequests('all');
      setRequests(data || []);
    } catch (err) {
      console.error('Failed to load transfer requests:', err);
      setError(err.message || 'Failed to load transfer requests');
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
    const confirmMsg = `Are you sure you want to approve the account transfer from "${reqItem.booking_name}" to "${reqItem.title || ''} ${reqItem.name}"?\n\nThis will permanently update the kattalai record to "Inheritance" and assign it to the new successor.`;
    if (!window.confirm(confirmMsg)) return;

    setActionLoadingId(reqItem.id);
    try {
      const res = await api.approveTransferRequest(reqItem.id);
      const updatedItem = {
        ...reqItem,
        status: 'approved',
        approved_by_name: user?.name || 'Administrator',
        approved_by_role: user?.role || 'admin',
        approved_at: new Date().toISOString()
      };
      setRequests(prev => prev.map(r => r.id === reqItem.id ? updatedItem : r));
      if (selectedRequest && selectedRequest.id === reqItem.id) {
        setSelectedRequest(updatedItem);
      }
      alert(res.message || 'Account transfer approved and executed successfully!');
    } catch (err) {
      alert(err.message || 'Failed to approve transfer request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (reqItem) => {
    const reason = window.prompt(`Enter rejection reason for "${reqItem.booking_name}" -> "${reqItem.name}":`, '');
    if (reason === null) return; // User cancelled

    setActionLoadingId(reqItem.id);
    try {
      const res = await api.rejectTransferRequest(reqItem.id, reason);
      const updatedItem = {
        ...reqItem,
        status: 'rejected',
        rejection_reason: reason,
        approved_by_name: user?.name || 'Administrator',
        approved_by_role: user?.role || 'admin',
        approved_at: new Date().toISOString()
      };
      setRequests(prev => prev.map(r => r.id === reqItem.id ? updatedItem : r));
      if (selectedRequest && selectedRequest.id === reqItem.id) {
        setSelectedRequest(updatedItem);
      }
      alert(res.message || 'Transfer request rejected');
    } catch (err) {
      alert(err.message || 'Failed to reject transfer request');
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
      const origName = (r.booking_name || '').toLowerCase();
      const newName = (r.name || '').toLowerCase();
      const newNameTa = (r.name_ta || '').toLowerCase();
      const mobile = (r.mobile || '').toLowerCase();
      const ref = (r.payment_id || '').toLowerCase();
      return code.includes(q) || origName.includes(q) || newName.includes(q) || newNameTa.includes(q) || mobile.includes(q) || ref.includes(q);
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatDateTime = (dateVal) => {
    if (!dateVal) return { date: '-', time: '' };
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return { date: String(dateVal), time: '' };
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

  const getPaymentPill = (mode, amount) => {
    const m = (mode || 'cash').toLowerCase();
    const formattedAmt = amount ? `₹${Number(amount).toLocaleString('en-IN')}` : '₹200';
    if (m === 'upi' || m.includes('gpay')) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          UPI • {formattedAmt}
        </span>
      );
    }
    if (m === 'bank_transfer' || m.includes('neft')) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
          Bank • {formattedAmt}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
        Cash • {formattedAmt}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
          Pending
        </span>
      );
    }
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
          <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
          Approved
        </span>
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
        Loading account transfer requests...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white rounded-[22px] shadow-sm border border-red-200 p-8 text-center font-barlow">
        <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-2 font-bold">✕</div>
        <p className="text-red-700 font-bold mb-1">Failed to load transfer requests</p>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div>
            <h2 className="text-[19px] sm:text-[21px] font-bold text-[#5c292c] flex items-center gap-2">
              <span>Account Transfers</span>
              {pendingCount > 0 && (
                <span className="bg-[#c2410c] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs animate-pulse">
                  {pendingCount} Pending
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500">Review, verify, and approve 1-time hereditary account transfers</p>
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
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search devotee, successor, code..."
            className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-[#ebdccb] bg-[#faf8f5] focus:bg-white focus:outline-none focus:border-[#5c292c] text-gray-800 placeholder-gray-400 transition-all"
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

        <div className="text-xs text-gray-500 font-medium self-end sm:self-center">
          Total: <strong className="text-gray-800">{filteredRequests.length}</strong> request{filteredRequests.length === 1 ? '' : 's'}
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
          <p className="font-bold text-gray-700">No {activeTab} transfer requests found</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {searchQuery
              ? 'No requests matched your search query.'
              : activeTab === 'pending'
              ? 'All devotee account transfer requests have been processed.'
              : 'No records found for this view.'}
          </p>
        </div>
      ) : (
        <div className="rounded-[18px] border border-[#ebdccb] overflow-hidden my-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f7f1e5] border-b border-[#ebdccb] text-[#5c292c] text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-3.5 w-12 text-center">S.No</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Date & Time</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Kattalai Code</th>
                  <th className="py-3 px-3.5">Original Devotee</th>
                  <th className="py-3 px-3.5">New Successor</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Payment</th>
                  <th className="py-3 px-3.5 whitespace-nowrap text-center">Status</th>
                  <th className="py-3 px-3 w-16 text-center">Trigger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0e6dc] text-xs">
                {paginatedRequests.map((r, index) => {
                  const sNo = (currentPage - 1) * pageSize + index + 1;
                  const dt = formatDateTime(r.created_at);

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
                        <span className="font-mono font-bold text-xs bg-[#5c292c] text-white px-2.5 py-0.5 rounded-md tracking-wider">
                          {r.booking_code}
                        </span>
                      </td>

                      {/* Original Devotee */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-gray-900 text-xs">
                          {r.booking_title} {r.booking_name}
                        </div>
                        {(r.booking_place || r.booking_star) && (
                          <div className="text-[10.5px] text-gray-500 mt-0.5">
                            {r.booking_place}{r.booking_place && r.booking_star ? ' • ' : ''}{r.booking_star}
                          </div>
                        )}
                      </td>

                      {/* New Successor */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-[#5c292c] text-xs flex items-center gap-1.5 flex-wrap">
                          <span>{r.title} {r.name}</span>
                          {r.name_ta && (
                            <span className="text-[10px] text-gray-500 font-medium bg-[#f4ead7] px-1.5 py-0.1 rounded">
                              {r.name_ta}
                            </span>
                          )}
                        </div>
                        <div className="text-[10.5px] text-gray-500 mt-0.5">
                          +{r.country_code} {r.mobile}
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {getPaymentPill(r.payment_mode, r.fee_amount)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-center">
                        {getStatusBadge(r.status)}
                      </td>

                      {/* Trigger View Button */}
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedRequest(r)}
                          className="w-7 h-7 rounded-full bg-[#f7f1e5] hover:bg-[#5c292c] text-[#5c292c] hover:text-white border border-[#ebdccb] flex items-center justify-center transition-all cursor-pointer shadow-2xs mx-auto"
                          title="View all details / Trigger actions"
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

          {/* Pagination Footer */}
          <div className="bg-[#faf8f5] px-4 py-3 border-t border-[#ebdccb] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-gray-600 font-medium">
              Showing <span className="font-bold text-gray-900">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-bold text-gray-900">
                {Math.min(currentPage * pageSize, filteredRequests.length)}
              </span>{' '}
              of <span className="font-bold text-gray-900">{filteredRequests.length}</span> records
            </div>

            <div className="flex items-center gap-2">
              {/* Prev Button */}
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={`w-7 h-7 rounded-md flex items-center justify-center font-bold transition-all cursor-pointer ${
                  currentPage <= 1
                    ? 'text-gray-300 bg-transparent cursor-not-allowed'
                    : 'text-gray-700 hover:bg-[#ebdccb] bg-white border border-[#cdb9ab]'
                }`}
                title="Previous Page"
              >
                ‹
              </button>

              {/* Page Number Pills */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((num, idx) => {
                  if (num === '...') {
                    return (
                      <span key={`dots-${idx}`} className="px-1 text-gray-400 font-bold">
                        ...
                      </span>
                    );
                  }
                  const isActive = currentPage === num;
                  return (
                    <button
                      key={`page-${num}`}
                      type="button"
                      onClick={() => setCurrentPage(num)}
                      className={`w-7 h-7 rounded-md font-bold text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#5c292c] text-white shadow-xs'
                          : 'bg-white text-gray-700 hover:bg-[#f7f1e5] border border-[#cdb9ab]'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>

              {/* Next Button */}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className={`w-7 h-7 rounded-md flex items-center justify-center font-bold transition-all cursor-pointer ${
                  currentPage >= totalPages
                    ? 'text-gray-300 bg-transparent cursor-not-allowed'
                    : 'text-gray-700 hover:bg-[#ebdccb] bg-white border border-[#cdb9ab]'
                }`}
                title="Next Page"
              >
                ›
              </button>

              {/* Page Size Selector */}
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value, 10));
                  setCurrentPage(1);
                }}
                className="border border-[#cdb9ab] rounded-md px-2 py-1 text-xs bg-white text-gray-700 font-medium focus:outline-none focus:border-[#5c292c] cursor-pointer ml-1"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Trigger Details Modal - Full Data Display */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-[24px] max-w-3xl w-full border border-[#ebdccb] shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#fbf8f3] border-b border-[#ebdccb] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#5c292c] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#5c292c] flex items-center gap-2">
                    <span>Account Transfer Request Details</span>
                    <span className="font-mono text-xs bg-[#5c292c] text-white px-2 py-0.5 rounded-md font-bold">
                      {selectedRequest.booking_code}
                    </span>
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Requested on {formatDateTime(selectedRequest.created_at).full}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 text-gray-500 hover:text-black border border-[#ebdccb] flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Status & Payment Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#faf8f5] p-3.5 rounded-2xl border border-[#ebdccb]">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Transfer Status</span>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>

                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Transfer Fee</span>
                  <div className="font-bold text-sm text-[#5c292c] mt-1 flex items-center gap-1.5">
                    <span>₹{Number(selectedRequest.fee_amount || 200).toLocaleString('en-IN')}</span>
                    <span className="text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Paid
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Payment Mode & Ref</span>
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    {getPaymentPill(selectedRequest.payment_mode, selectedRequest.fee_amount)}
                    {selectedRequest.payment_id && (
                      <span className="text-[10.5px] font-mono text-gray-600 bg-white px-2 py-0.5 rounded border border-[#ebdccb]">
                        {selectedRequest.payment_id}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Devotee Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-11 gap-3.5 items-center">
                
                {/* Original Devotee Card */}
                <div className="md:col-span-5 bg-[#faf8f5] p-4 rounded-2xl border border-[#ebdccb]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">
                    Original Devotee
                  </span>
                  <div className="font-bold text-[15px] text-[#5c292c]">
                    {selectedRequest.booking_title} {selectedRequest.booking_name}
                  </div>
                  <div className="text-xs text-gray-600 mt-2 space-y-1">
                    {selectedRequest.booking_star && (
                      <div>Star: <strong className="text-gray-800">{selectedRequest.booking_star}</strong></div>
                    )}
                    {selectedRequest.booking_place && (
                      <div>Place: <strong className="text-gray-800">{selectedRequest.booking_place}</strong></div>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="md:col-span-1 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#f4ead7] text-[#5c292c] border border-[#ebdccb] flex items-center justify-center font-bold shadow-xs">
                    ➜
                  </div>
                </div>

                {/* Successor Card */}
                <div className="md:col-span-5 bg-[#fffdfa] p-4 rounded-2xl border-2 border-[#ebdccb] shadow-2xs">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block mb-1">
                    New Successor
                  </span>
                  <div className="font-bold text-[15.5px] text-gray-900 flex items-center gap-1.5 flex-wrap">
                    <span>{selectedRequest.title} {selectedRequest.name}</span>
                    {selectedRequest.name_ta && (
                      <span className="text-xs font-medium text-[#786c62] bg-[#f4ead7] px-2 py-0.5 rounded-full">
                        {selectedRequest.title_ta} {selectedRequest.name_ta}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-600 mt-1.5 space-y-1">
                    {selectedRequest.star && (
                      <div>
                        Star: <strong className="text-gray-800">{selectedRequest.star} {selectedRequest.star_ta ? `(${selectedRequest.star_ta})` : ''}</strong>
                      </div>
                    )}
                    {selectedRequest.place && (
                      <div>
                        Place: <strong className="text-gray-800">{selectedRequest.place} {selectedRequest.place_ta ? `(${selectedRequest.place_ta})` : ''}</strong>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-gray-700 mt-2.5 pt-2.5 border-t border-[#ebdccb]/60">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 text-[11px]">Mobile:</span>
                      <a href={`tel:${selectedRequest.mobile}`} className="font-semibold text-[#5c292c] hover:underline">
                        +{selectedRequest.country_code} {selectedRequest.mobile}
                      </a>
                    </div>
                    {selectedRequest.whatsapp_number && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 text-[11px]">WhatsApp:</span>
                        <a 
                          href={`https://wa.me/${selectedRequest.country_code}${selectedRequest.whatsapp_number.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="font-semibold text-emerald-700 hover:underline"
                        >
                          +{selectedRequest.country_code} {selectedRequest.whatsapp_number}
                        </a>
                      </div>
                    )}
                    {selectedRequest.email && (
                      <div className="flex items-center gap-1 truncate col-span-2">
                        <span className="text-gray-500 text-[11px]">Email:</span>
                        <span className="font-medium truncate">{selectedRequest.email}</span>
                      </div>
                    )}
                    {selectedRequest.address && (
                      <div className="flex items-start gap-1 col-span-2 text-[11.5px] text-gray-600">
                        <span className="text-gray-500 text-[11px] shrink-0">Address:</span>
                        <span>{selectedRequest.address}</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Approval/Rejection Audit Stamp */}
              {selectedRequest.status === 'approved' && (
                <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 px-4 py-2.5 rounded-xl flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 font-bold">
                    <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Approved by {selectedRequest.approved_by_name || 'Super Administrator'} ({selectedRequest.approved_by_role || 'superadmin'})</span>
                  </span>
                  {selectedRequest.approved_at && (
                    <span className="text-emerald-700 font-medium">
                      {formatDateTime(selectedRequest.approved_at).full}
                    </span>
                  )}
                </div>
              )}

              {selectedRequest.status === 'rejected' && (
                <div className="flex items-center justify-between text-xs bg-red-50 text-red-900 border border-red-200 px-4 py-2.5 rounded-xl flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 font-bold">
                    <svg className="w-4 h-4 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Rejected by {selectedRequest.approved_by_name || 'Administrator'} ({selectedRequest.approved_by_role || 'admin'})</span>
                    {selectedRequest.rejection_reason && (
                      <span className="font-normal italic">- Reason: {selectedRequest.rejection_reason}</span>
                    )}
                  </span>
                  {selectedRequest.approved_at && (
                    <span className="text-red-700 font-medium">
                      {formatDateTime(selectedRequest.approved_at).full}
                    </span>
                  )}
                </div>
              )}

            </div>

            {/* Modal Actions Footer */}
            <div className="px-5 py-3.5 bg-[#fbf8f3] border-t border-[#ebdccb] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 rounded-full border border-gray-300 bg-white text-gray-700 font-bold text-xs hover:bg-gray-50 transition-all cursor-pointer"
              >
                Close
              </button>

              {selectedRequest.status === 'pending' && (
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled={actionLoadingId === selectedRequest.id}
                    onClick={() => handleReject(selectedRequest)}
                    className="px-4 h-[36px] rounded-full border border-red-300 bg-white text-red-700 font-bold text-xs hover:bg-red-50 transition-all cursor-pointer disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={actionLoadingId === selectedRequest.id}
                    onClick={() => handleApprove(selectedRequest)}
                    className="px-6 h-[36px] rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {actionLoadingId === selectedRequest.id ? (
                      <span>Executing...</span>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Approve & Execute Transfer</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
