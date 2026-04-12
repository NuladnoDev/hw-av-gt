import { NextResponse } from 'next/server'
import * as nsfwjs from 'nsfwjs'
import * as tf from '@tensorflow/tfjs'
import { createCanvas, loadImage } from 'canvas'

// Cache model so it's not reloaded on every request
let model: nsfwjs.NSFWJS | null = null

async function getModel(): Promise<nsfwjs.NSFWJS> {
  if (!model) {
    model = await nsfwjs.load()
  }
  return model
}

const NSFW_CLASSES = ['Porn', 'Sexy', 'Hentai']
const NSFW_THRESHOLD = 0.60

const ADULT_KEYWORDS = [
  'эротик', 'порно', 'секс-', 'интим-услуг', 'xxx', 'nsfw', 'стриптиз', 'эскорт',
]

export async function POST(request: Request) {
  let body: { images?: unknown; category?: string; title?: string; description?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const title = typeof body.title === 'string' ? body.title.toLowerCase() : ''
  const description = typeof body.description === 'string' ? body.description.toLowerCase() : ''
  const combined = `${title} ${description}`

  // Keyword check
  if (ADULT_KEYWORDS.some(kw => combined.includes(kw))) {
    return NextResponse.json({ isAdult: true, reason: 'keyword' })
  }

  // Image check
  const images = Array.isArray(body.images)
    ? (body.images as unknown[])
        .filter((x): x is string => typeof x === 'string' && x.startsWith('data:image/'))
        .slice(0, 3)
    : []

  if (images.length === 0) {
    return NextResponse.json({ isAdult: false, reason: 'no_images' })
  }

  try {
    const nsfwModel = await getModel()

    for (const imgDataUrl of images) {
      const base64 = imgDataUrl.split(',')[1]
      const buffer = Buffer.from(base64, 'base64')
      const img = await loadImage(buffer)
      const canvas = createCanvas(img.width, img.height)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const tensor = tf.browser.fromPixels(canvas as unknown as HTMLCanvasElement)
      const predictions = await nsfwModel.classify(tensor)
      tensor.dispose()

      console.log('[check-nsfw] predictions:', JSON.stringify(predictions))

      const nsfwScore = predictions
        .filter(p => NSFW_CLASSES.includes(p.className))
        .reduce((sum, p) => sum + p.probability, 0)

      if (nsfwScore >= NSFW_THRESHOLD) {
        return NextResponse.json({ isAdult: true, reason: 'image_nsfw', score: nsfwScore })
      }
    }

    return NextResponse.json({ isAdult: false, reason: 'clean' })
  } catch (e) {
    console.error('[check-nsfw] error:', e)
    return NextResponse.json({ isAdult: false, reason: 'check_failed' })
  }
}
