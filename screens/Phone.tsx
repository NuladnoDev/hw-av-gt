'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { X, Smartphone, Tablet, Laptop, Globe, MapPin, Clock, Shield, LogOut, ChevronRight, ChevronLeft } from 'lucide-react'
import { getSupabase, loadLocalAuth } from '@/lib/supabaseClient'

type DeviceInfo = {
  id: string
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'web'
  deviceName: string
  os: string
  browser: string
  ip?: string
  location?: string
  lastActive: string
  isCurrent: boolean
}

export default function PhoneScreen({ onClose }: { onClose: () => void }) {
  const [scale, setScale] = useState(1)
  const [devices, setDevices] = useState<DeviceInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [draggingKey, setDraggingKey] = useState<string | null>(null)
  const [dragOffsetX, setDragOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const baseW = 375
    const baseH = 812
    const update = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const s = Math.min(vw / baseW, vh / baseH)
      setScale(Math.min(1, s))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    loadDevices()
  }, [])

  const loadDevices = async () => {
    try {
      setLoading(true)
      
      const auth = await loadLocalAuth()
      const client = getSupabase()
      
      if (!client || !auth?.uuid) {
        const currentDevice: DeviceInfo = {
          id: 'current',
          deviceType: getDeviceType(),
          deviceName: getDeviceName(),
          os: getOS(),
          browser: getBrowser(),
          location: 'Череповец, Россия',
          lastActive: new Date().toISOString(),
          isCurrent: true
        }
        setDevices([currentDevice])
        return
      }

      const { data: sessions, error } = await client
        .from('auth.sessions')
        .select('*')
        .eq('user_id', auth.uuid)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error || !sessions?.length) {
        const currentDevice: DeviceInfo = {
          id: 'current',
          deviceType: getDeviceType(),
          deviceName: getDeviceName(),
          os: getOS(),
          browser: getBrowser(),
          location: 'Череповец, Россия',
          lastActive: new Date().toISOString(),
          isCurrent: true
        }
        setDevices([currentDevice])
      } else {
        const deviceInfos: DeviceInfo[] = sessions.map((session, index) => ({
          id: session.id || `device-${index}`,
          deviceType: detectDeviceType(session.user_agent || ''),
          deviceName: getDeviceNameFromUA(session.user_agent || ''),
          os: getOSFromUA(session.user_agent || ''),
          browser: getBrowserFromUA(session.user_agent || ''),
          ip: session.ip_address,
          location: 'Череповец, Россия',
          lastActive: session.updated_at || session.created_at,
          isCurrent: index === 0
        }))
        setDevices(deviceInfos)
      }
    } catch (error) {
      console.error('Ошибка при загрузке устройств:', error)
      const currentDevice: DeviceInfo = {
        id: 'current',
        deviceType: getDeviceType(),
        deviceName: getDeviceName(),
        os: getOS(),
        browser: getBrowser(),
        location: 'Череповец, Россия',
        lastActive: new Date().toISOString(),
        isCurrent: true
      }
      setDevices([currentDevice])
    } finally {
      setLoading(false)
    }
  }

  const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' | 'web' => {
    if (typeof window === 'undefined') return 'web'
    const ua = navigator.userAgent
    if (/Mobile|Android|iPhone|iPad/.test(ua)) return 'mobile'
    if (/Tablet|iPad/.test(ua)) return 'tablet'
    return 'desktop'
  }

  const getDeviceName = (): string => {
    if (typeof window === 'undefined') return 'Неизвестное устройство'
    const ua = navigator.userAgent
    if (/iPhone/.test(ua)) return 'iPhone'
    if (/iPad/.test(ua)) return 'iPad'
    if (/Android/.test(ua)) return 'Android устройство'
    if (/Windows/.test(ua)) return 'Windows компьютер'
    if (/Mac/.test(ua)) return 'Mac'
    if (/Linux/.test(ua)) return 'Linux устройство'
    return 'Неизвестное устройство'
  }

  const getOS = (): string => {
    if (typeof window === 'undefined') return 'Неизвестная ОС'
    const ua = navigator.userAgent
    if (/Windows NT 10/.test(ua)) return 'Windows 10'
    if (/Windows NT 11/.test(ua)) return 'Windows 11'
    if (/Mac OS X/.test(ua)) return 'macOS'
    if (/Android/.test(ua)) return 'Android'
    if (/iOS|iPhone|iPad/.test(ua)) return 'iOS'
    if (/Linux/.test(ua)) return 'Linux'
    return 'Неизвестная ОС'
  }

  const getBrowser = (): string => {
    if (typeof window === 'undefined') return 'Неизвестный браузер'
    const ua = navigator.userAgent
    if (/Chrome/.test(ua) && !/Edg/.test(ua)) return 'Chrome'
    if (/Safari/.test(ua) && !/Chrome/.test(ua)) return 'Safari'
    if (/Firefox/.test(ua)) return 'Firefox'
    if (/Edg/.test(ua)) return 'Edge'
    if (/Opera|OPR/.test(ua)) return 'Opera'
    return 'Неизвестный браузер'
  }

  const detectDeviceType = (ua: string): 'mobile' | 'tablet' | 'desktop' | 'web' => {
    if (/Mobile|Android|iPhone/.test(ua)) return 'mobile'
    if (/Tablet|iPad/.test(ua)) return 'tablet'
    return 'desktop'
  }

  const getDeviceNameFromUA = (ua: string): string => {
    if (/iPhone/.test(ua)) return 'iPhone'
    if (/iPad/.test(ua)) return 'iPad'
    if (/Android/.test(ua)) return 'Android устройство'
    if (/Windows/.test(ua)) return 'Windows компьютер'
    if (/Mac/.test(ua)) return 'Mac'
    return 'Устройство'
  }

  const getOSFromUA = (ua: string): string => {
    if (/Windows NT 10/.test(ua)) return 'Windows 10'
    if (/Windows NT 11/.test(ua)) return 'Windows 11'
    if (/Mac OS X/.test(ua)) return 'macOS'
    if (/Android/.test(ua)) return 'Android'
    if (/iOS|iPhone|iPad/.test(ua)) return 'iOS'
    return 'Неизвестная ОС'
  }

  const getBrowserFromUA = (ua: string): string => {
    if (/Chrome/.test(ua) && !/Edg/.test(ua)) return 'Chrome'
    if (/Safari/.test(ua) && !/Chrome/.test(ua)) return 'Safari'
    if (/Firefox/.test(ua)) return 'Firefox'
    if (/Edg/.test(ua)) return 'Edge'
    return 'Браузер'
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="w-5 h-5" />
      case 'tablet': return <Tablet className="w-5 h-5" />
      case 'desktop': return <Laptop className="w-5 h-5" />
      default: return <Globe className="w-5 h-5" />
    }
  }

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Только что'
    if (minutes < 60) return `${minutes} мин назад`
    if (hours < 24) return `${hours} час назад`
    if (days < 7) return `${days} дн назад`
    return date.toLocaleDateString('ru-RU')
  }

  const handleLogoutDevice = async (deviceId: string) => {
    try {
      const client = getSupabase()
      if (!client) return
      setDevices(prev => prev.filter(device => device.id !== deviceId))
    } catch (error) {
      console.error('Ошибка при выходе устройства:', error)
    }
  }

  const currentDevice = devices.find(d => d.isCurrent)
  const otherDevices = devices.filter(d => !d.isCurrent)

  return (
    <motion.div
      className="fixed inset-0 z-50 flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden"
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="relative h-full w-full flex flex-col bg-[#0A0A0A]" style={{ transform: `scale(${scale})` }}>
        {/* Header */}
        <div 
          className="flex items-center px-6 bg-[#0A0A0A]/80 backdrop-blur-xl z-50 sticky top-0"
          style={{ height: 'calc(env(safe-area-inset-top, 0px) + 56px)', paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
          <div className="flex-1 text-center pr-8">
            <span className="text-[20px] font-ttc-bold text-white">Устройства</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden px-6 pt-4 pb-32">
          {/* Security Banner */}
          <div className="mb-8 p-5 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-4">
            <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400">
              <Shield className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-[16px] font-ttc-bold text-white/90">Безопасность</div>
              <div className="text-[13px] text-white/40 font-sf-ui-light leading-relaxed">
                Здесь отображаются все сеансы входа в ваш аккаунт. Вы можете завершить любой из них.
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <div className="text-white/20 text-[14px] font-sf-ui-medium uppercase tracking-widest">Загрузка...</div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Current Device Section */}
              {currentDevice && (
                <div className="space-y-4">
                  <div className="text-[13px] text-white/20 font-sf-ui-medium uppercase tracking-widest pl-1">Этот девайс</div>
                  <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/10">
                        {getDeviceIcon(currentDevice.deviceType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[18px] font-ttc-bold text-white truncate">
                          {currentDevice.deviceName}
                        </div>
                        <div className="text-[14px] text-white/40 font-sf-ui-regular truncate">
                          {currentDevice.os} • {currentDevice.browser}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[11px] font-sf-ui-bold text-emerald-400 uppercase tracking-tight">Онлайн</span>
                        </div>
                      </div>
                    </div>
                    {currentDevice.location && (
                      <div className="mt-4 pt-4 border-t border-white/[0.05] flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-white/20" />
                        <span className="text-[13px] text-white/30 font-sf-ui-light">{currentDevice.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Other Devices Section */}
              {otherDevices.length > 0 && (
                <div className="space-y-4">
                  <div className="text-[13px] text-white/20 font-sf-ui-medium uppercase tracking-widest pl-1">Активные сессии</div>
                  <div className="space-y-3">
                    {otherDevices.map((device) => {
                      const key = device.id
                      const isDragging = draggingKey === key
                      const offset = isDragging ? dragOffsetX : 0
                      const clamped = Math.max(-120, Math.min(0, offset))
                      
                      return (
                        <div key={device.id} className="relative overflow-hidden rounded-3xl group">
                          {/* Delete Background */}
                          <div 
                            className="absolute inset-0 bg-red-500 flex items-center justify-end px-8 transition-opacity duration-300"
                            style={{ opacity: Math.abs(clamped) / 80 }}
                          >
                            <LogOut className="w-6 h-6 text-white" />
                          </div>

                          <motion.div
                            drag="x"
                            dragConstraints={{ left: -120, right: 0 }}
                            dragElastic={0.2}
                            onDragStart={() => {
                              setDraggingKey(key)
                              setIsDragging(true)
                            }}
                            onDrag={(e, info) => setDragOffsetX(info.offset.x)}
                            onDragEnd={(e, info) => {
                              if (info.offset.x <= -80) {
                                handleLogoutDevice(device.id)
                              }
                              setDraggingKey(null)
                              setDragOffsetX(0)
                              setIsDragging(false)
                            }}
                            style={{ x: clamped }}
                            className="relative p-5 bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl rounded-3xl active:bg-white/[0.05] transition-colors flex items-center gap-5"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/60">
                              {getDeviceIcon(device.deviceType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[16px] font-ttc-bold text-white truncate">
                                {device.deviceName}
                              </div>
                              <div className="text-[13px] text-white/40 font-sf-ui-regular truncate">
                                {device.os} • {device.browser}
                              </div>
                              <div className="flex items-center gap-3 mt-1.5">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-white/20" />
                                  <span className="text-[11px] text-white/30 font-sf-ui-light">{formatLastActive(device.lastActive)}</span>
                                </div>
                                {device.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-white/20" />
                                    <span className="text-[11px] text-white/30 font-sf-ui-light truncate max-w-[100px]">{device.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                              <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white/30 transition-colors" />
                            </div>
                          </motion.div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Hint */}
          {!loading && otherDevices.length > 0 && (
            <div className="mt-12 flex flex-col items-center gap-3 text-center px-8">
              <div className="p-3 rounded-full bg-white/[0.02] border border-white/[0.05]">
                <LogOut className="w-5 h-5 text-white/20" />
              </div>
              <p className="text-[13px] text-white/20 font-sf-ui-light leading-relaxed">
                Смахните устройство влево,<br />чтобы завершить сеанс
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
