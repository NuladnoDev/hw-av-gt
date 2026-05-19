'use client'
import { motion } from 'motion/react'

// ── Shared helpers ────────────────────────────────────────────────────────────
function FloatWrap({ children, duration = 3 }: { children: React.ReactNode; duration?: number }) {  return (
    <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}>
      {children}
    </motion.g>
  )
}
function Sparkles({ color = 'rgba(255,255,255,0.9)', pts }: { color?: string; pts: { cx: number; cy: number; r: number; d: number }[] }) {
  return <>
    {pts.map((p, i) => (
      <motion.circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={color}
        animate={{ opacity: [0, 1, 0], scale: [0.4, 1.5, 0.4] }}
        transition={{ duration: 2.2, repeat: Infinity, delay: p.d, ease: 'easeInOut' }} />
    ))}
  </>
}

// ── Crystal ──────────────────────────────────────────────────────────────────
export function CrystalVisual({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <filter id="blur_crystal" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="softglow_crystal" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <ellipse cx="60" cy="88" rx="28" ry="8" fill="rgba(255,255,255,0.07)" filter="url(#blur_crystal)" />
      <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} style={{ transformOrigin: '60px 60px' }}>
        <motion.ellipse cx="60" cy="90" rx="18" ry="4" fill="rgba(0,0,0,0.35)" animate={{ scaleX: [1, 0.85, 1], opacity: [0.35, 0.15, 0.35] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
        <polygon points="60,22 38,50 60,44" fill="rgba(255,255,255,0.95)" filter="url(#softglow_crystal)" />
        <polygon points="60,22 82,50 60,44" fill="rgba(255,255,255,0.75)" />
        <polygon points="60,22 38,50 28,42" fill="rgba(255,255,255,0.55)" />
        <polygon points="60,22 82,50 92,42" fill="rgba(255,255,255,0.40)" />
        <polygon points="28,42 38,50 60,44 82,50 92,42 60,22" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" />
        <polygon points="38,50 28,42 32,68 60,82 88,68 92,42 82,50 60,44" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" />
        <polygon points="38,50 60,44 60,82" fill="rgba(255,255,255,0.22)" />
        <polygon points="82,50 60,44 60,82" fill="rgba(255,255,255,0.12)" />
        <polygon points="38,50 32,68 60,82" fill="rgba(255,255,255,0.30)" />
        <polygon points="82,50 88,68 60,82" fill="rgba(255,255,255,0.18)" />
        <polygon points="32,68 28,42 38,50 60,82" fill="rgba(255,255,255,0.10)" />
        <polygon points="88,68 92,42 82,50 60,82" fill="rgba(255,255,255,0.08)" />
        <polygon points="32,68 60,82 88,68 82,50 38,50" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" />
        <motion.polygon points="60,26 50,42 60,38" fill="rgba(255,255,255,0.7)" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
        <polygon points="60,26 70,42 60,38" fill="rgba(255,255,255,0.35)" />
      </motion.g>
      {[{ cx: 22, cy: 30, r: 1.8, delay: 0 }, { cx: 96, cy: 38, r: 1.4, delay: 0.6 }, { cx: 18, cy: 62, r: 1.2, delay: 1.1 }, { cx: 100, cy: 65, r: 1.6, delay: 0.3 }, { cx: 50, cy: 14, r: 1.3, delay: 0.8 }, { cx: 74, cy: 16, r: 1.0, delay: 1.4 }].map((p, i) => (
        <motion.circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill="rgba(255,255,255,0.9)" animate={{ opacity: [0, 1, 0], scale: [0.5, 1.4, 0.5] }} transition={{ duration: 2.2, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }} />
      ))}
      <motion.g animate={{ opacity: [0.3, 1, 0.3], rotate: [0, 45, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} style={{ transformOrigin: '60px 14px' }}>
        <line x1="60" y1="10" x2="60" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="56" y1="14" x2="64" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </motion.g>
    </svg>
  )
}

// ── Rose ─────────────────────────────────────────────────────────────────────
export function RoseVisual({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <filter id="rose_glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="rose_sh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      </defs>
      <ellipse cx="60" cy="93" rx="22" ry="5" fill="rgba(255,80,120,0.12)" filter="url(#rose_sh)"/>
      <FloatWrap duration={3.2}>
        <motion.ellipse cx="60" cy="91" rx="16" ry="3" fill="rgba(0,0,0,0.25)"
          animate={{ scaleX:[1,0.8,1], opacity:[0.25,0.1,0.25] }} transition={{ duration:3.2, repeat:Infinity, ease:'easeInOut' }}/>
        {/* Stem */}
        <rect x="57" y="72" width="6" height="22" rx="3" fill="#2ecc71"/>
        {/* Leaf */}
        <path d="M60,82 Q50,76 52,68 Q58,74 60,82Z" fill="#27ae60"/>
        <path d="M60,82 Q70,76 68,68 Q62,74 60,82Z" fill="#2ecc71" opacity="0.8"/>
        {/* Petals outer */}
        <motion.ellipse cx="60" cy="52" rx="14" ry="10" fill="#ff4757" opacity="0.9"
          animate={{ scaleX:[1,1.05,1] }} transition={{ duration:3.2, repeat:Infinity, ease:'easeInOut' }}/>
        <motion.ellipse cx="46" cy="58" rx="10" ry="8" fill="#ff6b81" opacity="0.85"
          animate={{ rotate:[0,5,0] }} transition={{ duration:3.2, repeat:Infinity, ease:'easeInOut' }} style={{ transformOrigin:'46px 58px' }}/>
        <motion.ellipse cx="74" cy="58" rx="10" ry="8" fill="#ff4757" opacity="0.85"
          animate={{ rotate:[0,-5,0] }} transition={{ duration:3.2, repeat:Infinity, ease:'easeInOut' }} style={{ transformOrigin:'74px 58px' }}/>
        {/* Center */}
        <circle cx="60" cy="52" r="7" fill="#c0392b" filter="url(#rose_glow)"/>
        <circle cx="60" cy="52" r="4" fill="#e84393" opacity="0.8"/>
        <circle cx="58" cy="50" r="2" fill="rgba(255,255,255,0.5)"/>
      </FloatWrap>
      <Sparkles color="rgba(255,100,130,0.9)" pts={[{cx:20,cy:35,r:1.5,d:0},{cx:98,cy:40,r:1.3,d:0.6},{cx:16,cy:65,r:1.1,d:1.1},{cx:102,cy:68,r:1.4,d:0.3}]}/>
    </svg>
  )
}

// ── Star ─────────────────────────────────────────────────────────────────────
export function StarVisual({ size }: { size: number }) {
  const pts = '60,20 68,44 94,44 74,58 82,82 60,68 38,82 46,58 26,44 52,44'
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <linearGradient id="star_g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff8a0"/><stop offset="100%" stopColor="#f9ca24"/>
        </linearGradient>
        <filter id="star_glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="star_sh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      </defs>
      <ellipse cx="60" cy="93" rx="22" ry="5" fill="rgba(249,202,36,0.15)" filter="url(#star_sh)"/>
      <FloatWrap duration={2.8}>
        <motion.ellipse cx="60" cy="91" rx="16" ry="3" fill="rgba(0,0,0,0.25)"
          animate={{ scaleX:[1,0.8,1], opacity:[0.25,0.1,0.25] }} transition={{ duration:2.8, repeat:Infinity, ease:'easeInOut' }}/>
        <motion.polygon points={pts} fill="url(#star_g)" filter="url(#star_glow)"
          animate={{ rotate:[0,8,0,-8,0] }} transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }} style={{ transformOrigin:'60px 52px' }}/>
        <polygon points={pts} fill="none" stroke="rgba(255,240,100,0.5)" strokeWidth="0.8"/>
        {/* Shine */}
        <ellipse cx="52" cy="36" rx="6" ry="3" fill="rgba(255,255,255,0.4)" transform="rotate(-20,52,36)"/>
      </FloatWrap>
      <Sparkles color="rgba(255,220,50,0.95)" pts={[{cx:18,cy:30,r:1.6,d:0},{cx:100,cy:36,r:1.3,d:0.5},{cx:14,cy:68,r:1.2,d:1.0},{cx:104,cy:70,r:1.5,d:0.3},{cx:46,cy:12,r:1.1,d:0.8},{cx:76,cy:10,r:1.0,d:1.4}]}/>
    </svg>
  )
}

