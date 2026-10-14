import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function History() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await api.getHistory(user?.role === 'user' ? user.id : null);
        setLogs(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load activity history logs');
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [user]);

  const getActionBadge = (action = '') => {
    if (action.includes('Present')) return 'bg-green-100 text-green-800 border-green-200';
    if (action.includes('Absent')) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (action.includes('Created Booking')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (action.includes('WhatsApp')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (action.includes('Staff Profile') || action.includes('User')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (action.includes('Edit Request')) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-[#5c292c]/10 text-[#5c292c] border-[#5c292c]/20';
  };

  const filteredLogs = logs.filter(log => {
    const q = search.toLowerCase();
    const userMatch = (log.user_name || log.user_role || '').toLowerCase().includes(q);
    const actionMatch = (log.action || '').toLowerCase().includes(q);
    const detailsMatch = (log.details || '').toLowerCase().includes(q);
    return userMatch || actionMatch || detailsMatch;
  });

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
              System History Log
            </h1>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-[38px] pl-9 pr-4 rounded-full border border-[#e2d8cb] bg-white font-barlow text-xs sm:text-sm text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] transition-all"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9c9186]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-[20px] border border-[#ebdccb] p-10 text-center text-gray-500 font-medium">
            Loading activity history...
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-[20px] text-center">
            {error}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white rounded-[20px] border border-[#ebdccb] p-10 text-center text-gray-500 font-medium">
            No activity logs found.
          </div>
        ) : (
          <div>
            {/* Mobile View: Vertical Stacked Cards (Zero horizontal scroll) */}
            <div className="md:hidden flex flex-col gap-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white rounded-[20px] border border-[#ebdccb] p-4 shadow-sm flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">
                      {new Date(log.created_at).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#5c292c] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                      {(log.user_name || log.user_role || 'S').slice(0, 1).toUpperCase()}
                    </div>
                    <span className="font-semibold text-gray-900 text-xs">
                      {log.user_name || (log.user_role ? log.user_role : 'System')}
                    </span>
                    {log.user_role && (
                      <span className="text-[10px] bg-[#f7f1e5] text-[#5c292c] font-bold px-2 py-0.2 rounded-full uppercase border border-[#ebdccb]">
                        {log.user_role}
                      </span>
                    )}
                  </div>

                  {log.details && (
                    <div className="bg-[#faf8f7] p-2.5 rounded-[12px] border border-[#ebdccb]/60 text-xs text-gray-700 leading-relaxed break-words">
                      {log.details}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop View: Full Data Table */}
            <div className="hidden md:block bg-white rounded-[22px] border border-[#ebdccb] shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f7f1e5] border-b border-[#ebdccb] text-[#5c292c] text-xs font-bold uppercase tracking-wider">
                    <th className="py-3 px-6 whitespace-nowrap">Date & Time</th>
                    <th className="py-3 px-5 whitespace-nowrap">User</th>
                    <th className="py-3 px-5 whitespace-nowrap">Action</th>
                    <th className="py-3 px-6">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0e6dc]">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#faf6f0] transition-colors">
                      <td className="py-3.5 px-6 text-xs text-gray-600 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-semibold text-gray-900 text-xs">
                            {log.user_name || (log.user_role ? log.user_role : 'System')}
                          </span>
                          {log.user_role && (
                            <span className="text-[10px] bg-[#5c292c]/10 text-[#5c292c] font-bold px-2 py-0.2 rounded-full uppercase tracking-wider">
                              {log.user_role}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-block border ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-xs text-gray-700 leading-relaxed">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
