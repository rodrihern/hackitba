'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { UserRole, UserProfile, BrandProfile } from './types'
import type { Session } from '@supabase/supabase-js'
import {
  ensureRoleProfile,
  fetchAuthUserData,
  fetchAuthUserDataWithRoleHint,
  getAuthSession,
  insertBrandProfile,
  insertUserProfile,
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
  bio?: string
  followersInstagram?: number
  followersTiktok?: number
  category?: string
  location?: string
  companyName?: string
  industry?: string
}

interface AuthContextType {
  currentUser: AuthUser | null
  isLoading: boolean
  session: Session | null
  login: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>
  logout: () => Promise<void>
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>
  updateProfile: (updates: Partial<UserProfile | BrandProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    getAuthSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        const roleHint = session.user.user_metadata?.role
        let userData = await fetchAuthUserDataWithRoleHint(session.user.id, roleHint)

        if (!userData) {
          try {
            const repaired = await ensureRoleProfile({
              id: session.user.id,
              email: session.user.email,
              role: roleHint,
              companyName: session.user.user_metadata?.companyName,
              industry: session.user.user_metadata?.industry,
            })
            if (repaired) {
              userData = await fetchAuthUserDataWithRoleHint(session.user.id, roleHint)
            }
          } catch (err) {
            console.error('Error repairing missing profile on session restore:', err)
          }
        }

        setCurrentUser(userData)
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChanged(async (_event, session) => {
      setSession(session)
      if (session?.user) {
        const roleHint = session.user.user_metadata?.role
        let userData = await fetchAuthUserDataWithRoleHint(session.user.id, roleHint)

        if (!userData) {
          try {
            const repaired = await ensureRoleProfile({
              id: session.user.id,
              email: session.user.email,
              role: roleHint,
              companyName: session.user.user_metadata?.companyName,
              industry: session.user.user_metadata?.industry,
            })
            if (repaired) {
              userData = await fetchAuthUserDataWithRoleHint(session.user.id, roleHint)
            }
          } catch (err) {
            console.error('Error repairing missing profile on auth change:', err)
          }
        }

        setCurrentUser(userData)
      } else {
        setCurrentUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
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
    return { success: true, role: userData.role }
  }

  const logout = async () => {
    // Clear local auth state immediately so UI reacts even if network sign-out fails.
    setCurrentUser(null)
    setSession(null)

    try {
      await signOutAuth()
    } catch (err) {
      console.error('Error during sign out:', err)
    } finally {
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.assign('/')
      }
    }
  }

  const signup = async (data: SignupData): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: authData, error } = await signUpAuth(data.email, data.password, data.role)

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

      const userId = authData.user.id

      // Avoid blocking signup UI on profile bootstrap. If this fails, login/session
      // repair path (ensureRoleProfile) will recreate missing role profiles.
      if (authData.session?.user) {
        void (async () => {
          if (data.role === 'user') {
            const { error: profileError } = await insertUserProfile({
              userId,
              username: data.username || data.email.split('@')[0],
              bio: data.bio || '',
              followersInstagram: data.followersInstagram || 0,
              followersTiktok: data.followersTiktok || 0,
              category: data.category || 'Lifestyle',
              location: data.location || 'Argentina',
            })

            if (profileError) {
              console.error('Background user profile bootstrap failed:', profileError.message)
            }
          }

          if (data.role === 'brand') {
            const { error: brandError } = await insertBrandProfile({
              userId,
              companyName: data.companyName || 'Mi Marca',
              industry: data.industry || 'Otro',
            })

            if (brandError) {
              console.error('Background brand profile bootstrap failed:', brandError.message)
            }
          }
        })()
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
    <AuthContext.Provider value={{ currentUser, isLoading, session, login, logout, signup, updateProfile }}>
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
