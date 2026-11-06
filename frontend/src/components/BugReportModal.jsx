import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function BugReportModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const location = useLocation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Check limit of 5 photos
    if (photos.length + files.length > 5) {
      alert('You can attach a maximum of 5 photos.');
      return;
    }

    const newPhotos = [...photos, ...files];
    setPhotos(newPhotos);

    // Create preview URLs
    const newPreviews = [...previews];
    files.forEach(f => {
      newPreviews.push({
        name: f.name,
        url: URL.createObjectURL(f)
      });
    });
    setPreviews(newPreviews);
  };

  const removePhoto = (idx) => {
    const updatedPhotos = photos.filter((_, i) => i !== idx);
    const updatedPreviews = previews.filter((_, i) => i !== idx);
    setPhotos(updatedPhotos);
    setPreviews(updatedPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for the issue');
      return;
    }
    if (!description.trim()) {
      setError('Please describe the issue or bug you encountered');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('page_url', location.pathname + location.search);
      formData.append('username', user?.name || user?.username || 'Guest Devotee');
      formData.append('user_role', user?.role || 'user');
      if (user?.id) formData.append('user_id', user.id);

      photos.forEach(file => {
        formData.append('screenshots', file);
      });

      const res = await api.submitBugReport(formData);
      setSuccessMsg(res.message || 'Bug report submitted successfully! Thank you.');

      if (onSuccess) onSuccess(res);

      setTimeout(() => {
        setTitle('');
        setDescription('');
        setPhotos([]);
        setPreviews([]);
        setSuccessMsg(null);
        onClose();
      }, 1500);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to submit bug report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 p-4 flex items-center justify-center overflow-y-auto animate-fade-in font-barlow">
      <div className="relative shadow-2xl flex flex-col p-6 bg-[#f7f1e5] border border-[#ebdccb] rounded-[26px] max-w-[480px] w-full my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#ebdccb]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#5c292c] tracking-tight leading-none">
                Report Issue / Bug
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Attach photos and describe what went wrong
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8c8075] hover:text-[#5c292c] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-4">

          {/* User & Route Context Tag */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-white/70 rounded-full border border-[#e8ded3] text-[11px] text-gray-500">
            <span>Reporting as: <strong className="text-gray-800">{user?.name || user?.username || 'Devotee'}</strong> ({user?.role || 'user'})</span>
            <span className="font-mono text-gray-400 truncate max-w-[150px]">{location.pathname}</span>
          </div>

          {/* Title / Summary */}
          <div>
            <label className="block text-[#5c292c] font-bold text-xs mb-1 px-1">
              Issue Summary <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the bug or problem"
              required
              className="h-[38px] px-4 rounded-full border border-[#e2d8cb] bg-white font-barlow text-[13.5px] text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] w-full shadow-sm"
            />
          </div>

          {/* Message / Description */}
          <div>
            <label className="block text-[#5c292c] font-bold text-xs mb-1 px-1">
              Problem Description / Steps <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What were you trying to do, and what happened?"
              required
              className="p-3 rounded-2xl border border-[#e2d8cb] bg-white font-barlow text-[13px] text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] w-full shadow-sm resize-none"
            />
          </div>

          {/* Attach Photos / Screenshots */}
          <div>
            <label className="block text-[#5c292c] font-bold text-xs mb-1.5 px-1 flex items-center justify-between">
              <span>Attach Photos / Screenshots</span>
              <span className="text-[10.5px] font-normal text-gray-500">{photos.length}/5 images</span>
            </label>

            {/* Photo Preview Strip */}
            {previews.length > 0 && (
              <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                {previews.map((p, idx) => (
                  <div key={idx} className="relative group shrink-0 w-16 h-16 rounded-xl border border-[#ebdccb] overflow-hidden bg-white shadow-xs">
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs shadow-md opacity-90 hover:opacity-100 cursor-pointer"
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Area */}
            {photos.length < 5 && (
              <label className="border-2 border-dashed border-[#d8c8b6] hover:border-[#5c292c] bg-white/70 hover:bg-white rounded-2xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shadow-xs">
                <svg className="w-6 h-6 text-[#8c7b70]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-semibold text-[#5c292c]">
                  Click or drag photos here
                </span>
                <span className="text-[10px] text-gray-400">
                  PNG, JPG, JPEG, WEBP up to 10MB each
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="bg-red-50 text-red-700 text-xs py-2 px-3 rounded-xl border border-red-200 font-medium">
              ⚠ {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 text-emerald-800 text-xs py-2 px-3.5 rounded-full border border-emerald-200 text-center font-medium animate-fade-in">
              ✓ {successMsg}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ebdccb] mt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2 rounded-full border border-[#5c292c] text-[#5c292c] font-semibold text-xs bg-white hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 rounded-full bg-[#5c292c] hover:bg-[#482022] text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Report</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
