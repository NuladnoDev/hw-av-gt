'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

export default function ProBadge({ size = 20 }: { size?: number }) {
  const [showSheet, setShowSheet] = useState(false)

  return (
    <>
      <motion.div
        className="cursor-pointer inline-flex items-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 1.1 }}
        onClick={(e) => { e.stopPropagation(); setShowSheet(true) }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        {/* Pill badge */}
        <div
          className="relative flex items-center overflow-hidden"
          style={{
            height: size,
            gap: size * 0.18,
            paddingLeft: size * 0.32,
            paddingRight: size * 0.38,
            borderRadius: size / 2,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: '0 0 10px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          {/* Shimmer */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.07) 50%, transparent 60%)' }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: 'linear' }}
          />
          {/* ✦ as SVG — perfectly centered */}
          <svg
            width={size * 0.62}
            height={size * 0.62}
            viewBox="0 0 24 24"
            fill="rgba(255,255,255,0.8)"
            style={{ flexShrink: 0, display: 'block' }}
          >
            <path d="M12 2 L13.8 9.2 L21 12 L13.8 14.8 L12 22 L10.2 14.8 L3 12 L10.2 9.2 Z" />
          </svg>
          {/* PRO text */}
          <span
            className="font-ttc-bold text-white select-none inline-flex items-center"
            style={{ fontSize: size * 0.52, lineHeight: 1, paddingTop: 1 }}
          >PRO</span>
        </div>
      </motion.div>

      {/* Bottom sheet */}
      <AnimatePresence>
        {showSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm"
              onClick={() => setShowSheet(false)}
            />
            <div className="fixed inset-0 z-[210] flex items-end justify-center pointer-events-none">
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }}
                transition={{ type: 'spring', damping: 32, stiffness: 380 }}
                className="w-full pointer-events-auto overflow-y-auto"
                style={{ maxHeight: '94dvh', borderRadius: '28px 28px 0 0', background: '#0e0e0e', borderTop: '1px solid rgba(255,255,255,0.08)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <div className="flex justify-center pt-4 pb-2 sticky top-0 bg-[#0e0e0e] z-10">
                  <div className="w-10 h-1 rounded-full bg-white/15" />
                </div>

                <div className="px-6 pb-[calc(env(safe-area-inset-bottom,0px)+28px)]">
                  {/* Hero */}
                  <div className="relative rounded-[24px] overflow-hidden mb-6 mt-2" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
                    <div className="absolute inset-0 overflow-hidden">
                      {[...Array(6)].map((_, i) => (
                        <motion.div key={i}
                          className="absolute rounded-full"
                          style={{ width: 80 + i * 30, height: 80 + i * 30, left: `${10 + i * 15}%`, top: `${-20 + i * 10}%`, background: 'rgba(99,102,241,0.08)' }}
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                          transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
                        />
                      ))}
                    </div>
                    <div className="relative z-10 px-6 py-8 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-5">
                        <motion.span className="text-[52px] leading-none select-none"
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        >✦</motion.span>
                        <div>
                          <div className="text-[11px] font-sf-ui-medium text-white/40 uppercase tracking-[0.15em] mb-1">HelloWorld</div>
                          <div className="text-[26px] font-ttc-bold text-white leading-none">hw-pro</div>
                          <div className="text-[12px] text-white/45 font-sf-ui-light mt-1">Максимум возможностей</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="text-[28px] font-ttc-bold text-white leading-none">199 ₽</span>
                        <span className="text-[12px] text-white/40 font-sf-ui-light mt-0.5">/ месяц</span>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="text-[13px] font-sf-ui-medium text-white/35 tracking-[0.12em] mb-3">Что входит</div>
                  <div className="bg-white/[0.07] rounded-[18px] border border-white/[0.06] mb-6 overflow-hidden">
                    {[
                      { icon: <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"/>, label: 'AI генерация описаний', sub: 'Безлимитно, любая категория' },
                      { icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>, label: 'До 50 активных объявлений', sub: 'Вместо 10 на бесплатном' },
                      { icon: <><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></>, label: 'Значок hw-pro в профиле', sub: 'Выделяйся среди других' },
                      { icon: <><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></>, label: 'Приоритетная поддержка', sub: 'Ответ в течение 2 часов' },
                      { icon: <><path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-4.03 9-9 9S3 16.97 3 12 7.03 3 12 3s9 4.03 9 9z"/></>, label: 'Ранний доступ к функциям', sub: 'Тестируй новое первым' },
                    ].map((f, i, arr) => (
                      <div key={i}>
                        <div className="flex items-center gap-4 px-4 py-3.5">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                            {f.icon}
                          </svg>
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-sf-ui-medium text-white/90">{f.label}</div>
                            <div className="text-[12px] text-white/35 font-sf-ui-light mt-0.5">{f.sub}</div>
                          </div>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                        </div>
                        {i < arr.length - 1 && <div className="h-px bg-white/[0.05] mx-4" />}
                      </div>
                    ))}
                  </div>

                  {/* Comparison */}
                  <div className="text-[13px] font-sf-ui-medium text-white/35 tracking-[0.12em] mb-3">Сравнение</div>
                  <div className="rounded-[18px] border border-white/[0.06] overflow-hidden mb-6">
                    <div className="grid grid-cols-3 bg-white/[0.03] px-4 py-2.5">
                      <div className="text-[12px] text-white/30 font-sf-ui-light">Функция</div>
                      <div className="text-[12px] text-white/30 font-sf-ui-light text-center">Бесплатно</div>
                      <div className="text-[12px] text-white/80 font-sf-ui-medium text-center">hw-pro</div>
                    </div>
                    {[
                      ['Объявления', '10', '50'],
                      ['AI описания', '—', '∞'],
                      ['Поддержка', 'Стандарт', 'Приоритет'],
                      ['Значок', '—', '✦'],
                    ].map(([feat, free, pro], i) => (
                      <div key={i} className={`grid grid-cols-3 px-4 py-3 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                        <div className="text-[13px] text-white/60 font-sf-ui-light">{feat}</div>
                        <div className="text-[13px] text-white/30 font-sf-ui-light text-center">{free}</div>
                        <div className="text-[13px] text-white font-sf-ui-medium text-center">{pro}</div>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <button type="button"
                    className="w-full h-[56px] rounded-full font-sf-ui-medium text-[16px] text-black active:scale-[0.97] transition-all mb-3"
                    style={{ background: 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)' }}
                    onClick={() => setShowSheet(false)}
                  >
                    Оформить hw-pro — 199 ₽/мес
                  </button>
                  <button type="button"
                    className="w-full h-[48px] rounded-full text-[15px] text-white/40 font-sf-ui-light active:opacity-60 transition-all"
                    onClick={() => setShowSheet(false)}
                  >
                    Отмена
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
