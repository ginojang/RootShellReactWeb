// src/appServices/PureUnityWebView.tsx

import { useState, useEffect, useRef } from 'react'

import { UnityProvider } from '../providers/unity/UnityProvider'
import { ReactUICanvas } from '../components/ReactUICanvas'

import DebugOverlay from '../components/DebugOverlay'
import EmptySplashBackground from '../pages/default/EmptySplashBackground'
import BlueScreenSplash from '../pages/default/BlueScreenSplash'

import { UnityWrapper } from '../providers/unity/UnityWrapper'

import { log } from '../utils/log';
import { getLanguage, GlobalEnv } from '../config/GlobalEnv';


function PureUnityWebViewInner() {
    const [isReady, setIsReady] = useState(false)

    const [startUnity, setStartUnity] = useState(false)
    const [isBlueScreen, setIsBlueScreen] = useState(false)
    const [blueScreenStatus, setBlueScreenStatus] = useState<string>('')
    const [userUUID, setUserUUID] = useState<string>('');

    const isReadyRef = useRef(false)
    const isFirstGameLoopRef = useRef(true)
    const isBlueScreenRef = useRef(false)

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

            setIsReady(true)
            isReadyRef.current = true
        }
    }

    const handleStarted = async () => {

        console.log(`[🌸RootShell]✅ handleStarted ->>  !!4`);

        //
    }

    const handleLoop = () => {
        const isFirst = isFirstGameLoopRef.current

        /*
        O2JamMainLoop({
            isFirstLoop: isFirst,
            onStartUnity: (uuid: string) => {
                setUserUUID(uuid);
                setStartUnity(true);
            },
        })*/
        if (isFirst) isFirstGameLoopRef.current = false
    }

    useEffect(() => {
        const loopId = setInterval(() => {
            if (isReadyRef.current)
                handleLoop()
        }, 100)
        return () => clearInterval(loopId)
    }, [isReady])

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

            {isReady && (
                <BlueScreenSplash
                    statusScreen={blueScreenStatus}
                    onExited={handleStarted}
                />

            )}  {/* z-index = 1 */}

            {startUnity && (
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
