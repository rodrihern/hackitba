'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { fetchActiveCampaigns } from '@/lib/services/user-service'
import CampaignCard from '@/components/CampaignCard'
import ExchangeApplyModal from '@/components/ExchangeApplyModal'
import LevelBadge from '@/components/LevelBadge'
import type { UserProfile, Campaign } from '@/lib/types'

const levelThresholds: Record<string, { min: number; max: number; next: string }> = {
  Bronze: { min: 0, max: 2000, next: 'Silver' },
  Silver: { min: 2000, max: 5000, next: 'Gold' },
  Gold: { min: 5000, max: 8000, next: 'Platinum' },
  Platinum: { min: 8000, max: 12000, next: 'Diamond' },
  Diamond: { min: 12000, max: 20000, next: 'Diamond' },
}

export default function HomePage() {
  const { currentUser } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedExchange, setSelectedExchange] = useState<Campaign | null>(null)
  const profile = currentUser?.profile as UserProfile

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const data = await fetchActiveCampaigns(profile?.id)
        setCampaigns(data)
      } catch (err) {
        console.error('Error fetching campaigns:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCampaigns()
  }, [profile?.id])

  const exchanges = campaigns.filter(c => c.type === 'exchange')
  const challenges = campaigns.filter(c => c.type === 'challenge')

  const threshold = levelThresholds[profile?.level] || levelThresholds.Bronze
  const progress = Math.min(
    ((profile?.totalPoints - threshold.min) / (threshold.max - threshold.min)) * 100,
    100
  )

  const handleApplied = (campaignId: string) => {
    setCampaigns(prev => prev.map(campaign => (
      campaign.id === campaignId
        ? {
            ...campaign,
            currentUserApplicationStatus: 'applied',
            exchange: campaign.exchange
              ? {
                  ...campaign.exchange,
                  applicantsCount: campaign.exchange.applicantsCount + 1,
                }
              : campaign.exchange,
          }
        : campaign
    )))
  }

  const appliedCount = campaigns.filter(campaign => Boolean(campaign.currentUserApplicationStatus)).length

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">
            ¡Bienvenido, {profile?.username}!
          </h1>
          <LevelBadge level={profile?.level} size="md" />
        </div>
        <p className="text-gray-500">Descubrí nuevas colaboraciones disponibles para vos</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="text-3xl font-extrabold text-indigo-600 mb-1">
            {profile?.totalPoints?.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Puntos totales</div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{profile?.level}</span>
              <span>{threshold.next !== profile?.level ? threshold.next : 'Max'}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="text-3xl font-extrabold text-orange-500 mb-1">
            {exchanges.length + challenges.length}
          </div>
          <div className="text-sm text-gray-500">Campañas activas</div>
          <div className="mt-2 flex gap-2">
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{exchanges.length} canjes</span>
            <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{challenges.length} retos</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="text-3xl font-extrabold text-green-600 mb-1">
            {appliedCount}
          </div>
          <div className="text-sm text-gray-500">Canjes aplicados</div>
          <div className="mt-2 text-xs text-gray-400">
            {appliedCount === 0 ? '¡Empezá a aplicar!' : 'Revisalas en Mis Campañas'}
          </div>
        </div>
      </div>

      {/* Exchanges section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="w-1 h-5 bg-indigo-600 rounded-full inline-block" />
            Canjes Disponibles
          </h2>
          <span className="text-sm text-gray-400">{exchanges.length} disponibles</span>
        </div>
        {exchanges.length === 0 ? (
          <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <p className="text-sm">No hay canjes activos por el momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {exchanges.map(campaign => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onApply={() => setSelectedExchange(campaign)}
                href={`/campaign/${campaign.id}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Challenges section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="w-1 h-5 bg-orange-500 rounded-full inline-block" />
            Retos Activos
          </h2>
          <span className="text-sm text-gray-400">{challenges.length} activos</span>
        </div>
        {challenges.length === 0 ? (
          <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <p className="text-sm">No hay retos activos por el momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {challenges.map(campaign => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                href={`/campaign/${campaign.id}`}
              />
            ))}
          </div>
        )}
      </section>

      <ExchangeApplyModal
        campaign={selectedExchange}
        userProfileId={profile?.id}
        open={Boolean(selectedExchange)}
        onClose={() => setSelectedExchange(null)}
        onApplied={handleApplied}
      />
    </div>
  )
}
