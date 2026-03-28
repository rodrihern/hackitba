'use client'

import { Camera, Music, PlayCircle } from 'lucide-react'
import type { UserProfile } from '@/lib/types'
import LevelBadge from './LevelBadge'

function formatFollowers(n: number) {
  if (n === 0) return null
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return n.toString()
}

interface Props {
  user: UserProfile
  onInvite?: (user: UserProfile) => void
  onClick?: (user: UserProfile) => void
}

export default function UserCard({ user, onInvite, onClick }: Props) {
  const igFollowers = formatFollowers(user.followersInstagram)
  const ttFollowers = formatFollowers(user.followersTiktok)
  const ytFollowers = formatFollowers(user.followersYoutube)

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer group"
      onClick={() => onClick?.(user)}
    >
      <div className="p-5">
        {/* Avatar + Level */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.profileImage}
              alt={user.username}
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
            />
            <div>
              <div className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                @{user.username}
              </div>
              <div className="text-xs text-gray-400">{user.location}</div>
            </div>
          </div>
          <LevelBadge level={user.level} size="sm" />
        </div>

        {/* Category */}
        <div className="mb-3">
          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
            {user.category}
          </span>
        </div>

        {/* Bio */}
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
          {user.bio}
        </p>

        {/* Followers */}
        <div className="flex flex-wrap gap-2 mb-4">
          {igFollowers && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Camera size={12} className="text-pink-500" />
              <span className="font-medium">{igFollowers}</span>
            </div>
          )}
          {ttFollowers && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Music size={12} className="text-gray-700" />
              <span className="font-medium">{ttFollowers}</span>
            </div>
          )}
          {ytFollowers && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <PlayCircle size={12} className="text-red-500" />
              <span className="font-medium">{ytFollowers}</span>
            </div>
          )}
        </div>

        {/* Action */}
        {onInvite && (
          <button
            onClick={(e) => { e.stopPropagation(); onInvite(user) }}
            className="w-full bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Invitar a Canje
          </button>
        )}
      </div>
    </div>
  )
}
