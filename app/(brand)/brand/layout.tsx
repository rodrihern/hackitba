'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import type { BrandProfile } from '@/lib/types'
import AuthRecoveryScreen from '@/components/AuthRecoveryScreen'

const navItems = [
  { href: '/brand/dashboard', label: 'Dashboard' },
  { href: '/brand/campaigns', label: 'Mis Campañas' },
  { href: '/brand/marketplace', label: 'Influencers' },
  { href: '/brand/store', label: 'Mi Tienda' },
]

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading, isRecoveringSession, session, authError, logout } = useAuth()
  const pathname = usePathname()
  const [failedLogoSrc, setFailedLogoSrc] = useState<string | null>(null)

  const handleLogout = async () => {
    await logout('/login')
  }

  useEffect(() => {
    if (isLoading || typeof window === 'undefined') return

    if (!session) {
      if (window.location.pathname !== '/') {
        window.location.replace('/')
      }

      return
    }

    if (currentUser?.role === 'user' && window.location.pathname !== '/home') {
      window.location.replace('/home')
    }
  }, [session, currentUser, isLoading])

  const rawLogo = (currentUser?.profile as BrandProfile | undefined)?.logo?.trim() ?? ''

  if (isLoading || isRecoveringSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (session && !currentUser) {
    return (
      <AuthRecoveryScreen
        message={
          authError ||
          'La sesión existe, pero no se pudo cargar el perfil de marca. Probablemente haya un problema de RLS, migraciones o configuración de Supabase.'
        }
        onReset={() => logout('/login')}
      />
    )
  }

  if (session && currentUser?.role !== 'brand') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!currentUser || currentUser.role !== 'brand') {
    return null
  }

  const profile = currentUser.profile as BrandProfile
  const showLogoImage = Boolean(rawLogo) && failedLogoSrc !== rawLogo
  const brandInitial = profile.name?.[0]?.toUpperCase() ?? 'B'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className="flex items-center justify-between gap-4">
            <Link href="/brand/dashboard" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.png" alt="CollabSpace" className="h-10 w-10 rounded-2xl shadow-sm" />
              <div>
                <div className="font-bold text-gray-900">CollabSpace</div>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 lg:hidden"
            >
              Salir
            </button>
          </div>

          <nav className="mx-auto flex w-fit items-center gap-1 overflow-x-auto rounded-2xl bg-gray-100 p-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/brand/dashboard' && pathname.startsWith(item.href))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
          </nav>

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <div className="flex items-center gap-2 rounded-xl px-3 py-1.5">
              <div className="h-7 w-7 overflow-hidden rounded-full border border-gray-200 bg-gray-50">
                {showLogoImage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={rawLogo}
                      alt={profile.name}
                      className="h-full w-full object-cover"
                      onError={() => setFailedLogoSrc(rawLogo)}
                    />
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-indigo-100">
                    <span className="text-xs font-bold text-indigo-600">{brandInitial}</span>
                  </div>
                )}
              </div>
              <span className="max-w-32 truncate text-sm font-medium text-gray-700">{profile.name}</span>
            </div>

            <button
              onClick={handleLogout}
              className="hidden rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 lg:inline-flex"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-97px)] overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
