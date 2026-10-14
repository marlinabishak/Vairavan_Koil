import { Link } from 'react-router-dom';
import RequestsInbox from '../components/RequestsInbox.jsx';
import { useAuth } from '../context/AuthContext';

export default function RequestsPage() {
  const { user } = useAuth();

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
              {user && (
                <span className="text-xs bg-[#5c292c]/10 text-[#5c292c] font-bold px-2.5 py-0.5 rounded-full capitalize">
                  {user.role}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#5c292c] tracking-tight">
              Devotee Edit Requests
            </h1>
          </div>
        </div>

        <RequestsInbox showEmptyMessage={true} />
      </div>
    </div>
  );
}
