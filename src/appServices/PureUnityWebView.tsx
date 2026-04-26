// src/appServices/PureUnityWebView.tsx

import { useState, useEffect, useRef } from 'react'

import { UnityProvider } from '../providers/unity/UnityProvider'
import { ReactUICanvas } from '../components/ReactUICanvas'

import DebugOverlay from '../components/DebugOverlay'
import EmptySplashBackground from '../pages/default/EmptySplashBackground'
import BlueScreenSplash from '../pages/default/BlueScreenSplash'
import LandingPage from '../pages/punker/LandingPage'
import HolderPage from '../pages/punker/HolderPage'

import { UnityWrapper } from '../providers/unity/UnityWrapper'

import { log } from '../utils/log';
import { getLanguage, GlobalEnv } from '../config/GlobalEnv';
import { GameMainLoop } from '../core/unity/GameMainLoop';




function PureUnityWebViewInner() {
    const [isReady, setIsReady] = useState(false)
    const [isShowStartBlueScreen, setIsShowStartBlueScreen] = useState(false)
    const [isShowWalletConnect, setIsWalletConnect] = useState(false)
    const [isShowHolderPage, setIsShowHolderPage] = useState(false);
    const [isStartedGameLoop, setIsStartedGameLoop] = useState(false)


    const [startUnity, setStartUnity] = useState(false)
    const [isBlueScreen, setIsBlueScreen] = useState(false)
    const [blueScreenStatus, setBlueScreenStatus] = useState<string>('')
    const [userUUID, setUserUUID] = useState<string>('');

    const isReadyRef = useRef(false)
    const isShowWalletConnectRef = useRef(false)
    const isStartedGameLoopRef = useRef(false)
    const isFirstGameLoopRef = useRef(true)
    const isBlueScreenRef = useRef(false)

    const [address, setAddress] = useState<string>('');
    const [authToken, setAuthToken] = useState<string>('');

    const handleReady = () => {

        if (GlobalEnv.launchedInApp === 'kakao') {
            setBlueScreenStatus('kakao')
            setIsBlueScreen(true)
            setIsReady(false)
            isBlueScreenRef.current = true
            isReadyRef.current = false
        }
        else if (GlobalEnv.isMobile === true && GlobalEnv.currentOS === 'ios' && (GlobalEnv.currentOSVersion ?? 0) < 17) {
            setBlueScreenStatus('unsupported_ios_version')
            setIsBlueScreen(true)
            setIsReady(false)
            isBlueScreenRef.current = true
            isReadyRef.current = false
        }
        else {
            setBlueScreenStatus('')
            setIsReady(true)
            isReadyRef.current = true
            setIsShowStartBlueScreen(true)

            setIsWalletConnect(true)
            isShowWalletConnectRef.current = true
        }
    }


    // 
    type WebLoopParams = {
        address: string;
        token: string;
    };
    const hanleWebLoop = async ({ address, token }: WebLoopParams) => {
        console.log('[WebLoop] start:', address, token);

        setAddress(address);
        setAuthToken(token);

        setIsWalletConnect(false);
        setIsShowStartBlueScreen(false);

        // HolderPage 표시
        setIsShowHolderPage(true);
    };


    // 아래는 아레나 시스템이 구축 된 이후 활성화.
    const hanleGameStart = async () => {
        setIsShowStartBlueScreen(false)
        setTimeout(() => {
            setIsStartedGameLoop(true)
            isStartedGameLoopRef.current = true
        }, 1)
    }

    const handleGameLoop = () => {
        const isFirst = isFirstGameLoopRef.current
        if (isFirst) isFirstGameLoopRef.current = false

        GameMainLoop({
            isFirstLoop: isFirst,
            onStartUnity: (uuid: string) => {
                setUserUUID(uuid)
                setStartUnity(true)
            },
        })
    }

    useEffect(() => {
        const loopId = setInterval(() => {
            if (isStartedGameLoopRef.current)
                handleGameLoop()
        }, 100)
        return () => clearInterval(loopId)
    }, [isStartedGameLoop])

    const handleExitApp = () => {
        const exitUrl = import.meta.env.VITE_EXIT_URL
        log(`handleExitApp >> ${exitUrl}`);
        if (exitUrl) {
            const isFullUrl = /^https?:\/\//.test(exitUrl)
            const finalUrl = isFullUrl ? exitUrl : `https://${exitUrl}`

            window.location.href = finalUrl
        } else {
            log('[🌸handleExitApp]❌ VITE_EXIT_URL 환경변수가 설정되어 있지 않음')
        }
    }

    return (
        <div style={{ position: 'relative' }}>
            {<EmptySplashBackground
                onReady={handleReady}
            />} {/* z-index = 0 */}

            {isBlueScreen && (
                <BlueScreenSplash
                    statusScreen={blueScreenStatus}
                    onExited={handleExitApp}
                />
            )} {/* z-index = 0 */}

            {isShowStartBlueScreen && (
                <BlueScreenSplash
                    statusScreen={blueScreenStatus}
                    onExited={async () => { }}
                />
            )}  {/* z-index = 1 */}

            {isShowWalletConnect && (
                <LandingPage
                    onSuccesed={({ address, token }) => {
                        console.log('success address:', address, token);
                        hanleWebLoop({ address, token });
                    }}
                />
            )}

            {isShowHolderPage && (
                <HolderPage
                    address={address}
                    token={authToken}
                />
            )}


            {isReady && startUnity && (
                <UnityWrapper
                    startMode={'pure'}
                    userUUID={userUUID}
                    language={getLanguage()}
                    isMobile={(GlobalEnv.isMobile === true) ? 'true' : 'false'}
                />
            )}

            {<ReactUICanvas />}     {/* zIndex: 1000 */}
            {<DebugOverlay />}   {/* zIndex: 10000 */}
        </div>
    )
}

export function PureUnityWebView() {
    return (
        <UnityProvider>
            <PureUnityWebViewInner />
        </UnityProvider>
    )
}