// ── Heart ────────────────────────────────────────────────────────────────────
export function HeartVisual({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <linearGradient id="heart_g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff6b81"/><stop offset="100%" stopColor="#c0392b"/>
        </linearGradient>
        <filter id="heart_glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="heart_sh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      </defs>
      <ellipse cx="60" cy="93" rx="22" ry="5" fill="rgba(255,70,90,0.15)" filter="url(#heart_sh)"/>
      <FloatWrap duration={2.6}>
        <motion.ellipse cx="60" cy="91" rx="16" ry="3" fill="rgba(0,0,0,0.25)"
          animate={{ scaleX:[1,0.8,1], opacity:[0.25,0.1,0.25] }} transition={{ duration:2.6, repeat:Infinity, ease:'easeInOut' }}/>
        <motion.path d="M60,80 C60,80 24,62 24,40 C24,28 34,22 44,26 C50,28 56,34 60,40 C64,34 70,28 76,26 C86,22 96,28 96,40 C96,62 60,80 60,80Z"
          fill="url(#heart_g)" filter="url(#heart_glow)"
          animate={{ scale:[1,1.06,1] }} transition={{ duration:1.2, repeat:Infinity, ease:'easeInOut' }} style={{ transformOrigin:'60px 52px' }}/>
        {/* Shine */}
        <ellipse cx="44" cy="34" rx="8" ry="5" fill="rgba(255,255,255,0.3)" transform="rotate(-30,44,34)"/>
      </FloatWrap>
      <Sparkles color="rgba(255,100,120,0.9)" pts={[{cx:18,cy:32,r:1.6,d:0},{cx:100,cy:38,r:1.3,d:0.5},{cx:14,cy:66,r:1.2,d:1.0},{cx:104,cy:68,r:1.5,d:0.3}]}/>
    </svg>
  )
}

