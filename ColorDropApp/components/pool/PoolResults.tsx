'use client';

interface PlayerResult {
  rank: number;
  address: string;
  username?: string;
  fid?: number;
  accuracy: number;
  prize?: string;
}

interface PoolResultsProps {
  results: PlayerResult[];
  userAddress: string;
  onBackToLobby: () => void;
}

export function PoolResults({ results, userAddress, onBackToLobby }: PoolResultsProps) {
  const userResult = results.find(
    r => r.address.toLowerCase() === userAddress.toLowerCase()
  );

  const isWinner = userResult && userResult.rank <= 3;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className={`rounded-2xl shadow-xl p-8 text-white ${
        isWinner
          ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
          : 'bg-gradient-to-r from-purple-600 to-blue-600'
      }`}>
        <div className="text-center">
          <div className="text-6xl mb-4">
            {isWinner ? '🏆' : '🎮'}
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {isWinner ? 'Congratulations!' : 'Tournament Complete'}
          </h1>
          {userResult && (
            <div className="text-xl">
              You ranked #{userResult.rank} with {userResult.accuracy.toFixed(2)}% accuracy
              {isWinner && (
                <div className="text-2xl font-bold mt-2">
                  Prize: {userResult.prize}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
          🏅 Winners
        </h2>

        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
          {/* 2nd Place */}
          {results[1] && (
            <div className="text-center order-1">
              <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl p-4 shadow-lg mb-3 h-32 flex flex-col justify-center">
                <div className="text-4xl mb-2">🥈</div>
                <div className="text-3xl font-bold text-gray-700">2nd</div>
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {results[1].username || `${results[1].address.slice(0, 6)}...`}
              </div>
              <div className="text-xs text-gray-600">
                {results[1].accuracy.toFixed(2)}%
              </div>
              <div className="text-lg font-bold text-gray-700 mt-1">
                6 CELO
              </div>
            </div>
          )}

          {/* 1st Place */}
          {results[0] && (
            <div className="text-center order-2">
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl p-4 shadow-xl mb-3 h-40 flex flex-col justify-center transform scale-110">
                <div className="text-5xl mb-2">🥇</div>
                <div className="text-4xl font-bold text-yellow-900">1st</div>
              </div>
              <div className="text-base font-bold text-gray-900">
                {results[0].username || `${results[0].address.slice(0, 6)}...`}
              </div>
              <div className="text-sm text-gray-600">
                {results[0].accuracy.toFixed(2)}%
              </div>
              <div className="text-2xl font-bold text-yellow-600 mt-1">
                10 CELO
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {results[2] && (
            <div className="text-center order-3">
              <div className="bg-gradient-to-br from-orange-300 to-orange-400 rounded-xl p-4 shadow-lg mb-3 h-32 flex flex-col justify-center">
                <div className="text-4xl mb-2">🥉</div>
                <div className="text-3xl font-bold text-orange-900">3rd</div>
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {results[2].username || `${results[2].address.slice(0, 6)}...`}
              </div>
              <div className="text-xs text-gray-600">
                {results[2].accuracy.toFixed(2)}%
              </div>
              <div className="text-lg font-bold text-orange-700 mt-1">
                3 CELO
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Leaderboard */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          📊 Full Leaderboard
        </h2>

        <div className="space-y-2">
          {results.map((result) => {
            const isCurrentUser = result.address.toLowerCase() === userAddress.toLowerCase();
            const isTopThree = result.rank <= 3;

            return (
              <div
                key={result.address}
                className={`flex items-center justify-between p-4 rounded-xl ${
                  isCurrentUser
                    ? 'bg-blue-50 border-2 border-blue-300'
                    : isTopThree
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                {/* Rank & Player */}
                <div className="flex items-center gap-4 flex-1">
                  <div className={`text-2xl font-bold ${
                    result.rank === 1 ? 'text-yellow-600' :
                    result.rank === 2 ? 'text-gray-600' :
                    result.rank === 3 ? 'text-orange-600' :
                    'text-gray-400'
                  }`}>
                    #{result.rank}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {result.username || `${result.address.slice(0, 6)}...${result.address.slice(-4)}`}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    {result.fid && (
                      <div className="text-xs text-gray-500">
                        FID: {result.fid}
                      </div>
                    )}
                  </div>
                </div>

                {/* Accuracy */}
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">
                    {result.accuracy.toFixed(2)}%
                  </div>
                  {result.prize && (
                    <div className="text-sm font-semibold text-green-600">
                      {result.prize}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBackToLobby}
          className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
        >
          Join New Pool
        </button>
      </div>
    </div>
  );
}
