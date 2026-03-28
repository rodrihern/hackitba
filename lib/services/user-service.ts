import { mapCampaign, mapExchangeApplicationAnswer } from '@/lib/mappers'
import { supabase } from '@/lib/supabase'
import type {
  ApplicationStatus,
  Campaign,
  ExchangeApplicationAnswer,
  ExchangeFormQuestion,
  Notification,
} from '@/lib/types'

export interface UserCampaignApplicationRow {
  id: string
  status: ApplicationStatus
  proposal_text: string
  created_at: string
  answers?: ExchangeApplicationAnswer[]
  exchange_application_answers?: Array<Record<string, unknown>>
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

interface ExchangeApplicationLookupRow {
  id: string
  exchange_id: string
  status: ApplicationStatus
  user_id: string
}

function mapApplicationAnswers(rows: Array<Record<string, unknown>>): ExchangeApplicationAnswer[] {
  return rows.map(row => mapExchangeApplicationAnswer(row))
}

async function augmentCampaignsWithExchangeStats(
  campaignsData: Record<string, unknown>[],
  userProfileId?: string
): Promise<Campaign[]> {
  const campaigns = campaignsData.map(row => mapCampaign(row))
  const exchangeIds = campaigns
    .flatMap(campaign => (campaign.exchange ? [campaign.exchange.id] : []))
    .filter(Boolean)

  if (exchangeIds.length === 0) {
    return campaigns
  }

  const { data: applicationRows, error } = await supabase
    .from('exchange_applications')
    .select('id, exchange_id, status, user_id')
    .in('exchange_id', exchangeIds)

  if (error) {
    throw new Error(error.message)
  }

  const counts = new Map<string, number>()
  const acceptedCounts = new Map<string, number>()
  const currentUserStatuses = new Map<string, ApplicationStatus>()

  for (const row of (applicationRows || []) as ExchangeApplicationLookupRow[]) {
    counts.set(row.exchange_id, (counts.get(row.exchange_id) || 0) + 1)
    if (row.status === 'accepted') {
      acceptedCounts.set(row.exchange_id, (acceptedCounts.get(row.exchange_id) || 0) + 1)
    }
    if (userProfileId && row.user_id === userProfileId) {
      currentUserStatuses.set(row.exchange_id, row.status)
    }
  }

  return campaigns.map(campaign => {
    if (!campaign.exchange) return campaign

    return {
      ...campaign,
      currentUserApplicationStatus: currentUserStatuses.get(campaign.exchange.id),
      exchange: {
        ...campaign.exchange,
        applicantsCount: counts.get(campaign.exchange.id) || 0,
        acceptedApplicantsCount: acceptedCounts.get(campaign.exchange.id) || 0,
      },
    }
  })
}

export async function fetchAllCampaigns(userProfileId?: string): Promise<Campaign[]> {
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
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return augmentCampaignsWithExchangeStats((data || []) as Record<string, unknown>[], userProfileId)
}

export async function fetchActiveCampaigns(userProfileId?: string): Promise<Campaign[]> {
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
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return augmentCampaignsWithExchangeStats((data || []) as Record<string, unknown>[], userProfileId)
}

export async function fetchExchangeFormQuestions(exchangeId: string): Promise<ExchangeFormQuestion[]> {
  const { data, error } = await supabase
    .from('exchange_form_questions')
    .select('*')
    .eq('exchange_id', exchangeId)
    .order('position', { ascending: true })

  if (error) throw new Error(error.message)

  return ((data || []) as Record<string, unknown>[]).map(row => ({
    id: row.id as string,
    exchangeId: row.exchange_id as string,
    label: row.label as string,
    fieldType: row.field_type as ExchangeFormQuestion['fieldType'],
    required: Boolean(row.required),
    position: (row.position as number) || 0,
    options: Array.isArray(row.options) ? row.options.map(option => String(option)) : [],
  }))
}

export async function createExchangeApplication(input: {
  exchangeId: string
  userProfileId: string
  answers: Array<{
    questionId: string
    answerText: string
    answerJson?: string[]
  }>
}) {
  if (!input.exchangeId) {
    throw new Error('No se pudo detectar el canje para esta aplicación.')
  }

  const primaryAnswer = input.answers.find(answer => answer.answerText.trim().length > 0)?.answerText || ''

  const { data: application, error: applicationError } = await supabase
    .from('exchange_applications')
    .insert({
      exchange_id: input.exchangeId,
      user_id: input.userProfileId,
      proposal_text: primaryAnswer,
      status: 'applied',
    })
    .select('id')
    .single()

  if (applicationError) {
    if (applicationError.message.toLowerCase().includes('duplicate')) {
      throw new Error('Ya aplicaste a este canje.')
    }

    throw new Error(applicationError.message)
  }

  if (!application?.id) {
    throw new Error('Application was created without an id')
  }

  const answerRows = input.answers.map(answer => ({
    application_id: application.id,
    question_id: answer.questionId,
    answer_text: answer.answerText || null,
    answer_json: answer.answerJson && answer.answerJson.length > 0 ? answer.answerJson : null,
  }))

  if (answerRows.length > 0) {
    const { error: answersError } = await supabase
      .from('exchange_application_answers')
      .insert(answerRows)

    if (answersError) {
      throw new Error(answersError.message)
    }
  }

  return application.id as string
}

export async function fetchUserCampaignsData(userProfileId: string): Promise<{
  applications: Array<UserCampaignApplicationRow & { answers: ExchangeApplicationAnswer[] }>
  challengeSubs: UserChallengeSubmissionRow[]
}> {
  const [appsResult, subsResult] = await Promise.all([
    supabase
      .from('exchange_applications')
      .select(`
        *,
        exchange_application_answers (
          *,
          exchange_form_questions (*)
        ),
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
    applications: ((appsResult.data || []) as UserCampaignApplicationRow[]).map(application => ({
      ...application,
      answers: mapApplicationAnswers(
        (application.exchange_application_answers || []) as Array<Record<string, unknown>>
      ),
    })),
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