// ── Moon ─────────────────────────────────────────────────────────────────────
export function MoonVisual({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <filter id="moon_glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="moon_sh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      </defs>
      <ellipse cx="60" cy="93" rx="22" ry="5" fill="rgba(200,210,220,0.12)" filter="url(#moon_sh)"/>
      <FloatWrap duration={4}>
        <motion.ellipse cx="60" cy="91" rx="16" ry="3" fill="rgba(0,0,0,0.2)"
          animate={{ scaleX:[1,0.8,1], opacity:[0.2,0.08,0.2] }} transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }}/>
        {/* Moon crescent */}
        <motion.path d="M72,28 C58,28 44,40 44,58 C44,76 58,88 72,88 C56,88 36,76 36,58 C36,40 56,28 72,28Z"
          fill="rgba(255,255,255,0.92)" filter="url(#moon_glow)"
          animate={{ rotate:[0,3,0,-3,0] }} transition={{ duration:5, repeat:Infinity, ease:'easeInOut' }} style={{ transformOrigin:'60px 58px' }}/>
        {/* Stars on moon */}
        {[{x:68,y:40,r:2},{x:76,y:60,r:1.5},{x:64,y:74,r:1.8}].map((s,i)=>(
          <motion.circle key={i} cx={s.x} cy={s.y} r={s.r} fill="rgba(180,200,220,0.6)"
            animate={{ opacity:[0.4,1,0.4] }} transition={{ duration:2+i*0.4, repeat:Infinity, delay:i*0.3 }}/>
        ))}
      </FloatWrap>
      <Sparkles color="rgba(220,230,255,0.9)" pts={[{cx:20,cy:28,r:1.5,d:0},{cx:98,cy:34,r:1.2,d:0.7},{cx:16,cy:64,r:1.1,d:1.2},{cx:102,cy:66,r:1.4,d:0.4},{cx:48,cy:12,r:1.0,d:0.9}]}/>
    </svg>
  )
}

// ── Diamond ──────────────────────────────────────────────────────────────────
export function DiamondVisual({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <linearGradient id="diam_g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a8d8ff"/><stop offset="100%" stopColor="#0984e3"/>
        </linearGradient>
        <filter id="diam_glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="diam_sh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      </defs>
      <ellipse cx="60" cy="93" rx="22" ry="5" fill="rgba(0,150,255,0.12)" filter="url(#diam_sh)"/>
      <FloatWrap duration={3}>
        <motion.ellipse cx="60" cy="91" rx="16" ry="3" fill="rgba(0,0,0,0.25)"
          animate={{ scaleX:[1,0.8,1], opacity:[0.25,0.1,0.25] }} transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}/>
        {/* Top */}
        <polygon points="60,22 38,48 82,48" fill="url(#diam_g)" opacity="0.95" filter="url(#diam_glow)"/>
        {/* Left */}
        <polygon points="38,48 60,88 60,48" fill="#74b9ff" opacity="0.8"/>
        {/* Right */}
        <polygon points="82,48 60,88 60,48" fill="#0984e3" opacity="0.7"/>
        {/* Outline */}
        <polygon points="60,22 38,48 60,88 82,48" fill="none" stroke="rgba(100,200,255,0.5)" strokeWidth="0.8"/>
        {/* Shine */}
        <polygon points="60,26 50,42 60,40" fill="rgba(255,255,255,0.7)"/>
        <polygon points="60,26 70,42 60,40" fill="rgba(255,255,255,0.35)"/>
      </FloatWrap>
      <Sparkles color="rgba(100,200,255,0.9)" pts={[{cx:18,cy:30,r:1.6,d:0},{cx:100,cy:36,r:1.3,d:0.6},{cx:14,cy:66,r:1.2,d:1.1},{cx:104,cy:68,r:1.5,d:0.3},{cx:46,cy:12,r:1.1,d:0.8}]}/>
    </svg>
  )
}

