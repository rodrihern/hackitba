'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Medal, Gem, Sparkles } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import LevelBadge from '@/components/LevelBadge'
import type { UserProfile, UserLevel } from '@/lib/types'
import { fetchUserPointsData, type UserBrandPointsRow, type UserRedemptionRow } from '@/lib/services/user-service'

const levelThresholds: Record<UserLevel, { min: number; max: number; next: UserLevel | null }> = {
  Bronze:   { min: 0,     max: 2000,  next: 'Silver' },
  Silver:   { min: 2000,  max: 5000,  next: 'Gold' },
  Gold:     { min: 5000,  max: 8000,  next: 'Platinum' },
  Platinum: { min: 8000,  max: 12000, next: 'Diamond' },
  Diamond:  { min: 12000, max: 20000, next: null },
}

export default function PointsPage() {
  const { currentUser } = useAuth()
  const profile = currentUser?.profile as UserProfile
  const [brandPoints, setBrandPoints] = useState<UserBrandPointsRow[]>([])
  const [redemptions, setRedemptions] = useState<UserRedemptionRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!currentUser) return
      const userProfile = currentUser.profile as UserProfile

      try {
        const data = await fetchUserPointsData(userProfile.id)
        setBrandPoints(data.brandPoints)
        setRedemptions(data.redemptions)
      } catch (err) {
        console.error('Error fetching points data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentUser])

  const threshold = levelThresholds[profile?.level ?? 'Bronze']
  const progress = Math.min(
    ((profile?.totalPoints - threshold.min) / (threshold.max - threshold.min)) * 100,
    100
  )

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Mis Puntos</h1>
        <p className="text-gray-500">Tu historial de puntos y nivel actual</p>
      </div>

      {/* Level progress card */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white mb-6 shadow-lg shadow-indigo-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-5xl font-extrabold mb-1">{profile?.totalPoints?.toLocaleString()}</div>
            <div className="text-indigo-200">puntos totales</div>
          </div>
          <div className="text-right">
            <div className="text-4xl mb-1">
              {profile?.level === 'Diamond' ? <Sparkles size={36} /> : profile?.level === 'Platinum' ? <Gem size={36} /> : <Medal size={36} />}
            </div>
            <LevelBadge level={profile?.level ?? 'Bronze'} size="md" />
          </div>
        </div>

        {threshold.next && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-indigo-200">{profile?.level}</span>
              <span className="text-white font-medium">{threshold.next} ({threshold.max.toLocaleString()} pts)</span>
            </div>
            <div className="h-3 bg-indigo-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-sm text-indigo-200 mt-2">
              Te faltan <strong className="text-white">{(threshold.max - profile?.totalPoints)?.toLocaleString()} puntos</strong> para llegar a {threshold.next}
            </div>
          </div>
        )}
        {!threshold.next && (
          <div className="text-indigo-100 text-sm">
            ¡Llegaste al nivel máximo!
          </div>
        )}
      </div>

      {/* Brand points cards */}
      {brandPoints.length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold text-gray-900 mb-3">Puntos por marca</h2>
          <div className="grid grid-cols-3 gap-4">
            {brandPoints.map(bp => {
              const brandLogo = bp.brand_profiles?.logo?.trim()

              return (
                <div key={bp.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                      {brandLogo ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={brandLogo}
                            alt={bp.brand_profiles?.name}
                            className="w-8 h-8 object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-gray-500">
                          {bp.brand_profiles?.name?.charAt(0)?.toUpperCase() || 'B'}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{bp.brand_profiles?.name}</div>
                      <div className="text-xs text-gray-400">Puntos disponibles</div>
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-indigo-600">{bp.points.toLocaleString()}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Redemptions history */}
      {redemptions.length > 0 && (
        <div>
          <h2 className="font-bold text-gray-900 mb-3">Historial reciente</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {redemptions.map((entry, i) => (
              <div key={entry.id} className={`flex items-center justify-between px-5 py-4 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-red-100 text-red-600">
                    -
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{entry.rewards?.title}</div>
                    <div className="text-xs text-gray-400">
                      {entry.rewards?.brand_profiles?.name} · {new Date(entry.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                    </div>
                  </div>
                </div>
                <div className="font-bold text-red-500">
                  -{entry.points_used.toLocaleString()} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {brandPoints.length === 0 && redemptions.length === 0 && (
        <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <p className="text-sm">Aún no tenés puntos acumulados. ¡Participá en campañas para ganar!</p>
        </div>
      )}
    </div>
  )
}
