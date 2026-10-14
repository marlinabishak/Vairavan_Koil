import React, { useState } from 'react';
import { api } from '../api/client.js';

export default function WhatsAppSendModal({ isOpen, onClose, date, lang }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    try {
      // Direct call since this is a new custom route
      const response = await fetch('/api/whatsapp/send-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ date, lang })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to send campaign');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden font-barlow">
        <div className="px-6 py-4 border-b border-gray-200 bg-[#5c292c] text-white">
          <h2 className="text-xl font-semibold text-center">
            {lang === 'en' ? 'WhatsApp Campaign (English)' : 'WhatsApp Campaign (Tamil)'}
          </h2>
        </div>

        <div className="p-6 text-center">
          {!result && !loading && (
            <>
              <p className="text-gray-700 mb-6">
                You are about to send WhatsApp messages to all Kattalaitharars booked on <strong>{date}</strong>.
              </p>
              
              <div className="text-left bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 relative">
                <span className="absolute -top-3 left-3 bg-white px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Message Preview</span>
                {lang === 'en' ? (
                  <p className="text-sm text-gray-700 font-sans whitespace-pre-wrap">
                    Dear [Title] [Name],<br /><br />
                    This is a reminder that your <strong>[Kattalai Name]</strong> is scheduled on <strong>[Date]</strong> at <strong>[Time]</strong>.<br /><br />
                    📍 Location: [Place]<br />
                    ⭐ Star: [Star]<br /><br />
                    - Vairavan Koil
                  </p>
                ) : (
                  <p className="text-sm text-gray-700 font-sans whitespace-pre-wrap leading-relaxed">
                    [Title].[Name],<br /><br />
                    இப்பவும் தங்களது <strong>[Kattalai Name]</strong> கட்டளை அர்ச்சனை <strong>[Date]</strong> அன்று நடைபெறயிருக்கிறது.<br /><br />
                    📍 ஊர்: [Place]<br />
                    ⭐ நட்சத்திரம்: [Star]<br />
                    🕒 நேரம்: [Time]<br /><br />
                    - வைரவன் கோவில்
                  </p>
                )}
              </div>

              {error && <p className="text-red-500 mb-4">{error}</p>}
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  className="px-4 py-2 bg-[#f37435] text-white rounded-md hover:bg-[#d05c24] font-semibold"
                >
                  Yes, Send Now
                </button>
              </div>
            </>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-10 h-10 border-4 border-[#f37435] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Sending messages... Please do not close this window.</p>
            </div>
          )}

          {result && (
            <div className="py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Campaign Complete!</h3>
              <p className="text-gray-700 mb-1">Total Attempted: <strong>{result.total}</strong></p>
              <p className="text-green-600 mb-1">Successfully Sent: <strong>{result.sent}</strong></p>
              {result.failed > 0 && (
                <p className="text-red-500 mb-4">Failed: <strong>{result.failed}</strong></p>
              )}
              
              <button
                onClick={handleClose}
                className="mt-6 px-6 py-2 bg-[#5c292c] text-white rounded-md hover:bg-[#4a2123]"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
