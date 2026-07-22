import { Metadata } from 'next';
import { getLeaderboard } from '@/lib/api-adapter';
import { Trophy, Medal, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Leaderboard - SassyGurl Store',
  description: 'Top spenders of the month at SassyGurl Store.',
};

export const revalidate = 60; // Revalidate every 60 seconds

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard();

  return (
    <div className="container mx-auto py-12 px-4 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
          Monthly Leaderboard
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Top 50 SassyGurl members this month! Top 10 will receive special balance rewards at the end of the month.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="rounded-xl border border-pink-500/20 bg-zinc-950/50 shadow-lg shadow-pink-500/5 overflow-hidden">
          <div className="bg-white/5 border-b border-white/10 p-6">
            <h2 className="flex items-center gap-2 text-2xl font-semibold">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Top Members
            </h2>
          </div>
          <div className="p-0">
            {leaderboard.length === 0 ? (
              <div className="p-8 text-center text-zinc-400">
                No leaderboard data available yet for this month.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {leaderboard.map((user: any, index: number) => (
                  <div 
                    key={user.userId} 
                    className={`flex items-center justify-between p-4 transition-colors hover:bg-white/5 ${
                      index < 3 ? 'bg-white/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg bg-zinc-900 border-2 border-zinc-800 relative">
                        {index === 0 && <Medal className="absolute -top-3 -right-3 h-6 w-6 text-yellow-500" />}
                        {index === 1 && <Medal className="absolute -top-3 -right-3 h-6 w-6 text-gray-400" />}
                        {index === 2 && <Medal className="absolute -top-3 -right-3 h-6 w-6 text-amber-600" />}
                        {index + 1}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img src={user.image} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center">
                            <span className="text-pink-500 font-bold">{user.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{user.name}</p>
                          {index < 10 && (
                            <span className="text-xs text-pink-500 font-medium">Top 10 Reward Candidate</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end text-lg font-bold text-pink-500">
                        {user.monthlyPoints.toLocaleString('id-ID')} <Star className="h-4 w-4 fill-pink-500 text-pink-500" />
                      </div>
                      <p className="text-xs text-zinc-400">Points</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
