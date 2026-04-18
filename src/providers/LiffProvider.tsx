// src/providers/LiffProvider.tsx
import { createContext, useContext, useState, useEffect } from 'react'
import { log, logError } from '../utils/log';
import liff from '@line/liff'
type InitializeStatus = 'idle' | 'initializing' | 'success' | 'failed'

type LiffContextType = {
    initializeStatus: InitializeStatus
    init: (isFake: boolean) => Promise<void>
    userId: string | null
    displayName: string | null
    pictureUrl?: string
    statusMessage?: string
    idToken: string | null
}

export let globalLiffUserInfo: {
    userId: string | null;
    displayName: string | null;
    pictureUrl: string | null;
    statusMessage: string | null;
    idToken: string | null;
} = {
    userId: null,
    displayName: null,
    pictureUrl: null,
    statusMessage: null,
    idToken: null,
};

export function setGlobalLiffUserInfo(info: typeof globalLiffUserInfo) {
    globalLiffUserInfo = { ...info };
}


const LineWalletContext = createContext<LiffContextType | undefined>(undefined)
export const LiffProvider = ({ children }: { children: React.ReactNode }) => {

    const [initializeStatus, setInitializeStatus] = useState<InitializeStatus>('idle') // 🔥 추가
    const [userId, setUserId] = useState<string | null>(null)
    const [displayName, setDisplayName] = useState<string | null>(null)
    const [pictureUrl, setPictureUrl] = useState<string | undefined>(undefined)
    const [statusMessage, setStatusMessage] = useState<string | undefined>(undefined)
    const [idToken, setIdToken] = useState<string | null>(null)

    const BuildFakeLiffInfoForDevMode = async () => {
        setUserId('U853ff10524c6234955f9a6c847fdd7d6');
        setDisplayName('장진호');
        setPictureUrl(`https://profile.line-scdn.net/0hFNZR7Rk1GWF3KweE3GhnXwd7GgtUWkBzDEVVBBcpTgNDSFoxUxpRU0Z-E1VIE1w0XU1fD0V7F1hVHFh8PBg-AUZ3ASk3XV43LClWQDpvTygOYRozWiwfeAMiDi4NWi5ZHj8MBUQqRTExGVtCJUQRDypuPDAtSDhJB3x1N3IZd-IYKW40WkxQAEUjQlnD`);
        setStatusMessage(undefined);
        setIdToken(null);

        // ✅ 전역 세팅 먼저
        setGlobalLiffUserInfo({
            userId: 'U853ff10524c6234955f9a6c847fdd7d6',
            displayName: '장진호',
            pictureUrl: `https://profile.line-scdn.net/0hFNZR7Rk1GWF3KweE3GhnXwd7GgtUWkBzDEVVBBcpTgNDSFoxUxpRU0Z-E1VIE1w0XU1fD0V7F1hVHFh8PBg-AUZ3ASk3XV43LClWQDpvTygOYRozWiwfeAMiDi4NWi5ZHj8MBUQqRTExGVtCJUQRDypuPDAtSDhJB3x1N3IZd-IYKW40WkxQAEUjQlnD`,
            statusMessage: null,
            idToken: null,
        });

        setInitializeStatus('success');

        log(`[✅LIFF]  builded  Fake Liff Info..`)
    }

    const init = async (isFake: boolean) => {

        if (isFake) {
            await BuildFakeLiffInfoForDevMode();
            return;
        }

        log(`[✅LIFF]  connect...`)
        try {
            setInitializeStatus('initializing') // 시작
            await liff.init({
                liffId: import.meta.env.VITE_LINE_LIFF_ID,
                withLoginOnExternalBrowser: false
            })

            if (!liff.isLoggedIn()) {
                log(`[✅LIFF]🔐 로그인 필요 → redirect 중...`)
                liff.login({ redirectUri: window.location.href })
            }

            // ✅ LIFF API 기반 환경 체크
            const os = liff.getOS(); // 'ios' | 'android' | 'web'
            const isInClient = liff.isInClient(); // true if inside LINE app

            log(`[✅LIFF]📱 플랫폼 감지: OS=${os}, isInClient=${isInClient}`);

            // 🧷 브라우저/앱 제한 처리 (선택적으로 안내 가능)
            if (!isInClient) {
                log(`[✅LIFF]❌ LINE 앱 외부에서 실행됨. 실행 불가!!.`);
                setInitializeStatus('failed')
                return;
            }

            // ✅ 사용자 프로필 및 토큰 가져오기
            try {
                const profile = await liff.getProfile(); // 프로필 정보
                const idToken = liff.getIDToken();       // JWT ID 토큰

                if (!profile.userId || !profile.displayName) {
                    logError(`[✅LIFF]❌ 필수 사용자 정보가 누락됨. userId/displayName`);
                    setInitializeStatus('failed');
                    return;
                }

                setUserId(profile.userId);
                setDisplayName(profile.displayName);
                setPictureUrl(profile.pictureUrl ?? undefined);
                setStatusMessage(profile.statusMessage ?? undefined);
                setIdToken(idToken ?? null);

                log(`[✅LIFF]🙋‍♂️ 사용자 정보 수집 성공!`);
                log(`   🔸 userId:        ${profile.userId}`);
                log(`   🔸 displayName:   ${profile.displayName}`);
                log(`   🔸 pictureUrl:    ${profile.pictureUrl}`);
                log(`   🔸 statusMessage: ${profile.statusMessage}`);
                log(`   🔸 idToken:       ${idToken?.slice(0, 20)}...`);

                // ✅ 전역 세팅 먼저
                setGlobalLiffUserInfo({
                    userId: profile.userId,
                    displayName: profile.displayName,
                    pictureUrl: profile.pictureUrl ?? null,
                    statusMessage: profile.statusMessage ?? null,
                    idToken: idToken ?? null,
                });

                setInitializeStatus('success');

            } catch (err: any) {
                logError(`[✅LIFF]❌ 사용자 정보 수집 실패: ${err.message}`);
                setInitializeStatus('failed');
                return;
            }

        } catch (err: any) {
            logError(`[✅LIFF]❌ LIFF 연결 실패: ${err.message}`)
            setInitializeStatus('failed')
        }
    }

    // 로그인 결과 리다이렉트
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');

        if (code && state) {
            log(`[✅LIFF]✅ 최초 리다이렉트: code=${code}, state=${state}`);

            // 👉 이건 딱 1회성 이벤트로 처리
            // TODO: 여기에만 백엔드 인증 요청 보내면 됨 (line login auth)
            // 로그인 결과 리다이렉트>>  아래로 전달됨.
            // 이 경우는 라인 로그인 라이브러리 사용할때 의미 있음. - 지금 LIFF에서는 큰 의미 없음.
        }
    }, []);



    return (
        <LineWalletContext.Provider value={{
            initializeStatus,
            init,
            userId,
            displayName,
            pictureUrl,
            statusMessage,
            idToken,
        }}>
            {children}
        </LineWalletContext.Provider>
    )
}

