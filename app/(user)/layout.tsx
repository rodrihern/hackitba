'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import Navbar from '@/components/Navbar'
import type { UserProfile } from '@/lib/types'
import LevelBadge from '@/components/LevelBadge'

const navItems = [
  { href: '/home', label: 'Home', icon: '🏠' },
  { href: '/explore', label: 'Explorar', icon: '🔍' },
  { href: '/campaigns', label: 'Mis Campañas', icon: '📋' },
  { href: '/points', label: 'Mis Puntos', icon: '⭐' },
  { href: '/store', label: 'Tienda', icon: '🛍️' },
  { href: '/notifications', label: 'Notificaciones', icon: '🔔' },
]

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const unreadCount = 0 // Will be fetched dynamically in notifications page

  useEffect(() => {
    if (!isLoading && (!currentUser || currentUser.role !== 'user')) {
      router.replace('/')
    }
  }, [currentUser, isLoading, router])

  if (isLoading || !currentUser || currentUser.role !== 'user') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const profile = currentUser.profile as UserProfile

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-50">
          <Link href="/home" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CS</span>
            </div>
            <span className="font-bold text-gray-900">CollabSpace</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
                {item.label === 'Notificaciones' && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Profile snippet */}
        <div className="px-4 py-4 border-t border-gray-100">
          <Link href="/profile" className="flex items-center gap-3 mb-3 hover:opacity-80 transition-opacity">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.profileImage}
              alt={profile.username}
              className="w-9 h-9 rounded-full object-cover border-2 border-gray-100"
            />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-gray-900 text-sm truncate">@{profile.username}</div>
              <LevelBadge level={profile.level} size="sm" />
            </div>
          </Link>
          <button
            onClick={logout}
            className="w-full text-left text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar role="user" />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
