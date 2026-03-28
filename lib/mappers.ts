import type {
  Campaign,
  UserProfile,
  BrandProfile,
  Exchange,
  Challenge,
  ExchangeFormQuestion,
  ExchangeApplicationAnswer,
  ApplicationStatus,
} from './types'

function takeRelation<T>(value: unknown): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T) || null
  }

  return (value as T) || null
}

export function mapUserProfile(row: Record<string, unknown>): UserProfile {
  const baseProfile = takeRelation<Record<string, unknown>>(row.profiles)

  return {
    id: row.id as string,
    userId: row.user_id as string,
    email: (baseProfile?.email as string) || '',
    username: row.username as string,
    bio: (row.bio as string) || '',
    profileImage: (row.profile_image as string) || 'https://i.pravatar.cc/150?img=30',
    instagramUrl: (row.instagram_url as string) || '',
    tiktokUrl: (row.tiktok_url as string) || '',
    youtubeUrl: (row.youtube_url as string) || '',
    followersInstagram: (row.followers_instagram as number) || 0,
    followersTiktok: (row.followers_tiktok as number) || 0,
    followersYoutube: (row.followers_youtube as number) || 0,
    totalPoints: (row.total_points as number) || 0,
    level: (row.level as UserProfile['level']) || 'Bronze',
    category: (row.category as string) || 'Lifestyle',
    location: (row.location as string) || 'Argentina',
    createdAt: row.created_at as string,
  }
}

export function mapBrandProfile(row: Record<string, unknown>): BrandProfile {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    description: (row.description as string) || '',
    logo: (row.logo as string) || '',
    industry: (row.industry as string) || '',
    createdAt: row.created_at as string,
  }
}

export function mapCampaign(row: Record<string, unknown>): Campaign {
  const brandProfile = takeRelation<Record<string, unknown>>(row.brand_profiles) || {}
  const exchangeRow = takeRelation<Record<string, unknown>>(row.exchanges)
  const challengeRow = takeRelation<Record<string, unknown>>(row.challenges)
  const exchangeQuestions = ((exchangeRow?.exchange_form_questions as Record<string, unknown>[]) || [])
    .map(question => mapExchangeFormQuestion(question))
    .sort((a, b) => a.position - b.position)
  const currentUserApplication = ((exchangeRow?.exchange_applications as Record<string, unknown>[]) || [])[0]

  const exchange: Exchange | undefined = exchangeRow ? {
    id: exchangeRow.id as string,
    campaignId: exchangeRow.campaign_id as string,
    requirements: (exchangeRow.requirements as Record<string, string>) || {},
    rewardDescription: (exchangeRow.reward_description as string) || '',
    rewardType: (exchangeRow.reward_type as Exchange['rewardType']) || 'product',
    moneyAmount: exchangeRow.money_amount as number | undefined,
    productDescription: (exchangeRow.product_description as string) || '',
    slots: (exchangeRow.slots as number) || 1,
    deadline: (exchangeRow.deadline as string) || '',
    applicantsCount: 0,
    acceptedApplicantsCount: 0,
    formQuestions: exchangeQuestions,
  } : undefined

  const challenge: Challenge | undefined = challengeRow ? {
    id: challengeRow.id as string,
    campaignId: challengeRow.campaign_id as string,
    isMultiDay: (challengeRow.is_multi_day as boolean) || false,
    totalDays: (challengeRow.total_days as number) || 1,
    hasLeaderboard: (challengeRow.has_leaderboard as boolean) || true,
    maxWinners: (challengeRow.max_winners as number) || 1,
    deadline: (challengeRow.deadline as string) || undefined,
    days: ((challengeRow.challenge_days as Record<string, unknown>[]) || []).map(d => ({
      id: d.id as string,
      challengeId: d.challenge_id as string,
      dayNumber: d.day_number as number,
      title: d.title as string,
      description: (d.description as string) || '',
      contentType: (d.content_type as Challenge['days'][0]['contentType']) || 'link',
      instructions: (d.instructions as string) || '',
    })),
    submissions: ((challengeRow.challenge_submissions as Record<string, unknown>[]) || [])
      .map(submission => {
        if (!submission.user_profiles) return null

        return {
          id: submission.id as string,
          challengeId: submission.challenge_id as string,
          dayId: submission.day_id as string,
          userId: submission.user_id as string,
          userProfile: mapUserProfile(submission.user_profiles as Record<string, unknown>),
          submissionUrl: (submission.submission_url as string) || undefined,
          submissionText: (submission.submission_text as string) || undefined,
          videoUrl: (submission.video_url as string) || undefined,
          score: (submission.score as number | null) || undefined,
          createdAt: submission.created_at as string,
        }
      })
      .filter((submission): submission is NonNullable<typeof submission> => Boolean(submission)),
  } : undefined

  return {
    id: row.id as string,
    brandId: row.brand_id as string,
    brandName: (brandProfile?.name as string) || '',
    brandLogo: (brandProfile?.logo as string) || '',
    type: row.type as Campaign['type'],
    title: row.title as string,
    description: (row.description as string) || '',
    status: row.status as Campaign['status'],
    createdAt: row.created_at as string,
    currentUserApplicationStatus: currentUserApplication?.status as ApplicationStatus | undefined,
    exchange,
    challenge,
  }
}

export function mapExchangeFormQuestion(row: Record<string, unknown>): ExchangeFormQuestion {
  return {
    id: row.id as string,
    exchangeId: row.exchange_id as string,
    label: row.label as string,
    fieldType: row.field_type as ExchangeFormQuestion['fieldType'],
    required: Boolean(row.required),
    position: (row.position as number) || 0,
    options: Array.isArray(row.options) ? row.options.map(option => String(option)) : [],
  }
}

export function mapExchangeApplicationAnswer(row: Record<string, unknown>): ExchangeApplicationAnswer {
  const answerJson = row.answer_json

  return {
    id: row.id as string,
    applicationId: row.application_id as string,
    questionId: row.question_id as string,
    answerText: (row.answer_text as string) || '',
    answerJson: Array.isArray(answerJson) ? answerJson.map(value => String(value)) : undefined,
    question: row.exchange_form_questions
      ? mapExchangeFormQuestion(row.exchange_form_questions as Record<string, unknown>)
      : undefined,
  }
}
