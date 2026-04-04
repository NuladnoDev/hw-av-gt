import { NextResponse } from 'next/server'

type ModerateRequestBody = {
  images?: unknown
}

type ModerateResult = {
  safe: boolean
  score: number
}

const parseDataUrlToBytes = (dataUrl: string): { bytes: Uint8Array; mimeType: string } | null => {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  const mimeType = match[1] || 'image/jpeg'
  const base64 = match[2] || ''
  if (!base64) return null
  const bytes = Buffer.from(base64, 'base64')
  if (!bytes || bytes.length === 0) return null
  return { bytes, mimeType }
}

const moderateOneImage = async (
  imageDataUrl: string,
  apiUser: string,
  apiSecret: string,
): Promise<ModerateResult> => {
  const parsed = parseDataUrlToBytes(imageDataUrl)
  if (!parsed) return { safe: false, score: 1 }

  const form = new FormData()
  form.append('models', 'nudity-2.1')
  form.append('api_user', apiUser)
  form.append('api_secret', apiSecret)
  const normalizedBytes = new Uint8Array(parsed.bytes)
  form.append('media', new Blob([normalizedBytes], { type: parsed.mimeType }), 'upload.jpg')

  const response = await fetch('https://api.sightengine.com/1.0/check.json', {
    method: 'POST',
    body: form,
  })
  if (!response.ok) {
    throw new Error('moderation_provider_failed')
  }

  const payload = (await response.json()) as {
    nudity?: { raw?: number; partial?: number; sexual_activity?: number; safe?: number }
  }
  const nudity = payload?.nudity ?? {}
  const score = Math.max(
    Number(nudity.raw ?? 0),
    Number(nudity.partial ?? 0),
    Number(nudity.sexual_activity ?? 0),
  )
  const safe = score < 0.6
  return { safe, score }
}

export async function POST(request: Request) {
  const apiUser = process.env.SIGHTENGINE_API_USER
  const apiSecret = process.env.SIGHTENGINE_API_SECRET
  if (!apiUser || !apiSecret) {
    return NextResponse.json(
      { error: 'moderation_not_configured' },
      { status: 503 },
    )
  }

  let body: ModerateRequestBody
  try {
    body = (await request.json()) as ModerateRequestBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const images = Array.isArray(body.images)
    ? body.images.filter((item): item is string => typeof item === 'string' && item.startsWith('data:image/')).slice(0, 6)
    : []

  if (images.length === 0) {
    return NextResponse.json({ error: 'images_required' }, { status: 400 })
  }

  try {
    const results: ModerateResult[] = []
    for (const image of images) {
      const result = await moderateOneImage(image, apiUser, apiSecret)
      results.push(result)
    }
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'moderation_failed' }, { status: 502 })
  }
}
