'use client'

import Link from 'next/link'
import { Trophy, Check } from 'lucide-react'
import type { Campaign } from '@/lib/types'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatNumber(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

interface Props {
  campaign: Campaign
  href?: string
  onApply?: () => void
  showBrand?: boolean
}

export default function CampaignCard({ campaign, href, onApply, showBrand = true }: Props) {
  const isExchange = campaign.type === 'exchange'
  const isChallenge = campaign.type === 'challenge'
  const brandLogo = campaign.brandLogo?.trim() || null
  const brandInitial = campaign.brandName?.trim()?.charAt(0).toUpperCase() || 'B'
  const exchangeFull = isExchange && campaign.exchange
    ? campaign.exchange.acceptedApplicantsCount >= campaign.exchange.slots
    : false
  const currentStatus = campaign.currentUserApplicationStatus
  const applyDisabled = Boolean(currentStatus) || exchangeFull
  const isAccepted = currentStatus === 'accepted'
  const primaryLabel = currentStatus
    ? currentStatus === 'accepted'
      ? 'Aceptada'
      : currentStatus === 'rejected'
      ? 'Rechazada'
      : currentStatus === 'invited'
      ? 'Invitada'
      : 'Aplicada'
    : exchangeFull
    ? 'Lleno'
    : 'Aplicar'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
      {/* Header gradient */}
      <div className={`h-2 w-full ${isExchange ? 'bg-gradient-to-r from-indigo-500 to-violet-500' : 'bg-gradient-to-r from-orange-400 to-pink-500'}`} />

      <div className="p-5">
        {/* Brand + type */}
        {showBrand && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                {brandLogo ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={brandLogo}
                      alt={campaign.brandName}
                      className="w-6 h-6 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </>
                ) : (
                  <span className="text-xs font-semibold text-gray-500">{brandInitial}</span>
                )}
              </div>
              <span className="text-sm font-medium text-gray-700">{campaign.brandName}</span>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              isExchange
                ? 'bg-indigo-50 text-indigo-700'
                : 'bg-orange-50 text-orange-700'
            }`}>
              {isExchange ? 'Canje' : 'Reto'}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-base leading-snug mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {campaign.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
          {campaign.description}
        </p>

        {/* Details */}
        {isExchange && campaign.exchange && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Recompensa:</span>
              <span className="text-xs font-medium text-gray-700 line-clamp-1">{campaign.exchange.rewardDescription}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">Slots:</span>
                <span className="text-xs font-semibold text-indigo-600">
                  {campaign.exchange.slots - campaign.exchange.acceptedApplicantsCount > 0
                    ? `${campaign.exchange.slots - Math.min(campaign.exchange.acceptedApplicantsCount, campaign.exchange.slots)} restantes`
                    : 'Lleno'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">Cierra:</span>
                <span className="text-xs font-medium text-gray-600">{formatDate(campaign.exchange.deadline)}</span>
              </div>
            </div>
            {campaign.exchange.moneyAmount && campaign.exchange.moneyAmount > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                  + ${formatNumber(campaign.exchange.moneyAmount)} ARS
                </span>
              </div>
            )}
          </div>
        )}

        {isChallenge && campaign.challenge && (
          <div className="space-y-2">
            {campaign.challenge.hasLeaderboard && (
              <div className="flex items-center gap-2">
                <span className="text-xs bg-yellow-50 text-yellow-700 font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Trophy size={11} /> Leaderboard
                </span>
              </div>
            )}
            <div className="flex items-center gap-4">
              {campaign.challenge.isMultiDay && (
                <span className="text-xs text-gray-500">
                  {campaign.challenge.totalDays} días
                </span>
              )}
              <span className="text-xs text-gray-500">
                {campaign.challenge.maxWinners} ganadores
              </span>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-4 flex gap-2">
          {isExchange && onApply && isAccepted ? (
            <Link
              href={href || '#'}
              className="flex-1 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 text-center"
            >
              <div className="flex items-center justify-center gap-2">
                <Check size={14} />
                <span>Colaboración aceptada</span>
              </div>
            </Link>
          ) : isExchange && onApply && !isAccepted ? (
            <>
              <button
                onClick={onApply}
                disabled={applyDisabled}
                className={`flex-1 text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:cursor-not-allowed ${
                  currentStatus === 'rejected'
                    ? 'bg-red-100 text-red-700 disabled:bg-red-100'
                    : currentStatus === 'applied' || currentStatus === 'invited'
                    ? 'bg-gray-100 text-gray-500 disabled:bg-gray-100'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-200'
                }`}
              >
                {primaryLabel}
              </button>
              {href && (
                <Link
                  href={href}
                  className="px-4 text-center border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Ver
                </Link>
              )}
            </>
          ) : href ? (
            <Link
              href={href}
              className="flex-1 text-center bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Ver detalle
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="flex-1 bg-gray-100 text-gray-400 text-sm font-semibold py-2.5 rounded-xl cursor-not-allowed"
            >
              Próximamente
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
