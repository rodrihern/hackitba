'use client'

import type { Reward, BrandPoints } from '@/lib/types'

const rewardTypeLabels = {
  product: 'Producto',
  discount: 'Descuento',
  experience: 'Experiencia',
}

const rewardTypeColors = {
  product: 'bg-indigo-50 text-indigo-700',
  discount: 'bg-green-50 text-green-700',
  experience: 'bg-purple-50 text-purple-700',
}

const rewardGradients = {
  product: 'from-indigo-400 to-violet-500',
  discount: 'from-green-400 to-teal-500',
  experience: 'from-purple-400 to-pink-500',
}

interface Props {
  reward: Reward
  userBrandPoints?: BrandPoints
  onRedeem?: (reward: Reward) => void
}

export default function RewardCard({ reward, userBrandPoints, onRedeem }: Props) {
  const userPoints = userBrandPoints?.points ?? 0
  const canAfford = userPoints >= reward.pointsCost

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Image / Gradient placeholder */}
      <div className={`h-40 bg-gradient-to-br ${rewardGradients[reward.rewardType]} relative overflow-hidden`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={reward.image}
          alt={reward.title}
          className="w-full h-full object-cover opacity-80 mix-blend-overlay"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${rewardTypeColors[reward.rewardType]}`}>
            {rewardTypeLabels[reward.rewardType]}
          </span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-semibold text-gray-900 mb-1">{reward.title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">{reward.description}</p>

        {/* Points cost */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-extrabold text-indigo-600">{reward.pointsCost.toLocaleString()}</div>
            <div className="text-xs text-gray-400">puntos necesarios</div>
          </div>
          {userBrandPoints && (
            <div className="text-right">
              <div className={`text-sm font-semibold ${canAfford ? 'text-green-600' : 'text-red-500'}`}>
                {userBrandPoints.points.toLocaleString()} pts
              </div>
              <div className="text-xs text-gray-400">tus puntos</div>
            </div>
          )}
        </div>

        <button
          onClick={() => onRedeem?.(reward)}
          disabled={!canAfford && !!userBrandPoints}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            !userBrandPoints || canAfford
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {!userBrandPoints
            ? 'Canjear'
            : canAfford
            ? 'Canjear ahora'
            : `Faltan ${(reward.pointsCost - userPoints).toLocaleString()} pts`}
        </button>
      </div>
    </div>
  )
}
