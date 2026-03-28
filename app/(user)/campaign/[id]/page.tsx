'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Video, ExternalLink, Trophy, Calendar, Users, Gift, Check } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import type { Campaign, UserProfile } from '@/lib/types'
import { fetchCampaignById, updateExchangeApplicationVideoUrl } from '@/lib/services/user-service'
import { isValidVideoUrl, parseVideoUrl, getPlatformName } from '@/lib/utils/video-url-parser'
import ExchangeApplyModal from '@/components/ExchangeApplyModal'
import ChallengeSubmitModal from '@/components/ChallengeSubmitModal'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-AR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  })
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { currentUser } = useAuth()
  const profile = currentUser?.profile as UserProfile | undefined

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Video URL state
  const [videoUrl, setVideoUrl] = useState('')
  const [videoError, setVideoError] = useState('')
  const [videoSuccess, setVideoSuccess] = useState(false)
  const [isSavingVideo, setIsSavingVideo] = useState(false)
  
  // Modal state
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  useEffect(() => {
    async function loadCampaign() {
      try {
        const data = await fetchCampaignById(id, profile?.id)
        setCampaign(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar la campaña')
      } finally {
        setIsLoading(false)
      }
    }

    loadCampaign()
  }, [id, profile?.id])

  const handleSaveVideoUrl = async () => {
    if (!campaign || !profile) return

    const url = videoUrl.trim()
    
    if (!url) {
      setVideoError('Por favor ingresá una URL')
      return
    }

    if (!isValidVideoUrl(url)) {
      setVideoError('URL no válida. Usá un link de Instagram, TikTok o YouTube.')
      return
    }

    // Get application ID for this user
    const userApplication = (campaign.exchange as any)?.exchange_applications?.find(
      (app: any) => app.user_id === profile.id
    )

    if (!userApplication) {
      setVideoError('No se encontró tu aplicación')
      return
    }

    setIsSavingVideo(true)
    setVideoError('')

    try {
      await updateExchangeApplicationVideoUrl(userApplication.id, url)
      setVideoSuccess(true)
      
      // Update local state
      setCampaign(prev => {
        if (!prev || !prev.exchange) return prev
        return {
          ...prev,
          exchange: {
            ...prev.exchange,
            exchange_applications: (prev.exchange as any).exchange_applications?.map((app: any) =>
              app.id === userApplication.id ? { ...app, video_url: url } : app
            )
          }
        }
      })

      setTimeout(() => setVideoSuccess(false), 3000)
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setIsSavingVideo(false)
    }
  }

  const handleApplied = () => {
    // Reload campaign to get updated status
    fetchCampaignById(id, profile?.id).then(setCampaign)
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700">{error || 'Campaña no encontrada'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Volver
          </button>
        </div>
      </div>
    )
  }

  const isExchange = campaign.type === 'exchange'
  const isChallenge = campaign.type === 'challenge'
  const currentStatus = campaign.currentUserApplicationStatus
  const isAccepted = currentStatus === 'accepted'
  const hasApplied = Boolean(currentStatus)
  const exchangeFull = isExchange && campaign.exchange
    ? campaign.exchange.acceptedApplicantsCount >= campaign.exchange.slots
    : false

    // Get user's video URL if they've submitted one
    const userApplication = (campaign.exchange as any)?.exchange_applications?.find(
      (app: any) => app.user_id === profile?.id
    )
    const existingVideoUrl = userApplication?.video_url

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Volver</span>
      </button>

      {/* Campaign Header */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Gradient header */}
        <div className={`h-3 w-full ${
          isExchange 
            ? 'bg-gradient-to-r from-indigo-500 to-violet-500' 
            : 'bg-gradient-to-r from-orange-400 to-pink-500'
        }`} />

        <div className="p-8">
          {/* Brand info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
              {campaign.brandLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={campaign.brandLogo}
                  alt={campaign.brandName}
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <span className="text-lg font-semibold text-gray-500">
                  {campaign.brandName?.charAt(0) || 'M'}
                </span>
              )}
            </div>
            <div>
              <div className="text-sm text-gray-500">Campaña de</div>
              <div className="font-semibold text-gray-900">{campaign.brandName}</div>
            </div>
            <span className={`ml-auto text-sm font-semibold px-4 py-2 rounded-full ${
              isExchange
                ? 'bg-indigo-50 text-indigo-700'
                : 'bg-orange-50 text-orange-700'
            }`}>
              {isExchange ? 'Canje' : 'Reto'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {campaign.title}
          </h1>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed mb-6">
            {campaign.description}
          </p>

          {/* Status badge */}
          {currentStatus && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${
              currentStatus === 'accepted' 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : currentStatus === 'rejected'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : currentStatus === 'invited'
                ? 'bg-violet-50 text-violet-700 border border-violet-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {currentStatus === 'accepted' && <Check size={16} />}
              <span className="font-semibold">
                {currentStatus === 'accepted' ? 'Colaboración aceptada' :
                 currentStatus === 'rejected' ? 'Aplicación rechazada' :
                 currentStatus === 'invited' ? 'Invitación recibida' :
                 'Aplicación enviada'}
              </span>
            </div>
          )}

          {/* Exchange details */}
          {isExchange && campaign.exchange && (
            <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50 rounded-2xl mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                  <Gift className="text-indigo-600" size={20} />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Recompensa</div>
                  <div className="font-semibold text-gray-900">
                    {campaign.exchange.rewardDescription}
                  </div>
                  {campaign.exchange.moneyAmount && campaign.exchange.moneyAmount > 0 && (
                    <div className="text-sm text-green-600 font-semibold mt-1">
                      + ${campaign.exchange.moneyAmount} ARS
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                  <Calendar className="text-indigo-600" size={20} />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Fecha límite</div>
                  <div className="font-semibold text-gray-900">
                    {formatDate(campaign.exchange.deadline)}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                  <Users className="text-indigo-600" size={20} />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Slots disponibles</div>
                  <div className="font-semibold text-gray-900">
                    {Math.max(0, campaign.exchange.slots - campaign.exchange.acceptedApplicantsCount)} de {campaign.exchange.slots}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Challenge details */}
          {isChallenge && campaign.challenge && (
            <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50 rounded-2xl mb-6">
              {campaign.challenge.hasLeaderboard && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                    <Trophy className="text-orange-600" size={20} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Competencia</div>
                    <div className="font-semibold text-gray-900">
                      Leaderboard con {campaign.challenge.maxWinners} ganadores
                    </div>
                  </div>
                </div>
              )}

              {campaign.challenge.isMultiDay && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                    <Calendar className="text-orange-600" size={20} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Duración</div>
                    <div className="font-semibold text-gray-900">
                      {campaign.challenge.totalDays} días
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Video URL submission for accepted exchanges */}
          {isExchange && isAccepted && (
            <div className="mb-6">
              {existingVideoUrl ? (
                <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-indigo-900 mb-2">
                        <Video className="inline-block mr-1.5 mb-0.5" size={16} />
                        Video compartido con la marca
                      </p>
                      <a
                        href={existingVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        <span>{(() => {
                          const parsed = parseVideoUrl(existingVideoUrl)
                          return parsed.isValid ? `Ver en ${getPlatformName(parsed.platform)}` : 'Ver video'
                        })()}</span>
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    <Video className="inline-block mr-2 mb-1" size={20} />
                    Compartí tu video con la marca
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Agregá el link de tu contenido publicado (Instagram, TikTok o YouTube) para que la marca pueda ver los resultados de la colaboración.
                  </p>
                  
                  <div className="space-y-3">
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => {
                        setVideoUrl(e.target.value)
                        setVideoError('')
                      }}
                      placeholder="https://www.instagram.com/p/... o https://www.tiktok.com/..."
                      className="w-full text-sm border border-blue-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    
                    {videoUrl.trim() && (() => {
                      const parsed = parseVideoUrl(videoUrl)
                      return parsed.isValid ? (
                        <p className="text-xs text-green-600">
                          ✓ {getPlatformName(parsed.platform)} video detectado
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600">
                          URL no reconocida. Asegurate de usar un link de Instagram, TikTok o YouTube.
                        </p>
                      )
                    })()}
                    
                    {videoError && (
                      <p className="text-xs text-red-600">{videoError}</p>
                    )}
                    
                    {videoSuccess && (
                      <p className="text-xs text-green-600">✓ Video guardado correctamente</p>
                    )}
                    
                    <button
                      onClick={handleSaveVideoUrl}
                      disabled={isSavingVideo || !videoUrl.trim()}
                      className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingVideo ? 'Guardando...' : 'Guardar link del video'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex gap-3">
            {isExchange && !hasApplied && !exchangeFull && (
              <button
                onClick={() => setShowApplyModal(true)}
                className="flex-1 bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Aplicar al canje
              </button>
            )}

            {isExchange && exchangeFull && !hasApplied && (
              <div className="flex-1 bg-gray-100 text-gray-500 font-semibold py-3 rounded-xl text-center cursor-not-allowed">
                Canje lleno
              </div>
            )}

            {isChallenge && (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="flex-1 bg-orange-600 text-white font-semibold py-3 rounded-xl hover:bg-orange-700 transition-colors"
              >
                Participar en el reto
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isExchange && (
        <ExchangeApplyModal
          campaign={campaign}
          userProfileId={profile?.id}
          open={showApplyModal}
          onClose={() => setShowApplyModal(false)}
          onApplied={handleApplied}
        />
      )}

      {isChallenge && campaign.challenge && (
        <ChallengeSubmitModal
          challengeId={campaign.challenge.id}
          challengeTitle={campaign.title}
          brandName={campaign.brandName}
          dayId={(campaign.challenge as any).challenge_days?.[0]?.id || ''}
          dayNumber={1}
          dayTitle={(campaign.challenge as any).challenge_days?.[0]?.title || 'Día 1'}
          dayInstructions={(campaign.challenge as any).challenge_days?.[0]?.instructions}
          userProfileId={profile?.id}
          open={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          onSubmitted={handleApplied}
        />
      )}
    </div>
  )
}
