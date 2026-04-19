import React from 'react'
import { getText } from '../../i18n'
import { GlobalEnv } from '../../config/GlobalEnv'

export function getUnityCanvasSize() {
  return {
    width: GlobalEnv.isMobile ? window.innerWidth : 600,
    height: GlobalEnv.isMobile ? window.innerHeight : 960
  };
}

interface UnityCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  showSplash: boolean
  progress: number
  fadeOut: boolean
}

export const UnityCanvas: React.FC<UnityCanvasProps> = ({
  canvasRef,
  showSplash,
  progress,
  fadeOut,
}) => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  const width = isMobile ? window.innerWidth : Number(import.meta.env.VITE_PC_WIDTH) || 600;
  const height = isMobile ? window.innerHeight : Number(import.meta.env.VITE_PC_HEIGHT) || 960;

  const DISABLE_START_SPINNER = false;

  return (
    <div
      style={{
        position: 'relative',
        width: width,
        height: height,
      }}
    >
      {showSplash && (
        <>
          <img
            src="./imgs/start_splash.jpg"
            alt="Splash"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: width,
              height: height,
              objectFit: 'cover',
              zIndex: 0xF9A2C24D,
              pointerEvents: 'none',
              opacity: fadeOut ? 0 : 1,
              transition: 'opacity 0.5s ease',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              width: '100%',
              textAlign: 'center',
              color: '#fff',
              fontFamily: 'sans-serif',
              fontSize: '18px',
              textShadow: '0 0 8px rgba(0,0,0,0.7)',
              zIndex: 0xF9A2C24D + 1,
            }}
          >
            {showSplash && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 0xF9A2C24D + 10,
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                }}
              >
                {!DISABLE_START_SPINNER && progress >= 0.99 && (
                  <>
                    <div className="loader" />
                    <div
                      style={{
                        marginTop: '16px',
                        color: '#fff',
                        fontSize: '16px',
                        animation: 'fadeinout 2s ease-in-out infinite',
                      }}
                    >
                      {getText('t012') /*게임을 시작 중입니다... 잠시만 더 기다려 주세요.*/}
                    </div>
                  </>
                )}


                {/* 퍼센트 텍스트는 항상 보여줌 */}
                <div
                  style={{
                    marginTop: progress >= 0.99 ? '80px' : '40px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(2px)',
                    color: '#fff',
                    fontSize: '17px',
                    //fontWeight: 'bold', // ✅ 여기에 Bold 추가!
                    fontFamily: 'IBM Plex Mono, monospace',
                    textShadow: `
                        0 0 4px rgba(0, 0, 0, 0.7),
                        1px 1px 2px rgba(0, 0, 0, 0.8),
                        -1px -1px 2px rgba(0, 0, 0, 0.8)
                        `,
                    WebkitTextStroke: '0.3px rgba(0, 0, 0, 0.6)',
                    animation: 'fadeinout 2s ease-in-out infinite',
                    zIndex: 0xF9A2C24D + 9,
                  }}
                >
                  {getText('t013')} {Math.floor(progress * 100)}
                </div>
              </div>
            )}
          </div>
        </>
      )}
      <canvas
        id="unity-canvas"
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          top: 0,               // ✅ 최상단 고정
          left: 0,
          width: width,
          height: height,
          background: '#231F20',
          zIndex: 1,
          position: 'relative',
          touchAction: 'none',
        }}
      />
    </div>
  )
}