// ── Trophy ───────────────────────────────────────────────────────────────────
export function TrophyVisual({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <linearGradient id="troph_g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffbe6"/><stop offset="50%" stopColor="#ffd700"/><stop offset="100%" stopColor="#a0720a"/>
        </linearGradient>
        <filter id="troph_glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="troph_sh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      </defs>
      <ellipse cx="60" cy="93" rx="22" ry="5" fill="rgba(200,150,0,0.15)" filter="url(#troph_sh)"/>
      <FloatWrap duration={3.4}>
        <motion.ellipse cx="60" cy="91" rx="16" ry="3" fill="rgba(0,0,0,0.25)"
          animate={{ scaleX:[1,0.8,1], opacity:[0.25,0.1,0.25] }} transition={{ duration:3.4, repeat:Infinity, ease:'easeInOut' }}/>
        {/* Base */}
        <rect x="44" y="82" width="32" height="6" rx="3" fill="url(#troph_g)"/>
        <rect x="48" y="76" width="24" height="8" rx="2" fill="url(#troph_g)"/>
        {/* Stem */}
        <rect x="56" y="68" width="8" height="10" rx="2" fill="url(#troph_g)"/>
        {/* Cup */}
        <path d="M36,28 L36,58 Q36,72 60,72 Q84,72 84,58 L84,28 Z" fill="url(#troph_g)" filter="url(#troph_glow)"/>
        {/* Handles */}
        <path d="M36,34 Q22,34 22,46 Q22,58 36,58" fill="none" stroke="url(#troph_g)" strokeWidth="5" strokeLinecap="round"/>
        <path d="M84,34 Q98,34 98,46 Q98,58 84,58" fill="none" stroke="url(#troph_g)" strokeWidth="5" strokeLinecap="round"/>
        {/* Shine */}
        <ellipse cx="50" cy="40" rx="7" ry="12" fill="rgba(255,255,255,0.2)" transform="rotate(-10,50,40)"/>
        {/* Star on cup */}
        <motion.text x="60" y="56" fontSize="18" textAnchor="middle" fill="rgba(255,255,255,0.7)"
          animate={{ opacity:[0.5,1,0.5] }} transition={{ duration:2, repeat:Infinity }}>★</motion.text>
      </FloatWrap>
      <Sparkles color="rgba(255,220,60,0.95)" pts={[{cx:16,cy:30,r:1.6,d:0},{cx:102,cy:36,r:1.3,d:0.6},{cx:12,cy:66,r:1.2,d:1.1},{cx:106,cy:68,r:1.5,d:0.3}]}/>
    </svg>
  )
}

// ── Rocket ───────────────────────────────────────────────────────────────────
export function RocketVisual({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <linearGradient id="rock_g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dfe6e9"/><stop offset="100%" stopColor="#a29bfe"/>
        </linearGradient>
        <filter id="rock_glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="rock_sh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      </defs>
      <ellipse cx="60" cy="95" rx="18" ry="4" fill="rgba(100,80,255,0.12)" filter="url(#rock_sh)"/>
      <FloatWrap duration={2.4}>
        <motion.ellipse cx="60" cy="93" rx="12" ry="2.5" fill="rgba(0,0,0,0.2)"
          animate={{ scaleX:[1,0.8,1], opacity:[0.2,0.08,0.2] }} transition={{ duration:2.4, repeat:Infinity, ease:'easeInOut' }}/>
        {/* Flame */}
        {[0,1,2].map(i=>(
          <motion.ellipse key={i} cx={54+i*6} cy={88} rx={3} ry={6}
            fill={['#fdcb6e','#e17055','#ff7675'][i]} opacity={0.8}
            animate={{ scaleY:[1,1.4,0.8,1], opacity:[0.8,1,0.5,0.8] }}
            transition={{ duration:0.4+i*0.1, repeat:Infinity, ease:'easeInOut', delay:i*0.1 }}/>
        ))}
        {/* Body */}
        <path d="M60,18 C48,18 44,32 44,50 L44,78 L76,78 L76,50 C76,32 72,18 60,18Z" fill="url(#rock_g)" filter="url(#rock_glow)"/>
        {/* Nose cone */}
        <path d="M44,50 L60,18 L76,50Z" fill="rgba(255,255,255,0.15)"/>
        {/* Fins */}
        <path d="M44,68 L32,82 L44,78Z" fill="#a29bfe"/>
        <path d="M76,68 L88,82 L76,78Z" fill="#6c5ce7"/>
        {/* Window */}
        <circle cx="60" cy="52" r="9" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
        <circle cx="60" cy="52" r="6" fill="#74b9ff" opacity="0.6" filter="url(#rock_glow)"/>
        <circle cx="57" cy="49" r="2.5" fill="rgba(255,255,255,0.5)"/>
        {/* Shine */}
        <ellipse cx="52" cy="34" rx="4" ry="8" fill="rgba(255,255,255,0.2)" transform="rotate(-5,52,34)"/>
      </FloatWrap>
      <Sparkles color="rgba(162,155,254,0.9)" pts={[{cx:18,cy:28,r:1.5,d:0},{cx:100,cy:34,r:1.3,d:0.6},{cx:14,cy:62,r:1.1,d:1.1},{cx:104,cy:64,r:1.4,d:0.3}]}/>
    </svg>
  )
}

