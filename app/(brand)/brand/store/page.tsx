'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import RewardCard from '@/components/RewardCard'
import type { BrandProfile, Reward, RewardType } from '@/lib/types'

const rewardTypes: { value: RewardType; label: string }[] = [
  { value: 'product', label: 'Producto' },
  { value: 'discount', label: 'Descuento' },
  { value: 'experience', label: 'Experiencia' },
]

const defaultForm = {
  title: '',
  description: '',
  pointsCost: '',
  rewardType: 'product' as RewardType,
  image: '',
}

export default function BrandStorePage() {
  const { currentUser } = useAuth()
  const brand = currentUser?.profile as BrandProfile

  const [rewards, setRewards] = useState<Reward[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingReward, setEditingReward] = useState<Reward | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const fetchRewards = useCallback(async () => {
    if (!brand?.id) return

    try {
      const { data } = await supabase
        .from('rewards')
        .select('*')
        .eq('brand_id', brand.id)

      if (data) {
        setRewards(data.map(r => ({
          id: r.id,
          brandId: r.brand_id,
          title: r.title,
          description: r.description || '',
          pointsCost: r.points_cost,
          rewardType: r.reward_type,
          image: r.image || '',
        })))
      }
    } catch (err) {
      console.error('Error fetching rewards:', err)
    } finally {
      setIsLoading(false)
    }
  }, [brand?.id])

  useEffect(() => {
    fetchRewards()
  }, [fetchRewards])

  const openCreate = () => {
    setEditingReward(null)
    setForm(defaultForm)
    setSaveError('')
    setShowModal(true)
  }

  const openEdit = (reward: Reward) => {
    setEditingReward(reward)
    setForm({
      title: reward.title,
      description: reward.description,
      pointsCost: reward.pointsCost.toString(),
      rewardType: reward.rewardType,
      image: reward.image,
    })
    setSaveError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.pointsCost || !brand?.id) return
    setIsSaving(true)
    setSaveError('')

    try {
      if (editingReward) {
        const { error } = await supabase.from('rewards').update({
          title: form.title,
          description: form.description,
          points_cost: parseInt(form.pointsCost),
          reward_type: form.rewardType,
          image: form.image || null,
        }).eq('id', editingReward.id)

        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase.from('rewards').insert({
          brand_id: brand.id,
          title: form.title,
          description: form.description,
          points_cost: parseInt(form.pointsCost),
          reward_type: form.rewardType,
          image: form.image || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400',
        })

        if (error) throw new Error(error.message)
      }

      await fetchRewards()
      setShowModal(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('rewards').delete().eq('id', id)
      setRewards(prev => prev.filter(r => r.id !== id))
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Error deleting reward:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Tienda de Recompensas</h1>
          <p className="text-gray-500">Configurá los premios que los creadores pueden canjear con sus puntos</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-indigo-600 text-white font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors text-sm flex items-center gap-2"
        >
          <span>+</span> Agregar Reward
        </button>
      </div>

      {rewards.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-4">🎁</div>
          <p className="font-medium text-gray-600 mb-1">Sin rewards configurados</p>
          <p className="text-sm text-gray-400 mb-4">Agregá recompensas para motivar a tus creadores</p>
          <button
            onClick={openCreate}
            className="bg-indigo-600 text-white font-medium px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-sm"
          >
            Crear primer reward
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {rewards.map(reward => (
            <div key={reward.id} className="relative group">
              <RewardCard reward={reward} />
              {/* Edit/Delete overlay */}
              <div className="absolute top-3 left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(reward)}
                  className="bg-white text-gray-700 text-xs font-medium px-2.5 py-1 rounded-lg shadow-md hover:bg-gray-50 border border-gray-200"
                >
                  Editar
                </button>
                <button
                  onClick={() => setDeleteConfirm(reward.id)}
                  className="bg-white text-red-600 text-xs font-medium px-2.5 py-1 rounded-lg shadow-md hover:bg-red-50 border border-red-100"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-5">
              {editingReward ? 'Editar reward' : 'Nuevo reward'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Ej: Nike Air Max 2025"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe el reward..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de reward</label>
                <div className="flex gap-2">
                  {rewardTypes.map(rt => (
                    <button
                      key={rt.value}
                      onClick={() => setForm(p => ({ ...p, rewardType: rt.value }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                        form.rewardType === rt.value
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                      }`}
                    >
                      {rt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Costo en puntos *</label>
                <input
                  type="number"
                  value={form.pointsCost}
                  onChange={(e) => setForm(p => ({ ...p, pointsCost: e.target.value }))}
                  placeholder="5000"
                  min={1}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de imagen (opcional)</label>
                <input
                  type="url"
                  value={form.image}
                  onChange={(e) => setForm(p => ({ ...p, image: e.target.value }))}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {saveError && (
              <div className="mt-3 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
                {saveError}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!form.title || !form.pointsCost || isSaving}
                className="flex-1 bg-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </span>
                ) : editingReward ? 'Guardar cambios' : 'Crear reward'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar reward</h3>
            <p className="text-gray-500 mb-5 text-sm">¿Estás seguro que querés eliminar este reward? Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-500 text-white font-semibold py-2.5 rounded-xl hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
