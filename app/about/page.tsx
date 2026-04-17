'use client'
import { useEffect, useRef, useState } from 'react'

// ── Starfield canvas ──────────────────────────────────────────────────────────
function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const STAR_COUNT = 260

    type Star = { x: number; y: number; z: number; px: number; py: number }
    const stars: Star[] = []

    const W = () => canvas.width
    const H = () => canvas.height

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = document.documentElement.scrollHeight
    }

    const init = () => {
      stars.length = 0
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * W() - W() / 2,
          y: Math.random() * H() - H() / 2,
          z: Math.random() * W(),
          px: 0, py: 0,
        })
      }
    }

    const draw = () => {
      ctx.fillStyle = '#05050a'
      ctx.fillRect(0, 0, W(), H())

      const cx = W() / 2
      const cy = H() / 2
      const speed = 2.2

      for (const s of stars) {
        s.px = (s.x / s.z) * W() + cx
        s.py = (s.y / s.z) * H() / 2 + cy

        s.z -= speed
        if (s.z <= 0) {
          s.x = Math.random() * W() - cx
          s.y = Math.random() * H() - cy
          s.z = W()
          s.px = (s.x / s.z) * W() + cx
          s.py = (s.y / s.z) * H() / 2 + cy
        }

        const nx = (s.x / s.z) * W() + cx
        const ny = (s.y / s.z) * H() / 2 + cy

        const size = Math.max(0.3, (1 - s.z / W()) * 2.8)
        const alpha = Math.min(1, (1 - s.z / W()) * 1.4)

        ctx.beginPath()
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`
        ctx.lineWidth = size
        ctx.moveTo(s.px, s.py)
        ctx.lineTo(nx, ny)
        ctx.stroke()
      }

      animId = requestAnimationFrame(draw)
    }

    resize()
    init()
    draw()

    window.addEventListener('resize', () => { resize(); init() })
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', () => { resize(); init() })
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
    />
  )
}

// ── Animated SVG marketplace illustration ─────────────────────────────────────
function HeroIllustration() {
  // Real product images from Unsplash (free to use)
  const cards = [
    {
      img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop',
      title: 'Часы премиум',
      price: '₽ 12 490',
      priceColor: '#3b82f6',
      delay: '0s',
    },
    {
      img: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=300&h=200&fit=crop',
      title: 'Парфюм',
      price: '₽ 3 200',
      priceColor: '#10b981',
      delay: '0.15s',
    },
    {
      img: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=300&h=200&fit=crop',
      title: 'Кроссовки',
      price: '₽ 7 800',
      priceColor: '#f59e0b',
      delay: '0.3s',
    },
  ]

  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', width: '100%', maxWidth: 680 }}>
      {cards.map((c, i) => (
        <div key={i} className="hero-card" style={{ animationDelay: c.delay }}>
          <div className="hero-card-img-wrap">
            <img src={c.img} alt={c.title} className="hero-card-img" loading="lazy" />
            {/* favourite icon from project */}
            <div className="hero-card-fav">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.7899 6.48395H14.2066M11.5 15.1936L17.1669 20.2558C17.4891 20.5436 18 20.3149 18 19.8829V5C18 3.89543 17.1046 3 16 3H7C5.89543 3 5 3.89543 5 5V19.8829C5 20.3149 5.51092 20.5436 5.8331 20.2558L11.5 15.1936Z" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div className="hero-card-body">
            <div className="hero-card-title">{c.title}</div>
            <div className="hero-card-price" style={{ color: c.priceColor }}>{c.price}</div>
            <div className="hero-card-btn">
              {/* bag icon from project */}
              <svg width="13" height="13" viewBox="0 0 21 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.6499 7.69978V4.94979C13.6499 3.12725 12.2396 1.64978 10.4999 1.64978C8.76024 1.64978 7.34991 3.12725 7.34991 4.94978V7.69978M4.13628 20.3498H16.8635C17.9882 20.3498 18.8999 19.4124 18.8999 18.2561L17.5954 7.14975C17.5954 5.99345 16.6836 5.05608 15.559 5.05608H5.18628C4.06163 5.05608 3.14991 5.99345 3.14991 7.14975L2.09991 18.2561C2.09991 19.4124 3.01163 20.3498 4.13628 20.3498Z" stroke="white" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Купить
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay }: { icon: React.ReactNode; title: string; desc: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className="feature-card" style={{ transitionDelay: `${delay}ms`, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)' }}>
      <div className="feature-icon">{icon}</div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{desc}</p>
    </div>
  )
}

// ── Stat counter ──────────────────────────────────────────────────────────────
function StatItem({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className="stat-item" style={{ opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(0.85)', transition: 'all 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

// ── Step item ─────────────────────────────────────────────────────────────────
function StepItem({ num, title, desc }: { num: string; title: string; desc: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className="step-item" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: `all 0.5s ease ${parseInt(num) * 80}ms` }}>
      <div className="step-num">{num}</div>
      <div className="step-title">{title}</div>
      <div className="step-desc">{desc}</div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AboutPage() {
  const [scrolled, setScrolled] = useState(false)
  const [heroVisible, setHeroVisible] = useState(false)

  useEffect(() => {
    // Override root layout's overflow:hidden / position:fixed for this page
    const body = document.body
    const html = document.documentElement
    const prevBodyStyle = body.getAttribute('style') || ''
    const prevHtmlStyle = html.getAttribute('style') || ''
    body.style.cssText = 'margin:0;padding:0;background:#05050a;color:#fff;overflow-x:hidden;overflow-y:auto;position:static;overscroll-behavior:auto;'
    html.style.cssText = 'overflow:auto;position:static;height:auto;'
    // Remove overflow-hidden class added by root layout
    body.classList.remove('overflow-hidden')
    setTimeout(() => setHeroVisible(true), 80)
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      body.setAttribute('style', prevBodyStyle)
      html.setAttribute('style', prevHtmlStyle)
    }
  }, [])

  const APP_URL = 'https://hw-project.vercel.app'

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #05050a; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow-x: hidden; }
        section, footer, nav { position: relative; z-index: 1; }

        /* grid bg */
        .grid-bg { display: none; }

        /* orbs — removed */

        /* nav */
        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: flex; align-items: center; justify-content: center; height: 60px; transition: none; }
        .nav.scrolled { background: none; backdrop-filter: none; -webkit-backdrop-filter: none; border-bottom: none; }
        .nav-inner { display: flex; align-items: center; gap: 4px; padding: 6px 8px; border-radius: 999px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
        .nav-link { padding: 7px 16px; border-radius: 999px; font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.55); text-decoration: none; transition: color 0.2s, background 0.2s; white-space: nowrap; }
        .nav-link:hover { color: rgba(255,255,255,0.95); background: rgba(255,255,255,0.06); }
        .nav-link.active { color: #fff; background: rgba(255,255,255,0.08); }
        .nav-divider { width: 1px; height: 16px; background: rgba(255,255,255,0.1); margin: 0 4px; }
        .nav-open { padding: 7px 18px; border-radius: 999px; font-size: 14px; font-weight: 600; color: #fff; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.12); text-decoration: none; transition: background 0.2s, border-color 0.2s; white-space: nowrap; }
        .nav-open:hover { background: rgba(255,255,255,0.16); border-color: rgba(255,255,255,0.2); }

        /* hero cards */
        .hero-card { width: 190px; border-radius: 18px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); overflow: hidden; animation: cardFloat 5s ease-in-out infinite; transition: transform 0.3s, border-color 0.3s; }
        .hero-card:hover { transform: translateY(-6px) !important; border-color: rgba(255,255,255,0.15); }
        .hero-card:nth-child(2) { animation-delay: 0.8s; margin-top: -20px; }
        .hero-card:nth-child(3) { animation-delay: 1.6s; }
        @keyframes cardFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .hero-card-img-wrap { position: relative; width: 100%; height: 130px; overflow: hidden; }
        .hero-card-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .hero-card-fav { position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; border-radius: 8px; background: rgba(0,0,0,0.45); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; }
        .hero-card-body { padding: 12px 14px 14px; }
        .hero-card-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.9); margin-bottom: 4px; }
        .hero-card-price { font-size: 15px; font-weight: 700; margin-bottom: 10px; }
        .hero-card-btn { display: flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 10px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.85); cursor: pointer; justify-content: center; }

        /* section divider */
        .divider { display: flex; align-items: center; gap: 20px; max-width: 700px; margin: 0 auto; padding: 0 24px; }
        .divider-line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent); }
        .divider-dot { width: 4px; height: 4px; border-radius: 50%; background: rgba(255,255,255,0.2); }

        /* hero */
        .hero { position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 160px 24px 60px; overflow: hidden; background: transparent; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        .hero-title { font-size: clamp(40px, 7vw, 80px); font-weight: 800; line-height: 1.05; letter-spacing: -2px; text-align: center; max-width: 800px; margin-bottom: 24px; }
        .hero-title .grad { background: linear-gradient(135deg, #fff 30%, #93c5fd 70%, #818cf8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero-sub { font-size: clamp(16px, 2.5vw, 20px); color: rgba(255,255,255,0.5); text-align: center; max-width: 520px; line-height: 1.6; margin-bottom: 44px; }
        .hero-actions { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; margin-bottom: 72px; }
        .btn-primary { padding: 14px 32px; border-radius: 14px; background: linear-gradient(135deg, #3b82f6, #6366f1); color: #fff; font-size: 16px; font-weight: 600; text-decoration: none; transition: all 0.2s; }
        .btn-primary:hover { transform: translateY(-2px); }
        .btn-secondary { padding: 14px 32px; border-radius: 14px; background: #1c1c1e; border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.85); font-size: 16px; font-weight: 600; text-decoration: none; transition: all 0.2s; }
        .btn-secondary:hover { background: #242426; border-color: rgba(255,255,255,0.18); transform: translateY(-2px); }
        .hero-illustration { width: 100%; max-width: 560px; animation: floatIllustration 6s ease-in-out infinite; }
        @keyframes floatIllustration { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }

        /* fade-in */
        .fade-in { transition: opacity 0.8s ease, transform 0.8s ease; }

        /* stats */
        .stats-section { padding: 60px 24px; display: flex; justify-content: center; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; max-width: 700px; width: 100%; background: rgba(255,255,255,0.05); border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.07); }
        .stat-item { padding: 32px 24px; background: rgba(255,255,255,0.02); text-align: center; transition: all 0.6s; }
        .stat-value { display: block; font-size: clamp(28px, 5vw, 44px); font-weight: 800; background: linear-gradient(135deg, #fff, #93c5fd); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing: -1px; }
        .stat-label { display: block; font-size: 13px; color: rgba(255,255,255,0.4); margin-top: 6px; }

        /* features */
        .features-section { padding: 80px 24px; max-width: 1200px; margin: 0 auto; }
        .section-label { font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.3); margin-bottom: 12px; text-align: center; }
        .section-title { font-size: clamp(28px, 4vw, 48px); font-weight: 800; text-align: center; letter-spacing: -1px; margin-bottom: 16px; }
        .section-sub { font-size: 16px; color: rgba(255,255,255,0.45); text-align: center; max-width: 480px; margin: 0 auto 56px; line-height: 1.6; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1px; background: rgba(255,255,255,0.06); border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); }
        .feature-card { padding: 36px 32px; background: #0d0d10; transition: all 0.5s ease, background 0.3s; position: relative; overflow: hidden; }
        .feature-card::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 0% 0%, rgba(255,255,255,0.03) 0%, transparent 60%); opacity: 0; transition: opacity 0.3s; pointer-events: none; }
        .feature-card:hover { background: #111116; }
        .feature-card:hover::before { opacity: 1; }
        .feature-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; opacity: 0.85; }
        .feature-title { font-size: 16px; font-weight: 700; margin-bottom: 10px; color: rgba(255,255,255,0.95); letter-spacing: -0.2px; }
        .feature-desc { font-size: 14px; color: rgba(255,255,255,0.38); line-height: 1.65; }

        /* how it works */
        .how-section { padding: 80px 24px; max-width: 900px; margin: 0 auto; }
        .steps-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; background: rgba(255,255,255,0.05); border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); }
        .step-item { padding: 36px 28px; background: #0d0d10; display: flex; flex-direction: column; gap: 0; transition: background 0.3s; position: relative; }
        .step-item:hover { background: #111116; }
        .step-connector { display: none; }
        .step-num { font-size: 42px; font-weight: 800; color: rgba(255,255,255,0.08); margin-bottom: 16px; line-height: 1; font-variant-numeric: tabular-nums; letter-spacing: -2px; font-family: Georgia, 'Times New Roman', serif; }
        .step-title { font-size: 16px; font-weight: 700; margin-bottom: 10px; color: rgba(255,255,255,0.95); letter-spacing: -0.2px; }
        .step-desc { font-size: 14px; color: rgba(255,255,255,0.38); line-height: 1.65; }
        @media (max-width: 640px) { .steps-list { grid-template-columns: 1fr; } }

        /* cta */
        .cta-section { padding: 80px 24px 100px; }
        .cta-card { max-width: 1200px; margin: 0 auto; width: 100%; padding: 80px 60px; border-radius: 28px; background: #0d0d10; border: 1px solid rgba(255,255,255,0.07); text-align: center; position: relative; overflow: hidden; }
        .cta-card::before { content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 600px; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent); }
        .cta-card::after { content: ''; position: absolute; top: -120px; left: 50%; transform: translateX(-50%); width: 400px; height: 400px; background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%); pointer-events: none; }
        .cta-eyebrow { font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.25); margin-bottom: 20px; }
        .cta-title { font-size: clamp(32px, 5vw, 56px); font-weight: 800; letter-spacing: -2px; margin-bottom: 18px; line-height: 1.05; color: #fff; }
        .cta-sub { font-size: 17px; color: rgba(255,255,255,0.38); margin-bottom: 44px; line-height: 1.65; max-width: 480px; margin-left: auto; margin-right: auto; }
        .cta-actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
        .cta-divider { width: 40px; height: 1px; background: rgba(255,255,255,0.1); margin: 0 auto 32px; }

        /* marquee */
        .marquee-section { padding: 0; overflow: hidden; border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.01); }
        .marquee-track { display: flex; gap: 0; animation: marqueeScroll 28s linear infinite; width: max-content; }
        .marquee-track:hover { animation-play-state: paused; }
        .marquee-item { display: flex; align-items: center; gap: 10px; padding: 14px 32px; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.3); white-space: nowrap; border-right: 1px solid rgba(255,255,255,0.05); }
        .marquee-item svg { opacity: 0.4; flex-shrink: 0; }
        @keyframes marqueeScroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }

        /* bento */
        .bento-section { padding: 0 24px 80px; max-width: 1200px; margin: 0 auto; }
        .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: auto auto; gap: 12px; }
        .bento-card { border-radius: 20px; background: #0d0d10; border: 1px solid rgba(255,255,255,0.07); padding: 28px; position: relative; overflow: hidden; transition: border-color 0.3s, background 0.3s; }
        .bento-card:hover { border-color: rgba(255,255,255,0.13); background: #111116; }
        .bento-card::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent); }
        .bento-wide { grid-column: span 2; }
        .bento-tall { grid-row: span 2; }
        .bento-label { font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,0.25); margin-bottom: 12px; }
        .bento-title { font-size: 20px; font-weight: 700; letter-spacing: -0.4px; margin-bottom: 8px; color: rgba(255,255,255,0.95); }
        .bento-desc { font-size: 14px; color: rgba(255,255,255,0.38); line-height: 1.6; }
        .bento-visual { margin-top: 20px; border-radius: 12px; overflow: hidden; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); }
        .bento-stat-big { font-size: 52px; font-weight: 800; letter-spacing: -3px; background: linear-gradient(135deg, #fff 40%, rgba(255,255,255,0.4)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1; margin: 16px 0 8px; }
        .bento-tag { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 8px; }
        @media (max-width: 768px) { .bento-grid { grid-template-columns: 1fr; } .bento-wide { grid-column: span 1; } .bento-tall { grid-row: span 1; } }
        .footer { padding: 32px 24px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; flex-wrap: gap; gap: 16px; max-width: 1100px; margin: 0 auto; }
        .footer-copy { font-size: 13px; color: rgba(255,255,255,0.25); }
        .footer-links { display: flex; gap: 24px; }
        .footer-link { font-size: 13px; color: rgba(255,255,255,0.35); text-decoration: none; transition: color 0.2s; }
        .footer-link:hover { color: rgba(255,255,255,0.7); }

        /* animated scan line on hero */
        .scan-line { position: absolute; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent); animation: scanLine 4s ease-in-out infinite; pointer-events: none; }
        @keyframes scanLine { 0%{top:20%;opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{top:80%;opacity:0} }

        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: 1fr; }
          .hero-title { letter-spacing: -1px; }
          .cta-card { padding: 48px 24px; }
          .footer { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      {/* NAV */}
      <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
        <div className="nav-inner">
          <a href="#features" className="nav-link">Возможности</a>
          <a href="#how" className="nav-link">Как работает</a>
          <div className="nav-divider" />
          <a href={APP_URL} className="nav-open">Открыть</a>
        </div>
      </nav>

      <Starfield />

      {/* HERO */}
      <section className="hero">
        <div className="scan-line" />

        <div className="fade-in" style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(20px)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          <h1 className="hero-title">
            <span className="grad">Выкладывай, покупай,</span>
            <br />продавай.
          </h1>

          <p className="hero-sub">
            hw-project — современная площадка для покупки и продажи товаров. Удобно, быстро, безопасно.
          </p>

          <div className="hero-actions">
            <a href="#features" className="btn-secondary">Узнать больше</a>
          </div>

          <div className="hero-illustration">
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats-section">
        <div className="stats-grid">
          <StatItem value="PWA" label="Работает как приложение" />
          <StatItem value="0₽" label="Бесплатная регистрация" />
          <StatItem value="∞" label="Объявлений без лимита" />
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-section">
        <div className="marquee-track">
          {[...Array(2)].map((_, ri) => (
            <div key={ri} style={{ display: 'flex' }}>
              {[
                { icon: <svg width="14" height="14" viewBox="0 0 21 22" fill="none"><path d="M13.6499 7.69978V4.94979C13.6499 3.12725 12.2396 1.64978 10.4999 1.64978C8.76024 1.64978 7.34991 3.12725 7.34991 4.94978V7.69978M4.13628 20.3498H16.8635C17.9882 20.3498 18.8999 19.4124 18.8999 18.2561L17.5954 7.14975C17.5954 5.99345 16.6836 5.05608 15.559 5.05608H5.18628C4.06163 5.05608 3.14991 5.99345 3.14991 7.14975L2.09991 18.2561C2.09991 19.4124 3.01163 20.3498 4.13628 20.3498Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: 'Объявления' },
                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: 'Чат' },
                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: 'Отзывы' },
                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M8.7899 6.48395H14.2066M11.5 15.1936L17.1669 20.2558C17.4891 20.5436 18 20.3149 18 19.8829V5C18 3.89543 17.1046 3 16 3H7C5.89543 3 5 3.89543 5 5V19.8829C5 20.3149 5.51092 20.5436 5.8331 20.2558L11.5 15.1936Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: 'Избранное' },
                { icon: <svg width="14" height="14" viewBox="0 0 24 23" fill="none"><path d="M21.8333 6.61841L14.8334 0.83932C14.1917 0.29881 13.3609 0 12.5 0C11.6392 0 10.8084 0.29881 10.1667 0.83932L3.16677 6.61841C2.7962 6.93051 2.50049 7.31338 2.29933 7.74153C2.09817 8.16968 1.99617 8.63327 2.00011 9.10142V18.7039C2.00011 19.5782 2.36887 20.4165 3.02523 21.0346C3.6816 21.6527 4.57184 22 5.50008 22H19.5C20.4282 22 21.3185 21.6527 21.9748 21.0346C22.6312 20.4165 23 19.5782 23 18.7039V9.09043C23.0023 8.62413 22.8994 8.16266 22.6984 7.73652C22.4972 7.31039 22.2024 6.92928 21.8333 6.61841Z" fill="white" fillOpacity="0.8"/></svg>, label: 'Магазины' },
                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M2.3999 21.6V19.4667M8.7999 21.6V14.1333M15.1999 21.6V8.79999M21.5999 21.6V2.39999" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: 'Аналитика' },
                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4.7999 15.5999L8.9999 19.1999M4.1999 15.5999L16.0313 3.35533C17.3052 2.08143 19.3706 2.08143 20.6445 3.35533C21.9184 4.62923 21.9184 6.69463 20.6445 7.96853L8.3999 19.7999L2.3999 21.5999L4.1999 15.5999Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: 'Редактирование' },
                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9.78133 3.89027C10.3452 3.40974 10.6271 3.16948 10.9219 3.02859C11.6037 2.70271 12.3963 2.70271 13.0781 3.02859C13.3729 3.16948 13.6548 3.40974 14.2187 3.89027" stroke="white" strokeWidth="1.5"/><path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: 'Верификация' },
                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4.7999 15.5999L8.9999 19.1999M4.1999 15.5999L16.0313 3.35533C17.3052 2.08143 19.3706 2.08143 20.6445 3.35533C21.9184 4.62923 21.9184 6.69463 20.6445 7.96853L8.3999 19.7999L2.3999 21.5999L4.1999 15.5999Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: 'Продвижение' },
              ].map((item, i) => (
                <div key={i} className="marquee-item">
                  {item.icon}
                  {item.label}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* BENTO */}
      <div className="divider" style={{ margin: '60px auto 40px' }}><div className="divider-line"/><div className="divider-dot"/><div className="divider-dot"/><div className="divider-dot"/><div className="divider-line"/></div>
      <section className="bento-section">
        <div className="bento-grid">
          {/* Wide card — PWA */}
          <div className="bento-card bento-wide">
            <div className="bento-label">Технология</div>
            <div className="bento-title">Работает как приложение</div>
            <div className="bento-desc">Добавь на главный экран телефона — hw-project запускается без браузера, как нативное приложение. Никакой установки из магазина.</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
              {['PWA', 'iOS', 'Android', 'Offline-ready'].map(t => (
                <span key={t} className="bento-tag">{t}</span>
              ))}
            </div>
          </div>

          {/* Tall card — stats */}
          <div className="bento-card bento-tall">
            <div className="bento-label">Доступность</div>
            <div className="bento-title">Бесплатно</div>
            <div className="bento-stat-big">0₽</div>
            <div className="bento-desc">Регистрация, публикация объявлений и общение — полностью бесплатно.</div>
            <div style={{ marginTop: 32 }}>
              <div className="bento-label">Объявлений</div>
              <div className="bento-stat-big">∞</div>
              <div className="bento-desc">Без лимитов на количество публикаций.</div>
            </div>
          </div>

          {/* Card — chat */}
          <div className="bento-card">
            <div className="bento-label">Коммуникация</div>
            <div className="bento-title">Встроенный чат</div>
            <div className="bento-desc">Общайся с покупателями прямо на сайте — без Telegram и WhatsApp.</div>
          </div>

          {/* Card — safety */}
          <div className="bento-card">
            <div className="bento-label">Безопасность</div>
            <div className="bento-title">Верификация продавцов</div>
            <div className="bento-desc">Рейтинги, отзывы и значки верификации помогают выбирать надёжных продавцов.</div>
          </div>

          {/* Card — promote */}
          <div className="bento-card">
            <div className="bento-label">Рост</div>
            <div className="bento-title">Продвижение</div>
            <div className="bento-desc">Подними объявление в топ — больше просмотров, быстрее продажа.</div>
          </div>
        </div>
      </section>
      <div className="divider"><div className="divider-line"/><div className="divider-dot"/><div className="divider-dot"/><div className="divider-dot"/><div className="divider-line"/></div>
      <section className="features-section" id="features">
        <p className="section-label">Возможности</p>
        <h2 className="section-title">Всё что нужно для торговли</h2>
        <p className="section-sub">Простой интерфейс, мощные инструменты и безопасные сделки в одном месте.</p>

        <div className="features-grid">
          <FeatureCard delay={0} icon={
            <svg width="22" height="22" viewBox="0 0 21 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.6499 7.69978V4.94979C13.6499 3.12725 12.2396 1.64978 10.4999 1.64978C8.76024 1.64978 7.34991 3.12725 7.34991 4.94978V7.69978M4.13628 20.3498H16.8635C17.9882 20.3498 18.8999 19.4124 18.8999 18.2561L17.5954 7.14975C17.5954 5.99345 16.6836 5.05608 15.559 5.05608H5.18628C4.06163 5.05608 3.14991 5.99345 3.14991 7.14975L2.09991 18.2561C2.09991 19.4124 3.01163 20.3498 4.13628 20.3498Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          } title="Объявления" desc="Публикуй товары за секунды. Добавляй фото, описание и цену — всё интуитивно." />

          <FeatureCard delay={80} icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.7899 6.48395H14.2066M11.5 15.1936L17.1669 20.2558C17.4891 20.5436 18 20.3149 18 19.8829V5C18 3.89543 17.1046 3 16 3H7C5.89543 3 5 3.89543 5 5V19.8829C5 20.3149 5.51092 20.5436 5.8331 20.2558L11.5 15.1936Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          } title="Избранное" desc="Сохраняй понравившиеся товары и возвращайся к ним в любой момент." />

          <FeatureCard delay={160} icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.78133 3.89027C10.3452 3.40974 10.6271 3.16948 10.9219 3.02859C11.6037 2.70271 12.3963 2.70271 13.0781 3.02859C13.3729 3.16948 13.6548 3.40974 14.2187 3.89027C14.4431 4.08152 14.5553 4.17715 14.6752 4.25747C14.9499 4.4416 15.2584 4.56939 15.5828 4.63344C15.7244 4.66139 15.8713 4.67312 16.1653 4.69657C16.9038 4.7555 17.273 4.78497 17.5811 4.89378C18.2936 5.14546 18.8541 5.70591 19.1058 6.41844C19.2146 6.72651 19.244 7.09576 19.303 7.83426C19.3264 8.12819 19.3381 8.27515 19.3661 8.41669C19.4301 8.74114 19.5579 9.04965 19.7421 9.32437C19.8224 9.44421 19.918 9.55642 20.1093 9.78084C20.5898 10.3447 20.8301 10.6267 20.971 10.9214C21.2968 11.6032 21.2968 12.3958 20.971 13.0776C20.8301 13.3724 20.5898 13.6543 20.1093 14.2182C19.918 14.4426 19.8224 14.5548 19.7421 14.6747C19.5579 14.9494 19.4301 15.2579 19.3661 15.5824C19.3381 15.7239 19.3264 15.8709 19.303 16.1648C19.244 16.9033 19.2146 17.2725 19.1058 17.5806C18.8541 18.2931 18.2936 18.8536 17.5811 19.1053C17.273 19.2141 16.9038 19.2435 16.1653 19.3025C15.8713 19.3259 15.7244 19.3377 15.5828 19.3656C15.2584 19.4297 14.9499 19.5574 14.6752 19.7416C14.5553 19.8219 14.4431 19.9175 14.2187 20.1088C13.6548 20.5893 13.3729 20.8296 13.0781 20.9705C12.3963 21.2963 11.6037 21.2963 10.9219 20.9705C10.6271 20.8296 10.3452 20.5893 9.78133 20.1088C9.55691 19.9175 9.44469 19.8219 9.32485 19.7416C9.05014 19.5574 8.74163 19.4297 8.41718 19.3656C8.27564 19.3377 8.12868 19.3259 7.83475 19.3025C7.09625 19.2435 6.72699 19.2141 6.41893 19.1053C5.7064 18.8536 5.14594 18.2931 4.89427 17.5806C4.78546 17.2725 4.75599 16.9033 4.69706 16.1648C4.6736 15.8709 4.66188 15.7239 4.63393 15.5824C4.56988 15.2579 4.44209 14.9494 4.25796 14.6747C4.17764 14.5548 4.08201 14.4426 3.89076 14.2182C3.41023 13.6543 3.16997 13.3724 3.02907 13.0776C2.7032 12.3958 2.7032 11.6032 3.02907 10.9214C3.16997 10.6266 3.41023 10.3447 3.89076 9.78084C4.08201 9.55642 4.17764 9.44421 4.25796 9.32437C4.44209 9.04965 4.56988 8.74114 4.63393 8.41669C4.66188 8.27515 4.6736 8.12819 4.69706 7.83426C4.75599 7.09576 4.78546 6.72651 4.89427 6.41844C5.14594 5.70591 5.7064 5.14546 6.41893 4.89378C6.72699 4.78497 7.09625 4.7555 7.83475 4.69657C8.12868 4.67312 8.27564 4.66139 8.41718 4.63344C8.74163 4.56939 9.05014 4.4416 9.32485 4.25747C9.4447 4.17715 9.55691 4.08152 9.78133 3.89027Z" stroke="white" strokeWidth="1.5"/>
              <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          } title="Верификация" desc="Система рейтингов и верифицированных продавцов для безопасных сделок." />

          <FeatureCard delay={240} icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.3999 21.6V19.4667M8.7999 21.6V14.1333M15.1999 21.6V8.79999M21.5999 21.6V2.39999" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          } title="Аналитика" desc="Следи за просмотрами и активностью своих объявлений в реальном времени." />

          <FeatureCard delay={320} icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.7999 15.5999L8.9999 19.1999M4.1999 15.5999L16.0313 3.35533C17.3052 2.08143 19.3706 2.08143 20.6445 3.35533C21.9184 4.62923 21.9184 6.69463 20.6445 7.96853L8.3999 19.7999L2.3999 21.5999L4.1999 15.5999Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          } title="Редактирование" desc="Изменяй объявления в любой момент — цена, фото, описание без ограничений." />

          <FeatureCard delay={400} icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M11.4545 2.2256C11.7558 1.9248 12.2442 1.9248 12.5455 2.2256L13.0598 2.73911L15.6312 5.30668C15.9325 5.60749 15.9325 6.0952 15.6312 6.39601C15.3299 6.69682 14.8415 6.69682 14.5402 6.39601L12.7714 4.62986V12.0135C12.7714 12.4389 12.426 12.7838 12 12.7838C11.574 12.7838 11.2286 12.4389 11.2286 12.0135V4.62986L9.45977 6.39601C9.15851 6.69682 8.67007 6.69682 8.3688 6.39601C8.06754 6.0952 8.06754 5.60749 8.3688 5.30668L10.9402 2.73911L11.4545 2.2256ZM4.8 9.7027C4.65798 9.7027 4.54286 9.81765 4.54286 9.95945V19.2027C4.54286 19.3445 4.65798 19.4595 4.8 19.4595H19.2C19.342 19.4595 19.4571 19.3445 19.4571 19.2027V9.95945C19.4571 9.81765 19.342 9.7027 19.2 9.7027H16.1143C15.6882 9.7027 15.3429 9.35783 15.3429 8.93242C15.3429 8.50702 15.6882 8.16215 16.1143 8.16215H19.2C20.1941 8.16215 21 8.96683 21 9.95945V19.2027C21 20.1953 20.1941 21 19.2 21H4.8C3.80589 21 3 20.1953 3 19.2027V9.95945C3 8.96683 3.80589 8.16215 4.8 8.16215H7.88571C8.31176 8.16215 8.65714 8.50702 8.65714 8.93242C8.65714 9.35783 8.31176 9.7027 7.88571 9.7027H4.8Z" fill="white" fillOpacity="0.85"/>
            </svg>
          } title="Поделиться" desc="Делись объявлениями с друзьями — прямая ссылка на любой товар." />

          <FeatureCard delay={480} icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.29 15.29C11.247 15.3375 11.2069 15.3876 11.17 15.44C11.1322 15.4957 11.1019 15.5563 11.08 15.62C11.0512 15.6767 11.031 15.7374 11.02 15.8C11.0151 15.8666 11.0151 15.9334 11.02 16C11.0166 16.1312 11.044 16.2613 11.1 16.38C11.1449 16.5041 11.2166 16.6168 11.3099 16.7101C11.4032 16.8034 11.5159 16.8751 11.64 16.92C11.7597 16.9729 11.8891 17.0002 12.02 17.0002C12.1509 17.0002 12.2803 16.9729 12.4 16.92C12.5241 16.8751 12.6368 16.8034 12.7301 16.7101C12.8234 16.6168 12.8951 16.5041 12.94 16.38C12.9844 16.2584 13.0048 16.1294 13 16C13.0008 15.8684 12.9755 15.7379 12.9258 15.6161C12.876 15.4943 12.8027 15.3834 12.71 15.29C12.617 15.1963 12.5064 15.1219 12.3846 15.0711C12.2627 15.0203 12.132 14.9942 12 14.9942C11.868 14.9942 11.7373 15.0203 11.6154 15.0711C11.4936 15.1219 11.383 15.1963 11.29 15.29ZM12 2C10.0222 2 8.08879 2.58649 6.4443 3.6853C4.79981 4.78412 3.51809 6.3459 2.76121 8.17317C2.00433 10.0004 1.8063 12.0111 2.19215 13.9509C2.578 15.8907 3.53041 17.6725 4.92894 19.0711C6.32746 20.4696 8.10929 21.422 10.0491 21.8079C11.9889 22.1937 13.9996 21.9957 15.8268 21.2388C17.6541 20.4819 19.2159 19.2002 20.3147 17.5557C21.4135 15.9112 22 13.9778 22 12C22 10.6868 21.7413 9.38642 21.2388 8.17317C20.7363 6.95991 19.9997 5.85752 19.0711 4.92893C18.1425 4.00035 17.0401 3.26375 15.8268 2.7612C14.6136 2.25866 13.3132 2 12 2ZM12 20C10.4178 20 8.87104 19.5308 7.55544 18.6518C6.23985 17.7727 5.21447 16.5233 4.60897 15.0615C4.00347 13.5997 3.84504 11.9911 4.15372 10.4393C4.4624 8.88743 5.22433 7.46197 6.34315 6.34315C7.46197 5.22433 8.88743 4.4624 10.4393 4.15372C11.9911 3.84504 13.5997 4.00346 15.0615 4.60896C16.5233 5.21447 17.7727 6.23984 18.6518 7.55544C19.5308 8.87103 20 10.4177 20 12C20 14.1217 19.1572 16.1566 17.6569 17.6569C16.1566 19.1571 14.1217 20 12 20ZM12 7C11.4731 6.99966 10.9553 7.13812 10.4989 7.40144C10.0425 7.66476 9.66347 8.04366 9.4 8.5C9.32765 8.61382 9.27907 8.7411 9.25718 8.87418C9.23529 9.00726 9.24055 9.14339 9.27263 9.27439C9.30472 9.40538 9.36297 9.52854 9.44389 9.63643C9.52481 9.74433 9.62671 9.83475 9.74348 9.90224C9.86024 9.96974 9.98945 10.0129 10.1233 10.0292C10.2572 10.0454 10.393 10.0345 10.5225 9.99688C10.6521 9.9593 10.7727 9.89591 10.8771 9.81052C10.9814 9.72513 11.0675 9.6195 11.13 9.5C11.2181 9.3474 11.345 9.22078 11.4978 9.13298C11.6505 9.04518 11.8238 8.9993 12 9C12.2652 9 12.5196 9.10536 12.7071 9.29289C12.8946 9.48043 13 9.73478 13 10C13 10.2652 12.8946 10.5196 12.7071 10.7071C12.5196 10.8946 12.2652 11 12 11C11.7348 11 11.4804 11.1054 11.2929 11.2929C11.1054 11.4804 11 11.7348 11 12V13C11 13.2652 11.1054 13.5196 11.2929 13.7071C11.4804 13.8946 11.7348 14 12 14C12.2652 14 12.5196 13.8946 12.7071 13.7071C12.8946 13.5196 13 13.2652 13 13V12.82C13.6614 12.58 14.2174 12.1152 14.5708 11.5069C14.9242 10.8985 15.0525 10.1853 14.9334 9.49189C14.8143 8.79849 14.4552 8.16902 13.919 7.71352C13.3828 7.25801 12.7035 7.00546 12 7Z" fill="white" fillOpacity="0.8"/>
            </svg>
          } title="Поддержка" desc="Служба поддержки всегда на связи — пиши напрямую из приложения." />

          <FeatureCard delay={560} icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="19" cy="5" r="3" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.2"/>
              <path d="M18 5L18.8 5.8L20.2 4.2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          } title="Украшения профиля" desc="Выделяйся среди других — уникальные рамки, значки и декорации для твоего профиля." />

          <FeatureCard delay={640} icon={
            <svg width="22" height="22" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.8333 6.61841L14.8334 0.83932C14.1917 0.29881 13.3609 0 12.5 0C11.6392 0 10.8084 0.29881 10.1667 0.83932L3.16677 6.61841C2.7962 6.93051 2.50049 7.31338 2.29933 7.74153C2.09817 8.16968 1.99617 8.63327 2.00011 9.10142V18.7039C2.00011 19.5782 2.36887 20.4165 3.02523 21.0346C3.6816 21.6527 4.57184 22 5.50008 22H19.5C20.4282 22 21.3185 21.6527 21.9748 21.0346C22.6312 20.4165 23 19.5782 23 18.7039V9.09043C23.0023 8.62413 22.8994 8.16266 22.6984 7.73652C22.4972 7.31039 22.2024 6.92928 21.8333 6.61841ZM14.8334 19.8026H10.1667V14.3092C10.1667 14.0178 10.2897 13.7383 10.5084 13.5323C10.7272 13.3263 11.024 13.2105 11.3334 13.2105H13.6667C13.9761 13.2105 14.2729 13.3263 14.4916 13.5323C14.7104 13.7383 14.8334 14.0178 14.8334 14.3092V19.8026ZM20.6666 18.7039C20.6666 18.9953 20.5437 19.2748 20.3249 19.4808C20.1062 19.6869 19.8094 19.8026 19.5 19.8026H17.1667V14.3092C17.1667 13.4351 16.7979 12.5967 16.1415 11.9785C15.4852 11.3604 14.5949 11.0131 13.6667 11.0131H11.3334C10.4051 11.0131 9.51489 11.3604 8.85852 11.9785C8.20214 12.5967 7.8334 13.4351 7.8334 14.3092V19.8026H5.50008C5.19067 19.8026 4.89392 19.6869 4.67514 19.4808C4.45635 19.2748 4.33343 18.9953 4.33343 18.7039V9.09043C4.33364 8.93442 4.36913 8.78028 4.43752 8.63821C4.50592 8.49613 4.60565 8.3694 4.7301 8.26644L11.73 2.49834C11.943 2.32219 12.2167 2.22505 12.5 2.22505C12.7834 2.22505 13.0571 2.32219 13.27 2.49834L20.27 8.26644C20.3945 8.3694 20.4942 8.49613 20.5626 8.63821C20.6309 8.78028 20.6664 8.93442 20.6666 9.09043V18.7039Z" fill="white" fillOpacity="0.8"/>
            </svg>
          } title="Свой магазин" desc="Создай собственный магазин, добавь аватар и публикуй товары от его имени." />

          <FeatureCard delay={720} icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 10h8M8 13h5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          } title="Чат на сайте" desc="Переписывайся с продавцами и покупателями прямо на сайте — без сторонних мессенджеров." />

          <FeatureCard delay={800} icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          } title="Отзывы продавцам" desc="Оставляй отзывы после сделки — помогай другим выбирать проверенных продавцов." />

          <FeatureCard delay={880} icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h18z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M9.4 8H7.4L4.2 16h2.154l.4-1h3.29l.4 1h2.155L9.4 8zm-1.848 5L8.4 10.885 9.244 13H7.552zM19 8h-2v2h-1a3 3 0 0 0 0 6h3V8zm-2 4v2h-1a1 1 0 0 1 0-2h1z" fill="white" fillOpacity="0.85"/>
            </svg>
          } title="Продвижение" desc="Купи продвижение для объявления — больше просмотров и быстрее найдёшь покупателя." />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <div className="divider"><div className="divider-line"/><div className="divider-dot"/><div className="divider-dot"/><div className="divider-dot"/><div className="divider-line"/></div>
      <section className="how-section" id="how">
        <p className="section-label">Как это работает</p>
        <h2 className="section-title">Три шага до сделки</h2>
        <p className="section-sub">Начать торговать проще, чем кажется.</p>

        <div className="steps-list">
          <StepItem num="1" title="Зарегистрируйся" desc="Создай аккаунт за 30 секунд — только никнейм и пароль, без лишних данных." />
          <StepItem num="2" title="Добавь способ связи" desc="В настройках укажи телефон, Telegram или другой контакт — покупатели смогут написать тебе." />
          <StepItem num="3" title="Опубликуй товар" desc="Добавь фото, напиши описание и укажи цену. Объявление появится сразу." />
        </div>
      </section>

      {/* CTA */}
      <div className="divider"><div className="divider-line"/><div className="divider-dot"/><div className="divider-dot"/><div className="divider-dot"/><div className="divider-line"/></div>
      <section className="cta-section">
        <div className="cta-card">
          <p className="cta-eyebrow">hw-project</p>
          <div className="cta-divider" />
          <h2 className="cta-title">Выкладывай.<br/>Покупай.<br/>Продавай.</h2>
          <p className="cta-sub">Маркетплейс, который работает как приложение прямо в браузере — без установки.</p>
          <div className="cta-actions">
            <a href={APP_URL} className="btn-primary">Открыть маркетплейс</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 24px' }}>
        <div className="footer">
          <span className="footer-copy">© 2026 hw-project. Все права защищены.</span>
          <div className="footer-links">
            <a href={APP_URL} className="footer-link">Приложение</a>
            <a href="https://t.me/olcc_hw-project" className="footer-link" target="_blank" rel="noopener noreferrer">Telegram</a>
          </div>
        </div>
      </footer>
    </>
  )
}
