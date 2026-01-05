import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type PushSubscriptionKeys = {
  p256dh?: string
  auth?: string
}

type PushSubscriptionPayload = {
  endpoint: string
  keys?: PushSubscriptionKeys
}

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const subscription = body?.subscription as PushSubscriptionPayload | undefined
    const userId = typeof body?.userId === 'string' ? body.userId : null
    if (!subscription || !subscription.endpoint || !userId) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }
    const client = getServerSupabase()
    if (!client) {
      return NextResponse.json({ ok: true, skipped: true })
    }
    const endpoint = subscription.endpoint
    const p256dh = subscription.keys?.p256dh ?? null
    const auth = subscription.keys?.auth ?? null
    await client
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint,
        p256dh,
        auth,
      })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
