'use client';

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
}

export function SelfVerificationModal({
  isOpen,
  onVerify,
  onSkip,
  onCancel,
  slotsRemaining,
  canSkip,
}: SelfVerificationModalProps) {
  const { isVerifying, error, selfApp, startPolling } = useSelf();
  const {
    shouldShowQRCode,
    shouldUseDeeplink,
    isFarcaster,
    isLoading: platformLoading
  } = usePlatformDetection();

  if (!isOpen) return null;

  // Handle QR code verification success
  const handleQRSuccess = () => {
    console.log('✅ QR scan completed, starting polling for verification result');
    startPolling();
  };

  // Determine if verification is mandatory (at slot limit)
  const isMandatory = !canSkip;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div className="text-center space-y-4">
          {/* Icon */}
          <div className="text-6xl">🔐</div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900">
            {isMandatory ? 'Verification Required' : 'Unlock Unlimited Slots?'}
          </h2>

          {/* Description */}
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              Verify your age (18+) with SELF Protocol to {isMandatory ? 'continue playing' : 'unlock unlimited slots'}.
            </p>

            {isMandatory ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium">
                  🚫 You&apos;ve reached the 2-slot limit
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Verification is required to purchase more slots
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-medium">
                  ⚠️ You have {slotsRemaining} {slotsRemaining === 1 ? 'slot' : 'slots'} remaining
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Without verification, you&apos;re limited to 2 slots per game
                </p>
              </div>
            )}
          </div>

          {/* Benefits */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 text-left">
            <h3 className="font-bold text-gray-900 mb-2 text-sm">
              ✨ Verification Benefits
            </h3>
            <ul className="space-y-1.5 text-xs text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Unlimited slots in every game</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>One-time verification (persists in session)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Privacy-preserving (zero-knowledge proof)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>No personal data stored or exposed</span>
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Verification Options */}
          {!isVerifying && !platformLoading && selfApp && (
            <div className="space-y-4">
              {/* Farcaster: Show deeplink button first (primary action for mobile users) */}
              {shouldUseDeeplink && (
                <div className="space-y-3">
                  <button
                    onClick={onVerify}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all text-lg"
                  >
                    📱 Open SELF App to Verify
                  </button>
                  <p className="text-xs text-gray-500">
                    Opens SELF app for verification, then returns here
                  </p>
                </div>
              )}

              {/* Divider when showing both options */}
              {shouldUseDeeplink && shouldShowQRCode && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-xs text-gray-400">or scan QR code</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
              )}

              {/* QR code option */}
              {shouldShowQRCode && (
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-lg border-2 border-purple-200 mx-auto inline-block">
                    <SelfQRcodeWrapper
                      selfApp={selfApp}
                      onSuccess={handleQRSuccess}
                      onError={(err) => {
                        console.error('QR verification error:', err);
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 text-blue-700">
                <span className="animate-spin text-xl">⏳</span>
                <span className="font-medium">Verifying your identity...</span>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Complete verification in the SELF app. This may take up to 5 minutes.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            {/* Skip button - only show if user can skip */}
            {canSkip && (
              <button
                onClick={onSkip}
                disabled={isVerifying}
                className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Skip for Now ({slotsRemaining} {slotsRemaining === 1 ? 'slot' : 'slots'} left)
              </button>
            )}

            {/* Cancel button - always shown */}
            <button
              onClick={onCancel}
              disabled={isVerifying}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>

          {/* Privacy Note */}
          <p className="text-xs text-gray-500 pt-2">
            SELF Protocol uses zero-knowledge proofs to verify age without
            storing or exposing personal data.{' '}
            <a
              href="https://self.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700 underline"
            >
              Learn more
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
