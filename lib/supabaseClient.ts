'use client'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

function idbGet(key: string): Promise<string | null> {
  return new Promise((resolve) => {
    const req = window.indexedDB.open('hw-session-db', 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv')
    }
    req.onsuccess = () => {
      const db = req.result
      const tx = db.transaction('kv', 'readonly')
      const store = tx.objectStore('kv')
      const g = store.get(key)
      g.onsuccess = () => resolve(g.result ?? null)
      g.onerror = () => resolve(null)
    }
    req.onerror = () => resolve(null)
  })
}
function idbSet(key: string, val: string): Promise<void> {
  return new Promise((resolve) => {
    const req = window.indexedDB.open('hw-session-db', 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv')
    }
    req.onsuccess = () => {
      const db = req.result
      const tx = db.transaction('kv', 'readwrite')
      const store = tx.objectStore('kv')
      store.put(val, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    }
    req.onerror = () => resolve()
  })
}
function idbRemove(key: string): Promise<void> {
  return new Promise((resolve) => {
    const req = window.indexedDB.open('hw-session-db', 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv')
    }
    req.onsuccess = () => {
      const db = req.result
      const tx = db.transaction('kv', 'readwrite')
      const store = tx.objectStore('kv')
      store.delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    }
    req.onerror = () => resolve()
  })
}

async function initRecovery(c: SupabaseClient) {
  try {
    const { data } = await c.auth.getSession()
    if (!data.session) {
      const backup = await idbGet('sb-session')
      if (backup) {
        const parsed = JSON.parse(backup) as { access_token?: string; refresh_token?: string }
        if (parsed.access_token && parsed.refresh_token) {
          await c.auth.setSession({
            access_token: parsed.access_token,
            refresh_token: parsed.refresh_token,
          })
        }
      }
    }
    c.auth.onAuthStateChange(async (evt, session) => {
      if (session?.access_token && session?.refresh_token) {
        await idbSet(
          'sb-session',
          JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }),
        )
      }
    })
  } catch {}
}

export async function loadLocalAuth(): Promise<{ tag?: string; uid?: string; email?: string } | null> {
  try {
    const rawLs = window.localStorage.getItem('hw-auth')
    if (rawLs) return JSON.parse(rawLs) as { tag?: string; uid?: string; email?: string }
    const raw = await idbGet('hw-auth')
    return raw ? (JSON.parse(raw) as { tag?: string; uid?: string; email?: string }) : null
  } catch {
    return null
  }
}
export async function saveLocalAuth(obj: { tag: string; uid: string; email: string }) {
  try {
    window.localStorage.setItem('hw-auth', JSON.stringify(obj))
  } catch {}
  try {
    await idbSet('hw-auth', JSON.stringify(obj))
  } catch {}
}
export async function clearLocalAuth() {
  try {
    window.localStorage.removeItem('hw-auth')
  } catch {}
  try {
    await idbRemove('hw-auth')
  } catch {}
}

export function getSupabase(): SupabaseClient | null {
  if (client) return client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
  initRecovery(client)
  return client
}

export async function clearSessionBackup() {
  try {
    await idbRemove('sb-session')
  } catch {}
}
