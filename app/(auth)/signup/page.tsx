'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import type { UserRole } from '@/lib/types'

export default function SignupPage() {
  const [role, setRole] = useState<UserRole>('user')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  // User fields
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [category, setCategory] = useState('Lifestyle')
  const [location, setLocation] = useState('Buenos Aires, AR')
  const [followersInstagram, setFollowersInstagram] = useState('')
  const [followersTiktok, setFollowersTiktok] = useState('')
  // Brand fields
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('Moda & Lifestyle')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const router = useRouter()

  // Read role from sessionStorage when component mounts
  useEffect(() => {
    const savedRole = sessionStorage.getItem('signup_role') as UserRole | null
    if (savedRole === 'user' || savedRole === 'brand') {
      setRole(savedRole)
      // Clear the sessionStorage after reading
      sessionStorage.removeItem('signup_role')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    const result = await signup({
      email,
      password,
      role,
      username,
      bio,
      category,
      location,
      followersInstagram: parseInt(followersInstagram) || 0,
      followersTiktok: parseInt(followersTiktok) || 0,
      companyName,
      industry,
    })

    if (result.success) {
      // Redirect to landing, which will redirect based on role after auth settles
      setTimeout(() => {
        router.push('/')
      }, 500)
    } else {
      setError(result.error || 'Error al registrarse')
      setLoading(false)
    }
  }

  const categories = ['Fitness & Salud', 'Moda & Belleza', 'Gastronomía', 'Tecnología', 'Viajes', 'Música', 'Gaming', 'Lifestyle']
  const industries = ['Moda & Lifestyle', 'Deportes', 'Tecnología', 'Gastronomía', 'Belleza', 'Música & Entretenimiento', 'Otro']

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">CS</span>
            </div>
            <span className="font-bold text-gray-900 text-xl">CollabSpace</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Crear cuenta</h1>
          <p className="text-gray-500 mt-1">Unite a la comunidad</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Role Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {(['user', 'brand'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  role === r
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {r === 'user' ? 'Creador' : 'Marca'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetí tu contraseña"
                minLength={6}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* User-specific fields */}
            {role === 'user' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="@tuusername"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Contanos sobre vos..."
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  >
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seguidores IG</label>
                    <input
                      type="number"
                      value={followersInstagram}
                      onChange={(e) => setFollowersInstagram(e.target.value)}
                      placeholder="10000"
                      min={0}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seguidores TikTok</label>
                    <input
                      type="number"
                      value={followersTiktok}
                      onChange={(e) => setFollowersTiktok(e.target.value)}
                      placeholder="10000"
                      min={0}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Brand-specific fields */}
            {role === 'brand' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la empresa</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Mi Empresa S.A."
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industria</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  >
                    {industries.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creando cuenta...
                </span>
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="text-indigo-600 font-medium hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
