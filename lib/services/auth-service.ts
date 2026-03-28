import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { BrandProfile, UserProfile, UserRole } from '@/lib/types'

export interface AuthUser {
  role: UserRole
  profile: UserProfile | BrandProfile
}

export async function getAuthSession() {
  return supabase.auth.getSession()
}

export function onAuthStateChanged(
  callback: (event: string, session: Session | null) => void | Promise<void>
) {
  return supabase.auth.onAuthStateChange(callback)
}

export async function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOutAuth() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

export async function signUpAuth(email: string, password: string, role: UserRole) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role },
    },
  })
}

export async function upsertBaseProfile(userId: string, email: string, role: UserRole) {
  return supabase.from('profiles').upsert({ id: userId, email, role })
}

export async function insertUserProfile(input: {
  userId: string
  username: string
  bio: string
  followersInstagram: number
  followersTiktok: number
  category: string
  location: string
}) {
  return supabase.from('user_profiles').insert({
    user_id: input.userId,
    username: input.username,
    bio: input.bio,
    profile_image: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70),
    followers_instagram: input.followersInstagram,
    followers_tiktok: input.followersTiktok,
    followers_youtube: 0,
    total_points: 0,
    level: 'Bronze',
    category: input.category,
    location: input.location,
  })
}

export async function insertBrandProfile(input: {
  userId: string
  companyName: string
  industry: string
}) {
  return supabase.from('brand_profiles').insert({
    user_id: input.userId,
    name: input.companyName,
    description: '',
    logo: '',
    industry: input.industry,
  })
}

export async function updateUserProfileById(profileId: string, updates: Record<string, unknown>) {
  return supabase.from('user_profiles').update(updates).eq('id', profileId)
}

export async function updateBrandProfileById(profileId: string, updates: Record<string, unknown>) {
  return supabase.from('brand_profiles').update(updates).eq('id', profileId)
}

export async function fetchAuthUserData(userId: string): Promise<AuthUser | null> {
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
