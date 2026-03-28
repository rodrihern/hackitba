'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import RewardCard from '@/components/RewardCard'
import type { Reward, UserProfile } from '@/lib/types'

interface BrandPointsRow {
  id: string
  brand_id: string
  points: number
  brand_profiles: { id: string; name: string; logo: string }
}

interface BrandRow {
  id: string
  name: string
  logo: string
}

export default function StorePage() {
  const { currentUser, isLoading: authLoading } = useAuth()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [brandPoints, setBrandPoints] = useState<BrandPointsRow[]>([])
  const [brands, setBrands] = useState<BrandRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBrandId, setSelectedBrandId] = useState<string | 'all'>('all')
  const [redeemModal, setRedeemModal] = useState<Reward | null>(null)
  const [redeemed, setRedeemed] = useState<Set<string>>(new Set())
  const [redeemError, setRedeemError] = useState('')
  const [redeemLoading, setRedeemLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      // Wait for auth to finish loading
      if (authLoading) return
      
      if (!currentUser) {
        setIsLoading(false)
        return
      }
      const userProfile = currentUser.profile as UserProfile

      try {
        const [rewardsResult, bpResult, brandsResult] = await Promise.all([
          supabase
            .from('rewards')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('brand_points')
            .select('*, brand_profiles (id, name, logo)')
            .eq('user_id', userProfile.id),
          supabase
            .from('brand_profiles')
            .select('id, name, logo')
        ])

        if (rewardsResult.data) {
          setRewards(rewardsResult.data.map(r => ({
            id: r.id,
            brandId: r.brand_id,
            title: r.title,
            description: r.description || '',
            pointsCost: r.points_cost,
            rewardType: r.reward_type,
            image: r.image || '',
          })))
        }
        if (bpResult.data) setBrandPoints(bpResult.data as unknown as BrandPointsRow[])
        if (brandsResult.data) setBrands(brandsResult.data as BrandRow[])
      } catch (err) {
        console.error('Error fetching store data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentUser, authLoading])

  const filteredRewards = selectedBrandId === 'all'
    ? rewards
    : rewards.filter(r => r.brandId === selectedBrandId)

  const totalPoints = brandPoints.reduce((sum, bp) => sum + bp.points, 0)

  const handleRedeem = (reward: Reward) => {
    setRedeemError('')
    setRedeemModal(reward)
  }

  const confirmRedeem = async () => {
    if (!redeemModal || !currentUser) return
    const userProfile = currentUser.profile as UserProfile
    setRedeemLoading(true)
    setRedeemError('')

    try {
      // Find user's brand points for this reward
      const userBrandPts = brandPoints.find(bp => bp.brand_id === redeemModal.brandId)
      if (!userBrandPts || userBrandPts.points < redeemModal.pointsCost) {
        setRedeemError('Puntos insuficientes')
        setRedeemLoading(false)
        return
      }

      // Insert redemption
      const { error: redemptionError } = await supabase.from('redemptions').insert({
        reward_id: redeemModal.id,
        user_id: userProfile.id,
        points_used: redeemModal.pointsCost,
        money_paid: 0,
      })

      if (redemptionError) {
        setRedeemError(redemptionError.message)
        setRedeemLoading(false)
        return
      }

      // Deduct points
      await supabase.from('brand_points').update({
        points: userBrandPts.points - redeemModal.pointsCost
      }).eq('id', userBrandPts.id)

      // Update local brand points state
      setBrandPoints(prev => prev.map(bp =>
        bp.id === userBrandPts.id ? { ...bp, points: bp.points - redeemModal.pointsCost } : bp
      ))

      setRedeemed(prev => new Set([...prev, redeemModal.id]))
      setRedeemModal(null)
    } catch (err) {
      console.error('Error redeeming reward:', err)
      setRedeemError('Error al procesar el canje')
    } finally {
      setRedeemLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Tienda de Recompensas</h1>
          <p className="text-gray-500">Canjeá tus puntos por productos y experiencias exclusivas</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-3 text-right">
          <div className="text-2xl font-extrabold text-indigo-600">{totalPoints.toLocaleString()}</div>
          <div className="text-xs text-indigo-500">puntos totales</div>
        </div>
      </div>

      {/* Brand tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setSelectedBrandId('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            selectedBrandId === 'all'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
          }`}
        >
          Todas las marcas
        </button>
        {brands.map(brand => {
          const brandPts = brandPoints.find(bp => bp.brand_id === brand.id)
          return (
            <button
              key={brand.id}
              onClick={() => setSelectedBrandId(brand.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedBrandId === brand.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={brand.logo} alt="" className="w-4 h-4 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
              {brand.name}
              {brandPts && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  selectedBrandId === brand.id ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  {brandPts.points.toLocaleString()}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Rewards grid */}
      {filteredRewards.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-4">🎁</div>
          <p className="font-medium text-gray-600">No hay recompensas disponibles</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {filteredRewards.map(reward => {
            const brandPts = brandPoints.find(bp => bp.brand_id === reward.brandId)
            return (
              <div key={reward.id} className="relative">
                {redeemed.has(reward.id) && (
                  <div className="absolute inset-0 bg-green-500/10 border-2 border-green-400 rounded-2xl z-10 flex items-center justify-center">
                    <div className="bg-green-500 text-white rounded-full px-4 py-2 text-sm font-bold shadow-lg">
                      ✅ Canjeado
                    </div>
                  </div>
                )}
                <RewardCard
                  reward={reward}
                  userBrandPoints={brandPts ? { brandId: brandPts.brand_id, brandName: brandPts.brand_profiles?.name, brandLogo: brandPts.brand_profiles?.logo, points: brandPts.points } : undefined}
                  onRedeem={handleRedeem}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Redeem confirmation modal */}
      {redeemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmar canje</h3>
            <p className="text-gray-500 mb-4">
              ¿Querés canjear <strong>{redeemModal.title}</strong> por{' '}
              <strong className="text-indigo-600">{redeemModal.pointsCost.toLocaleString()} puntos</strong>?
            </p>
            {redeemError && (
              <div className="mb-4 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
                {redeemError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setRedeemModal(null)}
                className="flex-1 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmRedeem}
                disabled={redeemLoading}
                className="flex-1 bg-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {redeemLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Procesando...
                  </span>
                ) : 'Confirmar canje'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