export const useLiffContext = () => {
    const context = useContext(LineWalletContext)
    if (!context) throw new Error('useLiffContext must be used within a LiffProvider')
    return context
}


export type InviteStatus = 'success' | 'cancelled' | 'failed';
export async function inviteFriends(): Promise<InviteStatus> {
    try {
        const shareResult = await liff.shareTargetPicker([
            {
                type: 'text',
                text: `リズムゲーム「オトジャムニンジャ」、招待きたよ！\n A friend invited you to rhythm game O2Jam Ninja.\n  오투잼 닌자 한 판 어때요? 초대가 도착했어요! \n ${import.meta.env.VITE_LIFF_URL}`,
            },
            /*
            {
                type: 'image',
                originalContentUrl: 'https://ninja-line.o2jam.xyz/imgs/o2jam_ninja_og_image.png',
                previewImageUrl: 'https://ninja-line.o2jam.xyz/imgs/o2jam_ninja_og_image.png',
            },*/
        ]);

        if (shareResult) {
            log(`[✅LIFF] 친구 초대 메시지 전송 성공!`);
            return 'success';
        } else {
            log(`[⚠️LIFF] 사용자가 메시지 전송을 취소했어요.`);
            return 'cancelled';
        }
    } catch (err: any) {
        logError(`[❌LIFF] 친구 초대 실패: ${err.message}`);
        return 'failed';
    }
}

/*
         //
         // ✅ SDK 초기화
         if (!sdkInstance) {
             (window as any).__KAIA_DISABLE_METRICS__ = true;

             log(`[👛Wallet] ✅ KAIA SDK 초기화 시도 >>   ${import.meta.env.VITE_KAIA_CLIENT_ID} ${import.meta.env.VITE_KAIA_CHAIN_ID}`)

             sdkInstance = await DappPortalSDK.init({
                 clientId: import.meta.env.VITE_KAIA_CLIENT_ID!,
                 chainId: import.meta.env.VITE_KAIA_CHAIN_ID!,
             })

             log(`[👛Wallet] ✅ KAIA SDK 초기화됨 ${import.meta.env.VITE_KAIA_CLIENT_ID} ${import.meta.env.VITE_KAIA_CHAIN_ID}🍺`)
         }

         //
         const idToken = liff.getIDToken();
         const base = import.meta.env.VITE_ROOT_SHELL_4_API_BASE_URL.replace(/\/$/, '')
         const url = `${base}/wallet/get-kaia-wallet-from-liff`

         const response = await fetch(url, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ idToken })
         });
         const json = await response.json();
         const { result, lineUserId } = json;

         let walletAddress: string | null = null;
         if (result === 'exist') {
             walletAddress = json.walletAddress;
             log(`[🌸RootShell]💰 이미 등록된 지갑 :  ${walletAddress}`)
         }
         else {
             log(`[🌸RootShell]💰 아직 지갑이 등록 되지 않음 - 지갑 등록 시작!! : LineID : ${lineUserId}`)
             const address = await createKaiaWallet2(sdkInstance, lineUserId)
             if (!address) {
                 log(`[🌸RootShell]❌ 지갑 생성 실패: LineID: ${lineUserId}`);
                 //setConnectionStatus('error');
                 return; // 중단 (상태는 'error'로 유지)
             }

             walletAddress = address;
             log(`[🌸RootShell]✅ 지갑 생성 완료: ${walletAddress}`);

             // 루트셀 4에 지갑, 라인 ID 등록
             const registerUrl = `${base}/wallet/register-kaia-wallet-from-liff`
             const registerRes = await fetch(registerUrl, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                     lineUserId,
                     address: walletAddress,
                 }),
             })

             const registerJson = await registerRes.json()
             if (!registerJson.success) {
                 log(`[🌸RootShell]❌ 루트셀 4에 지갑 등록 실패: ${registerJson.error || '알 수 없음'}`)
                 // 필요시 setConnectionStatus('error');
                 return
             }

             log(`[🌸RootShell]✅ 루트셀 4에 지갑 등록 완료: ${walletAddress}`)
         }

         if (!walletAddress) {
             log(`[🌸RootShell]❌ 최종 지갑 주소가 비어 있음`);
             return;
         }
         setAddress(walletAddress);
         setIsConnected(true)
         setConnectionStatus('connected')

         log(`[🌸RootShell]✅✅✅✅ 커넥션 성공  address: ${walletAddress}`)
         */
