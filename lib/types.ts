export type UserRole = 'brand' | 'user'
export type CampaignType = 'exchange' | 'challenge'
export type CampaignStatus = 'draft' | 'active' | 'closed'
export type ApplicationStatus = 'applied' | 'invited' | 'accepted' | 'rejected'
export type UserLevel = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond'
export type RewardType = 'product' | 'discount' | 'experience'
export type ContentType = 'video' | 'image' | 'text' | 'link'
export type ExchangeFormFieldType = 'short_text' | 'long_text' | 'select' | 'radio'

export interface UserProfile {
  id: string
  userId: string
  email?: string
  username: string
  bio: string
  profileImage: string
  instagramUrl?: string
  tiktokUrl?: string
  youtubeUrl?: string
  followersInstagram: number
  followersTiktok: number
  followersYoutube: number
  totalPoints: number
  level: UserLevel
  category: string
  location: string
  createdAt: string
}

export interface BrandProfile {
  id: string
  userId: string
  name: string
  description: string
  logo: string
  industry: string
  createdAt: string
}

export interface Campaign {
  id: string
  brandId: string
  brandName: string
  brandLogo: string
  type: CampaignType
  title: string
  description: string
  status: CampaignStatus
  createdAt: string
  currentUserApplicationStatus?: ApplicationStatus
  exchange?: Exchange
  challenge?: Challenge
}

export interface Exchange {
  id: string
  campaignId: string
  requirements: Record<string, string>
  rewardDescription: string
  rewardType: 'product' | 'money' | 'both'
  moneyAmount?: number
  productDescription?: string
  slots: number
  deadline: string
  applicantsCount: number
  acceptedApplicantsCount: number
  formQuestions: ExchangeFormQuestion[]
}

export interface ExchangeFormQuestion {
  id: string
  exchangeId: string
  label: string
  fieldType: ExchangeFormFieldType
  required: boolean
  position: number
  options: string[]
}

export interface ExchangeApplicationAnswer {
  id: string
  applicationId: string
  questionId: string
  answerText: string
  answerJson?: string[]
  question?: ExchangeFormQuestion
}

export interface Challenge {
  id: string
  campaignId: string
  isMultiDay: boolean
  totalDays: number
  hasLeaderboard: boolean
  maxWinners: number
  days: ChallengeDay[]
}

export interface ChallengeDay {
  id: string
  challengeId: string
  dayNumber: number
  title: string
  description: string
  contentType: ContentType
  instructions: string
}

export interface Application {
  id: string
  exchangeId: string
  userId: string
  userProfile: UserProfile
  status: ApplicationStatus
  proposalText: string
  createdAt: string
  answers: ExchangeApplicationAnswer[]
}

export interface ChallengeSubmission {
  id: string
  challengeId: string
  dayId: string
  userId: string
  userProfile: UserProfile
  submissionUrl: string
  submissionText: string
  score?: number
  createdAt: string
}

export interface BrandPoints {
  brandId: string
  brandName: string
  brandLogo: string
  points: number
}

export interface Reward {
  id: string
  brandId: string
  title: string
  description: string
  pointsCost: number
  moneyCost?: number
  rewardType: RewardType
  image: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  read: boolean
  createdAt: string
}
