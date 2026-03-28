import { supabase } from '@/lib/supabase'
import type { Reward, RewardType } from '@/lib/types'

export async function fetchBrandRewards(brandId: string): Promise<Reward[]> {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('brand_id', brandId)

  if (error) throw new Error(error.message)

  return (data || []).map(r => ({
    id: r.id,
    brandId: r.brand_id,
    title: r.title,
    description: r.description || '',
    pointsCost: r.points_cost,
    rewardType: r.reward_type,
    image: r.image || '',
  }))
}

export async function createReward(input: {
  brandId: string
  title: string
  description: string
  pointsCost: number
  rewardType: RewardType
  image?: string
}) {
  const { error } = await supabase.from('rewards').insert({
    brand_id: input.brandId,
    title: input.title,
    description: input.description,
    points_cost: input.pointsCost,
    reward_type: input.rewardType,
    image: input.image || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400',
  })

  if (error) throw new Error(error.message)
}

export async function updateReward(input: {
  id: string
  title: string
  description: string
  pointsCost: number
  rewardType: RewardType
  image?: string
}) {
  const { error } = await supabase
    .from('rewards')
    .update({
      title: input.title,
      description: input.description,
      points_cost: input.pointsCost,
      reward_type: input.rewardType,
      image: input.image || null,
    })
    .eq('id', input.id)

  if (error) throw new Error(error.message)
}

export async function deleteReward(id: string) {
  const { error } = await supabase.from('rewards').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
