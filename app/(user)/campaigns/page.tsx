'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import type { ApplicationStatus, UserProfile } from '@/lib/types'

const statusLabels: Record<ApplicationStatus, string> = {
  applied: 'Aplicada',
  invited: 'Invitada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
}

const statusColors: Record<ApplicationStatus, string> = {
  applied: 'bg-blue-50 text-blue-700 border-blue-200',
  invited: 'bg-violet-50 text-violet-700 border-violet-200',
  accepted: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

interface ApplicationRow {
  id: string
  status: ApplicationStatus
  proposal_text: string
  created_at: string
  exchanges: {
    id: string
    campaigns: {
      id: string
      title: string
      brand_profiles: { name: string; logo: string }
    }
  }
}

interface ChallengeSubRow {
  id: string
  created_at: string
  challenges: {
    id: string
    is_multi_day: boolean
    total_days: number
    challenge_days: { id: string; day_number: number }[]
    campaigns: {
      id: string
      title: string
      brand_profiles: { name: string; logo: string }
    }
  }
}

export default function CampaignsPage() {
  const [tab, setTab] = useState<'applications' | 'challenges'>('applications')
  const { currentUser } = useAuth()
  const [applications, setApplications] = useState<ApplicationRow[]>([])
  const [challengeSubs, setChallengeSubs] = useState<ChallengeSubRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!currentUser) return
      const userProfile = currentUser.profile as UserProfile

      try {
        const [appsResult, subsResult] = await Promise.all([
          supabase
            .from('exchange_applications')
            .select(`
              *,
              exchanges (
                *,
                campaigns (*, brand_profiles (name, logo))
              )
            `)
            .eq('user_id', userProfile.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('challenge_submissions')
            .select(`
              *,
              challenges (
                *,
                campaigns (*, brand_profiles (name, logo)),
                challenge_days (*)
              )
            `)
            .eq('user_id', userProfile.id)
        ])

        if (appsResult.data) setApplications(appsResult.data as unknown as ApplicationRow[])
        if (subsResult.data) setChallengeSubs(subsResult.data as unknown as ChallengeSubRow[])
      } catch (err) {
        console.error('Error fetching user campaigns:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentUser])

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
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Mis Campañas</h1>
        <p className="text-gray-500">Seguí el estado de tus aplicaciones y retos</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {([['applications', 'Aplicaciones'], ['challenges', 'Retos']] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setTab(val)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === val
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Applications tab */}
      {tab === 'applications' && (
        <div className="space-y-3">
          {applications.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-4">📋</div>
              <p className="font-medium text-gray-600 mb-1">No tenés aplicaciones</p>
              <p className="text-sm">Explorá campañas y empezá a aplicar</p>
            </div>
          ) : (
            applications.map(app => {
              const campaign = app.exchanges?.campaigns
              if (!campaign) return null

              return (
                <div key={app.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={campaign.brand_profiles?.logo}
                          alt={campaign.brand_profiles?.name}
                          className="w-8 h-8 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{campaign.title}</div>
                        <div className="text-sm text-gray-400">{campaign.brand_profiles?.name} · {formatDate(app.created_at)}</div>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusColors[app.status]}`}>
                      {statusLabels[app.status]}
                    </span>
                  </div>

                  {app.proposal_text && (
                    <div className="mt-3 bg-gray-50 rounded-xl px-4 py-3">
                      <p className="text-sm text-gray-600 italic">&ldquo;{app.proposal_text}&rdquo;</p>
                    </div>
                  )}

                  {app.status === 'accepted' && (
                    <div className="mt-3 bg-green-50 rounded-xl px-4 py-3 flex items-center gap-2">
                      <span className="text-green-600">✅</span>
                      <span className="text-sm text-green-700 font-medium">¡Felicitaciones! Tu aplicación fue aceptada. La marca se comunicará con vos pronto.</span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Challenges tab */}
      {tab === 'challenges' && (
        <div className="space-y-3">
          {challengeSubs.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-4">🏆</div>
              <p className="font-medium text-gray-600 mb-1">No participás en ningún reto</p>
              <p className="text-sm">Explorá los retos disponibles</p>
            </div>
          ) : (
            challengeSubs.map(sub => {
              const challenge = sub.challenges
              if (!challenge) return null
              const campaign = challenge.campaigns
              const currentDay = challenge.challenge_days?.length || 1

              return (
                <div key={sub.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={campaign?.brand_profiles?.logo}
                          alt={campaign?.brand_profiles?.name}
                          className="w-8 h-8 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{campaign?.title}</div>
                        <div className="text-sm text-gray-400">{campaign?.brand_profiles?.name}</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                      En progreso
                    </span>
                  </div>

                  {challenge.is_multi_day && challenge.challenge_days && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Progreso</span>
                        <span className="font-medium text-gray-700">Día {currentDay} de {challenge.total_days}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-400 to-pink-500 rounded-full"
                          style={{ width: `${(currentDay / challenge.total_days) * 100}%` }}
                        />
                      </div>
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {challenge.challenge_days.slice(0, 7).map(day => (
                          <div
                            key={day.id}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                              day.day_number < currentDay
                                ? 'bg-green-100 border-green-400 text-green-700'
                                : day.day_number === currentDay
                                ? 'bg-orange-100 border-orange-400 text-orange-700'
                                : 'bg-gray-100 border-gray-200 text-gray-400'
                            }`}
                          >
                            {day.day_number}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
