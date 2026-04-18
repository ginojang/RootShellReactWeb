// src/appServices/dAppUnityWeb.tsx

import { useState, useEffect, useRef } from 'react'

import { KaiaWalletProvider, useWalletProvider } from '../providers/KaiaWalletProvider'
import { UnityProvider } from '../providers/unity/UnityProvider'
import { ReactUICanvas } from '../components/ReactUICanvas'

import DebugOverlay from '../components/DebugOverlay'
import EmptySplashBackground from '../pages/default/EmptySplashBackground'
import BlueScreenSplash from '../pages/default/BlueScreenSplash'
import DAppStartSplash from '../pages/dAppStartSplash'

import { UnityWrapper } from '../providers/unity/UnityWrapper'
import { showLoadingSpinner, showPopup } from '../components/ReactUICanvas'
import { WalletProfile } from '../components/content/WalletProfile'

import { O2JamMainLoop } from '../content/O2JamMain'
import { log } from '../utils/log';
//import { getText } from '../i18n'
import { getLanguage, GlobalEnv } from '../config/GlobalEnv';


function DAppUnityWebInner() {
    const [isReady, setIsReady] = useState(false)
    const [isWalletConnected, setIsWalletConnect] = useState(false)

    const [startUnity, setStartUnity] = useState(false)
    const [isBlueScreen, setIsBlueScreen] = useState(false)
    const [blueScreenStatus, setBlueScreenStatus] = useState<string>('') // ✅ 추가
    const [userUUID, setUserUUID] = useState<string>(''); // 💡 UUID 저장

    const { address, connectionStatus, blueScreenStatusWallet, walletConnect } = useWalletProvider()

    const isReadyRef = useRef(false)
    const isWalletConnectedRef = useRef(false)
    const isFirstGameLoopRef = useRef(true) // ✅ 최초 루프인지 추적
    const isBlueScreenRef = useRef(false)
    const handleReady = () => {
        //
        // 시작 가능한지 체크
        if (GlobalEnv.launchedInApp === 'kakao') {
            setBlueScreenStatus('kakao')
            setIsBlueScreen(true)
            setIsReady(false)
            isBlueScreenRef.current = true
            isReadyRef.current = false
        }
        // 다른 조건 계속 추가
        else if (GlobalEnv.isMobile === true && GlobalEnv.currentOS === 'ios' && (GlobalEnv.currentOSVersion ?? 0) < 17) {
            setBlueScreenStatus('unsupported_ios_version')
            setIsBlueScreen(true)
            setIsReady(false)
            isBlueScreenRef.current = true
            isReadyRef.current = false
        }
        //
        else {
            setIsReady(true)
            isReadyRef.current = true
        }
    }


    const handleStarted = async () => {
        //showLoadingSpinner({ loading: true, message: getText('t007') /*`Securely connecting to your wallet...`*/ })

        showLoadingSpinner({ loading: false });
        await walletConnect('dAPP');
    }

    useEffect(() => {
        // 접속 성공이면. 유니티 게임 정상 플레이 진행 시킨다.
        if (connectionStatus === 'connected' && address) {
            showLoadingSpinner({ loading: false })
            console.log(`[🌸RootShell]✅ 지갑 접속 성공 !`);

            setIsWalletConnect(true)
            isWalletConnectedRef.current = true
        }
        // 맨처음 접속이면. 프로필 팝업 뜨게 한다.
        else if (connectionStatus === 'first_connected' && address) {
            console.log(`[🌸RootShell]✅  맨 처음 접속 - 프로필 팝업 -`);
            showPopup(
                <WalletProfile
                    isFirstMode={true}
                    pictureUrl={null}
                    displayName={null}
                    onClose={() => {
                        showPopup(null)

                        // 위 프로필 팝업 종료됨 - setIsConnect(true) 해서 - 아래 handleLoop() 안에서 유니티 실행 되게 한다.
                        showLoadingSpinner({ loading: false })
                        setIsWalletConnect(true)
                        isWalletConnectedRef.current = true
                    }}
                    onShowBlueScreen={() => {
                        setBlueScreenStatus('error_404')
                        setIsBlueScreen(true)
                        setIsReady(false)
                        isBlueScreenRef.current = true
                        isReadyRef.current = false
                        showPopup(null) // ✅ 팝업 닫기 
                    }}
                />
            )
        }
        // 생성 실패 - 브라우저 문제 - 오류
        else if (connectionStatus === 'failed') {
            showLoadingSpinner({ loading: false })
            if (blueScreenStatusWallet != null)
                setBlueScreenStatus(blueScreenStatusWallet)
            setIsBlueScreen(true)
            isBlueScreenRef.current = true

            setIsReady(false)
            isReadyRef.current = false
        }
    }, [connectionStatus, address]);

    const handleLoop = () => {
        const isFirst = isFirstGameLoopRef.current
        O2JamMainLoop({
            isFirstLoop: isFirst,
            onStartUnity: (uuid: string) => {
                setUserUUID(uuid);        // ✅ uuid 저장
                setStartUnity(true);      // ✅ UnityWrapper 시작
            },
        })
        if (isFirst) isFirstGameLoopRef.current = false
    }

    useEffect(() => {
        const loopId = setInterval(() => {
            if (isWalletConnectedRef.current)
                handleLoop()
        }, 100)
        return () => clearInterval(loopId)
    }, [isWalletConnected])

    const handleExitApp = () => {
        const exitUrl = import.meta.env.VITE_EXIT_URL
        log(`handleExitApp >> ${exitUrl}`);
        if (exitUrl) {
            // ✅ "http" 또는 "https"가 빠졌을 경우 보완
            const isFullUrl = /^https?:\/\//.test(exitUrl)
            const finalUrl = isFullUrl ? exitUrl : `https://${exitUrl}`

            window.location.href = finalUrl
        } else {
            log('[🌸handleExitApp]❌ VITE_EXIT_URL 환경변수가 설정되어 있지 않음')
        }
    }

    return (
        // ✅ position 기준 anchor 역할 (자식 absolute 요소 정렬 및 zIndex 기준용)
        <div style={{ position: 'relative' }}>
            {<EmptySplashBackground
                onReady={handleReady}
            />} {/* z-index = 0 */}

            {isBlueScreen && (
                <BlueScreenSplash
                    statusScreen={blueScreenStatus} // ✅ 전달
                    onExited={handleExitApp}
                />
            )} {/* z-index = 0 */}

            {isReady && (
                <DAppStartSplash
                    onStartButton={handleStarted}
                />
            )}  {/* z-index = 1 */}

            {startUnity && (
                <UnityWrapper
                    startMode={'dApp'}
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

export function DAppUnityWeb() {
    return (
        <KaiaWalletProvider>
            <UnityProvider>
                <DAppUnityWebInner />
            </UnityProvider>
        </KaiaWalletProvider>
    )
}
