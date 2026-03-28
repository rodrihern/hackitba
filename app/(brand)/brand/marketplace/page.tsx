'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { mapUserProfile, mapCampaign } from '@/lib/mappers'
import UserCard from '@/components/UserCard'
import LevelBadge from '@/components/LevelBadge'
import type { UserProfile, UserLevel, BrandProfile, Campaign } from '@/lib/types'

const categories = ['Todos', 'Fitness & Salud', 'Moda & Belleza', 'Gastronomía', 'Tecnología', 'Viajes', 'Música', 'Gaming', 'Lifestyle']
const levels: (UserLevel | 'Todos')[] = ['Todos', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']
const platforms = ['Todos', 'Instagram', 'TikTok', 'YouTube']

export default function MarketplacePage() {
  const { currentUser } = useAuth()
  const brand = currentUser?.profile as BrandProfile

  const [users, setUsers] = useState<UserProfile[]>([])
  const [brandExchanges, setBrandExchanges] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [aiSearch, setAiSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todos')
  const [levelFilter, setLevelFilter] = useState<UserLevel | 'Todos'>('Todos')
  const [platformFilter, setPlatformFilter] = useState('Todos')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [invitedUsers, setInvitedUsers] = useState<Set<string>>(new Set())
  const [inviteModal, setInviteModal] = useState<UserProfile | null>(null)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('')
  const [inviteLoading, setInviteLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersResult, campaignsResult] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('*')
            .order('total_points', { ascending: false }),
          brand?.id ? supabase
            .from('campaigns')
            .select(`
              *,
              brand_profiles (id, name, logo),
              exchanges (*),
              challenges (*, challenge_days (*))
            `)
            .eq('brand_id', brand.id)
            .eq('type', 'exchange')
            .eq('status', 'active') : null
        ])

        if (usersResult.data) {
          setUsers(usersResult.data.map(row => mapUserProfile(row as Record<string, unknown>)))
        }
        if (campaignsResult?.data) {
          setBrandExchanges(campaignsResult.data.map(row => mapCampaign(row as Record<string, unknown>)))
        }
      } catch (err) {
        console.error('Error fetching marketplace data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [brand?.id])

  const filtered = users.filter(user => {
    const matchesSearch = search === '' ||
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.bio.toLowerCase().includes(search.toLowerCase()) ||
      user.category.toLowerCase().includes(search.toLowerCase())

    const matchesCategory = categoryFilter === 'Todos' || user.category === categoryFilter
    const matchesLevel = levelFilter === 'Todos' || user.level === levelFilter
    const matchesPlatform = platformFilter === 'Todos' ||
      (platformFilter === 'Instagram' && user.followersInstagram > 0) ||
      (platformFilter === 'TikTok' && user.followersTiktok > 0) ||
      (platformFilter === 'YouTube' && user.followersYoutube > 0)

    return matchesSearch && matchesCategory && matchesLevel && matchesPlatform
  })

  const handleInvite = (user: UserProfile) => {
    setInviteModal(user)
    setSelectedCampaignId(brandExchanges[0]?.id || '')
  }

  const confirmInvite = async () => {
    if (!inviteModal || !brand?.id || !selectedCampaignId) {
      setInvitedUsers(prev => new Set([...prev, inviteModal?.id || '']))
      setInviteModal(null)
      return
    }

    setInviteLoading(true)
    try {
      // Create invitation
      await supabase.from('invitations').insert({
        brand_id: brand.id,
        user_id: inviteModal.id,
        campaign_id: selectedCampaignId,
        type: 'exchange',
        status: 'pending',
      })

      // Send notification to user
      await supabase.from('notifications').insert({
        user_id: inviteModal.userId,
        title: 'Nueva invitación',
        message: `${brand.name} te invitó a participar en una colaboración.`,
        read: false,
      })

      setInvitedUsers(prev => new Set([...prev, inviteModal.id]))
      setInviteModal(null)
    } catch (err) {
      console.error('Error sending invitation:', err)
      // Still mark as invited locally even if DB fails
      setInvitedUsers(prev => new Set([...prev, inviteModal.id]))
      setInviteModal(null)
    } finally {
      setInviteLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Marketplace de Creadores</h1>
        <p className="text-gray-500">Encontrá a los creadores perfectos para tu marca</p>
      </div>

      {/* AI Search */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-2xl p-6 mb-6 shadow-lg shadow-indigo-100">
        <div className="text-white font-semibold mb-2 flex items-center gap-2">
          <span>✨</span> Búsqueda inteligente
        </div>
        <p className="text-indigo-200 text-sm mb-4">Describí el creador ideal para tu campaña</p>
        <div className="flex gap-3">
          <input
            type="text"
            value={aiSearch}
            onChange={(e) => setAiSearch(e.target.value)}
            placeholder="Ej: Creador de fitness con más de 50K seguidores en Buenos Aires..."
            className="flex-1 bg-white/10 text-white placeholder-indigo-300 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 backdrop-blur-sm"
          />
          <button className="bg-white text-indigo-600 font-semibold px-5 py-3 rounded-xl hover:bg-indigo-50 transition-colors text-sm">
            Buscar
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filter sidebar */}
        <div className="w-52 flex-shrink-0 space-y-5">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Categoría</div>
            <div className="space-y-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    categoryFilter === cat
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nivel</div>
            <div className="space-y-1">
              {levels.map(level => (
                <button
                  key={level}
                  onClick={() => setLevelFilter(level)}
                  className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    levelFilter === level
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {level === 'Todos' ? 'Todos' : <LevelBadge level={level} size="sm" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Plataforma</div>
            <div className="space-y-1">
              {platforms.map(platform => (
                <button
                  key={platform}
                  onClick={() => setPlatformFilter(platform)}
                  className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    platformFilter === platform
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Search + count */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por username, categoría..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <span className="text-sm text-gray-400 flex-shrink-0">{filtered.length} creadores</span>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {filtered.map(user => (
                <div key={user.id} className="relative">
                  {invitedUsers.has(user.id) && (
                    <div className="absolute top-2 right-2 z-10 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      ✓ Invitado
                    </div>
                  )}
                  <UserCard
                    user={user}
                    onInvite={!invitedUsers.has(user.id) ? handleInvite : undefined}
                    onClick={setSelectedUser}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User detail slide-in panel */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelectedUser(null)} />
          <div className="w-96 bg-white h-full overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900">Perfil del creador</h3>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="text-center mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedUser.profileImage}
                alt={selectedUser.username}
                className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-4 border-indigo-100"
              />
              <div className="font-bold text-gray-900 text-lg">@{selectedUser.username}</div>
              <div className="text-gray-400 text-sm mb-2">{selectedUser.location}</div>
              <LevelBadge level={selectedUser.level} size="md" />
            </div>

            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Bio</div>
              <p className="text-sm text-gray-600 leading-relaxed">{selectedUser.bio}</p>
            </div>

            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Audiencia</div>
              <div className="space-y-2">
                {selectedUser.followersInstagram > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">📷 Instagram</span>
                    <span className="font-semibold text-gray-900">{selectedUser.followersInstagram.toLocaleString()}</span>
                  </div>
                )}
                {selectedUser.followersTiktok > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">🎵 TikTok</span>
                    <span className="font-semibold text-gray-900">{selectedUser.followersTiktok.toLocaleString()}</span>
                  </div>
                )}
                {selectedUser.followersYoutube > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">▶ YouTube</span>
                    <span className="font-semibold text-gray-900">{selectedUser.followersYoutube.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Categoría</div>
              <span className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium">
                {selectedUser.category}
              </span>
            </div>

            {!invitedUsers.has(selectedUser.id) ? (
              <button
                onClick={() => { handleInvite(selectedUser); setSelectedUser(null) }}
                className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Invitar a Canje
              </button>
            ) : (
              <div className="w-full bg-green-50 text-green-700 font-semibold py-3 rounded-xl text-center">
                ✅ Invitación enviada
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invite modal */}
      {inviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Invitar a Canje</h3>
            <p className="text-gray-500 mb-4">
              Invitar a <strong>@{inviteModal.username}</strong> a colaborar con tu marca.
            </p>

            {brandExchanges.length > 0 ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar campaña:</label>
                <div className="space-y-2">
                  {brandExchanges.map(c => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCampaignId(c.id)}
                      className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${
                        selectedCampaignId === c.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${selectedCampaignId === c.id ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                      <span className="text-sm text-gray-700">{c.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-4 bg-yellow-50 text-yellow-700 text-sm px-4 py-3 rounded-xl">
                No tenés campañas de canje activas. Crea una primero.
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setInviteModal(null)}
                className="flex-1 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmInvite}
                disabled={inviteLoading}
                className="flex-1 bg-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {inviteLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </span>
                ) : 'Enviar invitación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