// ── Fire ─────────────────────────────────────────────────────────────────────
export function FireVisual({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <radialGradient id="fire_g" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor="#fdcb6e"/><stop offset="50%" stopColor="#e17055"/><stop offset="100%" stopColor="#d63031"/>
        </radialGradient>
        <filter id="fire_glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="fire_sh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      </defs>
      <ellipse cx="60" cy="93" rx="20" ry="5" fill="rgba(255,100,50,0.15)" filter="url(#fire_sh)"/>
      <FloatWrap duration={2}>
        <motion.ellipse cx="60" cy="91" rx="14" ry="3" fill="rgba(0,0,0,0.2)"
          animate={{ scaleX:[1,0.8,1], opacity:[0.2,0.08,0.2] }} transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}/>
        {/* Outer flame */}
        <motion.path d="M60,20 C44,36 34,52 38,68 C40,78 50,88 60,88 C70,88 80,78 82,68 C86,52 76,36 60,20Z"
          fill="url(#fire_g)" filter="url(#fire_glow)"
          animate={{ scaleX:[1,1.06,0.96,1], skewX:[0,3,-3,0] }}
          transition={{ duration:1.2, repeat:Infinity, ease:'easeInOut' }} style={{ transformOrigin:'60px 54px' }}/>
        {/* Inner flame */}
        <motion.path d="M60,36 C52,48 48,60 52,72 C54,80 60,84 60,84 C60,84 66,80 68,72 C72,60 68,48 60,36Z"
          fill="#fdcb6e" opacity="0.7"
          animate={{ scaleX:[1,1.08,0.94,1] }}
          transition={{ duration:0.9, repeat:Infinity, ease:'easeInOut', delay:0.1 }} style={{ transformOrigin:'60px 60px' }}/>
        {/* Core */}
        <motion.ellipse cx="60" cy="72" rx="6" ry="8" fill="rgba(255,255,200,0.8)"
          animate={{ opacity:[0.6,1,0.6] }} transition={{ duration:0.8, repeat:Infinity }}/>
      </FloatWrap>
      <Sparkles color="rgba(255,160,50,0.9)" pts={[{cx:20,cy:30,r:1.6,d:0},{cx:98,cy:36,r:1.3,d:0.5},{cx:16,cy:64,r:1.2,d:1.0},{cx:102,cy:66,r:1.5,d:0.3}]}/>
    </svg>
  )
}

// ── Thunder ───────────────────────────────────────────────────────────────────
export function ThunderVisual({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <linearGradient id="thund_g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff8a0"/><stop offset="100%" stopColor="#fdcb6e"/>
        </linearGradient>
        <filter id="thund_glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="thund_sh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      </defs>
      <ellipse cx="60" cy="93" rx="20" ry="5" fill="rgba(255,220,50,0.15)" filter="url(#thund_sh)"/>
      <FloatWrap duration={2.6}>
        <motion.ellipse cx="60" cy="91" rx="14" ry="3" fill="rgba(0,0,0,0.2)"
          animate={{ scaleX:[1,0.8,1], opacity:[0.2,0.08,0.2] }} transition={{ duration:2.6, repeat:Infinity, ease:'easeInOut' }}/>
        {/* Bolt */}
        <motion.path d="M68,18 L46,60 L62,60 L52,98 L82,50 L64,50 L80,18Z"
          fill="url(#thund_g)" filter="url(#thund_glow)"
          animate={{ opacity:[0.85,1,0.85], scale:[1,1.04,1] }}
          transition={{ duration:1.8, repeat:Infinity, ease:'easeInOut' }} style={{ transformOrigin:'64px 58px' }}/>
        <path d="M68,18 L46,60 L62,60 L52,98 L82,50 L64,50 L80,18Z" fill="none" stroke="rgba(255,240,100,0.5)" strokeWidth="0.8"/>
        {/* Shine */}
        <ellipse cx="66" cy="30" rx="4" ry="8" fill="rgba(255,255,255,0.35)" transform="rotate(20,66,30)"/>
      </FloatWrap>
      <Sparkles color="rgba(255,230,60,0.95)" pts={[{cx:16,cy:28,r:1.6,d:0},{cx:102,cy:34,r:1.3,d:0.6},{cx:12,cy:66,r:1.2,d:1.1},{cx:106,cy:68,r:1.5,d:0.3},{cx:44,cy:10,r:1.1,d:0.8},{cx:78,cy:8,r:1.0,d:1.4}]}/>
    </svg>
  )
}

