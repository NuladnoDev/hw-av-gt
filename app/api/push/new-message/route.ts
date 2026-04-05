export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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
    const senderId = typeof body?.senderId === 'string' ? body.senderId : null
    const receiverId = typeof body?.receiverId === 'string' ? body.receiverId : null
    const message = typeof body?.message === 'string' ? body.message : ''

    if (!senderId || !receiverId) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const client = getServerSupabase()
    if (!client) return NextResponse.json({ ok: true, skipped: true })

    // Проверяем не замьючен ли чат у получателя
    const { data: muted } = await client
      .from('chat_muted')
      .select('id')
      .eq('user_id', receiverId)
      .eq('peer_id', senderId)
      .maybeSingle()

    if (muted) return NextResponse.json({ ok: true, muted: true })

    // Получаем тег отправителя
    const { data: sender } = await client
      .from('profiles')
      .select('tag')
      .eq('id', senderId)
      .maybeSingle()

    // Получаем push subscriptions получателя
    const { data: subs } = await client
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', receiverId)

    if (!subs || subs.length === 0) return NextResponse.json({ ok: true, sent: 0 })
    if (!configureWebPush()) return NextResponse.json({ ok: true, skipped: true })

    const senderTag = ((sender as any)?.tag ?? 'пользователь').replace(/^@/, '').trim()
    const payload = JSON.stringify({
      title: `@${senderTag}`,
      body: message.trim().substring(0, 120) || 'Новое сообщение',
      url: `/?tab=messages`,
    })

    let sent = 0
    await Promise.all(
      subs.map(async (row: any) => {
        try {
          await webpush.sendNotification(
            { endpoint: row.endpoint, keys: { p256dh: row.p256dh ?? '', auth: row.auth ?? '' } },
            payload
          )
          sent++
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await client.from('push_subscriptions').delete().eq('endpoint', row.endpoint)
          }
        }
      })
    )

    return NextResponse.json({ ok: true, sent })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
