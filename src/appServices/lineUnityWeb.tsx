// src/appServices/lineUnityWeb.tsx

import { useState, useEffect, useRef } from 'react'
import { LiffProvider, useLiffContext/*, inviteFriends*/ } from '../providers/LiffProvider'
import { KaiaWalletProvider, useWalletProvider } from '../providers/KaiaWalletProvider'

import EmptySplashBackground from '../pages/default/EmptySplashBackground'
import BlueScreenSplash from '../pages/default/BlueScreenSplash'
import DebugOverlay from '../components/DebugOverlay'

import { ReactUICanvas, showLoadingSpinner/*, showPopup*/ } from '../components/ReactUICanvas'

import { UnityProvider } from '../providers/unity/UnityProvider'
import { UnityWrapper } from '../providers/unity/UnityWrapper'

import { O2JamMainLoop } from '../content/O2JamMain'
import { log, logError } from '../utils/log';
import { sendApiJson, isApiSuccess } from '../utils/sendApi';
import { getLanguage, GlobalEnv } from '../config/GlobalEnv';



function LineUnityWebInner() {
    const [isReady, setIsReady] = useState(false)
    const [isInitLiff, setIsInitLiff] = useState(false)
    const [isWalletConnected, setIsWalletConnect] = useState(false)

    const [startUnity, setStartUnity] = useState(false)
    const [isBlueScreen, setIsBlueScreen] = useState(false)
    const [blueScreenStatus, setBlueScreenStatus] = useState<string>('') // ✅ 추가
    const [unityStartMode, setUnityStartMode] = useState<'liffNormal' | 'liffFirst'>('liffNormal');
    const [userUUID, setUserUUID] = useState<string>(''); // 💡 UUID 저장

    const { initializeStatus, init, userId, displayName, pictureUrl, statusMessage, idToken } = useLiffContext()
    const { address, walletType, connectionStatus, /*walletProvider,*/ walletConnect, /*, blueScreenStatusWallet,*/ } = useWalletProvider()

    const isReadyRef = useRef(false)
    const isWalletConnectedRef = useRef(false)
    const isBlueScreenRef = useRef(false)
    const isFirstGameLoopRef = useRef(true) // ✅ 최초 루프인지 추적


    const handleReady = async () => {

        // 다른 조건 계속 추가
        if (GlobalEnv.isMobile === true && GlobalEnv.currentOS === 'ios' && (GlobalEnv.currentOSVersion ?? 0) < 17) {
            setBlueScreenStatus('unsupported_ios_version')
            setIsBlueScreen(true)
            setIsReady(false)
            isBlueScreenRef.current = true
            isReadyRef.current = false
        }
        else {
            setIsReady(true)
            isReadyRef.current = true
            showLoadingSpinner({ loading: true, message: '' });
            await init((import.meta.env.VITE_APP_IS_FAKE_LIFF === 'true') ? true : false);
        }
    }

    useEffect(() => {
        if (!isReady)
            return;

        const gotoBlueScreen = () => {
            showLoadingSpinner({ loading: false });
            if (!isBlueScreenRef.current) {
                setIsBlueScreen(true);
                setBlueScreenStatus('failed');
                isBlueScreenRef.current = true;
            }
            return;
        }
        if (initializeStatus === 'success') {

            const getWalletAddress = async () => {
                const payload = {
                    user_id: userId,
                    connected_service: 'line'
                };
                const raw = await sendApiJson<typeof payload>('users', 'get-wallet-address', payload);
                const result = isApiSuccess(raw);
                if (!result.ok) {
                    log(`[🌸RootShell4]❌ 지갑 가져오기 실패 → 블루스크린 진입`);
                    gotoBlueScreen();
                    return;
                }

                setIsInitLiff(true);
                const address = result.data.address

                showLoadingSpinner({ loading: false });

                if (address === 'no_address') {
                    walletConnect('LiffFirst')
                }
                else
                    walletConnect('Liff')
            }

            const sendLiffUserInfo = async () => {
                const payload = {
                    user_id: userId,
                    connected_service: 'line',
                    display_name: displayName,
                    picture_url: pictureUrl ?? null,
                    statusMessage: statusMessage ?? null,
                    token_id: idToken,
                };

                const raw = await sendApiJson<typeof payload>('auth', 'oauth', payload);
                const result = isApiSuccess(raw);

                if (!result.ok) {
                    log(`[🌸RootShell4]❌ 사용자 등록 실패 → 블루스크린 진입`);
                    gotoBlueScreen();
                    return;
                }

                log(`[🌸RootShell4] 라인 사용자 등록 [${displayName}] 성공!`);

                await getWalletAddress();
            };

            sendLiffUserInfo();
        }
        else if (initializeStatus === 'failed') {
            showLoadingSpinner({ loading: false })
            setIsBlueScreen(true)
            setBlueScreenStatus('failed')
            isBlueScreenRef.current = true
        }
    }, [isReady, initializeStatus]);


    // 지갑 관련 - USEEFFECT
    useEffect(() => {
        if (!isInitLiff)
            return;

        // ✅ 최초 연결된 경우 → 백엔드에 지갑 등록
        if (connectionStatus === 'first_connected' && address) {
            const registerWallet = async () => {
                const payload = {
                    wallet_address: address,
                    wallet_type: walletType,
                    user_id: userId,
                    connected_service: 'line',
                };

                const raw = await sendApiJson<typeof payload>('users', 'set-wallet-address', payload);
                const result = isApiSuccess(raw);
                log(`${result}`);

                if (!result.ok) {
                    log(`[🌸RootShell4]❌ 지갑 등록 실패 → ${address}`);
                    setIsBlueScreen(true);
                    setBlueScreenStatus('failed');
                    return;
                }

                showLoadingSpinner({ loading: false })


                setUnityStartMode('liffFirst'); // 이거만 차이남
                setIsWalletConnect(true);
                isWalletConnectedRef.current = true;

            };

            registerWallet();
        }
        else if (connectionStatus === 'connected' && address) {

            const registerWallet = async () => {
                const payload = {
                    wallet_address: address,
                    wallet_type: walletType,
                    user_id: userId,
                    connected_service: 'line',
                };

                const raw = await sendApiJson<typeof payload>('users', 'set-wallet-address', payload);
                const result = isApiSuccess(raw);
                log(`${result}`);

                if (!result.ok) {
                    log(`[🌸RootShell4]❌ 지갑 등록 실패 → ${address}`);
                    setIsBlueScreen(true);
                    setBlueScreenStatus('failed');
                    return;
                }

                showLoadingSpinner({ loading: false })


                setUnityStartMode('liffNormal');        // 이거만 차이남
                setIsWalletConnect(true);
                isWalletConnectedRef.current = true;

            };

            registerWallet();
        }
    }, [connectionStatus, address]);


    // 유니티 게임 LOOP     
    const handleLoop = () => {
        const isFirst = isFirstGameLoopRef.current
        /*
                if (isFirst === true && userId != null)
                    testBanner(
                        { userId: userId, displayName: displayName || 'KaiaUser' },
                        walletType || '',
                        walletProvider
                    );
        */

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

            {startUnity && (
                <UnityWrapper
                    startMode={unityStartMode}
                    userUUID={userUUID}
                    language={getLanguage()}
                    isMobile={(GlobalEnv.isMobile === true) ? 'true' : 'false'}
                />
            )}
            {<ReactUICanvas />}     {/* zIndex: 1000 */}
            <DebugOverlay />   {/* zIndex: 10000 */}
        </div>
    )
}

