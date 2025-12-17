'use client'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export type LocalAuthInfo = {
  tag?: string
  uid?: string
  email?: string
} | null

export function getSupabase(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  return createClient(supabaseUrl, supabaseAnonKey)
}

export async function loadLocalAuth(): Promise<LocalAuthInfo> {
  try {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem('hw-auth')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { tag?: string; uid?: string; email?: string } | null
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

export async function clearLocalAuth(): Promise<void> {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem('hw-auth')
  } catch {
  }
}

export async function saveLocalAuth(info: { tag: string; uid: string; email: string }): Promise<void> {
  try {
    if (typeof window === 'undefined') return
    const payload = {
      tag: info.tag,
      uid: info.uid,
      email: info.email,
    }
    window.localStorage.setItem('hw-auth', JSON.stringify(payload))
  } catch {
  }
}
