import { mapCampaign, mapExchangeApplicationAnswer, mapUserProfile } from '@/lib/mappers'
import { retryOnTransientFetch } from '@/lib/retry'
import { supabase } from '@/lib/supabase'
import type { ApplicationStatus, Campaign, ExchangeApplicationAnswer, UserProfile } from '@/lib/types'

function takeRelation<T>(value: unknown): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T) || null
  }

  return (value as T) || null
}

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
    exchange_form_questions?: Array<Record<string, unknown>>
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
  video_url?: string
  created_at: string
  user_profiles: Record<string, unknown>
  exchange_application_answers?: Array<Record<string, unknown>>
}

export interface SubmissionRow {
  id: string
  submission_url: string
  submission_text: string
  video_url?: string
  score?: number
  created_at: string
  user_profiles: Record<string, unknown>
}

interface ExchangeCountRow {
  exchange_id: string
  status: ApplicationStatus
}

interface ExchangeDecisionResultRow {
  selectedApplicationId: string
  selectedStatus: ApplicationStatus
  exchangeId: string
  autoRejectedApplicationIds: string[]
  slotsFilled: boolean
}

export interface ExchangeDecisionResult {
  selectedApplicationId: string
  selectedStatus: ApplicationStatus
  autoRejectedApplicationIds: string[]
  slotsFilled: boolean
}

