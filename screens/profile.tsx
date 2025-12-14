'use client'

export default function Profile({
  profileTab,
  setProfileTab,
}: {
  profileTab: 'posts' | 'ads' | 'music' | 'friends'
  setProfileTab: (t: 'posts' | 'ads' | 'music' | 'friends') => void
}) {
  return (
    <>
      <div
        className="absolute left-0 w-full"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px)', height: 'var(--profile-cover-height)' }}
      >
        <div className="h-full w-full" style={{ background: '#0A0A0A' }} />
      </div>
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full overflow-hidden border border-[rgba(255,255,255,0.2)]"
        style={{
          width: 'var(--profile-avatar-size)',
          height: 'var(--profile-avatar-size)',
          top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px + var(--profile-cover-height) - calc(var(--profile-avatar-size) / 2))',
          boxShadow: '0 4px 18px rgba(0,0,0,0.35)',
          background: '#423030ff',
        }}
      />
      <div
        className="absolute left-0 w-full px-6"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px + var(--profile-cover-height) + calc(var(--profile-avatar-size) / 2) + 12px)',
          height: 'calc(812px - 88px - 56px - var(--profile-cover-height) - calc(var(--profile-avatar-size) / 2) - var(--home-header-offset) - 12px)',
        }}
      >
        <div className="flex w-full flex-col items-center">
          <div className="leading-[2.3em] text-white font-ttc-bold" style={{ fontSize: 'var(--profile-name-size)', marginTop: 'var(--profile-name-margin-top)' }}>
            @PaulDuRove
          </div>
          <div className="flex w-full items-center justify-center" style={{ marginTop: 'var(--profile-switch-offset)' }}>
            <div className="flex h-[45px] items-center justify-between rounded-[12px] border border-[#2B2B2B] bg-[#111111] px-2">
              <button
                type="button"
                onClick={() => setProfileTab('posts')}
                className={`h-[32px] rounded-[8px] px-3 text-[14px] ${profileTab === 'posts' ? 'bg-[#222222] text-white' : 'text-white/70'}`}
              >
                Посты
              </button>
              <button
                type="button"
                onClick={() => setProfileTab('ads')}
                className={`h-[32px] rounded-[8px] px-3 text-[14px] ${profileTab === 'ads' ? 'bg-[#222222] text-white' : 'text-white/70'}`}
              >
                Объявления
              </button>
              <button
                type="button"
                aria-disabled="true"
                className="h-[32px] rounded-[8px] px-3 text-[14px] text-white/40 cursor-not-allowed"
              >
                Скоро
              </button>
              <button
                type="button"
                aria-disabled="true"
                className="h-[32px] rounded-[8px] px-3 text-[14px] text-white/40 cursor-not-allowed"
              >
                Скоро
              </button>
            </div>
          </div>
          <div key={profileTab} className="mt-12 relative w-full h-full profile-switch-transition">
            {profileTab === 'posts' ? (
              <>
                <img
                  src="/interface/glass.png"
                  alt="empty"
                  style={{
                    position: 'absolute',
                    top: 'var(--profile-empty-icon-top)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'var(--profile-empty-icon-size)',
                    height: 'var(--profile-empty-icon-size)',
                  }}
                />
                <div
                  className="text-center text-[16px] leading-[1.4em] text-[#A1A1A1]"
                  style={{ position: 'absolute', left: 0, right: 0, bottom: 'var(--profile-empty-text-bottom)' }}
                >
                  У вас ещё нет публикаций
                </div>
                <button
                  type="button"
                  className="text-center rounded-[10px] bg-[#111111]"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bottom: 'var(--profile-empty-button-bottom)',
                    width: 'var(--profile-empty-button-width)',
                    height: 'var(--profile-empty-button-height)',
                    borderRadius: 'var(--profile-empty-button-radius)',
                    background: 'var(--profile-empty-button-bg)',
                  }}
                >
                  <span
                    className="inline-block font-vk-demi"
                    style={{
                      fontSize: 'var(--profile-empty-button-text-size)',
                      color: 'var(--profile-empty-button-text-color)',
                      lineHeight: '1.25em',
                      letterSpacing: '0.015em',
                    }}
                  >
                    Добавить
                  </span>
                </button>
              </>
            ) : profileTab === 'ads' ? (
              <>
                <img
                  src="/interface/glass.png"
                  alt="empty"
                  style={{
                    position: 'absolute',
                    top: 'var(--profile-empty-icon-top)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'var(--profile-empty-icon-size)',
                    height: 'var(--profile-empty-icon-size)',
                  }}
                />
                <div
                  className="text-center text-[16px] leading-[1.4em] text-[#A1A1A1]"
                  style={{ position: 'absolute', left: 0, right: 0, bottom: 'var(--profile-empty-text-bottom)' }}
                >
                  У вас ещё нет объявлений
                </div>
                <button
                  type="button"
                  className="text-center rounded-[10px] bg-[#111111]"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bottom: 'var(--profile-empty-button-bottom)',
                    width: 'var(--profile-empty-button-width)',
                    height: 'var(--profile-empty-button-height)',
                    borderRadius: 'var(--profile-empty-button-radius)',
                    background: 'var(--profile-empty-button-bg)',
                  }}
                >
                  <span
                    className="inline-block font-vk-demi"
                    style={{
                      fontSize: 'var(--profile-empty-button-text-size)',
                      color: 'var(--profile-empty-button-text-color)',
                      lineHeight: '1.25em',
                      letterSpacing: '0.015em',
                    }}
                  >
                    Добавить
                  </span>
                </button>
              </>
            ) : (
              null
            )}
          </div>
        </div>
      </div>
    </>
  )
}
