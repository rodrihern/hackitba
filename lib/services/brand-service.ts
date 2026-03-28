import { mapCampaign, mapUserProfile } from '@/lib/mappers'
import { supabase } from '@/lib/supabase'
import type { ApplicationStatus, Campaign, UserProfile } from '@/lib/types'

export interface CampaignData {
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

export interface ApplicationRow {
  id: string
  status: ApplicationStatus
  proposal_text: string
  created_at: string
  user_profiles: Record<string, unknown>
}

export interface SubmissionRow {
  id: string
  submission_url: string
  submission_text: string
  score?: number
  created_at: string
  user_profiles: Record<string, unknown>
}

export async function fetchBrandCampaigns(brandId: string): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      brand_profiles (id, name, logo),
      exchanges (*),
      challenges (*, challenge_days (*))
    `)
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map(row => mapCampaign(row as Record<string, unknown>))
}

export async function fetchBrandDashboardData(brandId: string): Promise<{
  campaigns: Campaign[]
  totalApplicants: number
  acceptedCount: number
}> {
  const { data: campaignsData, error: campaignsError } = await supabase
    .from('campaigns')
    .select(`
      *,
      brand_profiles (id, name, logo),
      exchanges (*),
      challenges (*, challenge_days (*))
    `)
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })

  if (campaignsError) throw new Error(campaignsError.message)

  const campaigns = (campaignsData || []).map(row => mapCampaign(row as Record<string, unknown>))
  const exchangeIds = (campaignsData || [])
    .flatMap(c => (c.exchanges ? [c.exchanges.id] : []))
    .filter(Boolean)

  if (exchangeIds.length === 0) {
    return { campaigns, totalApplicants: 0, acceptedCount: 0 }
  }

  const { count: totalCount, error: totalError } = await supabase
    .from('exchange_applications')
    .select('*', { count: 'exact', head: true })
    .in('exchange_id', exchangeIds)

  if (totalError) throw new Error(totalError.message)

  const { count: acceptedCount, error: acceptedError } = await supabase
    .from('exchange_applications')
    .select('*', { count: 'exact', head: true })
    .in('exchange_id', exchangeIds)
    .eq('status', 'accepted')

  if (acceptedError) throw new Error(acceptedError.message)

  return {
    campaigns,
    totalApplicants: totalCount || 0,
    acceptedCount: acceptedCount || 0,
  }
}

export async function updateCampaignStatus(id: string, status: 'active' | 'closed') {
  const { error } = await supabase.from('campaigns').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function fetchCampaignDetail(id: string): Promise<CampaignData | null> {
  const { data, error } = await supabase
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

  if (error) throw new Error(error.message)
  return (data as unknown as CampaignData) || null
}

export async function updateExchangeApplicationStatus(appId: string, status: ApplicationStatus) {
  const { error } = await supabase.from('exchange_applications').update({ status }).eq('id', appId)
  if (error) throw new Error(error.message)
}

export async function createNotification(input: {
  userId: string
  title: string
  message: string
}) {
  const { error } = await supabase.from('notifications').insert({
    user_id: input.userId,
    title: input.title,
    message: input.message,
    read: false,
  })

  if (error) throw new Error(error.message)
}

export async function updateChallengeSubmissionScore(submissionId: string, score: number) {
  const { error } = await supabase.from('challenge_submissions').update({ score }).eq('id', submissionId)
  if (error) throw new Error(error.message)
}

export async function fetchMarketplaceData(brandId?: string): Promise<{
  users: UserProfile[]
  brandExchanges: Campaign[]
}> {
  const [usersResult, campaignsResult] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('*')
      .order('total_points', { ascending: false }),
    brandId
      ? supabase
          .from('campaigns')
          .select(`
            *,
            brand_profiles (id, name, logo),
            exchanges (*),
            challenges (*, challenge_days (*))
          `)
          .eq('brand_id', brandId)
          .eq('type', 'exchange')
          .eq('status', 'active')
      : Promise.resolve({ data: [], error: null }),
  ])

  if (usersResult.error) throw new Error(usersResult.error.message)
  if (campaignsResult.error) throw new Error(campaignsResult.error.message)

  return {
    users: (usersResult.data || []).map(row => mapUserProfile(row as Record<string, unknown>)),
    brandExchanges: (campaignsResult.data || []).map(row => mapCampaign(row as Record<string, unknown>)),
  }
}

export async function inviteUserToExchange(input: {
  brandId: string
  userProfileId: string
  userAuthId: string
  campaignId: string
  brandName: string
}) {
  const { error: invitationError } = await supabase.from('invitations').insert({
    brand_id: input.brandId,
    user_id: input.userProfileId,
    campaign_id: input.campaignId,
    type: 'exchange',
    status: 'pending',
  })

  if (invitationError) throw new Error(invitationError.message)

  const { error: notificationError } = await supabase.from('notifications').insert({
    user_id: input.userAuthId,
    title: 'Nueva invitación',
    message: `${input.brandName} te invitó a participar en una colaboración.`,
    read: false,
  })

  if (notificationError) throw new Error(notificationError.message)
}