// ── Ghost ─────────────────────────────────────────────────────────────────────
export function GhostVisual({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <filter id="ghost_glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="ghost_sh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      </defs>
      <ellipse cx="60" cy="95" rx="20" ry="4" fill="rgba(200,210,220,0.1)" filter="url(#ghost_sh)"/>
      <FloatWrap duration={3.6}>
        <motion.ellipse cx="60" cy="93" rx="14" ry="2.5" fill="rgba(0,0,0,0.15)"
          animate={{ scaleX:[1,0.8,1], opacity:[0.15,0.06,0.15] }} transition={{ duration:3.6, repeat:Infinity, ease:'easeInOut' }}/>
        {/* Body */}
        <motion.path d="M36,56 C36,36 44,22 60,22 C76,22 84,36 84,56 L84,88 C84,88 78,82 72,88 C66,94 66,88 60,88 C54,88 54,94 48,88 C42,82 36,88 36,88 Z"
          fill="rgba(220,230,240,0.92)" filter="url(#ghost_glow)"
          animate={{ scaleX:[1,1.03,1] }} transition={{ duration:3.6, repeat:Infinity, ease:'easeInOut' }} style={{ transformOrigin:'60px 55px' }}/>
        {/* Eyes */}
        <motion.ellipse cx="48" cy="52" rx="6" ry="7" fill="rgba(40,50,80,0.85)"
          animate={{ scaleY:[1,0.3,1] }} transition={{ duration:4, repeat:Infinity, delay:1.5 }}/>
        <motion.ellipse cx="72" cy="52" rx="6" ry="7" fill="rgba(40,50,80,0.85)"
          animate={{ scaleY:[1,0.3,1] }} transition={{ duration:4, repeat:Infinity, delay:1.5 }}/>
        {/* Eye shine */}
        <circle cx="50" cy="49" r="2" fill="rgba(255,255,255,0.7)"/>
        <circle cx="74" cy="49" r="2" fill="rgba(255,255,255,0.7)"/>
        {/* Smile */}
        <path d="M50,66 Q60,74 70,66" fill="none" stroke="rgba(40,50,80,0.6)" strokeWidth="2" strokeLinecap="round"/>
      </FloatWrap>
      <Sparkles color="rgba(200,220,255,0.8)" pts={[{cx:18,cy:30,r:1.4,d:0},{cx:100,cy:36,r:1.2,d:0.7},{cx:14,cy:66,r:1.0,d:1.2},{cx:104,cy:68,r:1.3,d:0.4}]}/>
    </svg>
  )
}

// ── Dragon ────────────────────────────────────────────────────────────────────
export function DragonVisual({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <linearGradient id="drag_g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#55efc4"/><stop offset="100%" stopColor="#00b894"/>
        </linearGradient>
        <filter id="drag_glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="drag_sh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      </defs>
      <ellipse cx="60" cy="93" rx="22" ry="5" fill="rgba(0,200,150,0.12)" filter="url(#drag_sh)"/>
      <FloatWrap duration={3}>
        <motion.ellipse cx="60" cy="91" rx="16" ry="3" fill="rgba(0,0,0,0.2)"
          animate={{ scaleX:[1,0.8,1], opacity:[0.2,0.08,0.2] }} transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}/>
        {/* Body */}
        <ellipse cx="60" cy="64" rx="22" ry="26" fill="url(#drag_g)" filter="url(#drag_glow)"/>
        {/* Belly */}
        <ellipse cx="60" cy="68" rx="14" ry="18" fill="rgba(255,255,255,0.15)"/>
        {/* Wings */}
        <motion.path d="M38,52 C24,40 18,24 28,22 C36,20 40,36 38,52Z" fill="#00cec9" opacity="0.8"
          animate={{ rotate:[0,8,0] }} transition={{ duration:1.4, repeat:Infinity, ease:'easeInOut' }} style={{ transformOrigin:'38px 37px' }}/>
        <motion.path d="M82,52 C96,40 102,24 92,22 C84,20 80,36 82,52Z" fill="#00b894" opacity="0.8"
          animate={{ rotate:[0,-8,0] }} transition={{ duration:1.4, repeat:Infinity, ease:'easeInOut', delay:0.1 }} style={{ transformOrigin:'82px 37px' }}/>
        {/* Head */}
        <ellipse cx="60" cy="36" rx="16" ry="14" fill="url(#drag_g)"/>
        {/* Horns */}
        <path d="M52,26 L48,14 L54,22Z" fill="#00b894"/>
        <path d="M68,26 L72,14 L66,22Z" fill="#00cec9"/>
        {/* Eyes */}
        <circle cx="54" cy="34" r="4" fill="rgba(0,0,0,0.7)"/>
        <circle cx="66" cy="34" r="4" fill="rgba(0,0,0,0.7)"/>
        <circle cx="55" cy="32" r="1.5" fill="rgba(255,255,255,0.8)"/>
        <circle cx="67" cy="32" r="1.5" fill="rgba(255,255,255,0.8)"/>
        {/* Nostrils */}
        <circle cx="57" cy="40" r="1.5" fill="rgba(0,0,0,0.3)"/>
        <circle cx="63" cy="40" r="1.5" fill="rgba(0,0,0,0.3)"/>
        {/* Tail */}
        <path d="M82,72 Q96,80 92,92 Q86,96 82,88" fill="none" stroke="url(#drag_g)" strokeWidth="6" strokeLinecap="round"/>
      </FloatWrap>
      <Sparkles color="rgba(80,240,180,0.9)" pts={[{cx:16,cy:28,r:1.5,d:0},{cx:102,cy:34,r:1.3,d:0.6},{cx:12,cy:66,r:1.1,d:1.1},{cx:106,cy:68,r:1.4,d:0.3}]}/>
    </svg>
  )
}

