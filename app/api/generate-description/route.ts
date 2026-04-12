import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const key = process.env.GROQ_API_KEY
  if (!key) return NextResponse.json({ error: 'not_configured' }, { status: 503 })

  let body: { hint?: string; title?: string; category?: string; specs?: { label: string; value: string }[] }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  const hint = typeof body.hint === 'string' ? body.hint.trim() : ''
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const category = typeof body.category === 'string' ? body.category : ''
  const specs = Array.isArray(body.specs) ? body.specs : []

  const categoryNames: Record<string, string> = {
    nicotine: 'никотиновые устройства',
    things: 'вещи и электроника',
    service: 'услуги',
    job: 'работа',
    other: 'другое',
  }

  const specsText = specs.length > 0
    ? specs.map(s => `${s.label}: ${s.value}`).join(', ')
    : ''

  const contextParts = [
    title && `Название: ${title}`,
    category && `Категория: ${categoryNames[category] ?? category}`,
    specsText && `Характеристики: ${specsText}`,
    hint && `Подсказка от продавца: ${hint}`,
  ].filter(Boolean).join('\n')

  const systemPrompt = `Ты помогаешь продавцам писать описания объявлений на доске объявлений.
Правила:
- Пиши на русском языке
- Описание должно быть 2-4 предложения, не больше
- Только факты о товаре/услуге, без воды и лишних слов
- Не используй восклицательные знаки и рекламные клише
- Не повторяй название товара в начале
- Пиши от третьего лица или нейтрально
- Если это услуга — опиши что именно предлагается
- Если это товар — опиши состояние, комплектацию, особенности`

  const userPrompt = `Напиши краткое описание для объявления:\n${contextParts}`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[generate-description] Groq error:', res.status, err)
      return NextResponse.json({ error: 'groq_error' }, { status: 502 })
    }

    const data = await res.json() as { choices?: { message?: { content?: string } }[] }
    const text = data.choices?.[0]?.message?.content?.trim() ?? ''
    return NextResponse.json({ description: text })
  } catch (e) {
    console.error('[generate-description] fetch error:', e)
    return NextResponse.json({ error: 'fetch_failed' }, { status: 502 })
  }
}
