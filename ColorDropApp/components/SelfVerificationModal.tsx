'use client';

import Image from 'next/image';
import { useSelf } from '@/contexts/SelfContext';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { SelfQRcodeWrapper } from '@selfxyz/qrcode';

interface SelfVerificationModalProps {
  isOpen: boolean;
  onVerify: () => void;
  onSkip: () => void;
  onCancel: () => void;
  slotsRemaining: number;
  canSkip: boolean;
  onProceedVerified?: () => void; // Called when verified user proceeds
}

export function SelfVerificationModal({
  isOpen,
  onVerify,
  onSkip,
  onCancel,
  slotsRemaining,
  canSkip,
  onProceedVerified,
}: SelfVerificationModalProps) {
  const { isVerified, isVerifying, error, selfApp, setIsVerified } = useSelf();
  const {
    shouldShowQRCode,
    shouldUseDeeplink,
    isFarcaster,
    isLoading: platformLoading
  } = usePlatformDetection();

  if (!isOpen) return null;

  // Handle QR code verification success
  // This is called when SELF app successfully verifies and our backend returns success
  const handleQRSuccess = () => {
    console.log('✅ SELF verification completed successfully!');
    // Mark as verified and proceed immediately
    setIsVerified(true);
    // Auto-proceed to payment after brief moment
    if (onProceedVerified) {
      setTimeout(() => {
        onProceedVerified();
      }, 500);
    }
  };

  // Determine if verification is mandatory (at slot limit)
  const isMandatory = !canSkip;

  // v4.0.0: If already verified when modal opens, proceed immediately
  // Note: The main flow control is handled by useEffect in PlayGrid.tsx
  // This is just a safety check for edge cases
  if (isVerified && onProceedVerified && !isVerifying) {
    // Don't render the modal if already verified - let parent handle it
    return null;
  }

  // Always show verification screen with SELF branding (for marketing)
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
        <div className="text-center space-y-3">
          {/* SELF Protocol Logo + Header */}
          <div className="flex flex-col items-center gap-2">
            <Image
              src="/self.png"
              alt="SELF Protocol"
              width={80}
              height={80}
              className="w-16 h-16 sm:w-20 sm:h-20"
            />
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              {isMandatory ? 'Age Verification Required' : 'Verify with SELF Protocol'}
            </h2>
          </div>

          {/* Compact Description */}
          <p className="text-xs sm:text-sm text-gray-600">
            Verify your age (18+) to {isMandatory ? 'continue playing' : 'unlock more slots'}.
          </p>

          {/* Status Banner */}
          {isMandatory ? (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <p className="text-red-800 font-medium text-sm">
                🚫 You&apos;ve used your 2 free slots
              </p>
              <p className="text-xs text-red-700">
                SELF verification required for additional slots
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <p className="text-amber-800 font-medium text-sm">
                ⚠️ {slotsRemaining} free {slotsRemaining === 1 ? 'slot' : 'slots'} remaining
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2">
              <p className="text-xs text-red-800">{error}</p>
            </div>
          )}

          {/* Verification Options */}
          {!isVerifying && !platformLoading && selfApp && (
            <div className="space-y-3">
              {/* Farcaster: Show deeplink button first (primary action for mobile users) */}
              {shouldUseDeeplink && (
                <div className="space-y-1">
                  <button
                    onClick={onVerify}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <Image src="/self.png" alt="" width={20} height={20} className="w-5 h-5" />
                    Open SELF App to Verify
                  </button>
                  <p className="text-[10px] text-gray-500">
                    Opens SELF app for verification, then returns here
                  </p>
                </div>
              )}

              {/* Divider when showing both options */}
              {shouldUseDeeplink && shouldShowQRCode && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-[10px] text-gray-400">or scan QR</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
              )}

              {/* QR code option */}
              {shouldShowQRCode && (
                <div className="space-y-2">
                  <div className="bg-white p-2 rounded-lg border-2 border-purple-200 mx-auto inline-block qr-container">
                    <div className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] flex items-center justify-center overflow-hidden">
                      <SelfQRcodeWrapper
                        selfApp={selfApp}
                        onSuccess={handleQRSuccess}
                        size={160}
                        onError={(err) => {
                          console.error('QR verification error:', err);
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {isFarcaster
                      ? 'Or scan with SELF app on another device'
                      : 'Scan with SELF Protocol mobile app to verify'
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Verification in progress indicator */}
          {isVerifying && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-center gap-2 text-blue-700">
                <span className="animate-spin text-lg">⏳</span>
                <span className="font-medium text-sm">Verifying...</span>
              </div>
              <p className="text-[10px] text-blue-600 mt-1">
                Complete verification in the SELF app
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-1">
            {/* Skip button - only show if user can skip */}
            {canSkip && (
              <button
                onClick={onSkip}
                disabled={isVerifying}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Skip for Now ({slotsRemaining} free {slotsRemaining === 1 ? 'slot' : 'slots'} left)
              </button>
            )}

            {/* Cancel button - always shown */}
            <button
              onClick={onCancel}
              disabled={isVerifying}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Cancel
            </button>
          </div>

          {/* SELF Protocol Branding Footer */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500">
              <span>Powered by</span>
              <a
                href="https://self.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium"
              >
                <Image src="/self.png" alt="" width={14} height={14} className="w-3.5 h-3.5" />
                SELF Protocol
              </a>
              <span>• Zero-Knowledge Age Verification</span>
            </div>
          </div>
        </div>
      </div>

      {/* CSS to constrain QR code size */}
      <style jsx global>{`
        .qr-container svg,
        .qr-container canvas {
          max-width: 100% !important;
          max-height: 100% !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
}