// ── Unicorn ───────────────────────────────────────────────────────────────────
export function UnicornVisual({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <linearGradient id="uni_mane" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fd79a8"/><stop offset="50%" stopColor="#a29bfe"/><stop offset="100%" stopColor="#74b9ff"/>
        </linearGradient>
        <linearGradient id="uni_body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff"/><stop offset="100%" stopColor="#dfe6e9"/>
        </linearGradient>
        <filter id="uni_glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="uni_sh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      </defs>
      <ellipse cx="60" cy="93" rx="24" ry="5" fill="rgba(200,150,255,0.15)" filter="url(#uni_sh)"/>
      <FloatWrap duration={3.4}>
        <motion.ellipse cx="60" cy="91" rx="18" ry="3" fill="rgba(0,0,0,0.2)"
          animate={{ scaleX:[1,0.8,1], opacity:[0.2,0.08,0.2] }} transition={{ duration:3.4, repeat:Infinity, ease:'easeInOut' }}/>
        {/* Body */}
        <ellipse cx="62" cy="68" rx="26" ry="20" fill="url(#uni_body)"/>
        {/* Legs */}
        {[{x:44,d:0},{x:52,d:0.1},{x:68,d:0.2},{x:76,d:0.05}].map((l,i)=>(
          <motion.rect key={i} x={l.x} y={82} width={6} height={14} rx={3} fill="url(#uni_body)"
            animate={{ scaleY:[1,0.92,1] }} transition={{ duration:1.2, repeat:Infinity, delay:l.d }}/>
        ))}
        {/* Neck */}
        <path d="M52,52 L44,36 L62,36 L66,52Z" fill="url(#uni_body)"/>
        {/* Head */}
        <ellipse cx="52" cy="30" rx="16" ry="12" fill="url(#uni_body)"/>
        {/* Horn */}
        <motion.path d="M52,18 L46,36 L58,36Z" fill="url(#uni_mane)" filter="url(#uni_glow)"
          animate={{ opacity:[0.8,1,0.8] }} transition={{ duration:2, repeat:Infinity }}/>
        {/* Mane */}
        <path d="M62,36 C68,28 72,20 66,14 C72,18 76,28 70,36Z" fill="url(#uni_mane)" opacity="0.9"/>
        <path d="M66,52 C74,44 78,34 72,26 C78,32 80,44 74,52Z" fill="#fd79a8" opacity="0.7"/>
        {/* Tail */}
        <path d="M88,60 C98,52 104,60 100,72 C96,80 88,76 88,68" fill="none" stroke="url(#uni_mane)" strokeWidth="5" strokeLinecap="round"/>
        {/* Eye */}
        <circle cx="46" cy="28" r="4" fill="rgba(40,40,80,0.8)"/>
        <circle cx="47" cy="26" r="1.5" fill="rgba(255,255,255,0.8)"/>
        {/* Cheek */}
        <circle cx="54" cy="34" r="4" fill="rgba(255,100,150,0.25)"/>
      </FloatWrap>
      <Sparkles color="rgba(200,150,255,0.9)" pts={[{cx:14,cy:26,r:1.6,d:0},{cx:104,cy:32,r:1.3,d:0.6},{cx:10,cy:64,r:1.2,d:1.1},{cx:108,cy:66,r:1.5,d:0.3},{cx:44,cy:10,r:1.1,d:0.8},{cx:78,cy:8,r:1.0,d:1.4}]}/>
    </svg>
  )
}

// ── Galaxy ────────────────────────────────────────────────────────────────────
export function GalaxyVisual({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <radialGradient id="gal_g" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a29bfe"/><stop offset="50%" stopColor="#6c5ce7"/><stop offset="100%" stopColor="#2d3436"/>
        </radialGradient>
        <filter id="gal_glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="gal_sh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      </defs>
      <ellipse cx="60" cy="93" rx="22" ry="5" fill="rgba(100,80,200,0.15)" filter="url(#gal_sh)"/>
      <FloatWrap duration={4}>
        <motion.ellipse cx="60" cy="91" rx="16" ry="3" fill="rgba(0,0,0,0.25)"
          animate={{ scaleX:[1,0.8,1], opacity:[0.25,0.1,0.25] }} transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }}/>
        {/* Galaxy disc */}
        <motion.ellipse cx="60" cy="58" rx="36" ry="12" fill="url(#gal_g)" opacity="0.5"
          animate={{ rotate:[0,360] }} transition={{ duration:12, repeat:Infinity, ease:'linear' }} style={{ transformOrigin:'60px 58px' }}/>
        <motion.ellipse cx="60" cy="58" rx="24" ry="8" fill="url(#gal_g)" opacity="0.7"
          animate={{ rotate:[0,-360] }} transition={{ duration:8, repeat:Infinity, ease:'linear' }} style={{ transformOrigin:'60px 58px' }}/>
        {/* Core */}
        <circle cx="60" cy="58" r="12" fill="url(#gal_g)" filter="url(#gal_glow)"/>
        <circle cx="60" cy="58" r="7" fill="rgba(200,190,255,0.9)"/>
        <circle cx="57" cy="55" r="3" fill="rgba(255,255,255,0.7)"/>
        {/* Stars in galaxy */}
        {[{x:30,y:52,r:1.2},{x:88,y:54,r:1.0},{x:44,y:46,r:0.8},{x:76,y:62,r:0.9},{x:36,y:64,r:1.1},{x:84,y:48,r:0.8}].map((s,i)=>(
          <motion.circle key={i} cx={s.x} cy={s.y} r={s.r} fill="rgba(255,255,255,0.8)"
            animate={{ opacity:[0.3,1,0.3] }} transition={{ duration:1.5+i*0.3, repeat:Infinity, delay:i*0.2 }}/>
        ))}
      </FloatWrap>
      <Sparkles color="rgba(160,140,255,0.9)" pts={[{cx:14,cy:24,r:1.6,d:0},{cx:104,cy:30,r:1.3,d:0.6},{cx:10,cy:62,r:1.2,d:1.1},{cx:108,cy:64,r:1.5,d:0.3},{cx:42,cy:8,r:1.1,d:0.8},{cx:80,cy:6,r:1.0,d:1.4}]}/>
    </svg>
  )
}

