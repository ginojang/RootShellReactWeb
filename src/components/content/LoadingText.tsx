// content/LoadingText.tsx

import { useEffect, useState } from 'react';
import { GlobalEnv } from '../../config/GlobalEnv'


type LoadingTextProps = {
    startTime?: number;
};

export function LoadingText({ startTime = 0 }: LoadingTextProps) {
    const frames = [
        '/imgs/O2ImgTitleLoadingText1.png',
        '/imgs/O2ImgTitleLoadingText2.png',
        '/imgs/O2ImgTitleLoadingText3.png',
    ];

    const [frameIndex, setFrameIndex] = useState(0);
    const [visible, setVisible] = useState(startTime === 0);
    //const [visible, setVisible] = useState(true);

    useEffect(() => {

        // 열기 동작 처리
        if (startTime > 0) {
            const timer = setTimeout(() => setVisible(true), startTime);
            return () => clearTimeout(timer);
        }
        setVisible(true);
    }, [startTime]);

    useEffect(() => {
        if (!visible) return;
        const interval = setInterval(() => {
            setFrameIndex((prev) => (prev + 1) % frames.length);
        }, 500);
        return () => clearInterval(interval);
    }, [visible]);

    if (!visible) return null;

    return (
        <div
            style={
                GlobalEnv.isMobile
                    ?
                    {
                        position: 'fixed',
                        bottom: '12%', // 하단 30% 위치
                        left: '50%',
                        transform: 'translate(-50%)', // 중앙 기준
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        pointerEvents: 'none',
                        width: '100%',
                        zIndex: 9999, // Unity보다 위
                        color: 'white', // TEST 글자 보이게
                        fontSize: '20px',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.7)', // 그림자 넣어서 대비 강화
                    } :
                    {
                        position: 'fixed',
                        top: '70%',
                        left: '50%',
                        transform: 'translate(-50%)', // 중앙 기준
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        pointerEvents: 'none',
                        width: '100%',
                        zIndex: 9999, // Unity보다 위
                        color: 'white', // TEST 글자 보이게
                        fontSize: '20px',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.7)', // 그림자 넣어서 대비 강화
                    }
            }
        >
            <img
                src={frames[frameIndex]}
                alt="Loading"
                style={{
                    width: '180px',
                    height: 'auto',
                    filter: 'drop-shadow(3px 3px 8px rgba(0,0,0,0.6))',
                    marginRight: '8px'
                }}
            />
        </div>
    );
}
