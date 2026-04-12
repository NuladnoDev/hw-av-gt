import { NextRequest, NextResponse } from 'next/server'

// Боты которые читают OG теги
const BOT_UA = /vkShare|facebookexternalhit|Twitterbot|TelegramBot|WhatsApp|LinkedInBot|Slackbot|Discordbot|bot|crawler|spider/i

export async function proxy(req: NextRequest) {
  const ua = req.headers.get('user-agent') || ''
  if (!BOT_UA.test(ua)) return NextResponse.next()

  const { searchParams } = req.nextUrl
  const sellerId = searchParams.get('sellerId') || searchParams.get('seller')
  const adId = searchParams.get('adId')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const siteUrl = req.nextUrl.origin

  let title = 'hw-project'
  let description = 'Выкладывай, покупай, продавай.'
  let image = `${siteUrl}/logo.svg`

  if (supabaseUrl && supabaseKey) {
    try {
      if (adId) {
        // Объявление
        const res = await fetch(
          `${supabaseUrl}/rest/v1/ads?id=eq.${adId}&select=title,price,image_url,user_tag`,
          { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
        )
        const [ad] = await res.json()
        if (ad) {
          title = `${ad.title} — ${ad.price} ₽`
          description = `Продаёт @${(ad.user_tag || '').replace(/^@/, '')}`
          if (ad.image_url) {
            try {
              const imgs = JSON.parse(ad.image_url)
              if (Array.isArray(imgs) && imgs[0]) image = imgs[0]
            } catch {
              if (typeof ad.image_url === 'string' && ad.image_url.startsWith('http')) {
                image = ad.image_url
              }
            }
          }
        }
      } else if (sellerId) {
        // Профиль
        const res = await fetch(
          `${supabaseUrl}/rest/v1/profiles?id=eq.${sellerId}&select=tag,avatar_url,city`,
          { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
        )
        const [profile] = await res.json()
        if (profile) {
          const tag = (profile.tag || '').replace(/^@/, '')
          title = `@${tag}`
          description = profile.city ? `Профиль пользователя из ${profile.city}` : 'Профиль пользователя'
          if (profile.avatar_url) image = profile.avatar_url
        }
      }
    } catch {}
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${escHtml(title)}</title>
  <meta name="description" content="${escHtml(description)}"/>
  <meta property="og:title" content="${escHtml(title)}"/>
  <meta property="og:description" content="${escHtml(description)}"/>
  <meta property="og:image" content="${escHtml(image)}"/>
  <meta property="og:type" content="website"/>
  <meta property="og:url" content="${escHtml(req.url)}"/>
  <meta property="og:site_name" content="hw-project"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${escHtml(title)}"/>
  <meta name="twitter:description" content="${escHtml(description)}"/>
  <meta name="twitter:image" content="${escHtml(image)}"/>
</head>
<body></body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export const config = {
  matcher: '/',
}
