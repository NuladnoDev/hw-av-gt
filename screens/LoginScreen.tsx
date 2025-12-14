'use client'
import { getSupabase } from '@/lib/supabaseClient'
import { useState } from 'react'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    const client = getSupabase()
    if (!client) {
      setError('Не заданы переменные окружения для Supabase')
      setLoading(false)
      return
    }
    const { error } = await client.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    const client = getSupabase()
    if (!client) {
      setError('Не заданы переменные окружения для Supabase')
      setLoading(false)
      return
    }
    const { error } = await client.auth.signUp({ email, password })
    if (error) setError(error.message)
    else setMessage('Проверьте почту для подтверждения')
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow dark:bg-zinc-900">
        <h1 className="mb-4 text-2xl font-semibold text-black dark:text-zinc-50">Вход или регистрация</h1>
        <form className="flex flex-col gap-3" onSubmit={handleSignIn}>
          <input
            type="email"
            placeholder="Email"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="mt-2 rounded-full bg-black px-4 py-2 text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
            disabled={loading}
          >
            Войти
          </button>
        </form>
        <button
          onClick={handleSignUp}
          className="mt-3 w-full rounded-full border border-zinc-300 px-4 py-2 text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
          disabled={loading}
        >
          Зарегистрироваться
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-3 text-sm text-green-600">{message}</p>}
        {!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Установите переменные окружения <code>NEXT_PUBLIC_SUPABASE_URL</code> и{' '}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> в файле <code>.env.local</code>
          </p>
        ) : null}
      </div>
    </div>
  )
}
