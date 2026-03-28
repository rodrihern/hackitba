'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { UserRole, UserProfile, BrandProfile } from './types'
import type { Session } from '@supabase/supabase-js'
import {
  fetchAuthUserData,
  getAuthSession,
  insertBrandProfile,
  insertUserProfile,
  onAuthStateChanged,
  signInWithPassword,
  signOutAuth,
  signUpAuth,
  updateBrandProfileById,
  updateUserProfileById,
  upsertBaseProfile,
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
        const userData = await fetchAuthUserData(session.user.id)
        setCurrentUser(userData)
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChanged(async (_event, session) => {
      setSession(session)
      if (session?.user) {
        const userData = await fetchAuthUserData(session.user.id)
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
    const userData = await fetchAuthUserData(data.user.id)
    if (!userData) return { success: false, error: 'No se encontró el perfil. Intentá registrarte nuevamente.' }
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
    const { data: authData, error } = await signUpAuth(data.email, data.password, data.role)

    if (error) return { success: false, error: error.message }
    if (!authData.user) return { success: false, error: 'No se pudo crear el usuario' }

    const userId = authData.user.id

    // Create profile record (the trigger should do this, but let's be safe)
    await upsertBaseProfile(userId, data.email, data.role)

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
      if (profileError) return { success: false, error: profileError.message }
    }

    if (data.role === 'brand') {
      const { error: brandError } = await insertBrandProfile({
        userId,
        companyName: data.companyName || 'Mi Marca',
        industry: data.industry || 'Otro',
      })
      if (brandError) return { success: false, error: brandError.message }
    }

    return { success: true }
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
