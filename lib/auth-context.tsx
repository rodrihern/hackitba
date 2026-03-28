'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'
import type { UserRole, UserProfile, BrandProfile } from './types'
import type { Session } from '@supabase/supabase-js'

interface AuthUser {
  role: UserRole
  profile: UserProfile | BrandProfile
}

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
  logout: () => void
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>
  updateProfile: (updates: Partial<UserProfile | BrandProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

async function fetchUserData(userId: string): Promise<AuthUser | null> {
  // Get role from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (!profile) return null

  if (profile.role === 'user') {
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!userProfile) return null

    return {
      role: 'user',
      profile: {
        id: userProfile.id,
        userId: userProfile.user_id,
        username: userProfile.username,
        bio: userProfile.bio || '',
        profileImage: userProfile.profile_image || 'https://i.pravatar.cc/150?img=30',
        instagramUrl: userProfile.instagram_url || '',
        tiktokUrl: userProfile.tiktok_url || '',
        youtubeUrl: userProfile.youtube_url || '',
        followersInstagram: userProfile.followers_instagram || 0,
        followersTiktok: userProfile.followers_tiktok || 0,
        followersYoutube: userProfile.followers_youtube || 0,
        totalPoints: userProfile.total_points || 0,
        level: userProfile.level || 'Bronze',
        category: userProfile.category || 'Lifestyle',
        location: userProfile.location || 'Argentina',
        createdAt: userProfile.created_at,
      } as UserProfile,
    }
  }

  if (profile.role === 'brand') {
    const { data: brandProfile } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!brandProfile) return null

    return {
      role: 'brand',
      profile: {
        id: brandProfile.id,
        userId: brandProfile.user_id,
        name: brandProfile.name,
        description: brandProfile.description || '',
        logo: brandProfile.logo || '',
        industry: brandProfile.industry || '',
        createdAt: brandProfile.created_at,
      } as BrandProfile,
    }
  }

  return null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        const userData = await fetchUserData(session.user.id)
        setCurrentUser(userData)
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      if (session?.user) {
        const userData = await fetchUserData(session.user.id)
        setCurrentUser(userData)
      } else {
        setCurrentUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { success: false, error: error.message }
    if (!data.user) return { success: false, error: 'No se pudo iniciar sesión' }
    const userData = await fetchUserData(data.user.id)
    if (!userData) return { success: false, error: 'No se encontró el perfil. Intentá registrarte nuevamente.' }
    setCurrentUser(userData)
    return { success: true, role: userData.role }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setCurrentUser(null)
    setSession(null)
  }

  const signup = async (data: SignupData): Promise<{ success: boolean; error?: string }> => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { role: data.role }
      }
    })

    if (error) return { success: false, error: error.message }
    if (!authData.user) return { success: false, error: 'No se pudo crear el usuario' }

    const userId = authData.user.id

    // Create profile record (the trigger should do this, but let's be safe)
    await supabase.from('profiles').upsert({ id: userId, email: data.email, role: data.role })

    if (data.role === 'user') {
      const { error: profileError } = await supabase.from('user_profiles').insert({
        user_id: userId,
        username: data.username || data.email.split('@')[0],
        bio: data.bio || '',
        profile_image: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70),
        followers_instagram: data.followersInstagram || 0,
        followers_tiktok: data.followersTiktok || 0,
        followers_youtube: 0,
        total_points: 0,
        level: 'Bronze',
        category: data.category || 'Lifestyle',
        location: data.location || 'Argentina',
      })
      if (profileError) return { success: false, error: profileError.message }
    }

    if (data.role === 'brand') {
      const { error: brandError } = await supabase.from('brand_profiles').insert({
        user_id: userId,
        name: data.companyName || 'Mi Marca',
        description: '',
        logo: '',
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

      await supabase.from('user_profiles').update(dbUpdates).eq('id', userProfile.id)
      const refreshed = await fetchUserData(session.user.id)
      setCurrentUser(refreshed)
    }

    if (currentUser.role === 'brand') {
      const brandProfile = currentUser.profile as BrandProfile
      const dbUpdates: Record<string, unknown> = {}
      if ('name' in updates) dbUpdates.name = updates.name
      if ('description' in updates) dbUpdates.description = updates.description

      await supabase.from('brand_profiles').update(dbUpdates).eq('id', brandProfile.id)
      const refreshed = await fetchUserData(session.user.id)
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
