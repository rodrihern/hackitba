import type { Campaign, UserProfile, BrandProfile, Exchange, Challenge } from './types'

export function mapUserProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    userId: row.user_id as string,
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
  const brandProfile = row.brand_profiles as Record<string, unknown>
  const exchangeRow = row.exchanges as Record<string, unknown> | null
  const challengeRow = row.challenges as Record<string, unknown> | null

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
  } : undefined

  const challenge: Challenge | undefined = challengeRow ? {
    id: challengeRow.id as string,
    campaignId: challengeRow.campaign_id as string,
    isMultiDay: (challengeRow.is_multi_day as boolean) || false,
    totalDays: (challengeRow.total_days as number) || 1,
    hasLeaderboard: (challengeRow.has_leaderboard as boolean) || true,
    maxWinners: (challengeRow.max_winners as number) || 1,
    days: ((challengeRow.challenge_days as Record<string, unknown>[]) || []).map(d => ({
      id: d.id as string,
      challengeId: d.challenge_id as string,
      dayNumber: d.day_number as number,
      title: d.title as string,
      description: (d.description as string) || '',
      contentType: (d.content_type as Challenge['days'][0]['contentType']) || 'link',
      instructions: (d.instructions as string) || '',
    })),
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
    exchange,
    challenge,
  }
}
