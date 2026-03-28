'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import type { UserRole } from '@/lib/types'

function sanitizeUsername(value: string): string {
  // Keep usernames URL/mention friendly: lowercase + alnum + dot + underscore.
  return value
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')
    .slice(0, 30)
}

export default function SignupPage() {
  const [role, setRole] = useState<UserRole>('user')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  // User fields
  const [username, setUsername] = useState('')
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

    if (role === 'user' && !username.trim()) {
      setError('El username es obligatorio')
      setLoading(false)
      return
    }

    const normalizedUsername = sanitizeUsername(username)
    if (role === 'user' && (normalizedUsername.length < 3 || normalizedUsername.length > 30)) {
      setError('El username debe tener entre 3 y 30 caracteres válidos')
      setLoading(false)
      return
    }

    try {
      const result = await Promise.race([
        signup({
          email,
          password,
          role,
          username: normalizedUsername,
          companyName,
          industry,
        }),
        new Promise<{ success: boolean; error?: string }>((resolve) => {
          setTimeout(() => {
            resolve({
              success: false,
              error: 'El registro está tardando demasiado. Intentá de nuevo en unos segundos.',
            })
          }, 12000)
        }),
      ])

      if (result.success) {
        setLoading(false)
        router.replace(role === 'brand' ? '/brand/dashboard' : '/home')
        return
      }

      setError(result.error || 'Error al registrarse')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado al registrarse')
    } finally {
      setLoading(false)
    }
  }

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
                    onChange={(e) => setUsername(sanitizeUsername(e.target.value))}
                    placeholder="Nombre de usuario"
                    minLength={3}
                    maxLength={30}
                    pattern="^[a-z0-9._]{3,30}$"
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                  <p className="mt-1 text-xs text-gray-500">Solo letras minúsculas, números, punto y guion bajo (3-30).</p>
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
