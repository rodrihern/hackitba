'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import Navbar from '@/components/Navbar'
import type { BrandProfile } from '@/lib/types'

const navItems = [
  { href: '/brand/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/brand/campaigns', label: 'Mis Campañas', icon: '📋' },
  { href: '/brand/campaigns/create', label: 'Crear Campaña', icon: '✨' },
  { href: '/brand/marketplace', label: 'Marketplace', icon: '🔍' },
  { href: '/brand/store', label: 'Tienda', icon: '🎁' },
]

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading, logout } = useAuth()
  const pathname = usePathname()
  const [failedLogoSrc, setFailedLogoSrc] = useState<string | null>(null)

  useEffect(() => {
    if (isLoading || typeof window === 'undefined') return

    if (!currentUser || currentUser.role !== 'brand') {
      if (window.location.pathname !== '/') {
        window.location.replace('/')
      }
    }
  }, [currentUser, isLoading])

  const rawLogo = (currentUser?.profile as BrandProfile | undefined)?.logo?.trim() ?? ''

  if (isLoading || !currentUser || currentUser.role !== 'brand') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const profile = currentUser.profile as BrandProfile
  const showLogoImage = Boolean(rawLogo) && failedLogoSrc !== rawLogo
  const brandInitial = profile.name?.[0]?.toUpperCase() ?? 'B'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-50">
          <Link href="/brand/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CS</span>
            </div>
            <span className="font-bold text-gray-900">CollabSpace</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
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
              </Link>
            )
          })}
        </nav>



        {/* Brand profile snippet */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
              {showLogoImage ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={rawLogo}
                    alt={profile.name}
                    className="w-7 h-7 object-contain"
                    onError={() => setFailedLogoSrc(rawLogo)}
                  />
                </>
              ) : (
                <div className="w-full h-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 text-sm font-bold">{brandInitial}</span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-gray-900 text-sm truncate">{profile.name}</div>
              <div className="text-xs text-gray-400 truncate">{profile.industry}</div>
            </div>
          </div>
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
        <Navbar role="brand" />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
