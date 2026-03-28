'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import type { CampaignType, ContentType, BrandProfile } from '@/lib/types'

type Step = 1 | 2 | 3

interface ChallengeDay {
  title: string
  description: string
  contentType: ContentType
  instructions: string
}

export default function CreateCampaignPage() {
  const router = useRouter()
  const { currentUser } = useAuth()
  const brand = currentUser?.profile as BrandProfile

  const [step, setStep] = useState<Step>(1)
  const [campaignType, setCampaignType] = useState<CampaignType | null>(null)

  // Common fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // Exchange fields
  const [slots, setSlots] = useState('5')
  const [deadline, setDeadline] = useState('')
  const [rewardType, setRewardType] = useState<'product' | 'money' | 'both'>('product')
  const [moneyAmount, setMoneyAmount] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [requirement, setRequirement] = useState('')

  // Challenge fields
  const [isMultiDay, setIsMultiDay] = useState(false)
  const [hasLeaderboard, setHasLeaderboard] = useState(true)
  const [maxWinners, setMaxWinners] = useState('3')
  const [days, setDays] = useState<ChallengeDay[]>([
    { title: '', description: '', contentType: 'image', instructions: '' }
  ])

  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState('')

  const addDay = () => {
    setDays(prev => [...prev, { title: '', description: '', contentType: 'image', instructions: '' }])
  }

  const updateDay = (idx: number, field: keyof ChallengeDay, value: string) => {
    setDays(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d))
  }

  const removeDay = (idx: number) => {
    if (days.length > 1) setDays(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSaveDraft = async () => {
    if (!brand?.id) return
    setPublishing(true)
    setPublishError('')

    try {
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          brand_id: brand.id,
          type: campaignType,
          title,
          description,
          status: 'draft',
        })
        .select()
        .single()

      if (campaignError) throw new Error(campaignError.message)

      if (campaignType === 'exchange') {
        const { error: exchangeError } = await supabase.from('exchanges').insert({
          campaign_id: campaign.id,
          requirements: requirement ? { main: requirement } : {},
          reward_description: productDescription || `Recompensa: ${rewardType}`,
          reward_type: rewardType,
          money_amount: moneyAmount ? parseFloat(moneyAmount) : null,
          product_description: productDescription,
          slots: parseInt(slots),
          deadline: deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        })
        if (exchangeError) throw new Error(exchangeError.message)
      }

      if (campaignType === 'challenge') {
        const { data: challenge, error: challengeError } = await supabase
          .from('challenges')
          .insert({
            campaign_id: campaign.id,
            is_multi_day: isMultiDay,
            total_days: days.length,
            has_leaderboard: hasLeaderboard,
            max_winners: parseInt(maxWinners),
          })
          .select()
          .single()

        if (challengeError) throw new Error(challengeError.message)

        if (isMultiDay && days.length > 0) {
          const { error: daysError } = await supabase.from('challenge_days').insert(
            days.map((day, i) => ({
              challenge_id: challenge.id,
              day_number: i + 1,
              title: day.title,
              description: day.description,
              content_type: day.contentType,
              instructions: day.instructions,
            }))
          )
          if (daysError) throw new Error(daysError.message)
        }
      }

      router.push('/brand/campaigns')
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setPublishing(false)
    }
  }

  const handlePublish = async () => {
    if (!brand?.id) return
    setPublishing(true)
    setPublishError('')

    try {
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          brand_id: brand.id,
          type: campaignType,
          title,
          description,
          status: 'active',
        })
        .select()
        .single()

      if (campaignError) throw new Error(campaignError.message)

      if (campaignType === 'exchange') {
        const { error: exchangeError } = await supabase.from('exchanges').insert({
          campaign_id: campaign.id,
          requirements: requirement ? { main: requirement } : {},
          reward_description: productDescription || `Recompensa: ${rewardType}`,
          reward_type: rewardType,
          money_amount: moneyAmount ? parseFloat(moneyAmount) : null,
          product_description: productDescription,
          slots: parseInt(slots),
          deadline: deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        })
        if (exchangeError) throw new Error(exchangeError.message)
      }

      if (campaignType === 'challenge') {
        const { data: challenge, error: challengeError } = await supabase
          .from('challenges')
          .insert({
            campaign_id: campaign.id,
            is_multi_day: isMultiDay,
            total_days: days.length,
            has_leaderboard: hasLeaderboard,
            max_winners: parseInt(maxWinners),
          })
          .select()
          .single()

        if (challengeError) throw new Error(challengeError.message)

        if (isMultiDay && days.length > 0) {
          const { error: daysError } = await supabase.from('challenge_days').insert(
            days.map((day, i) => ({
              challenge_id: challenge.id,
              day_number: i + 1,
              title: day.title,
              description: day.description,
              content_type: day.contentType,
              instructions: day.instructions,
            }))
          )
          if (daysError) throw new Error(daysError.message)
        }
      }

      router.push('/brand/campaigns')
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Error al publicar')
    } finally {
      setPublishing(false)
    }
  }

  const steps = ['Tipo', 'Configurar', 'Publicar']

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Crear Campaña</h1>
        <p className="text-gray-500">Conectá con los creadores perfectos para tu marca</p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((label, i) => {
          const s = (i + 1) as Step
          const isComplete = step > s
          const isCurrent = step === s
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 ${isCurrent ? 'text-indigo-600' : isComplete ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                  isCurrent ? 'border-indigo-600 bg-indigo-50 text-indigo-600' :
                  isComplete ? 'border-green-500 bg-green-50 text-green-600' :
                  'border-gray-200 bg-white text-gray-400'
                }`}>
                  {isComplete ? '✓' : s}
                </div>
                <span className="text-sm font-medium">{label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px w-12 ${step > s ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step 1: Choose type */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">¿Qué tipo de campaña querés crear?</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setCampaignType('exchange')}
              className={`p-6 rounded-2xl border-2 text-left transition-all ${
                campaignType === 'exchange'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-4xl mb-3">🔄</div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">Canje</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Ofrece productos o dinero a cambio de contenido. Los creadores aplican y vos elegís con quién trabajar.
              </p>
            </button>

            <button
              onClick={() => setCampaignType('challenge')}
              className={`p-6 rounded-2xl border-2 text-left transition-all ${
                campaignType === 'challenge'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">Reto</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Lanzá un challenge con leaderboard. Cualquier creador puede participar y los mejores ganan premios.
              </p>
            </button>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={() => campaignType && setStep(2)}
              disabled={!campaignType}
              className="bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Configure */}
      {step === 2 && (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Configurar {campaignType === 'exchange' ? 'Canje' : 'Reto'}
          </h2>

          {/* Common fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título de la campaña *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Air Max Day 2025 - Embajadores"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describí tu campaña en detalle..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Exchange-specific */}
          {campaignType === 'exchange' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de recompensa</label>
                <div className="flex gap-2">
                  {([['product', 'Producto'], ['money', 'Dinero'], ['both', 'Ambos']] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setRewardType(val)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        rewardType === val
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {(rewardType === 'product' || rewardType === 'both') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del producto</label>
                  <input
                    type="text"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder="Ej: Par de Nike Air Max 2025 a elección"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {(rewardType === 'money' || rewardType === 'both') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto en ARS</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      value={moneyAmount}
                      onChange={(e) => setMoneyAmount(e.target.value)}
                      placeholder="15000"
                      className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requisito principal</label>
                <input
                  type="text"
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  placeholder="Ej: Mínimo 10,000 seguidores + 2 posts en Instagram"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slots disponibles</label>
                  <input
                    type="number"
                    value={slots}
                    onChange={(e) => setSlots(e.target.value)}
                    min={1}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Challenge-specific */}
          {campaignType === 'challenge' && (
            <>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <div className="font-medium text-gray-900">Reto multi-día</div>
                  <div className="text-sm text-gray-500">¿Los participantes completan tareas durante varios días?</div>
                </div>
                <button
                  onClick={() => setIsMultiDay(!isMultiDay)}
                  className={`w-11 h-6 rounded-full transition-colors ${isMultiDay ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mx-0.5 ${isMultiDay ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <div className="font-medium text-gray-900">Leaderboard público</div>
                  <div className="text-sm text-gray-500">Mostrar ranking de participantes</div>
                </div>
                <button
                  onClick={() => setHasLeaderboard(!hasLeaderboard)}
                  className={`w-11 h-6 rounded-full transition-colors ${hasLeaderboard ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mx-0.5 ${hasLeaderboard ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad de ganadores</label>
                <input
                  type="number"
                  value={maxWinners}
                  onChange={(e) => setMaxWinners(e.target.value)}
                  min={1}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Days */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    {isMultiDay ? 'Días del reto' : 'Tarea principal'}
                  </label>
                  {isMultiDay && (
                    <button
                      onClick={addDay}
                      className="text-sm text-indigo-600 font-medium hover:text-indigo-700"
                    >
                      + Agregar día
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {days.map((day, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">
                          {isMultiDay ? `Día ${idx + 1}` : 'Tarea'}
                        </span>
                        {days.length > 1 && (
                          <button
                            onClick={() => removeDay(idx)}
                            className="text-xs text-red-400 hover:text-red-600"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={day.title}
                          onChange={(e) => updateDay(idx, 'title', e.target.value)}
                          placeholder="Título"
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <select
                          value={day.contentType}
                          onChange={(e) => updateDay(idx, 'contentType', e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="image">Imagen</option>
                          <option value="video">Video</option>
                          <option value="text">Texto</option>
                          <option value="link">Link</option>
                        </select>
                        <textarea
                          value={day.instructions}
                          onChange={(e) => updateDay(idx, 'instructions', e.target.value)}
                          placeholder="Instrucciones..."
                          rows={2}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              className="border border-gray-200 text-gray-700 font-medium px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              ← Atrás
            </button>
            <button
              onClick={() => title && description && setStep(3)}
              disabled={!title || !description}
              className="bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview + Publish */}
      {step === 3 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Vista previa y publicación</h2>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                campaignType === 'exchange' ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700'
              }`}>
                {campaignType === 'exchange' ? 'Canje' : 'Reto'}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title || 'Sin título'}</h3>
            <p className="text-gray-500 mb-4">{description || 'Sin descripción'}</p>

            {campaignType === 'exchange' && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-1">Slots</div>
                  <div className="font-semibold text-gray-900">{slots}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-1">Tipo recompensa</div>
                  <div className="font-semibold text-gray-900 capitalize">{rewardType}</div>
                </div>
                {moneyAmount && (
                  <div className="bg-green-50 rounded-xl p-3">
                    <div className="text-xs text-gray-400 mb-1">Pago</div>
                    <div className="font-semibold text-green-700">${parseInt(moneyAmount).toLocaleString()} ARS</div>
                  </div>
                )}
                {productDescription && (
                  <div className="bg-indigo-50 rounded-xl p-3">
                    <div className="text-xs text-gray-400 mb-1">Producto</div>
                    <div className="font-semibold text-gray-900 text-xs">{productDescription}</div>
                  </div>
                )}
              </div>
            )}

            {campaignType === 'challenge' && (
              <div className="space-y-2">
                <div className="flex gap-2 flex-wrap">
                  {hasLeaderboard && <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full font-medium">🏆 Leaderboard</span>}
                  {isMultiDay && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{days.length} días</span>}
                  <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-medium">{maxWinners} ganadores</span>
                </div>
              </div>
            )}
          </div>

          {publishError && (
            <div className="mb-4 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
              {publishError}
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="border border-gray-200 text-gray-700 font-medium px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              ← Editar
            </button>
            <div className="flex gap-3">
              <button
                className="border border-gray-200 text-gray-700 font-medium px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
                onClick={handleSaveDraft}
                disabled={publishing}
              >
                Guardar borrador
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 text-sm"
              >
                {publishing ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Publicando...
                  </span>
                ) : (
                  '🚀 Publicar campaña'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
