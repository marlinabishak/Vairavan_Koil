import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function RequestsInbox({ showEmptyMessage = false }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    try {
      const data = await api.getEditRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // Poll every 30 seconds for new requests
    const interval = setInterval(loadRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id, status) => {
    try {
      await api.updateEditRequestStatus(id, status);
      setRequests(reqs => reqs.map(r => r.id === id ? { ...r, status } : r));
    } catch (err) {
      console.error(err);
      alert('Failed to update request');
    }
  };

  const pending = requests.filter(r => r.status === 'pending');
  
  if (loading) {
    return (
      <div className="w-full bg-white rounded-[22px] shadow-sm border border-[#ebdccb] p-8 text-center text-gray-500 font-barlow">
        Loading devotee edit requests...
      </div>
    );
  }

  if (requests.length === 0) {
    if (!showEmptyMessage) return null;
    return (
      <div className="w-full bg-white rounded-[22px] shadow-sm border border-[#ebdccb] p-8 text-center text-gray-500 font-barlow">
        <div className="w-12 h-12 rounded-full bg-[#f7f1e5] text-[#5c292c] flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="font-semibold text-gray-700">No Devotee Edit Requests</p>
        <p className="text-xs text-gray-500 mt-1">There are no pending or past edit requests at this time.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-[22px] shadow-sm border border-[#ebdccb] p-5 sm:p-6 font-barlow text-fig-text mb-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#ebdccb]/60">
        <h2 className="text-[17px] sm:text-[19px] font-bold text-[#5c292c] flex items-center gap-2">
          <svg className="w-5 h-5 text-[#5c292c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Devotee Edit Requests
        </h2>
        {pending.length > 0 && (
          <span className="bg-[#5c292c] text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
            {pending.length} Pending
          </span>
        )}
      </div>
      
      {/* List: Vertical stacked on mobile, zero horizontal scroll */}
      <div className="flex flex-col gap-3">
        {requests.map(req => (
          <div
            key={req.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#faf8f7] p-3.5 sm:p-4 rounded-[18px] border border-[#ebdccb] gap-3"
          >
            <div className="min-w-0">
              <p className="font-bold text-[15px] text-gray-900 flex items-center gap-1.5 flex-wrap">
                {req.booking_name}
                <span className="bg-[#f7f1e5] px-2 py-0.5 rounded text-xs font-mono font-bold text-[#5c292c] border border-[#ebdccb]">
                  {req.booking_code}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Requested full edit access on {new Date(req.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
            
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {req.status === 'pending' ? (
                <>
                  <button
                    onClick={() => handleAction(req.id, 'approved')}
                    className="bg-[#2e7d32] hover:bg-[#256828] text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(req.id, 'rejected')}
                    className="bg-white border border-[#ebdccb] text-red-600 hover:bg-red-50 px-4 py-1.5 rounded-full text-xs font-bold transition-colors"
                  >
                    Reject
                  </button>
                </>
              ) : (
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  req.status === 'approved'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-red-100 text-red-700 border-red-200'
                }`}>
                  {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
