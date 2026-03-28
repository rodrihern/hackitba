'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { fetchAllCampaigns } from '@/lib/services/user-service'
import CampaignCard from '@/components/CampaignCard'
import ExchangeApplyModal from '@/components/ExchangeApplyModal'
import type { Campaign, CampaignType, CampaignStatus, UserProfile } from '@/lib/types'

export default function ExplorePage() {
  const { currentUser } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<CampaignType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('active')
  const [selectedExchange, setSelectedExchange] = useState<Campaign | null>(null)
  const profile = currentUser?.profile as UserProfile

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const data = await fetchAllCampaigns(profile?.id)
        setCampaigns(data)
      } catch (err) {
        console.error('Error fetching campaigns:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCampaigns()
  }, [profile?.id])

  const filtered = campaigns.filter(c => {
    const matchesSearch = search === '' ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.brandName.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || c.type === typeFilter
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

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

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Explorar Campañas</h1>
        <p className="text-gray-500">Encontrá la colaboración perfecta para vos</p>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex items-center gap-4 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-64 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por marca, título..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {([['all', 'Todos'], ['exchange', 'Canjes'], ['challenge', 'Retos']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setTypeFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                typeFilter === val
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {([['all', 'Todos'], ['active', 'Activas'], ['draft', 'Borradores']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                statusFilter === val
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="text-sm text-gray-400">{filtered.length} resultados</span>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">🔍</div>
          <p className="font-medium text-gray-600 mb-1">No se encontraron campañas</p>
          <p className="text-sm">Probá con otros filtros</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(campaign => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onApply={campaign.type === 'exchange' ? () => setSelectedExchange(campaign) : undefined}
            />
          ))}
        </div>
      )}

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
