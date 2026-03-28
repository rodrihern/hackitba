'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { mapUserProfile } from '@/lib/mappers'
import LeaderboardRow from '@/components/LeaderboardRow'
import type { ApplicationStatus, UserProfile } from '@/lib/types'

const statusLabels: Record<ApplicationStatus, string> = {
  applied: 'Aplicada',
  invited: 'Invitada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
}

const statusColors: Record<ApplicationStatus, string> = {
  applied: 'bg-blue-50 text-blue-700',
  invited: 'bg-violet-50 text-violet-700',
  accepted: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-600',
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface CampaignData {
  id: string
  title: string
  description: string
  type: 'exchange' | 'challenge'
  status: string
  brand_profiles: { name: string; logo: string }
  exchanges?: {
    id: string
    slots: number
    deadline: string
    reward_description: string
    exchange_applications?: ApplicationRow[]
  }
  challenges?: {
    id: string
    total_days: number
    max_winners: number
    challenge_days?: { id: string; day_number: number }[]
    challenge_submissions?: SubmissionRow[]
  }
}

interface ApplicationRow {
  id: string
  status: ApplicationStatus
  proposal_text: string
  created_at: string
  user_profiles: Record<string, unknown>
}

interface SubmissionRow {
  id: string
  submission_url: string
  submission_text: string
  score?: number
  created_at: string
  user_profiles: Record<string, unknown>
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [campaign, setCampaign] = useState<CampaignData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [applicationStatuses, setApplicationStatuses] = useState<Record<string, ApplicationStatus>>({})
  const [scores, setScores] = useState<Record<string, number>>({})

  const fetchCampaign = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('campaigns')
        .select(`
          *,
          brand_profiles (name, logo),
          exchanges (
            *,
            exchange_applications (
              *,
              user_profiles (*)
            )
          ),
          challenges (
            *,
            challenge_days (*),
            challenge_submissions (
              *,
              user_profiles (*)
            )
          )
        `)
        .eq('id', id)
        .single()

      if (data) {
        setCampaign(data as unknown as CampaignData)
        // Initialize application statuses
        const apps = data.exchanges?.exchange_applications || []
        setApplicationStatuses(
          Object.fromEntries(apps.map((a: ApplicationRow) => [a.id, a.status]))
        )
        // Initialize scores
        const subs = data.challenges?.challenge_submissions || []
        setScores(
          Object.fromEntries(subs.map((s: SubmissionRow) => [s.id, s.score || 0]))
        )
      }
    } catch (err) {
      console.error('Error fetching campaign:', err)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchCampaign()
  }, [fetchCampaign])

  const updateStatus = async (appId: string, status: ApplicationStatus) => {
    await supabase.from('exchange_applications').update({ status }).eq('id', appId)

    if (status === 'accepted' && campaign) {
      const app = campaign.exchanges?.exchange_applications?.find(a => a.id === appId)
      if (app?.user_profiles) {
        const userProfile = mapUserProfile(app.user_profiles)
        await supabase.from('notifications').insert({
          user_id: (app.user_profiles as Record<string, unknown>).user_id,
          title: 'Aplicación aceptada',
          message: `Tu aplicación para "${campaign.title}" fue aceptada.`,
          read: false,
        })
        void userProfile // used for type narrowing
      }
    }

    setApplicationStatuses(prev => ({ ...prev, [appId]: status }))
  }

  const updateScore = async (submissionId: string, score: number) => {
    await supabase.from('challenge_submissions').update({ score }).eq('id', submissionId)
    setScores(prev => ({ ...prev, [submissionId]: score }))
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="p-8 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <p className="font-medium text-gray-600 mb-2">Campaña no encontrada</p>
        <Link href="/brand/campaigns" className="text-indigo-600 hover:underline text-sm">
          ← Volver a campañas
        </Link>
      </div>
    )
  }

  const campaignApplications = campaign.exchanges?.exchange_applications || []
  const submissions = campaign.challenges?.challenge_submissions || []

  // Build leaderboard from submissions
  const leaderboard = submissions.map(sub => {
    const userProfile = mapUserProfile(sub.user_profiles)
    return { sub, userProfile }
  }).sort((a, b) => (scores[b.sub.id] || 0) - (scores[a.sub.id] || 0))

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/brand/campaigns" className="text-sm text-gray-400 hover:text-gray-600">
              Campañas
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-600">{campaign.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{campaign.title}</h1>
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              campaign.status === 'active' ? 'bg-green-50 text-green-700' :
              campaign.status === 'draft' ? 'bg-yellow-50 text-yellow-700' :
              'bg-gray-50 text-gray-600'
            }`}>
              {campaign.status === 'active' ? 'Activa' : campaign.status === 'draft' ? 'Borrador' : 'Cerrada'}
            </span>
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              campaign.type === 'exchange' ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700'
            }`}>
              {campaign.type === 'exchange' ? 'Canje' : 'Reto'}
            </span>
          </div>
        </div>
      </div>

      {/* Campaign info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <p className="text-gray-600 leading-relaxed mb-4">{campaign.description}</p>

        {campaign.type === 'exchange' && campaign.exchanges && (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-1">Slots</div>
              <div className="font-bold text-gray-900">{campaign.exchanges.slots}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-1">Aplicaciones</div>
              <div className="font-bold text-indigo-600">{campaignApplications.length}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-1">Deadline</div>
              <div className="font-bold text-gray-900">{campaign.exchanges.deadline ? formatDate(campaign.exchanges.deadline) : '-'}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-1">Recompensa</div>
              <div className="font-bold text-gray-900 text-xs leading-tight">{campaign.exchanges.reward_description}</div>
            </div>
          </div>
        )}

        {campaign.type === 'challenge' && campaign.challenges && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-1">Días</div>
              <div className="font-bold text-gray-900">{campaign.challenges.total_days}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-1">Ganadores</div>
              <div className="font-bold text-gray-900">{campaign.challenges.max_winners}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-1">Participantes</div>
              <div className="font-bold text-indigo-600">{submissions.length}</div>
            </div>
          </div>
        )}
      </div>

      {/* Exchange: Applicants */}
      {campaign.type === 'exchange' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">
            Aplicaciones ({campaignApplications.length})
          </h2>

          {campaignApplications.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-3">👥</div>
              <p>Aún no hay aplicaciones</p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaignApplications.map(app => {
                const currentStatus = applicationStatuses[app.id] || app.status
                const userProfile = app.user_profiles ? mapUserProfile(app.user_profiles) : null
                if (!userProfile) return null

                return (
                  <div key={app.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={userProfile.profileImage}
                          alt={userProfile.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-semibold text-gray-900">@{userProfile.username}</div>
                          <div className="text-xs text-gray-400">
                            {userProfile.level} · {userProfile.category} · {formatDate(app.created_at)}
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[currentStatus]}`}>
                        {statusLabels[currentStatus]}
                      </span>
                    </div>

                    {app.proposal_text && (
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 mb-3 italic">
                        &ldquo;{app.proposal_text}&rdquo;
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(app.id, 'accepted')}
                        disabled={currentStatus === 'accepted'}
                        className="flex-1 text-sm bg-green-50 text-green-700 font-medium py-2 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-40"
                      >
                        ✅ Aceptar
                      </button>
                      <button
                        onClick={() => updateStatus(app.id, 'rejected')}
                        disabled={currentStatus === 'rejected'}
                        className="flex-1 text-sm bg-red-50 text-red-600 font-medium py-2 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-40"
                      >
                        ❌ Rechazar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Challenge: Leaderboard + Submissions */}
      {campaign.type === 'challenge' && (
        <div className="space-y-6">
          {/* Leaderboard */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">Leaderboard</h2>
            {leaderboard.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <div className="text-4xl mb-3">🏆</div>
                <p>Aún no hay participantes</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, idx) => (
                  <LeaderboardRow
                    key={entry.sub.id}
                    rank={idx + 1}
                    userProfile={entry.userProfile}
                    score={scores[entry.sub.id] || 0}
                    isBrandView
                    onScoreChange={(score) => updateScore(entry.sub.id, score)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Submissions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">Sumisiones recientes</h2>
            {submissions.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p>Aún no hay sumisiones</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map(sub => {
                  const userProfile = sub.user_profiles ? mapUserProfile(sub.user_profiles) : null
                  if (!userProfile) return null

                  return (
                    <div key={sub.id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={userProfile.profileImage}
                          alt={userProfile.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">@{userProfile.username}</div>
                          <div className="text-xs text-gray-400">{formatDate(sub.created_at)}</div>
                        </div>
                        {sub.score && (
                          <span className="ml-auto text-sm font-bold text-indigo-600">{sub.score} pts</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{sub.submission_text}</p>
                      {sub.submission_url && (
                        <a
                          href={sub.submission_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-500 hover:underline"
                        >
                          Ver contenido →
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
