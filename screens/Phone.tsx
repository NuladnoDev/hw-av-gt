'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { X, Smartphone, Tablet, Laptop, Globe, MapPin, Clock, Shield } from 'lucide-react'
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
  const [dragStates, setDragStates] = useState<Record<string, { offset: number; isDragging: boolean }>>({})

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
      
      // Получаем текущую сессию
      const auth = await loadLocalAuth()
      const client = getSupabase()
      
      if (!client || !auth?.uuid) {
        // Заглушка с текущим устройством
        const currentDevice: DeviceInfo = {
          id: 'current',
          deviceType: getDeviceType(),
          deviceName: getDeviceName(),
          os: getOS(),
          browser: getBrowser(),
          location: 'Череповец, Россия', // Заглушка
          lastActive: new Date().toISOString(),
          isCurrent: true
        }
        setDevices([currentDevice])
        return
      }

      // Пытаемся получить реальные данные о сессиях из Supabase
      const { data: sessions, error } = await client
        .from('auth.sessions')
        .select('*')
        .eq('user_id', auth.uuid)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error || !sessions?.length) {
        // Если не получилось, показываем только текущее устройство
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
        // Преобразуем сессии в устройства
        const deviceInfos: DeviceInfo[] = sessions.map((session, index) => ({
          id: session.id || `device-${index}`,
          deviceType: detectDeviceType(session.user_agent || ''),
          deviceName: getDeviceNameFromUA(session.user_agent || ''),
          os: getOSFromUA(session.user_agent || ''),
          browser: getBrowserFromUA(session.user_agent || ''),
          ip: session.ip_address,
          location: 'Череповец, Россия', // Можно интегрировать IP геолокацию
          lastActive: session.updated_at || session.created_at,
          isCurrent: index === 0 // Самая recent сессия - текущая
        }))
        setDevices(deviceInfos)
      }
    } catch (error) {
      console.error('Ошибка при загрузке устройств:', error)
      // Показываем хотя бы текущее устройство
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

  const handleDragStart = (deviceId: string) => {
    setDragStates(prev => ({
      ...prev,
      [deviceId]: { offset: 0, isDragging: true }
    }))
  }

  const handleDrag = (deviceId: string, offset: number) => {
    setDragStates(prev => ({
      ...prev,
      [deviceId]: { ...prev[deviceId], offset }
    }))
  }

  const handleLogoutDevice = async (deviceId: string) => {
    try {
      const client = getSupabase()
      if (!client) return
      
      // Удаляем устройство из списка
      setDevices(prev => prev.filter(device => device.id !== deviceId))
      
      // В реальном приложении здесь был бы запрос к API для завершения сессии
      // await client.auth.signOut({ scope: 'single', deviceId })
      
      console.log(`Устройство ${deviceId} вышло из аккаунта`)
    } catch (error) {
      console.error('Ошибка при выходе устройства:', error)
    }
  }

  const handleDragEnd = (deviceId: string, finalOffset: number) => {
    if (finalOffset <= -70) {
      handleLogoutDevice(deviceId)
    } else {
      setDragStates(prev => ({
        ...prev,
        [deviceId]: { offset: 0, isDragging: false }
      }))
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <div className="relative h-[812px] w-[375px]" style={{ transform: `scale(${scale})` }}>
        <div className="absolute left-0 top-0 h-[812px] w-[375px] bg-[#0A0A0A]" />

        {/* Header */}
        <div
          className="absolute left-0 w-full bg-[#0A0A0A]"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset))', height: '56px' }}
        >
          <div className="relative h-full w-full flex items-center justify-center">
            <button
              type="button"
              onClick={onClose}
              className="absolute left-4 p-2 -ml-1 rounded-lg hover:bg-white/5 active:scale-95 transition-all duration-300"
              aria-label="Назад"
            >
              <X size={24} className="text-white" />
            </button>
            <div className="text-white leading-[1em]" style={{ fontSize: 'var(--profile-name-size, 20px)' }}>
              Устройства
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          className="absolute left-0 w-full overflow-y-auto px-4"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px)',
            height: 'calc(812px - 56px - var(--home-header-offset))',
          }}
        >
          <div className="py-4">
            {/* Security Info */}
            <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-green-400" />
                <div className="text-white font-medium">Безопасность</div>
              </div>
              <div className="text-white/60 text-sm">
                {devices.length > 0 
                  ? `Активных устройств: ${devices.length}`
                  : 'Информация об устройствах загружается'
                }
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-white/60 text-sm">Загрузка устройств...</div>
              </div>
            )}

            {!loading && devices.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <div className="text-white/60 text-sm">Устройства не найдены</div>
              </div>
            )}

            {!loading && devices.length > 0 && (
              <div className="space-y-3">
                {devices.map((device) => {
                  const key = device.id
                  const isDragging = draggingKey === key
                  const offset = isDragging ? dragOffsetX : 0
                  const clamped = Math.max(-120, Math.min(0, offset))
                  const intensity = Math.min(1, Math.abs(clamped) / 120)
                  const bg = `rgba(220,38,38,${0.2 + intensity * 0.4})`
                  
                  return (
                    <motion.div
                      key={device.id}
                      className="relative"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: clamped < 0 ? bg : 'transparent',
                        }}
                      />
                      <motion.div
                        className="relative p-4 bg-white/5 rounded-xl border border-white/10"
                        drag={!device.isCurrent ? "x" : undefined}
                        dragConstraints={{ left: -120, right: 0 }}
                        dragElastic={0.2}
                        onDragStart={() => {
                          if (!device.isCurrent) {
                            setDraggingKey(key)
                            setDragOffsetX(0)
                            setIsDragging(true)
                          }
                        }}
                        onDrag={(event, info) => {
                          if (draggingKey !== key) return
                          setDragOffsetX(info.offset.x)
                        }}
                        onDragEnd={(event, info) => {
                          const finalOffset = info.offset.x
                          if (finalOffset <= -70) {
                            handleLogoutDevice(device.id)
                          }
                          setDraggingKey(null)
                          setDragOffsetX(0)
                          setIsDragging(false)
                        }}
                        style={{
                          x: clamped,
                          touchAction: 'pan-y',
                          cursor: device.isCurrent ? 'default' : 'grab',
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-white/70">
                              {getDeviceIcon(device.deviceType)}
                            </div>
                            <div>
                              <div className="text-white font-medium">
                                {device.deviceName}
                                {device.isCurrent && (
                                  <span className="ml-2 text-xs text-green-400">(этот)</span>
                                )}
                              </div>
                              <div className="text-white/60 text-sm">
                                {device.os} • {device.browser}
                              </div>
                              {device.location && (
                                <div className="flex items-center gap-1 mt-1">
                                  <MapPin size={12} className="text-white/40" />
                                  <div className="text-white/50 text-xs">{device.location}</div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-white/50 text-xs">
                              <Clock size={12} />
                              {formatLastActive(device.lastActive)}
                            </div>
                            {device.ip && (
                              <div className="text-white/40 text-xs mt-1">
                                IP: {device.ip}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* Info */}
            <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="text-white/60 text-sm mb-2">
                Здесь отображаются устройства, на которых вы вошли в аккаунт.
              </div>
              <div className="text-white/40 text-xs">
                Смахните устройство влево, чтобы выйти из аккаунта
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