export async function fetchBrandCampaigns(brandId: string): Promise<Campaign[]> {
  return retryOnTransientFetch(async () => {
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        brand_profiles (id, name, logo),
        exchanges (
          *,
          exchange_form_questions (*)
        ),
        challenges (*, challenge_days (*))
      `)
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    const campaigns = (data || []).map(row => mapCampaign(row as Record<string, unknown>))
    const exchangeIds = campaigns
      .flatMap(campaign => (campaign.exchange ? [campaign.exchange.id] : []))
      .filter(Boolean)

    if (exchangeIds.length === 0) {
      return campaigns
    }

    const { data: applicationRows, error: appError } = await supabase
      .from('exchange_applications')
      .select('exchange_id, status')
      .in('exchange_id', exchangeIds)

    if (appError) throw new Error(appError.message)

    const counts = new Map<string, number>()
    const acceptedCounts = new Map<string, number>()

    for (const row of (applicationRows || []) as ExchangeCountRow[]) {
      counts.set(row.exchange_id, (counts.get(row.exchange_id) || 0) + 1)
      if (row.status === 'accepted') {
        acceptedCounts.set(row.exchange_id, (acceptedCounts.get(row.exchange_id) || 0) + 1)
      }
    }

    return campaigns.map(campaign => {
      if (!campaign.exchange) return campaign

      return {
        ...campaign,
        exchange: {
          ...campaign.exchange,
          applicantsCount: counts.get(campaign.exchange.id) || 0,
          acceptedApplicantsCount: acceptedCounts.get(campaign.exchange.id) || 0,
        },
      }
    })
  })
}

export async function fetchBrandDashboardData(brandId: string): Promise<{
  campaigns: Campaign[]
  totalApplicants: number
  acceptedCount: number
}> {
  return retryOnTransientFetch(async () => {
    const campaigns = await fetchBrandCampaigns(brandId)
    const exchangeIds = campaigns
      .flatMap(c => (c.exchange ? [c.exchange.id] : []))
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
  })
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
        exchange_form_questions (*),
        exchange_applications (
          *,
          user_profiles (
            *,
            profiles (email)
          ),
          exchange_application_answers (
            *,
            exchange_form_questions (*)
          )
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
  if (!data) return null

  const rawCampaign = data as Record<string, unknown>
  const exchange = takeRelation<Record<string, unknown>>(rawCampaign.exchanges)
  const challenge = takeRelation<Record<string, unknown>>(rawCampaign.challenges)

  return {
    ...(rawCampaign as unknown as CampaignData),
    brand_profiles: (takeRelation<Record<string, unknown>>(rawCampaign.brand_profiles) || {
      name: '',
      logo: '',
    }) as CampaignData['brand_profiles'],
    exchanges: exchange
      ? {
          id: exchange.id as string,
          slots: (exchange.slots as number) || 0,
          deadline: (exchange.deadline as string) || '',
          reward_description: (exchange.reward_description as string) || '',
          exchange_form_questions: (exchange.exchange_form_questions as Array<Record<string, unknown>>) || [],
          exchange_applications: (exchange.exchange_applications as ApplicationRow[]) || [],
        }
      : undefined,
    challenges: challenge
      ? {
          id: challenge.id as string,
          total_days: (challenge.total_days as number) || 0,
          max_winners: (challenge.max_winners as number) || 0,
          challenge_days: (challenge.challenge_days as Array<{ id: string; day_number: number }>) || [],
          challenge_submissions: (challenge.challenge_submissions as SubmissionRow[]) || [],
        }
      : undefined,
  }
}

function getAcceptedNotificationMessage(campaignTitle: string) {
  return `Tu aplicación para "${campaignTitle}" fue aceptada. La marca te va a contactar por email directamente.`
}

function getRejectedNotificationMessage(campaignTitle: string) {
  return `Tu aplicación para "${campaignTitle}" fue rechazada. Podés seguir aplicando a otras campañas activas.`
}

export async function updateExchangeApplicationStatus(
  appId: string,
  status: ApplicationStatus,
  context?: {
    campaignTitle?: string
    applications?: ApplicationRow[]
  }
): Promise<ExchangeDecisionResult> {
  const campaignTitle = context?.campaignTitle

  if (status === 'accepted') {
    const { data, error } = await supabase.rpc('accept_exchange_application', {
      target_application_id: appId,
    })

    if (error) {
      if (error.message.toLowerCase().includes('slots')) {
        throw new Error('No quedan slots disponibles para aceptar otra aplicación.')
      }

      throw new Error(error.message)
    }

    const result = (data || {}) as ExchangeDecisionResultRow
    const affectedApplications = context?.applications || []
    const acceptedApplication = affectedApplications.find(application => application.id === appId)

    if (acceptedApplication?.user_profiles && campaignTitle) {
      await createNotification({
        userId: (acceptedApplication.user_profiles as Record<string, unknown>).user_id as string,
        title: 'Aplicación aceptada',
        message: getAcceptedNotificationMessage(campaignTitle),
      })
    }

    const autoRejectedIds = result.autoRejectedApplicationIds || []

    if (autoRejectedIds.length > 0 && campaignTitle) {
      const autoRejectedApplications = affectedApplications.filter(application =>
        autoRejectedIds.includes(application.id)
      )

      await Promise.all(
        autoRejectedApplications
          .filter(application => application.user_profiles)
          .map(application =>
            createNotification({
              userId: (application.user_profiles as Record<string, unknown>).user_id as string,
              title: 'Aplicación rechazada',
              message: getRejectedNotificationMessage(campaignTitle),
            })
          )
      )
    }

    return {
      selectedApplicationId: result.selectedApplicationId || appId,
      selectedStatus: (result.selectedStatus || 'accepted') as ApplicationStatus,
      autoRejectedApplicationIds: autoRejectedIds,
      slotsFilled: Boolean(result.slotsFilled),
    }
  }

  const { error } = await supabase.from('exchange_applications').update({ status }).eq('id', appId)
  if (error) throw new Error(error.message)

  const rejectedApplication = context?.applications?.find(application => application.id === appId)

  if (status === 'rejected' && rejectedApplication?.user_profiles && campaignTitle) {
    await createNotification({
      userId: (rejectedApplication.user_profiles as Record<string, unknown>).user_id as string,
      title: 'Aplicación rechazada',
      message: getRejectedNotificationMessage(campaignTitle),
    })
  }

  return {
    selectedApplicationId: appId,
    selectedStatus: status,
    autoRejectedApplicationIds: [],
    slotsFilled: false,
  }
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
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new Error('El puntaje debe estar entre 0 y 100.')
  }

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
            exchanges (
              *,
              exchange_form_questions (*)
            ),
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

export function mapBrandApplicationAnswers(application: ApplicationRow): ExchangeApplicationAnswer[] {
  return ((application.exchange_application_answers || []) as Array<Record<string, unknown>>).map(row =>
    mapExchangeApplicationAnswer(row)
  )
}
