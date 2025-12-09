'use client';

import { useSelf } from '@/contexts/SelfContext';

interface SelfVerificationModalProps {
  isOpen: boolean;
  onVerify: () => void;
  onSkip: () => void;
  slotsRemaining: number;
  isUnlimited: boolean;
}

export function SelfVerificationModal({
  isOpen,
  onVerify,
  onSkip,
  slotsRemaining,
  isUnlimited,
}: SelfVerificationModalProps) {
  const { isVerifying, error } = useSelf();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
        <div className="text-center space-y-4">
          {/* Icon */}
          <div className="text-6xl">🔐</div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900">
            Unlock Unlimited Slots?
          </h2>

          {/* Description */}
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              Verify your age (18+) with SELF Protocol to unlock unlimited slots
              in this game and all future games.
            </p>

            {!isUnlimited && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-medium">
                  ⚠️ You have {slotsRemaining} {slotsRemaining === 1 ? 'slot' : 'slots'} remaining
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Without verification, you're limited to 4 slots per game
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
                <span>One-time verification (persists forever)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Privacy-preserving (zero-knowledge proof)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Comply with global regulations</span>
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={onVerify}
              disabled={isVerifying}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Verifying...
                </span>
              ) : (
                '🔐 Verify Age with SELF'
              )}
            </button>

            <button
              onClick={onSkip}
              disabled={isVerifying}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip for Now ({slotsRemaining} {slotsRemaining === 1 ? 'slot' : 'slots'} left)
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
