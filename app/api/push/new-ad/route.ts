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

type AdRow = {
  id: string
  user_id: string | null
  user_tag: string | null
  title: string | null
  price: string | null
}

type FollowRow = {
  follower_id: string | null
  target_id: string | null
  notifications_enabled: boolean | null
}

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function configureWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails('mailto:example@example.com', publicKey, privateKey)
  return true
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const adId = typeof body?.adId === 'string' ? body.adId : null
    if (!adId) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }
    const client = getServerSupabase()
    if (!client) {
      return NextResponse.json({ ok: true, skipped: true })
    }
    const { data: ad } = await client
      .from('ads')
      .select('id, user_id, user_tag, title, price')
      .eq('id', adId)
      .maybeSingle()
    if (!ad || !ad.user_id) {
      return NextResponse.json({ ok: true, sent: 0 })
    }
    const { data: follows } = await client
      .from('follows')
      .select('follower_id, target_id, notifications_enabled')
      .eq('target_id', ad.user_id)
      .eq('notifications_enabled', true)
    if (!follows || follows.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 })
    }
    const followerIds = Array.from(
      new Set(
        follows
          .map((f: FollowRow) => f.follower_id)
          .filter((x): x is string => typeof x === 'string' && x.length > 0),
      ),
    )
    if (followerIds.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 })
    }
    const { data: subs } = await client
      .from('push_subscriptions')
      .select('user_id, endpoint, p256dh, auth')
      .in('user_id', followerIds)
    if (!subs || subs.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 })
    }
    if (!configureWebPush()) {
      return NextResponse.json({ ok: true, skipped: true })
    }
    const payload = {
      title: 'Новое объявление',
      body: `${ad.user_tag ?? 'пользователь'} выложил новое объявление`,
      url: `/?sellerId=${encodeURIComponent(ad.user_id)}&profileTab=ads`,
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