// ── Angel ─────────────────────────────────────────────────────────────────────
export function AngelVisual({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <linearGradient id="ang_halo" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fffbe6"/><stop offset="50%" stopColor="#ffd700"/><stop offset="100%" stopColor="#fffbe6"/>
        </linearGradient>
        <filter id="ang_glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="ang_sh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      </defs>
      <ellipse cx="60" cy="93" rx="24" ry="5" fill="rgba(255,240,180,0.15)" filter="url(#ang_sh)"/>
      <FloatWrap duration={3.8}>
        <motion.ellipse cx="60" cy="91" rx="18" ry="3" fill="rgba(0,0,0,0.15)"
          animate={{ scaleX:[1,0.8,1], opacity:[0.15,0.06,0.15] }} transition={{ duration:3.8, repeat:Infinity, ease:'easeInOut' }}/>
        {/* Wings */}
        <motion.path d="M38,58 C20,46 14,28 26,24 C36,20 42,38 38,58Z" fill="rgba(255,255,255,0.88)" filter="url(#ang_glow)"
          animate={{ rotate:[0,6,0] }} transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }} style={{ transformOrigin:'38px 41px' }}/>
        <motion.path d="M82,58 C100,46 106,28 94,24 C84,20 78,38 82,58Z" fill="rgba(255,255,255,0.88)" filter="url(#ang_glow)"
          animate={{ rotate:[0,-6,0] }} transition={{ duration:2, repeat:Infinity, ease:'easeInOut', delay:0.1 }} style={{ transformOrigin:'82px 41px' }}/>
        {/* Inner wings */}
        <path d="M38,58 C28,50 24,38 30,32 C36,28 40,42 38,58Z" fill="rgba(255,255,255,0.5)"/>
        <path d="M82,58 C92,50 96,38 90,32 C84,28 80,42 82,58Z" fill="rgba(255,255,255,0.5)"/>
        {/* Body */}
        <ellipse cx="60" cy="68" rx="16" ry="20" fill="rgba(255,255,255,0.92)"/>
        {/* Robe detail */}
        <path d="M50,72 Q60,80 70,72" fill="none" stroke="rgba(200,200,220,0.5)" strokeWidth="1.5"/>
        <path d="M48,80 Q60,90 72,80" fill="none" stroke="rgba(200,200,220,0.4)" strokeWidth="1.5"/>
        {/* Head */}
        <circle cx="60" cy="44" r="14" fill="rgba(255,255,255,0.95)"/>
        {/* Face */}
        <circle cx="55" cy="42" r="2.5" fill="rgba(40,40,80,0.7)"/>
        <circle cx="65" cy="42" r="2.5" fill="rgba(40,40,80,0.7)"/>
        <circle cx="55.8" cy="41" r="1" fill="rgba(255,255,255,0.8)"/>
        <circle cx="65.8" cy="41" r="1" fill="rgba(255,255,255,0.8)"/>
        <path d="M54,50 Q60,56 66,50" fill="none" stroke="rgba(40,40,80,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
        {/* Cheeks */}
        <circle cx="50" cy="48" r="4" fill="rgba(255,150,180,0.25)"/>
        <circle cx="70" cy="48" r="4" fill="rgba(255,150,180,0.25)"/>
        {/* Halo */}
        <motion.ellipse cx="60" cy="26" rx="18" ry="5" fill="none" stroke="url(#ang_halo)" strokeWidth="3"
          filter="url(#ang_glow)"
          animate={{ opacity:[0.7,1,0.7], scaleX:[1,1.05,1] }} transition={{ duration:2.4, repeat:Infinity, ease:'easeInOut' }}/>
      </FloatWrap>
      <Sparkles color="rgba(255,240,150,0.95)" pts={[{cx:12,cy:22,r:1.6,d:0},{cx:106,cy:28,r:1.3,d:0.6},{cx:8,cy:62,r:1.2,d:1.1},{cx:110,cy:64,r:1.5,d:0.3},{cx:40,cy:8,r:1.1,d:0.8},{cx:82,cy:6,r:1.0,d:1.4}]}/>
    </svg>
  )
}
