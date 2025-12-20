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

// Helper to detect if error is a user rejection/cancellation
function isUserRejection(error: Error | null): boolean {
  if (!error) return false;
  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('user rejected') ||
    message.includes('user denied') ||
    message.includes('rejected the request') ||
    message.includes('user cancelled') ||
    message.includes('user canceled') ||
    message.includes('action_rejected') ||
    message.includes('denied transaction signature')
  );
}

// Helper to get user-friendly error message
function getErrorDisplay(error: Error | null): { icon: string; title: string; message: string; variant: 'info' | 'error' } {
  if (!error) {
    return { icon: '❌', title: 'Error', message: 'An unknown error occurred.', variant: 'error' };
  }

  if (isUserRejection(error)) {
    return {
      icon: '↩️',
      title: 'Transaction Cancelled',
      message: 'You cancelled the transaction. No payment was made. Feel free to try again when you\'re ready!',
      variant: 'info'
    };
  }

  // Check for insufficient funds
  if (error.message?.toLowerCase().includes('insufficient funds')) {
    return {
      icon: '💰',
      title: 'Insufficient Funds',
      message: 'You don\'t have enough CELO to complete this transaction. Please add more CELO to your wallet.',
      variant: 'error'
    };
  }

  // Check for network issues
  if (error.message?.toLowerCase().includes('network') || error.message?.toLowerCase().includes('connection')) {
    return {
      icon: '🌐',
      title: 'Network Error',
      message: 'There was a network issue. Please check your connection and try again.',
      variant: 'error'
    };
  }

  // Default error
  return {
    icon: '❌',
    title: 'Transaction Failed',
    message: error.message || 'An unknown error occurred. Please try again.',
    variant: 'error'
  };
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
      <div className="relative bg-white rounded-2xl shadow-xl border border-celo-dark-tan max-w-md w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="text-center">
          <div className="text-5xl sm:text-6xl mb-4">💰</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-celo-brown mb-2">
            Confirm Payment
          </h2>
          <p className="text-sm sm:text-base text-celo-body">
            You're about to play Slot #{slotNumber}
          </p>
        </div>

        {/* Payment Details */}
        <div className="bg-celo-dark-tan/30 rounded-xl p-4 sm:p-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm sm:text-base text-celo-body font-medium">Entry Fee:</span>
            <span className="text-lg sm:text-2xl font-bold text-celo-forest">{entryFee}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm sm:text-base text-celo-body font-medium">Slot Number:</span>
            <span className="text-lg sm:text-xl font-bold text-celo-brown">#{slotNumber}</span>
          </div>

          <div className="border-t border-celo-dark-tan pt-3 mt-3">
            <div className="text-xs sm:text-sm text-celo-body space-y-1">
              <div className="flex items-center gap-2">
                <span>🥇 1st: 3.5 CELO</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🥈 2nd: 2.5 CELO</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🥉 3rd: 1.25 CELO</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error/Cancellation Message */}
        {error && (() => {
          const errorDisplay = getErrorDisplay(error);
          const isInfo = errorDisplay.variant === 'info';
          return (
            <div className={`rounded-lg p-3 sm:p-4 ${
              isInfo
                ? 'bg-celo-forest/10 border border-celo-forest/30'
                : 'bg-celo-error/10 border border-celo-error/30'
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{errorDisplay.icon}</span>
                <div className={`text-xs sm:text-sm ${isInfo ? 'text-celo-forest' : 'text-celo-error'}`}>
                  <p className="font-semibold mb-1">{errorDisplay.title}</p>
                  <p className="opacity-90">{errorDisplay.message}</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Important Notice */}
        <div className="bg-celo-yellow/20 border border-celo-yellow/50 rounded-lg p-3 sm:p-4">
          <div className="flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <div className="text-xs sm:text-sm text-celo-brown">
              <p className="font-medium mb-1">Important:</p>
              <p>Once paid, the entry fee cannot be refunded. Make sure you're ready to play!</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 px-6 py-3 bg-celo-dark-tan/50 text-celo-brown font-medium rounded-xl hover:bg-celo-dark-tan transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 px-6 py-4 bg-celo-forest text-white font-medium rounded-xl hover:bg-celo-forest/90 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="absolute top-4 right-4 text-celo-inactive hover:text-celo-brown transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
