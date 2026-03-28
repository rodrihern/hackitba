'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { mapCampaign } from '@/lib/mappers'
import type { CampaignStatus, BrandProfile, Campaign } from '@/lib/types'

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function BrandCampaignsPage() {
  const { currentUser } = useAuth()
  const brand = currentUser?.profile as BrandProfile
  const [tab, setTab] = useState<CampaignStatus>('active')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchCampaigns = useCallback(async () => {
    if (!brand?.id) return

    try {
      const { data } = await supabase
        .from('campaigns')
        .select(`
          *,
          brand_profiles (id, name, logo),
          exchanges (*),
          challenges (*, challenge_days (*))
        `)
        .eq('brand_id', brand.id)
        .order('created_at', { ascending: false })

      if (data) {
        setCampaigns(data.map(row => mapCampaign(row as Record<string, unknown>)))
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err)
    } finally {
      setIsLoading(false)
    }
  }, [brand?.id])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  const publishCampaign = async (id: string) => {
    await supabase.from('campaigns').update({ status: 'active' }).eq('id', id)
    await fetchCampaigns()
  }

  const closeCampaign = async (id: string) => {
    await supabase.from('campaigns').update({ status: 'closed' }).eq('id', id)
    await fetchCampaigns()
  }

  const filtered = campaigns.filter(c => c.status === tab)

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Mis Campañas</h1>
          <p className="text-gray-500">Gestioná todas tus campañas en un solo lugar</p>
        </div>
        <Link
          href="/brand/campaigns/create"
          className="bg-indigo-600 text-white font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors text-sm flex items-center gap-2"
        >
          <span>+</span> Nueva campaña
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {([['active', 'Activas'], ['draft', 'Borradores'], ['closed', 'Cerradas']] as const).map(([val, label]) => {
          const count = campaigns.filter(c => c.status === val).length
          return (
            <button
              key={val}
              onClick={() => setTab(val)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                tab === val
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  tab === val ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Campaign list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-4">📋</div>
          <p className="font-medium text-gray-600 mb-1">No hay campañas en esta sección</p>
          <Link href="/brand/campaigns/create" className="text-sm text-indigo-600 hover:underline">
            Crear una nueva campaña →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(campaign => (
            <div key={campaign.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`w-1 h-12 rounded-full flex-shrink-0 mt-1 ${
                    campaign.type === 'exchange' ? 'bg-indigo-400' : 'bg-orange-400'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{campaign.title}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        campaign.type === 'exchange'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-orange-50 text-orange-700'
                      }`}>
                        {campaign.type === 'exchange' ? 'Canje' : 'Reto'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1">{campaign.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>Creada: {formatDate(campaign.createdAt)}</span>
                      {campaign.type === 'exchange' && campaign.exchange && (
                        <>
                          <span>·</span>
                          <span>{campaign.exchange.applicantsCount} aplicaciones</span>
                          <span>·</span>
                          <span>Deadline: {formatDate(campaign.exchange.deadline)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  {tab === 'draft' && (
                    <button
                      onClick={() => publishCampaign(campaign.id)}
                      className="text-sm bg-green-50 text-green-700 font-medium px-3 py-1.5 rounded-xl hover:bg-green-100 transition-colors"
                    >
                      Publicar
                    </button>
                  )}
                  {tab === 'active' && (
                    <button
                      onClick={() => closeCampaign(campaign.id)}
                      className="text-sm bg-gray-50 text-gray-600 font-medium px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      Cerrar
                    </button>
                  )}
                  <Link
                    href={`/brand/campaigns/${campaign.id}`}
                    className="text-sm bg-indigo-50 text-indigo-700 font-medium px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition-colors"
                  >
                    Ver detalle
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
