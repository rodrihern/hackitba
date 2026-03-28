import { mapCampaign } from '@/lib/mappers'
import { supabase } from '@/lib/supabase'
import type { Campaign, Notification } from '@/lib/types'

export interface UserCampaignApplicationRow {
  id: string
  status: 'applied' | 'invited' | 'accepted' | 'rejected'
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

export interface UserChallengeSubmissionRow {
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

export interface UserBrandPointsRow {
  id: string
  brand_id: string
  points: number
  brand_profiles: { id: string; name: string; logo: string }
}

export interface UserRedemptionRow {
  id: string
  points_used: number
  created_at: string
  rewards: {
    title: string
    brand_profiles: { name: string }
  }
}

export interface StoreBrandRow {
  id: string
  name: string
  logo: string
}

export async function fetchAllCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      brand_profiles (id, name, logo),
      exchanges (*),
      challenges (*, challenge_days (*))
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map(row => mapCampaign(row as Record<string, unknown>))
}

export async function fetchActiveCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      brand_profiles (id, name, logo),
      exchanges (*),
      challenges (*, challenge_days (*))
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map(row => mapCampaign(row as Record<string, unknown>))
}

export async function fetchUserCampaignsData(userProfileId: string): Promise<{
  applications: UserCampaignApplicationRow[]
  challengeSubs: UserChallengeSubmissionRow[]
}> {
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
      .eq('user_id', userProfileId)
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
      .eq('user_id', userProfileId),
  ])

  if (appsResult.error) throw new Error(appsResult.error.message)
  if (subsResult.error) throw new Error(subsResult.error.message)

  return {
    applications: (appsResult.data || []) as unknown as UserCampaignApplicationRow[],
    challengeSubs: (subsResult.data || []) as unknown as UserChallengeSubmissionRow[],
  }
}

export async function fetchUserStoreData(userProfileId: string): Promise<{
  rewards: Array<{
    id: string
    brandId: string
    title: string
    description: string
    pointsCost: number
    rewardType: 'product' | 'discount' | 'experience'
    image: string
  }>
  brandPoints: UserBrandPointsRow[]
  brands: StoreBrandRow[]
}> {
  const [rewardsResult, bpResult, brandsResult] = await Promise.all([
    supabase
      .from('rewards')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('brand_points')
      .select('*, brand_profiles (id, name, logo)')
      .eq('user_id', userProfileId),
    supabase
      .from('brand_profiles')
      .select('id, name, logo'),
  ])

  if (rewardsResult.error) throw new Error(rewardsResult.error.message)
  if (bpResult.error) throw new Error(bpResult.error.message)
  if (brandsResult.error) throw new Error(brandsResult.error.message)

  return {
    rewards: (rewardsResult.data || []).map(r => ({
      id: r.id,
      brandId: r.brand_id,
      title: r.title,
      description: r.description || '',
      pointsCost: r.points_cost,
      rewardType: r.reward_type,
      image: r.image || '',
    })),
    brandPoints: (bpResult.data || []) as unknown as UserBrandPointsRow[],
    brands: (brandsResult.data || []) as StoreBrandRow[],
  }
}

export async function redeemReward(input: {
  rewardId: string
  userProfileId: string
  pointsUsed: number
  brandPointRowId: string
  remainingPoints: number
}) {
  const { error: redemptionError } = await supabase.from('redemptions').insert({
    reward_id: input.rewardId,
    user_id: input.userProfileId,
    points_used: input.pointsUsed,
    money_paid: 0,
  })

  if (redemptionError) throw new Error(redemptionError.message)

  const { error: pointsError } = await supabase
    .from('brand_points')
    .update({ points: input.remainingPoints })
    .eq('id', input.brandPointRowId)

  if (pointsError) throw new Error(pointsError.message)
}

export async function fetchUserPointsData(userProfileId: string): Promise<{
  brandPoints: UserBrandPointsRow[]
  redemptions: UserRedemptionRow[]
}> {
  const [bpResult, redResult] = await Promise.all([
    supabase
      .from('brand_points')
      .select('*, brand_profiles (id, name, logo)')
      .eq('user_id', userProfileId),
    supabase
      .from('redemptions')
      .select('*, rewards (title, brand_profiles (name))')
      .eq('user_id', userProfileId)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  if (bpResult.error) throw new Error(bpResult.error.message)
  if (redResult.error) throw new Error(redResult.error.message)

  return {
    brandPoints: (bpResult.data || []) as unknown as UserBrandPointsRow[],
    redemptions: (redResult.data || []) as unknown as UserRedemptionRow[],
  }
}

export async function fetchUserNotifications(authUserId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', authUserId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data || []).map(n => ({
    id: n.id,
    userId: n.user_id,
    title: n.title,
    message: n.message,
    read: n.read,
    createdAt: n.created_at,
  }))
}

export async function markAllNotificationsRead(authUserId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', authUserId)
    .eq('read', false)

  if (error) throw new Error(error.message)
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId)
  if (error) throw new Error(error.message)
}
