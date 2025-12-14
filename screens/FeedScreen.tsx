'use client'
import { getSupabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

export default function FeedScreen() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const client = getSupabase()
    if (client) {
      client.auth.getUser().then(({ data }) => {
        setEmail(data.user?.email ?? null)
      })
    }
  }, [])

  async function signOut() {
    const client = getSupabase()
    if (client) {
      await client.auth.signOut()
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Лента постов</h1>
          <button
            onClick={signOut}
            className="rounded-full border border-zinc-300 px-4 py-2 text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            Выйти
          </button>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400">Вы вошли как {email ?? 'пользователь'}</p>
        <div className="mt-6 rounded-lg border border-dashed border-zinc-300 p-6 dark:border-zinc-700">
          <p className="text-zinc-600 dark:text-zinc-400">
            Здесь будет список постов, оформленных как сообщения в чате.
          </p>
        </div>
      </div>
    </div>
  )
}
