import { supabase } from '@/lib/supabase'
import type {
  CampaignStatus,
  CampaignType,
  ContentType,
  ExchangeFormFieldType,
} from '@/lib/types'

interface ChallengeDayInput {
  title: string
  description: string
  contentType: ContentType
  instructions: string
}

interface ExchangeFormQuestionInput {
  label: string
  fieldType: ExchangeFormFieldType
  required: boolean
  options: string[]
}

interface CreateCampaignInput {
  brandId: string
  type: CampaignType
  title: string
  description: string
  status: CampaignStatus
  exchange?: {
    requirementsBrief: string
    rewardType: 'product' | 'money' | 'both'
    moneyAmount: string
    productDescription: string
    slots: string
    deadline: string
    formQuestions: ExchangeFormQuestionInput[]
  }
  challenge?: {
    isMultiDay: boolean
    hasLeaderboard: boolean
    maxWinners: string
    deadline: string
    days: ChallengeDayInput[]
  }
}

const DEFAULT_TIMEOUT_MS = 30000

function getDefaultExchangeQuestions(input: CreateCampaignInput['exchange']): ExchangeFormQuestionInput[] {
  const requirementPrompt = input?.requirementsBrief?.trim()

  return [
    {
      label: 'Contanos por qué sos una buena opción para esta campaña',
      fieldType: 'long_text',
      required: true,
      options: [],
    },
    {
      label: requirementPrompt || 'Compartí cómo cumplís con los requisitos de la campaña',
      fieldType: 'long_text',
      required: true,
      options: [],
    },
    {
      label: 'Dejanos tu usuario principal o link de contenido',
      fieldType: 'short_text',
      required: true,
      options: [],
    },
  ]
}

async function withTimeout<T>(promiseLike: PromiseLike<T>, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Request timed out while creating campaign')), timeoutMs)
  })

  try {
    return await Promise.race([Promise.resolve(promiseLike), timeoutPromise])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export async function createCampaign(input: CreateCampaignInput): Promise<string> {
  const { data: campaign, error: campaignError } = await withTimeout(
    supabase
      .from('campaigns')
      .insert({
        brand_id: input.brandId,
        type: input.type,
        title: input.title,
        description: input.description,
        status: input.status,
      })
      .select()
      .single()
  )

  if (campaignError) {
    throw new Error(campaignError.message)
  }

  if (!campaign?.id) {
    throw new Error('Campaign was created without an id')
  }

  if (input.type === 'exchange' && input.exchange) {
    const { data: exchange, error: exchangeError } = await withTimeout(
      supabase.from('exchanges').insert({
        campaign_id: campaign.id,
        requirements: input.exchange.requirementsBrief ? { main: input.exchange.requirementsBrief } : {},
        reward_description: input.exchange.productDescription || `Recompensa: ${input.exchange.rewardType}`,
        reward_type: input.exchange.rewardType,
        money_amount: input.exchange.moneyAmount ? parseFloat(input.exchange.moneyAmount) : null,
        product_description: input.exchange.productDescription,
        slots: parseInt(input.exchange.slots, 10),
        deadline:
          input.exchange.deadline ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
      .select()
      .single()
    )

    if (exchangeError) {
      throw new Error(exchangeError.message)
    }

    if (!exchange?.id) {
      throw new Error('Exchange was created without an id')
    }

    const formQuestions = input.exchange.formQuestions.length > 0
      ? input.exchange.formQuestions
      : getDefaultExchangeQuestions(input.exchange)

    const { error: questionsError } = await withTimeout(
      supabase.from('exchange_form_questions').insert(
        formQuestions.map((question, index) => ({
          exchange_id: exchange.id,
          label: question.label,
          field_type: question.fieldType,
          required: question.required,
          position: index,
          options: question.options.length > 0 ? question.options : null,
        }))
      )
    )

    if (questionsError) {
      throw new Error(questionsError.message)
    }
  }

  if (input.type === 'challenge' && input.challenge) {
    const { data: challenge, error: challengeError } = await withTimeout(
      supabase
        .from('challenges')
        .insert({
          campaign_id: campaign.id,
          is_multi_day: input.challenge.isMultiDay,
          total_days: input.challenge.days.length,
          has_leaderboard: input.challenge.hasLeaderboard,
          max_winners: parseInt(input.challenge.maxWinners, 10),
          deadline: input.challenge.deadline || null,
        })
        .select()
        .single()
    )

    if (challengeError) {
      throw new Error(challengeError.message)
    }

    if (!challenge?.id) {
      throw new Error('Challenge was created without an id')
    }

    if (input.challenge.isMultiDay && input.challenge.days.length > 0) {
      const { error: daysError } = await withTimeout(
        supabase.from('challenge_days').insert(
          input.challenge.days.map((day, i) => ({
            challenge_id: challenge.id,
            day_number: i + 1,
            title: day.title,
            description: day.description,
            content_type: day.contentType,
            instructions: day.instructions,
          }))
        )
      )

      if (daysError) {
        throw new Error(daysError.message)
      }
    }
  }

  return campaign.id as string
}
