'use client'

import { useMemo, useState } from 'react'
import { X, Video, Link as LinkIcon } from 'lucide-react'
import { createChallengeSubmission } from '@/lib/services/user-service'
import { isValidVideoUrl, parseVideoUrl, getPlatformName } from '@/lib/utils/video-url-parser'

interface Props {
  challengeId: string
  challengeTitle: string
  brandName: string
  dayId: string
  dayNumber: number
  dayTitle: string
  dayInstructions?: string
  userProfileId?: string
  open: boolean
  onClose: () => void
  onSubmitted: () => void
}

export default function ChallengeSubmitModal({
  challengeId,
  challengeTitle,
  brandName,
  dayId,
  dayNumber,
  dayTitle,
  dayInstructions,
  userProfileId,
  open,
  onClose,
  onSubmitted,
}: Props) {
  const [videoUrl, setVideoUrl] = useState('')
  const [submissionUrl, setSubmissionUrl] = useState('')
  const [submissionText, setSubmissionText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const parsedVideoUrl = useMemo(() => {
    if (!videoUrl.trim()) return null
    return parseVideoUrl(videoUrl)
  }, [videoUrl])

  const hasContent = videoUrl.trim() || submissionUrl.trim() || submissionText.trim()

  if (!open) return null

  const handleSubmit = async () => {
    if (!userProfileId) {
      setError('Necesitás iniciar sesión para enviar tu entrega.')
      return
    }

    if (!hasContent) {
      setError('Agregá al menos un link, texto o video para tu entrega.')
      return
    }

    if (videoUrl.trim() && !isValidVideoUrl(videoUrl)) {
      setError('El link del video no es válido. Usá un link de Instagram, TikTok o YouTube.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await createChallengeSubmission({
        challengeId,
        dayId,
        userProfileId,
        videoUrl: videoUrl.trim() || undefined,
        submissionUrl: submissionUrl.trim() || undefined,
        submissionText: submissionText.trim() || undefined,
      })

      onSubmitted()
      onClose()
      
      // Reset form
      setVideoUrl('')
      setSubmissionUrl('')
      setSubmissionText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la entrega')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4">
      <div className="mx-auto flex min-h-full max-w-2xl items-center justify-center">
        <div className="w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
          <div className="border-b border-gray-100 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  Día {dayNumber}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{dayTitle}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {challengeTitle} • {brandName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-5 px-6 py-6">
            {dayInstructions && (
              <div className="rounded-2xl bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
                <p className="font-medium mb-1">Instrucciones:</p>
                <p>{dayInstructions}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-800">
                <Video className="inline-block mr-1.5 mb-0.5" size={16} />
                Link del video
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://www.instagram.com/p/... o https://www.tiktok.com/..."
              />
              {videoUrl.trim() && parsedVideoUrl && parsedVideoUrl.isValid && (
                <p className="text-xs text-green-600">
                  ✓ {getPlatformName(parsedVideoUrl.platform)} video detectado
                </p>
              )}
              {videoUrl.trim() && parsedVideoUrl && !parsedVideoUrl.isValid && (
                <p className="text-xs text-amber-600">
                  URL no reconocida. Asegurate de usar un link de Instagram, TikTok o YouTube.
                </p>
              )}
              <p className="text-xs text-gray-500">
                Agregá el link a tu video publicado para que la marca pueda ver tus resultados.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-800">
                <LinkIcon className="inline-block mr-1.5 mb-0.5" size={16} />
                Link adicional (opcional)
              </label>
              <input
                type="url"
                value={submissionUrl}
                onChange={(e) => setSubmissionUrl(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://..."
              />
              <p className="text-xs text-gray-500">
                Podés agregar otro link relevante (portafolio, artículo, etc.)
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-800">
                Descripción o notas (opcional)
              </label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Agregá contexto sobre tu entrega, métricas alcanzadas, o cualquier información relevante..."
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-5">
            <p className="text-xs text-gray-400">
              {hasContent
                ? 'Tu entrega será visible para la marca'
                : 'Agregá al menos un link o texto'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !hasContent}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar entrega'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