export function LineUnityWeb() {
    return (
        <LiffProvider>
            <KaiaWalletProvider>
                <UnityProvider>
                    <LineUnityWebInner />
                </UnityProvider>
            </KaiaWalletProvider>
        </LiffProvider>
    )
}


export function testBanner(
    user: { userId: string, displayName: string },
    walletType: string,
    walletProvider: any
) {
    const sdk = (window as any).OpenADLineJsSDK;
    if (!sdk?.banner?.init) {
        logError("[🌸LineAdDebug] SDK가 아직 안 올라옴");
        return;
    }

    // fetch 후킹
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const [url, options] = args;
        if (typeof url === "string" && url.includes("openad.network")) {
            log(`[🌸LineAdDebug] 광고 요청: ${url}, 옵션: ${JSON.stringify(options)}`);
        }
        const res = await originalFetch(...args);
        if (typeof url === "string" && url.includes("openad.network")) {
            log(`[🌸LineAdDebug] 광고 응답 상태: ${res.status}`);
        }
        return res;
    };

    // 배너 DOM
    const bannerDiv = document.createElement('div');
    bannerDiv.className = 'OpenADLineJsSDKBanner';
    bannerDiv.setAttribute('zoneId', '158');
    bannerDiv.setAttribute('publisherId', '49');
    bannerDiv.style.border = '1px solid red';
    bannerDiv.style.width = '320px';
    bannerDiv.style.height = '50px';
    bannerDiv.style.background = '#eee';
    document.body.prepend(bannerDiv);

    // SDK init
    sdk.banner.init({
        adParams: {
            line: {
                type: 'LMA',
                liffId: import.meta.env.VITE_LINE_LIFF_ID,
                prototype: (window as any).liff,
            },
            wallet: {
                type: walletType,
                provider: walletProvider,
                components: ''
            }
        },
        adInfo: { zoneId: 528, publisherId: 69, eventId: 0 },
        userInfo: { userId: user.userId, displayName: user.displayName }
    });

    log(`[🌸LineAdDebug] ✅ testBanner 실행 완료: walletType=${walletType}`);
}


//zoneId=528&publisherId =69