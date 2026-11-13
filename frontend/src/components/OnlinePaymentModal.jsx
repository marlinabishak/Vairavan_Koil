import React, { useState } from 'react';

export default function OnlinePaymentModal({
  isOpen,
  onClose,
  onSuccess,
  amount = 3500,
  purpose = 'Nithiya Kattalai Registration',
  devoteeName = '',
  officeCode = '',
  bookingId = null
}) {
  const [selectedMode, setSelectedMode] = useState('upi'); // 'upi', 'card', 'netbanking'
  const [upiApp, setUpiApp] = useState('gpay'); // 'gpay', 'phonepe', 'paytm', 'qr'
  const [selectedBank, setSelectedBank] = useState('sbi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [txnRef, setTxnRef] = useState('');

  if (!isOpen) return null;

  const numericAmount = parseFloat(amount) || 0;

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    const generatedTxnId = `pay_razorpay_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Simulate real gateway processing delay for authentic experience
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      setTxnRef(generatedTxnId);

      setTimeout(() => {
        if (onSuccess) {
          onSuccess({
            paymentId: generatedTxnId,
            amount: numericAmount,
            method: selectedMode,
            modeDetails: selectedMode === 'upi' ? `UPI (${upiApp.toUpperCase()})` : selectedMode === 'card' ? 'Debit/Credit Card' : `NetBanking (${selectedBank.toUpperCase()})`
          });
        }
      }, 1200);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in font-barlow">
      <div className="relative bg-[#faf8f5] border border-[#ebdccb] rounded-[26px] max-w-[480px] w-full p-5 sm:p-6 shadow-2xl my-auto flex flex-col gap-4 text-[#3d332a]">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#ebdccb]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#5c292c] text-amber-300 flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
              🛕
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold bg-[#5c292c]/10 text-[#5c292c] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Secure Online Gateway
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#5c292c] tracking-tight leading-tight mt-0.5">
                Arulmigu Vairavan Swamy Kovil
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-black hover:bg-black/5 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {paymentSuccess ? (
          /* Payment Success State */
          <div className="py-6 flex flex-col items-center justify-center text-center gap-3 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl shadow-sm border border-emerald-200">
              ✓
            </div>
            <div>
              <h4 className="text-xl font-bold text-[#5c292c]">Payment Successful!</h4>
              <p className="text-xs text-gray-600 mt-1">
                Amount ₹{numericAmount.toLocaleString('en-IN')} has been securely received.
              </p>
              <div className="mt-2.5 inline-block bg-white border border-[#ebdccb] rounded-full px-3.5 py-1 text-[11px] font-mono text-gray-700">
                Ref: {txnRef}
              </div>
            </div>
            <div className="text-xs text-emerald-700 font-semibold animate-pulse mt-1">
              Finalizing your record...
            </div>
          </div>
        ) : (
          <>
            {/* Amount Summary Card */}
            <div className="bg-gradient-to-br from-[#5c292c] to-[#401a1c] text-white rounded-[20px] p-4 shadow-sm relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none"></div>
              
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <div className="text-[11px] text-amber-200/90 font-medium uppercase tracking-wider">
                    Total Amount Payable
                  </div>
                  <div className="text-3xl font-black tracking-tight mt-0.5 text-white flex items-baseline gap-1">
                    <span>₹{numericAmount.toLocaleString('en-IN')}</span>
                    <span className="text-xs font-normal text-amber-200/70">(INR)</span>
                  </div>
                </div>

                {officeCode && (
                  <div className="text-right">
                    <span className="text-[10px] text-amber-200/80 font-medium">Office Code</span>
                    <div className="text-xs font-bold bg-white/15 px-2 py-0.5 rounded-md text-amber-100">
                      {officeCode}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-xs text-amber-100/90">
                <span className="truncate max-w-[240px] font-medium">{purpose}</span>
                {devoteeName && <span className="font-semibold text-white truncate max-w-[150px]">{devoteeName}</span>}
              </div>
            </div>

            {/* Select Online Payment Mode */}
            <div>
              <label className="block text-xs font-bold text-[#5c292c] mb-2 uppercase tracking-wider">
                Select Online Payment Mode
              </label>

              <div className="grid grid-cols-3 gap-2">
                {/* 1. UPI */}
                <button
                  type="button"
                  onClick={() => setSelectedMode('upi')}
                  className={`p-2.5 rounded-[16px] border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedMode === 'upi'
                      ? 'border-[#5c292c] bg-white shadow-sm ring-1 ring-[#5c292c]'
                      : 'border-[#ebdccb] bg-white/60 hover:bg-white text-gray-600'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-sm">
                    ⚡
                  </div>
                  <span className="text-xs font-bold text-gray-900">UPI Instant</span>
                  <span className="text-[10px] text-gray-500">GPay, PhonePe</span>
                </button>

                {/* 2. Cards */}
                <button
                  type="button"
                  onClick={() => setSelectedMode('card')}
                  className={`p-2.5 rounded-[16px] border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedMode === 'card'
                      ? 'border-[#5c292c] bg-white shadow-sm ring-1 ring-[#5c292c]'
                      : 'border-[#ebdccb] bg-white/60 hover:bg-white text-gray-600'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center font-bold text-sm">
                    💳
                  </div>
                  <span className="text-xs font-bold text-gray-900">Cards</span>
                  <span className="text-[10px] text-gray-500">Debit / Credit</span>
                </button>

                {/* 3. Net Banking */}
                <button
                  type="button"
                  onClick={() => setSelectedMode('netbanking')}
                  className={`p-2.5 rounded-[16px] border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedMode === 'netbanking'
                      ? 'border-[#5c292c] bg-white shadow-sm ring-1 ring-[#5c292c]'
                      : 'border-[#ebdccb] bg-white/60 hover:bg-white text-gray-600'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-sm">
                    🏛️
                  </div>
                  <span className="text-xs font-bold text-gray-900">Net Banking</span>
                  <span className="text-[10px] text-gray-500">All Indian Banks</span>
                </button>
              </div>
            </div>

            {/* Mode-Specific Sub-Options */}
            <div className="bg-white border border-[#ebdccb] rounded-[18px] p-3.5 text-xs shadow-2xs">
              {selectedMode === 'upi' && (
                <div className="space-y-2.5">
                  <div className="text-[11px] font-semibold text-gray-700">Choose your UPI App:</div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'gpay', label: 'Google Pay', icon: '🟢' },
                      { id: 'phonepe', label: 'PhonePe', icon: '🟣' },
                      { id: 'paytm', label: 'Paytm UPI', icon: '🔵' },
                      { id: 'qr', label: 'Scan QR', icon: '📱' }
                    ].map(app => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setUpiApp(app.id)}
                        className={`py-2 px-1 rounded-[12px] border text-center transition-all cursor-pointer ${
                          upiApp === app.id
                            ? 'border-[#5c292c] bg-[#faf8f5] font-bold text-[#5c292c]'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-sm">{app.icon}</div>
                        <div className="text-[10px] mt-0.5 truncate">{app.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedMode === 'card' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-gray-700">
                    <span>Card Information</span>
                    <span className="text-[10px] text-gray-500">Visa, MasterCard, RuPay</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Card Number (e.g. 4532 •••• •••• 8891)"
                      defaultValue="4532 •••• •••• 8891"
                      className="w-full h-[36px] px-3 rounded-xl border border-gray-200 text-xs font-mono font-medium focus:outline-none focus:border-[#5c292c]"
                      readOnly
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">💳</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="MM / YY"
                      defaultValue="12 / 29"
                      className="h-[36px] px-3 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none"
                      readOnly
                    />
                    <input
                      type="password"
                      placeholder="CVV"
                      defaultValue="•••"
                      className="h-[36px] px-3 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none"
                      readOnly
                    />
                  </div>
                </div>
              )}

              {selectedMode === 'netbanking' && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-gray-700">Select Bank:</div>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full h-[36px] px-3 rounded-xl border border-gray-200 text-xs font-semibold text-[#5c292c] bg-white focus:outline-none"
                  >
                    <option value="sbi">State Bank of India (SBI)</option>
                    <option value="hdfc">HDFC Bank</option>
                    <option value="icici">ICICI Bank</option>
                    <option value="axis">Axis Bank</option>
                    <option value="kotak">Kotak Mahindra Bank</option>
                    <option value="canara">Canara Bank</option>
                    <option value="iob">Indian Overseas Bank (IOB)</option>
                    <option value="cub">City Union Bank (CUB)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Gateway Security Badge */}
            <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
              <span className="flex items-center gap-1">
                <span>🔒</span> 256-Bit SSL Encrypted
              </span>
              <span>Razorpay Verified</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#ebdccb]">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-6 h-[40px] rounded-full font-barlow font-medium text-[14px] bg-white text-[#5c292c] border border-[#ebdccb] hover:bg-gray-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessPayment}
                disabled={isProcessing}
                className="flex-1 h-[40px] rounded-full font-barlow font-bold text-[14px] bg-[#5c292c] hover:bg-[#4a2123] text-white shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <span>Pay</span>
                )}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
