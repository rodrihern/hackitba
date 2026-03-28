import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  'placeholder-key'

declare global {
  var __collabspaceSupabaseClient: ReturnType<typeof createClient> | undefined
}

function createSupabaseSingleton() {
  if (typeof window === 'undefined') {
    return createClient(supabaseUrl, supabaseKey)
  }

  if (!globalThis.__collabspaceSupabaseClient) {
    globalThis.__collabspaceSupabaseClient = createClient(supabaseUrl, supabaseKey)
  }

  return globalThis.__collabspaceSupabaseClient
}

export const supabase = createSupabaseSingleton()
