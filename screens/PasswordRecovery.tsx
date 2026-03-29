'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Send, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export default function PasswordRecovery({
  onBack,
}: {
  onBack: () => void
}) {
  const [scale, setScale] = useState(1)
  const [tgTag, setTgTag] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [dontRemember, setDontRemember] = useState(false)
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const baseW = 375
    const baseH = 812
    const update = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const s = Math.min(vw / baseW, vh / baseH)
      setScale(Math.max(1, s))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const handleSubmit = async () => {
    if (!tgTag.trim()) return
    setLoading(true)
    
    // Имитация отправки
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div className="fixed inset-0 z-[100] flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden">
      <div className="relative h-[812px] w-[375px]" style={{ transform: `scale(${scale})` }}>
        <div className="absolute inset-0 bg-[#0A0A0A]" />
        
        {/* Декоративные элементы фона */}
        <div className="absolute top-[-50px] left-[-50px] w-[250px] h-[250px] bg-white/[0.02] blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-50px] right-[-50px] w-[200px] h-[200px] bg-white/[0.01] blur-[60px] rounded-full pointer-events-none" />

        <button
          type="button"
          onClick={onBack}
          className="absolute left-6 top-[50px] z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-200 active:scale-95"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-x-0 top-0 bottom-0 px-6 flex flex-col pt-[140px] z-20"
        >
          {!submitted ? (
            <>
              <div className="mb-2 text-[32px] font-bold leading-[1.2em] text-white font-ttc-bold tracking-tight">
                Восстановление
              </div>
              <div className="mb-8 text-[16px] leading-[1.4em] text-white/50 font-light max-w-[280px]" style={{ fontFamily: 'var(--font-inter)' }}>
                Заполни форму, чтобы вернуть доступ к аккаунту
              </div>

              <div className="space-y-6 flex-1 overflow-y-auto scrollbar-hidden pb-10">
                {/* TG TAG */}
                <div className="flex flex-col gap-3">
                  <label className="ml-1 text-[13px] font-medium text-white/30 tracking-[0.05em]" style={{ fontFamily: 'var(--font-inter)' }}>
                    Ваш Telegram (@tag)
                  </label>
                  <input
                    value={tgTag}
                    onChange={(e) => setTgTag(e.target.value)}
                    placeholder="@username"
                    className="h-[64px] w-full rounded-2xl border border-white/10 bg-white/5 pl-6 text-[18px] text-white outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all placeholder:text-white/20 backdrop-blur-md"
                  />
                </div>

                {/* OLD PASSWORD */}
                <div className="flex flex-col gap-3 opacity-100 transition-opacity duration-300" style={{ opacity: dontRemember ? 0.3 : 1 }}>
                  <label className="ml-1 text-[13px] font-medium text-white/30 tracking-[0.05em]" style={{ fontFamily: 'var(--font-inter)' }}>
                    Старый пароль (который помните)
                  </label>
                  <input
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    disabled={dontRemember}
                    type="text"
                    placeholder="Пароль..."
                    className="h-[64px] w-full rounded-2xl border border-white/10 bg-white/5 pl-6 text-[18px] text-white outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all placeholder:text-white/20 backdrop-blur-md"
                  />
                </div>

                {/* CHECKBOX */}
                <button 
                  onClick={() => setDontRemember(!dontRemember)}
                  className="flex items-center gap-3 px-1 group active:scale-[0.98] transition-all"
                >
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${dontRemember ? 'bg-white border-white' : 'border-white/10 bg-white/5'}`}>
                    {dontRemember && <div className="w-3 h-3 bg-black rounded-[2px]" />}
                  </div>
                  <span className={`text-[15px] transition-colors ${dontRemember ? 'text-white' : 'text-white/40'}`} style={{ fontFamily: 'var(--font-inter)' }}>
                    Вообще не помню пароль
                  </span>
                </button>

                {/* ADDITIONAL INFO */}
                <div className="flex flex-col gap-3 pt-2 min-h-[160px]">
                  <label className="ml-1 text-[13px] font-medium text-white/30 tracking-[0.05em]" style={{ fontFamily: 'var(--font-inter)' }}>
                    Дополнительная информация
                  </label>
                  <textarea
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    placeholder={dontRemember ? "Напишите всё, что поможет модератору узнать вас (город, дата регистрации, обьявления)..." : "Любая полезная информация..."}
                    className="w-full min-h-[120px] bg-white/5 border border-white/10 rounded-2xl p-6 text-[16px] text-white outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all placeholder:text-white/10 backdrop-blur-md resize-none font-sf-ui-light leading-relaxed"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!tgTag.trim() || loading}
                  className={`h-[64px] w-full rounded-full flex items-center justify-center text-[17px] font-vk-demi transition-all duration-300 relative overflow-hidden shadow-xl ${
                    tgTag.trim() && !loading
                      ? 'bg-white text-black active:scale-[0.98]'
                      : 'bg-white/10 text-white/20'
                  }`}
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <span>Отправить заявку</span>
                  )}
                </button>
              </div>
            </>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full text-center pb-[140px]"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-8">
                <Send size={32} className="text-white opacity-50" />
              </div>
              <div className="text-[28px] font-bold text-white font-ttc-bold mb-4">
                Заявка отправлена
              </div>
              <div className="text-[16px] text-white/40 font-light max-w-[280px] leading-relaxed mb-12" style={{ fontFamily: 'var(--font-inter)' }}>
                Модератор проверит вашу информацию и свяжется с вами в Telegram. Пожалуйста, ожидайте.
              </div>
              <button
                onClick={onBack}
                className="px-10 py-4 rounded-2xl bg-white text-black font-vk-demi text-[16px] active:scale-95 transition-all shadow-xl shadow-white/5"
              >
                Вернуться назад
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
