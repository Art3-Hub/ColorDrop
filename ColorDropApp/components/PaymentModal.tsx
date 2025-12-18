'use client';

import { useEffect } from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  slotNumber: number;
  entryFee: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
  error?: Error | null;
}

export function PaymentModal({
  isOpen,
  slotNumber,
  entryFee,
  onConfirm,
  onCancel,
  isProcessing = false,
  error = null,
}: PaymentModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isProcessing, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isProcessing ? onCancel : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="text-center">
          <div className="text-5xl sm:text-6xl mb-4">💰</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Confirm Payment
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            You're about to play Slot #{slotNumber}
          </p>
        </div>

        {/* Payment Details */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 sm:p-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm sm:text-base text-gray-700 font-medium">Entry Fee:</span>
            <span className="text-lg sm:text-2xl font-bold text-purple-600">{entryFee}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm sm:text-base text-gray-700 font-medium">Slot Number:</span>
            <span className="text-lg sm:text-xl font-bold text-gray-900">#{slotNumber}</span>
          </div>

          <div className="border-t border-purple-200 pt-3 mt-3">
            <div className="text-xs sm:text-sm text-gray-600 space-y-1">
              <div className="flex items-center gap-2">
                <span>🥇 1st: 0.6 CELO</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🥈 2nd: 0.3 CELO</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🥉 3rd: 0.1 CELO</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start gap-2">
              <span className="text-lg">❌</span>
              <div className="text-xs sm:text-sm text-red-800">
                <p className="font-semibold mb-1">Transaction Failed:</p>
                <p>{error.message || 'An unknown error occurred. Please try again.'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <div className="text-xs sm:text-sm text-yellow-800">
              <p className="font-semibold mb-1">Important:</p>
              <p>Once paid, the entry fee cannot be refunded. Make sure you're ready to play!</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Processing...
              </span>
            ) : (
              `Pay ${entryFee} & Play`
            )}
          </button>
        </div>

        {/* Close button */}
        {!isProcessing && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
