import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import BugReportModal from '../components/BugReportModal';

export default function BugReportsPage() {
  const { user } = useAuth();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal & Lightbox state
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getBugReports(statusFilter);
      setReports(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load bug reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      setUpdatingId(reportId);
      await api.updateBugReportStatus(reportId, { status: newStatus });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
    } catch (err) {
      console.error(err);
      alert('Failed to update status: ' + (err.message || 'Error'));
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'in_progress':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-rose-50 text-rose-800 border-rose-200';
    }
  };

  const counts = {
    all: reports.length,
    open: reports.filter(r => r.status === 'open').length,
    in_progress: reports.filter(r => r.status === 'in_progress').length,
    resolved: reports.filter(r => r.status === 'resolved').length
  };

  const filteredReports = reports.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.username && r.username.toLowerCase().includes(q)) ||
      (r.page_url && r.page_url.toLowerCase().includes(q))
    );
  });

  const categories = [
    { key: 'all', label: 'All Issues' },
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' }
  ];

  return (
    <div className="min-h-screen bg-[#faf8f7] p-4 sm:p-6 md:p-8 font-barlow relative z-10 text-gray-800 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        
        {/* Header - Matches System Settings & History Log Exactly */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1.5">
              <Link
                to="/dashboard"
                className="text-[#5c292c] hover:underline font-semibold text-xs flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-[#ebdccb] shadow-sm self-start"
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
              Bug & Issue Reports
            </h1>
            <p className="text-xs text-gray-600 mt-0.5">
              System issue logs, bug details, and screenshots submitted across all roles
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsBugModalOpen(true)}
            className="bg-[#5c292c] hover:bg-[#482022] text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm shrink-0 whitespace-nowrap self-start sm:self-auto flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Report New Issue</span>
          </button>
        </div>

        {/* Main Card Container - Matches System Settings rounded-[22px] */}
        <div className="bg-white rounded-[22px] shadow-sm border border-[#ebdccb] p-5 sm:p-6 mb-6">
          
          {/* Category Tabs - Clean underline tabs with count badges matching History.jsx */}
          <div className="flex gap-2 border-b border-[#ebdccb]/60 mb-5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((tab) => {
              const count = counts[tab.key] ?? 0;
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`pb-2.5 px-3 font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'border-b-2 border-[#5c292c] text-[#5c292c] font-bold'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-[#5c292c] text-white'
                        : 'bg-[#faf8f7] text-gray-600 border border-[#ebdccb]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Filter Bar */}
          <div className="bg-[#faf8f7] p-3.5 sm:p-4 rounded-[18px] border border-[#ebdccb] mb-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search issues by summary, description, reporter, or page..."
                className="w-full h-[38px] pl-9 pr-4 rounded-full border border-[#e2d8cb] bg-white text-xs sm:text-sm text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c]"
              />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-gray-500 hover:text-[#5c292c] font-semibold px-3 py-1 bg-white rounded-full border border-[#ebdccb] shadow-xs cursor-pointer self-start sm:self-auto"
              >
                Clear Search ✕
              </button>
            )}
          </div>

          {/* Content States */}
          {loading ? (
            <div className="bg-[#faf8f7] rounded-[18px] border border-[#ebdccb] p-12 text-center text-gray-500 text-sm font-medium">
              Loading issue reports...
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-[18px] text-center text-xs">
              {error}
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="bg-[#faf8f7] rounded-[18px] border border-[#ebdccb] p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-gray-800">No issues found</h4>
              <p className="text-xs text-gray-500 mt-1">
                {searchQuery ? 'No issue reports match your search query.' : 'There are no reports under this filter category.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-[#faf8f7] border border-[#ebdccb] rounded-[18px] p-4 sm:p-5 hover:border-[#cfc2b2] hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Title & Status */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-base font-bold text-[#5c292c] tracking-tight leading-snug">
                        {report.title}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase shrink-0 ${getStatusBadge(report.status)}`}>
                        {report.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Reporter Metadata */}
                    <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-gray-600 mb-3">
                      <span className="font-semibold text-gray-800">By {report.username || 'Devotee'}</span>
                      <span className="px-2 py-0.2 bg-white rounded-full border border-[#ebdccb] text-[10px] uppercase font-bold text-gray-600">
                        {report.user_role || 'user'}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(report.created_at).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {report.page_url && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-gray-600 text-[10.5px] bg-white px-2 py-0.2 rounded-full border border-[#ebdccb]">
                            {report.page_url}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Description Box */}
                    <div className="bg-white p-3.5 rounded-[14px] border border-[#ebdccb] text-xs text-gray-700 whitespace-pre-wrap leading-relaxed mb-3">
                      {report.description}
                    </div>

                    {/* Screenshots Gallery */}
                    {report.screenshot_urls && report.screenshot_urls.length > 0 && (
                      <div className="mb-3">
                        <span className="block text-[11px] font-bold text-[#5c292c] mb-1.5">
                          Attached Photos ({report.screenshot_urls.length}):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {report.screenshot_urls.map((url, i) => (
                            <div
                              key={i}
                              onClick={() => setSelectedPhoto(url)}
                              className="w-16 h-16 rounded-xl border border-[#ebdccb] overflow-hidden bg-white shadow-xs cursor-pointer hover:opacity-90 hover:scale-105 transition-all group relative"
                              title="Click to view full photo"
                            >
                              <img src={url} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs">
                                🔍
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer & Status Management */}
                  <div className="pt-3 border-t border-[#ebdccb]/60 flex flex-wrap items-center justify-between gap-2 mt-2">
                    <span className="text-[11px] text-gray-400 font-mono">
                      Ref #{report.id.slice(0, 8)}
                    </span>

                    {(user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'ulthurai') && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-gray-500 font-medium mr-1">Status:</span>
                        {['open', 'in_progress', 'resolved'].map((st) => (
                          <button
                            key={st}
                            type="button"
                            disabled={updatingId === report.id || report.status === st}
                            onClick={() => handleStatusChange(report.id, st)}
                            className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold transition-all cursor-pointer ${
                              report.status === st
                                ? 'bg-[#5c292c] text-white shadow-xs'
                                : 'bg-white hover:bg-gray-100 text-gray-700 border border-[#ebdccb]'
                            }`}
                          >
                            {st === 'in_progress' ? 'In Progress' : st.charAt(0).toUpperCase() + st.slice(1)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* Full Photo Lightbox Viewer */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 p-4 flex items-center justify-center animate-fade-in cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-black rounded-[22px] overflow-hidden shadow-2xl p-2 border border-white/20" onClick={e => e.stopPropagation()}>
            <img src={selectedPhoto} alt="Full size preview" className="max-w-full max-h-[82vh] object-contain rounded-xl mx-auto" />
            <div className="flex items-center justify-between pt-2 px-3 text-white text-xs">
              <span className="font-mono text-gray-300 truncate max-w-md">{selectedPhoto}</span>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="px-3.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold transition-all cursor-pointer"
              >
                Close ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Bug Modal */}
      <BugReportModal
        isOpen={isBugModalOpen}
        onClose={() => setIsBugModalOpen(false)}
        onSuccess={() => loadReports()}
      />

    </div>
  );
}
