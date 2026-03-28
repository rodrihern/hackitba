'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { UserRole, UserProfile, BrandProfile } from './types'
import type { Session } from '@supabase/supabase-js'
import {
  ensureRoleProfile,
  fetchAuthUserData,
  fetchAuthUserDataWithRoleHint,
  getAuthSession,
  onAuthStateChanged,
  signInWithPassword,
  signOutAuth,
  signUpAuth,
  updateBrandProfileById,
  updateUserProfileById,
  type AuthUser,
} from '@/lib/services/auth-service'

interface SignupData {
  email: string
  password: string
  role: UserRole
  username?: string
  companyName?: string
  industry?: string
}

interface AuthContextType {
  currentUser: AuthUser | null
  isLoading: boolean
  session: Session | null
  authError: string | null
  login: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>
  logout: (redirectTo?: string) => Promise<void>
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>
  updateProfile: (updates: Partial<UserProfile | BrandProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

function clearClientAuthArtifacts() {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem('signup_role')
    sessionStorage.removeItem('signup_role')

    // Best-effort cleanup for Supabase persisted auth artifacts.
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key)
      }
    })

    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('sb-')) {
        sessionStorage.removeItem(key)
      }
    })

    // Clear non-httpOnly cookies that may hold client-side auth metadata.
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0]?.trim()
      if (!name) return
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`
    })
  } catch (err) {
    console.error('Error clearing local auth artifacts:', err)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  const resolveSessionUser = async (activeSession: Session | null) => {
    setSession(activeSession)

    if (!activeSession?.user) {
      setCurrentUser(null)
      setAuthError(null)
      return
    }

    try {
      const roleHint = activeSession.user.user_metadata?.role
      let userData = await fetchAuthUserDataWithRoleHint(activeSession.user.id, roleHint)

      if (!userData) {
        const repaired = await ensureRoleProfile({
          id: activeSession.user.id,
          email: activeSession.user.email,
          role: roleHint,
          username: activeSession.user.user_metadata?.username,
          companyName: activeSession.user.user_metadata?.companyName,
          industry: activeSession.user.user_metadata?.industry,
        })

        if (repaired) {
          userData = await fetchAuthUserDataWithRoleHint(activeSession.user.id, roleHint)
        }
      }

      if (!userData) {
        setCurrentUser(null)
        setAuthError(
          'Hay una sesión válida en Supabase, pero no existe un perfil usable en la base. Revisá que Vercel apunte al proyecto correcto y que la migración supabase/migrations/202611010001_auth_profile_bootstrap.sql esté aplicada.'
        )
        return
      }

      setCurrentUser(userData)
      setAuthError(null)
    } catch (err) {
      setCurrentUser(null)
      setAuthError(err instanceof Error ? err.message : 'No se pudo cargar la sesión actual')
      throw err
    }
  }

  useEffect(() => {
    // Safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Auth session loading timed out after 10 seconds')
      setIsLoading(false)
    }, 10000)

    // Get initial session
    getAuthSession()
      .then(async ({ data: { session } }) => {
        await resolveSessionUser(session)
      })
      .catch((err) => {
        console.error('Error loading auth session:', err)
      })
      .finally(() => {
        clearTimeout(timeoutId)
        setIsLoading(false)
      })

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChanged(async (_event, session) => {
      try {
        await resolveSessionUser(session)
      } catch (err) {
        console.error('Error loading auth state change:', err)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
    setAuthError(null)
    const { data, error } = await signInWithPassword(email, password)
    if (error) return { success: false, error: error.message }
    if (!data.user) return { success: false, error: 'No se pudo iniciar sesión' }

    const roleHint = data.user.user_metadata?.role
    let userData = await fetchAuthUserDataWithRoleHint(data.user.id, roleHint)

    if (!userData) {
      try {
        const repaired = await ensureRoleProfile({
          id: data.user.id,
          email: data.user.email,
          role: roleHint,
          username: data.user.user_metadata?.username,
          companyName: data.user.user_metadata?.companyName,
          industry: data.user.user_metadata?.industry,
        })

        if (repaired) {
          userData = await fetchAuthUserDataWithRoleHint(data.user.id, roleHint)
        }
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'No se pudo crear el perfil' }
      }
    }

    if (!userData) {
      return {
        success: false,
        error: 'La cuenta existe pero no tiene perfil de app. Falta configurar trigger/policies en Supabase para crear profile al registrarse.',
      }
    }
    setCurrentUser(userData)
    setAuthError(null)
    return { success: true, role: userData.role }
  }

  const logout = async (redirectTo = '/login') => {
    try {
      await signOutAuth()
    } catch (err) {
      console.error('Error during sign out:', err)
    } finally {
      // Always clear in-memory and client-side state, even if remote sign-out fails.
      setCurrentUser(null)
      setSession(null)
      setAuthError(null)
      clearClientAuthArtifacts()

      if (typeof window !== 'undefined' && window.location.pathname !== redirectTo) {
        window.location.assign(redirectTo)
      }
    }
  }

  const signup = async (data: SignupData): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: authData, error } = await signUpAuth({
        email: data.email,
        password: data.password,
        role: data.role,
        username: data.username,
        companyName: data.companyName,
        industry: data.industry,
      })

      if (error) {
        if (error.message.toLowerCase().includes('database error saving new user')) {
          return {
            success: false,
            error:
              'Supabase no pudo crear el usuario porque falló el trigger de perfiles. Ejecutá la migración supabase/migrations/202611010001_auth_profile_bootstrap.sql en tu proyecto de Supabase.',
          }
        }

        return { success: false, error: error.message }
      }
      if (!authData.user) return { success: false, error: 'No se pudo crear el usuario' }

      if (authData.session?.user) {
        try {
          await ensureRoleProfile({
            id: authData.user.id,
            email: authData.user.email,
            role: data.role,
            username: data.username,
            companyName: data.companyName,
            industry: data.industry,
          })
        } catch (profileErr) {
          return {
            success: false,
            error: profileErr instanceof Error ? profileErr.message : 'No se pudo crear el perfil inicial',
          }
        }
      }

      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Error inesperado al registrarse' }
    }
  }

  const updateProfile = async (updates: Partial<UserProfile | BrandProfile>) => {
    if (!currentUser || !session?.user) return

    if (currentUser.role === 'user') {
      const userProfile = currentUser.profile as UserProfile
      const dbUpdates: Record<string, unknown> = {}
      if ('username' in updates) dbUpdates.username = updates.username
      if ('bio' in updates) dbUpdates.bio = updates.bio
      if ('location' in updates) dbUpdates.location = updates.location
      if ('instagramUrl' in updates) dbUpdates.instagram_url = (updates as UserProfile).instagramUrl
      if ('tiktokUrl' in updates) dbUpdates.tiktok_url = (updates as UserProfile).tiktokUrl
      if ('youtubeUrl' in updates) dbUpdates.youtube_url = (updates as UserProfile).youtubeUrl

      await updateUserProfileById(userProfile.id, dbUpdates)
      const refreshed = await fetchAuthUserData(session.user.id)
      setCurrentUser(refreshed)
    }

    if (currentUser.role === 'brand') {
      const brandProfile = currentUser.profile as BrandProfile
      const dbUpdates: Record<string, unknown> = {}
      if ('name' in updates) dbUpdates.name = updates.name
      if ('description' in updates) dbUpdates.description = updates.description

      await updateBrandProfileById(brandProfile.id, dbUpdates)
      const refreshed = await fetchAuthUserData(session.user.id)
      setCurrentUser(refreshed)
    }
  }

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, session, authError, login, logout, signup, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function useUserProfile(): UserProfile {
  const { currentUser } = useAuth()
  return currentUser?.profile as UserProfile
}

export function useBrandProfile(): BrandProfile {
  const { currentUser } = useAuth()
  return currentUser?.profile as BrandProfile
}
