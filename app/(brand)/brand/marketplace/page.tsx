'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { fetchMarketplaceData, inviteUserToExchange } from '@/lib/services/brand-service'
import UserCard from '@/components/UserCard'
import LevelBadge from '@/components/LevelBadge'
import { FilterChip, FilterGroup } from '@/components/FilterChip'
import type { UserProfile, UserLevel, BrandProfile, Campaign } from '@/lib/types'

const categories = ['Todos', 'Fitness & Salud', 'Moda & Belleza', 'Gastronomía', 'Tecnología', 'Viajes', 'Música', 'Gaming', 'Lifestyle']
const levels: (UserLevel | 'Todos')[] = ['Todos', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']
const platforms = ['Todos', 'Instagram', 'TikTok', 'YouTube']

function toggleFilterWithTodos<T>(currentFilter: Set<T>, selectedItem: T, isTodos: boolean): Set<T> {
  const newFilter = new Set(currentFilter)
  
  if (newFilter.has(selectedItem)) {
    // If already selected, deselect it
    newFilter.delete(selectedItem)
    // If we just removed something specific and now it's empty, add "Todos"
    if (!isTodos && newFilter.size === 0) {
      newFilter.add('Todos' as T)
    }
  } else {
    // If not selected, select it
    if (isTodos) {
      // If "Todos" is selected, clear everything and add only "Todos"
      newFilter.clear()
      newFilter.add('Todos' as T)
    } else {
      // If a specific option is selected, remove "Todos"
      newFilter.delete('Todos' as T)
      newFilter.add(selectedItem)
    }
  }
  
  return newFilter
}

function isVisuallySelected<T>(filter: Set<T>, item: T, isTodos: boolean): boolean {
  if (isTodos) {
    // "Todos" is visually selected if it's in the logical state
    return filter.has(item)
  } else {
    // If "Todos" is in the logical state, all items are visually selected
    if (filter.has('Todos' as T)) {
      return true
    }
    // Otherwise, only items in the logical state are visually selected
    return filter.has(item)
  }
}

export default function MarketplacePage() {
  const { currentUser } = useAuth()
  const brand = currentUser?.profile as BrandProfile

  const [users, setUsers] = useState<UserProfile[]>([])
  const [brandExchanges, setBrandExchanges] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set(['Todos']))
  const [levelFilter, setLevelFilter] = useState<Set<UserLevel | 'Todos'>>(new Set(['Todos']))
  const [platformFilter, setPlatformFilter] = useState<Set<string>>(new Set(['Todos']))
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [invitedUsers, setInvitedUsers] = useState<Set<string>>(new Set())
  const [inviteModal, setInviteModal] = useState<UserProfile | null>(null)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('')
  const [inviteLoading, setInviteLoading] = useState(false)

  const toggleCategoryFilter = (cat: string) => {
    setCategoryFilter(toggleFilterWithTodos(categoryFilter, cat, cat === 'Todos'))
  }

  const toggleLevelFilter = (level: UserLevel | 'Todos') => {
    setLevelFilter(toggleFilterWithTodos(levelFilter, level, level === 'Todos'))
  }

  const togglePlatformFilter = (platform: string) => {
    setPlatformFilter(toggleFilterWithTodos(platformFilter, platform, platform === 'Todos'))
  }

  const loadMarketplace = useCallback(async () => {
    try {
      const { users, brandExchanges } = await fetchMarketplaceData(brand?.id)
      setUsers(users)
      setBrandExchanges(brandExchanges)
      setLoadError('')
    } catch (err) {
      console.error('Error fetching marketplace data:', err)
      setUsers([])
      setBrandExchanges([])
      setLoadError(err instanceof Error ? err.message : 'No se pudo cargar el marketplace')
    } finally {
      setIsLoading(false)
    }
  }, [brand?.id])

  useEffect(() => {
    async function fetchData() {
      setLoadError('')
      await loadMarketplace()
    }

    fetchData()
  }, [loadMarketplace])

  const filtered = users.filter(user => {
    const matchesSearch = search === '' ||
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.bio.toLowerCase().includes(search.toLowerCase()) ||
      user.category.toLowerCase().includes(search.toLowerCase())

    const matchesCategory = categoryFilter.has('Todos') || categoryFilter.has(user.category)
    const matchesLevel = levelFilter.has('Todos') || levelFilter.has(user.level)
    const matchesPlatform = platformFilter.has('Todos') ||
      (platformFilter.has('Instagram') && user.followersInstagram > 0) ||
      (platformFilter.has('TikTok') && user.followersTiktok > 0) ||
      (platformFilter.has('YouTube') && user.followersYoutube > 0)

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
      await inviteUserToExchange({
        brandId: brand.id,
        userProfileId: inviteModal.id,
        userAuthId: inviteModal.userId,
        campaignId: selectedCampaignId,
        brandName: brand.name,
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

      <div className="flex gap-8">
        {/* Filter sidebar */}
        <div className="w-56 flex-shrink-0">
          <div className="sticky top-8 space-y-8 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <FilterGroup title="Categoría">
              <div className="flex flex-wrap gap-2.5">
                {categories.map(cat => (
                  <FilterChip
                    key={cat}
                    label={cat}
                    selected={categoryFilter.has(cat)}
                    visualSelected={isVisuallySelected(categoryFilter, cat, cat === 'Todos')}
                    onChange={() => toggleCategoryFilter(cat)}
                    variant="category"
                  />
                ))}
              </div>
            </FilterGroup>

            <div className="h-px bg-gray-100" />

            <FilterGroup title="Nivel">
              <div className="flex flex-wrap gap-2">
                {levels.map(level => (
                  <FilterChip
                    key={level}
                    label={level === 'Todos' ? 'Todos' : <LevelBadge level={level} size="sm" />}
                    selected={levelFilter.has(level)}
                    visualSelected={isVisuallySelected(levelFilter, level, level === 'Todos')}
                    onChange={() => toggleLevelFilter(level)}
                    variant={level === 'Todos' ? 'default' : 'badge'}
                  />
                ))}
              </div>
            </FilterGroup>

            <div className="h-px bg-gray-100" />

            <FilterGroup title="Plataforma">
              <div className="flex flex-wrap gap-2">
                {platforms.map(platform => (
                  <FilterChip
                    key={platform}
                    label={platform}
                    selected={platformFilter.has(platform)}
                    visualSelected={isVisuallySelected(platformFilter, platform, platform === 'Todos')}
                    onChange={() => togglePlatformFilter(platform)}
                  />
                ))}
              </div>
            </FilterGroup>
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
          ) : loadError ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
              <p className="text-sm text-red-600 mb-4">No se pudo cargar el marketplace: {loadError}</p>
              <button
                onClick={() => {
                  setIsLoading(true)
                  void loadMarketplace()
                }}
                className="bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-red-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-4">🔎</div>
              <p className="font-medium text-gray-600 mb-1">No encontramos creadores</p>
              <p className="text-sm text-gray-400">Probá ajustando filtros o limpiando la búsqueda.</p>
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
