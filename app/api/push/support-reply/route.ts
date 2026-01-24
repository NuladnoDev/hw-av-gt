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
    const { ticketId, userId, message } = body

    if (!ticketId || !userId) {
      return NextResponse.json({ ok: false, error: 'Missing ticketId or userId' }, { status: 400 })
    }

    const client = getServerSupabase()
    if (!client) {
      return NextResponse.json({ ok: false, error: 'Supabase client error' }, { status: 500 })
    }

    // Get the ticket to find the owner
    const { data: ticket } = await client
      .from('support_tickets')
      .select('user_id')
      .eq('id', ticketId)
      .maybeSingle()

    if (!ticket || !ticket.user_id) {
      return NextResponse.json({ ok: false, error: 'Ticket not found' }, { status: 404 })
    }

    // Get the owner's push subscriptions
    const { data: subs } = await client
      .from('push_subscriptions')
      .select('user_id, endpoint, p256dh, auth')
      .eq('user_id', ticket.user_id)

    if (!subs || subs.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, info: 'No subscriptions found for user' })
    }

    if (!configureWebPush()) {
      return NextResponse.json({ ok: false, error: 'WebPush configuration error' }, { status: 500 })
    }

    const payload = JSON.stringify({
      title: 'Ответ от поддержки',
      body: message || 'Вам пришел ответ на ваше обращение',
      url: '/?openSupport=true',
    })

    let sent = 0
    const promises = subs.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh || '',
            auth: sub.auth || '',
          },
        }
        await webpush.sendNotification(pushSubscription, payload)
        sent++
      } catch (err: any) {
        console.error('Push error:', err.endpoint, err.statusCode)
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Clean up expired subscriptions
          await client.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      }
    })

    await Promise.all(promises)

    return NextResponse.json({ ok: true, sent })
  } catch (err: any) {
    console.error('API Error:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
