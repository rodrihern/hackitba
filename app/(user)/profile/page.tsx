'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import LevelBadge from '@/components/LevelBadge'
import type { UserProfile } from '@/lib/types'

function formatFollowers(n: number) {
  if (n === 0) return '0'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return n.toString()
}

export default function ProfilePage() {
  const { currentUser, updateProfile } = useAuth()
  const profile = currentUser?.profile as UserProfile

  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(profile?.username || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [location, setLocation] = useState(profile?.location || '')
  const [instagramUrl, setInstagramUrl] = useState(profile?.instagramUrl || '')
  const [tiktokUrl, setTiktokUrl] = useState(profile?.tiktokUrl || '')
  const [youtubeUrl, setYoutubeUrl] = useState(profile?.youtubeUrl || '')
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    await updateProfile({ username, bio, location, instagramUrl, tiktokUrl, youtubeUrl })
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleCancel = () => {
    setUsername(profile?.username || '')
    setBio(profile?.bio || '')
    setLocation(profile?.location || '')
    setInstagramUrl(profile?.instagramUrl || '')
    setTiktokUrl(profile?.tiktokUrl || '')
    setYoutubeUrl(profile?.youtubeUrl || '')
    setEditing(false)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Mi Perfil</h1>
          <p className="text-gray-500">Administrá tu información pública</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="bg-indigo-600 text-white font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors text-sm"
          >
            Editar perfil
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="border border-gray-200 text-gray-700 font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="bg-indigo-600 text-white font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors text-sm"
            >
              Guardar cambios
            </button>
          </div>
        )}
      </div>

      {saved && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          ✅ Perfil actualizado correctamente
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Cover */}
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-violet-600" />

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile?.profileImage}
                alt={profile?.username}
                className="w-24 h-24 rounded-2xl border-4 border-white object-cover shadow-md"
              />
            </div>
            <LevelBadge level={profile?.level ?? 'Bronze'} size="lg" />
          </div>

          {/* Username + bio */}
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">@{profile?.username}</h2>
              <p className="text-gray-500 mt-1 leading-relaxed">{profile?.bio}</p>
              <p className="text-sm text-gray-400 mt-1">📍 {profile?.location}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 my-5 py-4 border-y border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-extrabold text-indigo-600">{profile?.totalPoints?.toLocaleString()}</div>
              <div className="text-xs text-gray-400">Puntos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold text-gray-900">
                {formatFollowers((profile?.followersInstagram || 0) + (profile?.followersTiktok || 0) + (profile?.followersYoutube || 0))}
              </div>
              <div className="text-xs text-gray-400">Seguidores totales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold text-gray-900">{profile?.level}</div>
              <div className="text-xs text-gray-400">Nivel</div>
            </div>
          </div>

          {/* Social links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Redes sociales</h3>
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Instagram URL</label>
                  <input
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">TikTok URL</label>
                  <input
                    type="url"
                    value={tiktokUrl}
                    onChange={(e) => setTiktokUrl(e.target.value)}
                    placeholder="https://tiktok.com/@..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">YouTube URL</label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/@..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  { label: 'Instagram', url: profile?.instagramUrl, followers: profile?.followersInstagram, icon: '📷', color: 'text-pink-600' },
                  { label: 'TikTok', url: profile?.tiktokUrl, followers: profile?.followersTiktok, icon: '🎵', color: 'text-gray-900' },
                  { label: 'YouTube', url: profile?.youtubeUrl, followers: profile?.followersYoutube, icon: '▶', color: 'text-red-600' },
                ].map(social => (
                  <div key={social.label} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className={`${social.color}`}>{social.icon}</span>
                      <span className="text-sm font-medium text-gray-700">{social.label}</span>
                      {social.url && (
                        <a href={social.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline truncate max-w-40">
                          {social.url.replace('https://', '')}
                        </a>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {formatFollowers(social.followers || 0)} seguidores
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
