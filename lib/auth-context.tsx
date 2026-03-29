'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
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
  isRecoveringSession: boolean
  session: Session | null
  authError: string | null
  login: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>
  logout: (redirectTo?: string) => Promise<void>
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>
  updateProfile: (updates: Partial<UserProfile | BrandProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)
const INITIAL_SESSION_TIMEOUT_MS = 12000
const INITIAL_SESSION_RETRY_TIMEOUT_MS = 8000
const PROFILE_RESOLUTION_TIMEOUT_MS = 15000
const AUTH_DEBUG_PREFIX = '[auth]'

function nowLabel() {
  return new Date().toISOString()
}

function logAuthDebug(step: string, details?: Record<string, unknown>) {
  if (typeof window === 'undefined') return

  if (details) {
    console.debug(`${AUTH_DEBUG_PREFIX} ${nowLabel()} ${step}`, details)
    return
  }

  console.debug(`${AUTH_DEBUG_PREFIX} ${nowLabel()} ${step}`)
}

function timeoutError(message: string) {
  return new Error(message)
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(timeoutError(message)), timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

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
  const [isRecoveringSession, setIsRecoveringSession] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const authRequestIdRef = useRef(0)
  const authStateChangeTaskRef = useRef<number | null>(null)

  const resolveSessionUser = async (activeSession: Session | null) => {
    const requestId = ++authRequestIdRef.current
    const resolutionStartedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
    setSession(activeSession)
    logAuthDebug('resolveSessionUser:start', {
      requestId,
      hasSession: Boolean(activeSession),
      userId: activeSession?.user?.id ?? null,
      roleHint: activeSession?.user?.user_metadata?.role ?? null,
    })

    if (!activeSession?.user) {
      setCurrentUser(null)
      setAuthError(null)
      setIsRecoveringSession(false)
      logAuthDebug('resolveSessionUser:no-session', { requestId })
      return
    }

    try {
      setAuthError(null)
      const roleHint = activeSession.user.user_metadata?.role
      const profileFetchStartedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
      let userData = await withTimeout(
        fetchAuthUserDataWithRoleHint(activeSession.user.id, roleHint),
        PROFILE_RESOLUTION_TIMEOUT_MS,
        'La sesión existe, pero Supabase tardó demasiado en devolver el perfil. Revisá conectividad, RLS y que el proyecto configurado sea el correcto.'
      )
      logAuthDebug('resolveSessionUser:profile-fetch-complete', {
        requestId,
        durationMs: Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - profileFetchStartedAt),
        foundProfile: Boolean(userData),
      })

      if (!userData) {
        const repairStartedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
        const repaired = await withTimeout(
          ensureRoleProfile({
            id: activeSession.user.id,
            email: activeSession.user.email,
            role: roleHint,
            username: activeSession.user.user_metadata?.username,
            companyName: activeSession.user.user_metadata?.companyName,
            industry: activeSession.user.user_metadata?.industry,
          }),
          PROFILE_RESOLUTION_TIMEOUT_MS,
          'Supabase tardó demasiado intentando reparar el perfil del usuario. Revisá las policies y migraciones de perfiles.'
        )
        logAuthDebug('resolveSessionUser:profile-repair-complete', {
          requestId,
          durationMs: Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - repairStartedAt),
          repaired,
        })

        if (repaired) {
          const refetchStartedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
          userData = await withTimeout(
            fetchAuthUserDataWithRoleHint(activeSession.user.id, roleHint),
            PROFILE_RESOLUTION_TIMEOUT_MS,
            'Supabase creó el perfil, pero tardó demasiado en devolverlo. Revisá conectividad y estado del proyecto.'
          )
          logAuthDebug('resolveSessionUser:profile-refetch-complete', {
            requestId,
            durationMs: Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - refetchStartedAt),
            foundProfile: Boolean(userData),
          })
        }
      }

      if (authRequestIdRef.current !== requestId) {
        logAuthDebug('resolveSessionUser:stale-result', { requestId })
        return
      }

      if (!userData) {
        setCurrentUser(null)
        setAuthError(
          'Hay una sesión válida en Supabase, pero no existe un perfil usable en la base. Revisá que Vercel apunte al proyecto correcto y que la migración supabase/migrations/202611010001_auth_profile_bootstrap.sql esté aplicada.'
        )
        setIsRecoveringSession(false)
        logAuthDebug('resolveSessionUser:missing-profile', {
          requestId,
          durationMs: Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - resolutionStartedAt),
        })
        return
      }

      setCurrentUser(userData)
      setAuthError(null)
      setIsRecoveringSession(false)
      logAuthDebug('resolveSessionUser:success', {
        requestId,
        durationMs: Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - resolutionStartedAt),
        resolvedRole: userData.role,
      })
    } catch (err) {
      if (authRequestIdRef.current !== requestId) {
        logAuthDebug('resolveSessionUser:stale-error', { requestId })
        return
      }
      setCurrentUser(null)
      setAuthError(err instanceof Error ? err.message : 'No se pudo cargar la sesión actual')
      setIsRecoveringSession(false)
      logAuthDebug('resolveSessionUser:error', {
        requestId,
        durationMs: Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - resolutionStartedAt),
        error: err instanceof Error ? err.message : 'unknown',
      })
    }
  }

  useEffect(() => {
    let isMounted = true
    const sessionBootstrapStartedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
    logAuthDebug('bootstrap:start')

    const loadInitialSession = async () => {
      try {
        return await withTimeout(
          getAuthSession(),
          INITIAL_SESSION_TIMEOUT_MS,
          'Supabase tardó demasiado en restaurar la sesión. Intentá recargar o volver a iniciar sesión.'
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo restaurar la sesión'
        const isTimeout = message.toLowerCase().includes('tardó demasiado')

        if (!isTimeout) {
          throw err
        }

        setIsRecoveringSession(true)
        logAuthDebug('bootstrap:getSession:retrying', {
          firstAttemptDurationMs: Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - sessionBootstrapStartedAt),
        })

        await wait(250)

        return withTimeout(
          getAuthSession(),
          INITIAL_SESSION_RETRY_TIMEOUT_MS,
          'Supabase no logró restaurar la sesión después de reintentar. Intentá recargar o volver a iniciar sesión.'
        )
      }
    }

    loadInitialSession()
      .then(async ({ data: { session } }) => {
        if (!isMounted) return
        logAuthDebug('bootstrap:getSession:success', {
          durationMs: Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - sessionBootstrapStartedAt),
          hasSession: Boolean(session),
          userId: session?.user?.id ?? null,
        })
        await resolveSessionUser(session)
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('Error loading auth session:', err)
        setCurrentUser(null)
        setSession(null)
        setIsRecoveringSession(false)
        setAuthError(err instanceof Error ? err.message : 'No se pudo restaurar la sesión')
        logAuthDebug('bootstrap:getSession:error', {
          durationMs: Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - sessionBootstrapStartedAt),
          error: err instanceof Error ? err.message : 'unknown',
        })
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
          logAuthDebug('bootstrap:complete', {
            durationMs: Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - sessionBootstrapStartedAt),
          })
        }
      })

    const { data: { subscription } } = onAuthStateChanged((_event, session) => {
      if (!isMounted) return

      if (authStateChangeTaskRef.current !== null && typeof window !== 'undefined') {
        window.clearTimeout(authStateChangeTaskRef.current)
      }

      const authEventStartedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
      logAuthDebug('onAuthStateChange:queued', {
        eventSession: Boolean(session),
        userId: session?.user?.id ?? null,
      })

      const scheduleAuthStateResolution = () => {
        setIsLoading(true)
        setIsRecoveringSession(false)
        logAuthDebug('onAuthStateChange:start', {
          eventSession: Boolean(session),
          userId: session?.user?.id ?? null,
        })

        void resolveSessionUser(session)
          .catch((err) => {
            console.error('Error loading auth state change:', err)
          })
          .finally(() => {
            if (isMounted) {
              setIsLoading(false)
              logAuthDebug('onAuthStateChange:complete', {
                durationMs: Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - authEventStartedAt),
              })
            }
          })
      }

      if (typeof window !== 'undefined') {
        authStateChangeTaskRef.current = window.setTimeout(() => {
          authStateChangeTaskRef.current = null
          scheduleAuthStateResolution()
        }, 0)
        return
      }

      queueMicrotask(scheduleAuthStateResolution)
    })

    return () => {
      isMounted = false
      if (authStateChangeTaskRef.current !== null && typeof window !== 'undefined') {
        window.clearTimeout(authStateChangeTaskRef.current)
      }
      subscription.unsubscribe()
    }
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
    <AuthContext.Provider value={{ currentUser, isLoading, isRecoveringSession, session, authError, login, logout, signup, updateProfile }}>
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
