export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

type PushSubscriptionRow = {
  user_id: string
  endpoint: string
  p256dh: string | null
  auth: string | null
}

type ProfileRow = {
  id: string
  tag: string | null
}

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function configureWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails('mailto:example@example.com', publicKey, privateKey)
  return true
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const followerId = typeof body?.followerId === 'string' ? body.followerId : null
    const targetId = typeof body?.targetId === 'string' ? body.targetId : null
    if (!followerId || !targetId) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }
    const client = getServerSupabase()
    if (!client) {
      return NextResponse.json({ ok: true, skipped: true })
    }
    const { data: follower } = await client
      .from('profiles')
      .select('id, tag')
      .eq('id', followerId)
      .maybeSingle()
    if (!follower) {
      return NextResponse.json({ ok: true, sent: 0 })
    }
    const { data: subs } = await client
      .from('push_subscriptions')
      .select('user_id, endpoint, p256dh, auth')
      .eq('user_id', targetId)
    if (!subs || subs.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 })
    }
    if (!configureWebPush()) {
      return NextResponse.json({ ok: true, skipped: true })
    }
    const followerTagRaw = (follower as ProfileRow).tag ?? null
    const followerTag =
      typeof followerTagRaw === 'string' && followerTagRaw.trim().length > 0
        ? followerTagRaw.replace(/^@/, '').trim()
        : 'пользователь'
    const payload = {
      title: 'Новый подписчик',
      body: `@${followerTag} подписался на вас`,
      url: `/?sellerId=${encodeURIComponent(followerId)}&profileTab=ads`,
    }
    let sent = 0
    await Promise.all(
      (subs as PushSubscriptionRow[]).map(async (row) => {
        const subscription = {
          endpoint: row.endpoint,
          keys: {
            p256dh: row.p256dh ?? '',
            auth: row.auth ?? '',
          },
        }
        try {
          await webpush.sendNotification(subscription, JSON.stringify(payload))
          sent += 1
        } catch {
        }
      }),
    )
    return NextResponse.json({ ok: true, sent })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

