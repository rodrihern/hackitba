'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Campaign, ExchangeFormQuestion } from '@/lib/types'
import { createExchangeApplication, fetchExchangeFormQuestions } from '@/lib/services/user-service'

interface Props {
  campaign: Campaign | null
  userProfileId?: string
  open: boolean
  onClose: () => void
  onApplied: (campaignId: string) => void
}

function getAnswerPreview(question: ExchangeFormQuestion, value: string) {
  if (question.fieldType === 'long_text' && value.length > 120) {
    return `${value.slice(0, 120)}...`
  }

  return value
}

export default function ExchangeApplyModal({ campaign, userProfileId, open, onClose, onApplied }: Props) {
  const [questions, setQuestions] = useState<ExchangeFormQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const exchange = campaign?.exchange
  const hasApplied = Boolean(campaign?.currentUserApplicationStatus)

  useEffect(() => {
    if (!open || !exchange?.id) return
    const exchangeId = exchange.id

    let active = true

    async function loadQuestions() {
      setIsLoading(true)
      setError('')

      try {
        const data = await fetchExchangeFormQuestions(exchangeId)
        if (!active) return
        setQuestions(data)
        setAnswers(
          Object.fromEntries(data.map(question => [question.id, '']))
        )
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'No se pudo cargar el formulario')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadQuestions()

    return () => {
      active = false
    }
  }, [exchange?.id, open])

  const missingRequiredCount = useMemo(
    () => questions.filter(question => question.required && !answers[question.id]?.trim()).length,
    [answers, questions]
  )

  if (!open || !campaign || !exchange) return null

  const handleSubmit = async () => {
    if (!userProfileId) {
      setError('Necesitás iniciar sesión como creador para aplicar.')
      return
    }

    if (hasApplied) {
      setError('Ya aplicaste a este canje.')
      return
    }

    if (missingRequiredCount > 0) {
      setError('Completá todos los campos obligatorios antes de enviar.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await createExchangeApplication({
        exchangeId: exchange.id,
        userProfileId,
        answers: questions.map(question => ({
          questionId: question.id,
          answerText: answers[question.id]?.trim() || '',
        })),
      })

      onApplied(campaign.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la aplicación')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderQuestionField = (question: ExchangeFormQuestion) => {
    const commonClassName = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

    if (question.fieldType === 'long_text') {
      return (
        <textarea
          value={answers[question.id] || ''}
          onChange={(event) => setAnswers(prev => ({ ...prev, [question.id]: event.target.value }))}
          rows={4}
          className={`${commonClassName} resize-none`}
          placeholder="Escribí tu respuesta..."
        />
      )
    }

    if (question.fieldType === 'select') {
      return (
        <select
          value={answers[question.id] || ''}
          onChange={(event) => setAnswers(prev => ({ ...prev, [question.id]: event.target.value }))}
          className={commonClassName}
        >
          <option value="">Seleccioná una opción</option>
          {question.options.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )
    }

    if (question.fieldType === 'radio') {
      return (
        <div className="space-y-2">
          {question.options.map(option => (
            <label
              key={option}
              className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700"
            >
              <input
                type="radio"
                name={question.id}
                value={option}
                checked={answers[question.id] === option}
                onChange={(event) => setAnswers(prev => ({ ...prev, [question.id]: event.target.value }))}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      )
    }

    return (
      <input
        type="text"
        value={answers[question.id] || ''}
        onChange={(event) => setAnswers(prev => ({ ...prev, [question.id]: event.target.value }))}
        className={commonClassName}
        placeholder="Escribí tu respuesta..."
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4">
      <div className="mx-auto flex min-h-full max-w-2xl items-center justify-center">
        <div className="w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
          <div className="border-b border-gray-100 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  Aplicar a canje
                </div>
                <h2 className="text-xl font-bold text-gray-900">{campaign.title}</h2>
                <p className="mt-1 text-sm text-gray-500">{campaign.brandName}</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="space-y-5 px-6 py-6">
            <div className="rounded-2xl bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
              Respondé el formulario para que la marca pueda comparar perfiles y elegir hasta {exchange.slots} colaboraciones.
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
              </div>
            ) : (
              <>
                {questions.map(question => (
                  <div key={question.id} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-800">
                      {question.label}
                      {question.required && <span className="ml-1 text-red-500">*</span>}
                    </label>
                    {renderQuestionField(question)}
                    {answers[question.id]?.trim() && (
                      <p className="text-xs text-gray-400">
                        {getAnswerPreview(question, answers[question.id].trim())}
                      </p>
                    )}
                  </div>
                ))}

                {questions.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
                    Este canje todavía no tiene preguntas configuradas.
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-5">
            <p className="text-xs text-gray-400">
              {hasApplied
                ? 'Ya aplicaste a este canje.'
                : missingRequiredCount > 0
                ? `Faltan ${missingRequiredCount} respuestas obligatorias`
                : 'Tu formulario se guarda como una aplicación única para este canje'}
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
                disabled={isLoading || isSubmitting || hasApplied}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Enviando...' : hasApplied ? 'Ya aplicaste' : 'Enviar aplicación'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
