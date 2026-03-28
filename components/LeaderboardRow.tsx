'use client'

import { Medal } from 'lucide-react'
import type { UserProfile } from '@/lib/types'

interface Props {
  rank: number
  userProfile: UserProfile
  score: number
  isBrandView?: boolean
  onScoreChange?: (score: number) => void
}

const rankColors: Record<number, string> = {
  1: 'bg-yellow-50 border-yellow-200',
  2: 'bg-gray-50 border-gray-200',
  3: 'bg-orange-50 border-orange-200',
}

const rankIconColors: Record<number, string> = {
  1: 'text-yellow-500',
  2: 'text-gray-400',
  3: 'text-amber-600',
}

export default function LeaderboardRow({ rank, userProfile, score, isBrandView, onScoreChange }: Props) {
  const maxScore = 100
  const progress = Math.min((score / maxScore) * 100, 100)
  const rowBg = rankColors[rank] || 'bg-white border-gray-100'

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${rowBg} transition-all`}>
      {/* Rank */}
      <div className="w-8 text-center flex-shrink-0">
        {rank <= 3 ? (
          <Medal size={20} className={rankIconColors[rank]} />
        ) : (
          <span className="text-sm font-bold text-gray-400">#{rank}</span>
        )}
      </div>

      {/* Avatar + Name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={userProfile.profileImage}
          alt={userProfile.username}
          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        />
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 truncate">@{userProfile.username}</div>
          <div className="text-xs text-gray-400">{userProfile.category}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex-1 max-w-32">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Score */}
      <div className="flex-shrink-0 w-28 text-right">
        {isBrandView && onScoreChange ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={score}
              onChange={(e) => onScoreChange(parseInt(e.target.value) || 0)}
              min={0}
              max={100}
              className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-xs text-gray-400">pts</span>
          </div>
        ) : (
          <span className="font-bold text-indigo-600">{score} pts</span>
        )}
      </div>
    </div>
  )
}
