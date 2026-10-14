import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Link, Navigate } from 'react-router-dom';

export default function MyHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  if (!user || user.role !== 'user') {
    return <Navigate to="/dashboard" />;
  }

  useEffect(() => {
    api.getMyAttendance(user.username)
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.username]);

  return (
    <div className="min-h-screen bg-[#faf8f7] p-4 sm:p-6 md:p-8 font-barlow relative z-10">
      <div className="max-w-4xl mx-auto">
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
              <span className="text-xs bg-[#5c292c]/10 text-[#5c292c] font-bold px-2.5 py-0.5 rounded-full capitalize">
                Devotee
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#5c292c] tracking-tight">
              My Attendance History
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-[22px] shadow-sm border border-[#ebdccb] p-8 text-center text-gray-500">
            Loading your history...
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-[22px] shadow-sm border border-[#ebdccb] p-8 text-center text-gray-500">
            You have no attendance records yet.
          </div>
        ) : (
          <div>
            {/* Mobile View: Vertical Stacked Cards (Zero horizontal scroll) */}
            <div className="md:hidden flex flex-col gap-3">
              {history.map((record, index) => (
                <div key={index} className="bg-white p-4 rounded-[18px] border border-[#ebdccb] shadow-2xs flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {record.kattalai_name || 'Kattalai'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(record.date_str).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      record.present
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-red-100 text-red-800 border-red-200'
                    }`}>
                      {record.present ? 'Present' : 'Absent'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#f0e6dc] text-xs text-gray-500 flex items-center justify-between">
                    <span>Devotee: <strong>{record.name}</strong></span>
                    <span className="text-[11px]">
                      {new Date(record.updated_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Full Data Table */}
            <div className="hidden md:block bg-white rounded-[22px] shadow-sm border border-[#ebdccb] overflow-hidden">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#f7f1e5] border-b border-[#ebdccb] text-[#5c292c] font-bold">
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Kattalai Details</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0e6dc]">
                  {history.map((record, index) => (
                    <tr key={index} className="hover:bg-[#faf6f0] transition-colors">
                      <td className="px-6 py-3.5 text-gray-800 font-medium whitespace-nowrap">
                        {new Date(record.date_str).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-3.5 text-gray-700">
                        {record.kattalai_name || 'Kattalai'} - {record.name}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          record.present
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {record.present ? 'Present' : 'Absent'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(record.updated_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
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
