import { useEffect, useRef, useState } from 'react'

export function TestOggPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  useEffect(() => {
    const loadAudio = async () => {
      const response = await fetch('https://ninja.o2jam.com/audio/0a7e4a05-2e5b-491a-8d63-687c17b785f5.ogg')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      console.log(`[🌸React] ✅ 오디오 blob url 생성 완료: ${url}`)
    }

    loadAudio()
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h2>🎵 React OGG 재생 테스트</h2>
      {audioUrl ? (
        <audio ref={audioRef} controls autoPlay>
          <source src={audioUrl} type="audio/ogg" />
          브라우저가 오디오를 지원하지 않습니다.
        </audio>
      ) : (
        <p>로딩 중...</p>
      )}
    </div>
  )
}
