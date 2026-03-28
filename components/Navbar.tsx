'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { mockNotifications } from '@/lib/mock-data'
import type { UserProfile, BrandProfile } from '@/lib/types'

interface Props {
  role: 'user' | 'brand'
}

export default function Navbar({ role }: Props) {
  const { currentUser, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleLogout = async () => {
    setShowDropdown(false)
    await logout('/login')
  }

  const unreadCount = mockNotifications.filter(n => !n.read).length

  const profile = currentUser?.profile
  const displayName = role === 'user'
    ? `@${(profile as UserProfile)?.username}`
    : (profile as BrandProfile)?.name

  const avatarSrc = role === 'user'
    ? (profile as UserProfile)?.profileImage
    : (profile as BrandProfile)?.logo

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-end px-6 gap-4 sticky top-0 z-40">
      {/* Notifications bell */}
      {role === 'user' && (
        <Link
          href="/notifications"
          className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Link>
      )}

      {/* Avatar dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 rounded-xl px-3 py-1.5 hover:bg-gray-100 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarSrc} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            ) : (
              <div className="w-full h-full bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 text-xs font-bold">
                  {displayName?.[0]?.toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <span className="text-sm font-medium text-gray-700 max-w-32 truncate">{displayName}</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              {role === 'user' && (
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowDropdown(false)}
                >
                  Mi perfil
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Cerrar sesión
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
