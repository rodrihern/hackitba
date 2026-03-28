'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { fetchBrandDashboardData } from '@/lib/services/brand-service'
import type { BrandProfile, Campaign } from '@/lib/types'

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function BrandDashboardPage() {
  const { currentUser } = useAuth()
  const brand = currentUser?.profile as BrandProfile
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [totalApplicants, setTotalApplicants] = useState(0)
  const [acceptedCount, setAcceptedCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!brand?.id) return

      try {
        const data = await fetchBrandDashboardData(brand.id)
        setCampaigns(data.campaigns)
        setTotalApplicants(data.totalApplicants)
        setAcceptedCount(data.acceptedCount)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [brand?.id])

  const activeCampaigns = campaigns.filter(c => c.status === 'active')

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-gray-500">Bienvenido de vuelta, {brand?.name}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total campañas', value: campaigns.length, icon: '📋', color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Campañas activas', value: activeCampaigns.length, icon: '🚀', color: 'text-green-600 bg-green-50' },
          { label: 'Total aplicaciones', value: totalApplicants, icon: '👥', color: 'text-blue-600 bg-blue-50' },
          { label: 'Colaboraciones activas', value: acceptedCount, icon: '🤝', color: 'text-violet-600 bg-violet-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${stat.color}`}>
              {stat.icon}
            </div>
            <div className="text-3xl font-extrabold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">Acciones rápidas</h2>
          <div className="space-y-3">
            <Link
              href="/brand/campaigns/create"
              className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors group"
            >
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-lg group-hover:scale-105 transition-transform">
                🔄
              </div>
              <div>
                <div className="font-semibold text-gray-900">Crear Canje</div>
                <div className="text-sm text-gray-500">Ofrece productos o dinero</div>
              </div>
              <svg className="ml-auto w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              href="/brand/campaigns/create"
              className="flex items-center gap-3 p-4 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors group"
            >
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white text-lg group-hover:scale-105 transition-transform">
                🏆
              </div>
              <div>
                <div className="font-semibold text-gray-900">Crear Reto</div>
                <div className="text-sm text-gray-500">Lanza un challenge con leaderboard</div>
              </div>
              <svg className="ml-auto w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              href="/brand/marketplace"
              className="flex items-center gap-3 p-4 rounded-xl bg-violet-50 hover:bg-violet-100 transition-colors group"
            >
              <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center text-white text-lg group-hover:scale-105 transition-transform">
                👤
              </div>
              <div>
                <div className="font-semibold text-gray-900">Buscar Creadores</div>
                <div className="text-sm text-gray-500">Explorar el marketplace</div>
              </div>
              <svg className="ml-auto w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Recent campaigns */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">Campañas recientes</h2>
          {campaigns.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-sm">No hay campañas aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.slice(0, 5).map(campaign => (
                <div key={campaign.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    campaign.status === 'active' ? 'bg-green-400' :
                    campaign.status === 'draft' ? 'bg-yellow-400' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 leading-snug truncate">{campaign.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(campaign.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Campaigns overview */}
      {campaigns.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Todas las campañas</h2>
            <Link href="/brand/campaigns" className="text-sm text-indigo-600 font-medium hover:underline">
              Ver todas →
            </Link>
          </div>
          <div className="space-y-3">
            {campaigns.slice(0, 3).map(campaign => (
              <div key={campaign.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-8 rounded-full ${
                    campaign.status === 'active' ? 'bg-green-400' :
                    campaign.status === 'draft' ? 'bg-yellow-400' : 'bg-gray-300'
                  }`} />
                  <div>
                    <div className="font-medium text-gray-900">{campaign.title}</div>
                    <div className="text-xs text-gray-400">
                      {campaign.type === 'exchange' ? 'Canje' : 'Reto'} ·{' '}
                      {campaign.type === 'exchange' && campaign.exchange
                        ? `${campaign.exchange.applicantsCount} aplicaciones`
                        : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    campaign.status === 'active' ? 'bg-green-50 text-green-700' :
                    campaign.status === 'draft' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {campaign.status === 'active' ? 'Activa' : campaign.status === 'draft' ? 'Borrador' : 'Cerrada'}
                  </span>
                  <Link
                    href={`/brand/campaigns/${campaign.id}`}
                    className="text-sm text-indigo-600 hover:underline font-medium"
                  >
                    Ver →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
