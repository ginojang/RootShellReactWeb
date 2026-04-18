import { useEffect, useState } from 'react'
import { isRestarted, GlobalEnv } from '../config/GlobalEnv'


export default function DAppStartSplash({ onStartButton }: { onStartButton: () => void }) {
  const [isVisible, setIsVisible] = useState(true)
  const [isMobile, setIsMobile] = useState(true)
  const [hasHandledRestart, setHasHandledRestart] = useState(false);

  useEffect(() => {
    setIsMobile(GlobalEnv.isMobile);

    const isRestart = isRestarted();
    if (isRestart && !hasHandledRestart) {
      setHasHandledRestart(true);
      handleTouch();
    }
  }, [hasHandledRestart]);

  const handleTouch = () => {
    setIsVisible(false)
    onStartButton()
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'url("/imgs/OTImgLobbyBackgroundMorning.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: 0,
          transition: 'background-color 0.3s ease',
          backgroundColor: isVisible ? 'transparent' : 'rgba(0, 0, 0, 0.6)',
          backgroundBlendMode: isVisible ? 'normal' : 'darken',
        }}
      />

      {isVisible && (
        <div
          style={{
            position: 'fixed',
            top: '8%',
            left: 0,
            width: '100%',
            zIndex: 2,
            pointerEvents: 'none',
            textAlign: 'center',
          }}
        >
          <img
            src="/imgs/OTImgLoadingTitle.png"
            alt="O2Jam Title"
            style={{
              width: isMobile ? '90%' : '60%',
            }}
          />
        </div>
      )}

      {
        // 하단 시작 접속 창
      }

      {isVisible && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            bottom: 0,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            zIndex: 2,
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px 20px 0 0',
              padding: isMobile ? '24px 16px' : '32px 24px',
              width: isMobile ? '100%' : '600px', // ✅ PC에서 고정 폭
              maxWidth: '100%', // 안전장치
              boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: isMobile ? '16px' : '24px',
              margin: '0 auto', // ✅ 중앙 정렬
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: isMobile ? '20px' : '25px',
                  fontWeight: 700,
                  marginBottom: '4px',
                  color: '#000',
                  fontFamily: 'sans-serif',
                }}
              >
                Welcome to O2Jam Ninja!
              </div>
              <div
                style={{
                  fontSize: isMobile ? '14px' : '18px',
                  color: '#444',
                  fontFamily: 'sans-serif',
                  marginTop: '14px',
                }}
              >
                Ready to play? Join with one click!
              </div>
            </div>

            <button
              onClick={handleTouch}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                width: isMobile ? '90%' : '90%',
                height: isMobile ? '52px' : '96px',
                borderRadius: '12px',
                backgroundColor: '#06C755',
                border: 'none',
                color: '#FFFFFF',
                fontSize: isMobile ? '18px' : '24px',
                fontFamily: 'sans-serif',
                fontWeight: 'bold',
                cursor: 'pointer',

              }}
            >
              <img
                src="/imgs/symbol_green.png"
                alt="KAIA symbol"
                style={{
                  width: '24px',
                  height: '24px',
                  filter: 'brightness(0) invert(1)',
                }}
              />
              Connect
            </button>
          </div>
        </div>
      )}
    </>
  )
}
