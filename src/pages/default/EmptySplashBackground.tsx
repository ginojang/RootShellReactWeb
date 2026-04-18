// src/pages/EmptySplashBackground.tsx
import { useEffect } from 'react'

export default function EmptySplashBackground({ onReady }: { onReady: () => void }) {

    // 웹브라우져 시작이후 시스템에서 각종 초기화 하는 시간 기다려주는 용도.
    //
    useEffect(() => {
        const timer = setTimeout(() => {
            onReady()
        }, 300) // 0.3초

        return () => clearTimeout(timer)
    }, [])


    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'black',
                zIndex: 0,
                display: 'flex',            // ✅ 중앙 정렬을 위해 flex 사용
                alignItems: 'center',       // ✅ 수직 정렬
                justifyContent: 'center',   // ✅ 수평 정렬
                color: 'white',             // ✅ 글자색
                fontSize: '60px',           // ✅ 글자 크기
                fontFamily: 'sans-serif',   // ✅ 깔끔한 글꼴
            }}
        >
        </div>
    )
}