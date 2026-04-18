// src/context/KaiaWalletProvider.tsx
import { createContext, useContext, useState } from 'react'
import { log, logError } from '../utils/log';
import { deleteAllLocalStorage } from '../utils/localStorage'
import DappPortalSDK from '@linenext/dapp-portal-sdk'

import { isValidAccount, requestAccount, getBalance } from '../services/KaiaWallet'
import { setKaiaContextInven } from '../content/O2JamPayment'
import { setKaiaContextUsers } from '../content/O2JamWalletUsers'


let sdkInstance: DappPortalSDK | null = null

type ConnectMode = 'dAPP' | 'Liff' | 'LiffFirst'
type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'failed' | 'first_connected'

type KaiaWalletContextType = {
    address: string | null
    walletType: string | null
    signature: string | null
    isConnected: boolean
    balance: number | null
    connectionStatus: ConnectionStatus
    blueScreenStatusWallet: string | null
    walletProvider: any | null   // ✅ 추가

    walletConnect: (mode: ConnectMode) => Promise<void>
    disconnect: () => Promise<void>
}

const KaiaWalletContext = createContext<KaiaWalletContextType | undefined>(undefined)

export const KaiaWalletProvider = ({ children }: { children: React.ReactNode }) => {
    const [address, setAddress] = useState<string | null>(null)
    const [walletType, setWalletType] = useState<string | null>(null)
    const [signature, setSignature] = useState<string | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [balance, setBalance] = useState<number | null>(null)
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle')
    const [blueScreenStatusWallet, setBlueScreenStatus] = useState<string | null>(null)
    const [walletProvider, setWalletProvider] = useState<any>(null);

    const InitSDK = async () => {
        // ✅ SDK 초기화
        sdkInstance = null;

        if (!sdkInstance) {
            (window as any).__KAIA_DISABLE_METRICS__ = true;

            log(`[👛Wallet] ✅ KAIA SDK 초기화 시도 >>   ${import.meta.env.VITE_KAIA_CLIENT_ID} ${import.meta.env.VITE_KAIA_CHAIN_ID}`)

            sdkInstance = await DappPortalSDK.init({
                clientId: import.meta.env.VITE_KAIA_CLIENT_ID!,
                chainId: import.meta.env.VITE_KAIA_CHAIN_ID!,
            })

            log(`[👛Wallet] ✅ KAIA SDK 초기화됨 ${import.meta.env.VITE_KAIA_CLIENT_ID} ${import.meta.env.VITE_KAIA_CHAIN_ID}🍺`)
        }
    };

    const walletConnect = async (mode: ConnectMode) => {
        log(`[👛Wallet] 지갑 접속 - 시작  : 접속모드: ${mode}`);

        if (mode === 'LiffFirst' && import.meta.env.VITE_APP_IS_DELETE_LOCAL_DATA_ON_START_LIFF === 'true')
            deleteAllLocalStorage();

        setConnectionStatus('connecting');
        try {
            await InitSDK();
            if (sdkInstance === null) return;

            log(`[👛Wallet] 🌕🌕🌕🌕🌕🌕🌕   KAIA SDK requestAccount()  시작 >>`)
            const newAddress = await requestAccount(sdkInstance);
            log(`[👛Wallet] (⭕_⭕) KAIA SDK requestAccount()  체크 포인트 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥  통과>>`)

            if (!isValidAccount(newAddress)) {
                logError(`[👛Wallet]❌❌❌❌❌❌❌❌❌❌   유저가 지갑 생성을 취소`);
                setConnectionStatus('failed');
                return;
            }


            const walletProvider = sdkInstance.getWalletProvider();
            const walletType = walletProvider.getWalletType() as string;
            log(`[👛Wallet] walletType: ${walletType}`);

            const balance = await getBalance(sdkInstance, newAddress);

            const providerObj = sdkInstance.getWalletProvider();
            setWalletProvider(providerObj);

            setAddress(newAddress);
            setWalletType(walletType);
            setSignature(signature);
            setBalance(balance);
            setIsConnected(true);

            setKaiaContextInven(sdkInstance);
            setKaiaContextUsers(sdkInstance);
            setBlueScreenStatus(null);

            switch (mode) {
                case 'dAPP':
                    setConnectionStatus('connected');
                    break;
                case 'Liff':
                    setConnectionStatus('connected');
                    break;
                case 'LiffFirst':
                    setConnectionStatus('first_connected');
                    break;
            }

            log(`[👛Wallet] 🍺 walletType: ${walletType} 주소: ${newAddress} 잔액: ${balance?.toFixed(4)} KLAY  접속모드: ${mode}`)

        } catch (e) {
            const errMsg = e instanceof Error ? e.message : JSON.stringify(e);
            logError(`[👛Wallet]❌ LIFF 지갑 연결 !!!!!    실패: ${errMsg}`);
            setConnectionStatus('failed');
        }
    };

    const disconnect = async () => {
        try {
            if (sdkInstance === null)
                return;

            const walletProvider = sdkInstance.getWalletProvider();
            await walletProvider.disconnectWallet();

            setWalletProvider(null);
            setAddress(null);
            setWalletType(null);
            setSignature(null);
            setBalance(null);
            setIsConnected(false);
            setConnectionStatus('idle');
            setBlueScreenStatus(null)

            setKaiaContextInven(null)
            setKaiaContextUsers(null)

            log(`[👛Wallet]🧼 지갑 연결 해제 완료!`);
        } catch (e) {
            const errMsg = e instanceof Error ? e.message : JSON.stringify(e);
            logError(`[👛Wallet]❌ disconnectWallet 실패: ${errMsg}`);
        }
    };

    return (
        <KaiaWalletContext.Provider value={{
            address,
            walletType,
            signature,
            isConnected,
            balance,
            connectionStatus,
            blueScreenStatusWallet,
            walletProvider,

            walletConnect,
            disconnect,
        }}>
            {children}
        </KaiaWalletContext.Provider>
    )
}

export const useWalletProvider = () => {
    const context = useContext(KaiaWalletContext)
    if (!context) throw new Error('useKaiaWallet must be used within a KaiaWalletProvider')
    return context
}


/*
///
const dAppConnect = async () => {
    log(`[👛Wallet] dAPP>>>>>>>>   Start Connecting !!`);

    setConnectionStatus('connecting') // 시작
    try {

        await InitSDK();
        if (sdkInstance === null)
            return;

        // 1. 계정 조회 (이미 연결되어 있는 지갑)
        const account = await getAccount(sdkInstance);

        if (isValidAccount(account)) {

            // 2. 지갑 연결 요청 (사용자 명시적 승인 요청)
            const userAddress = await requestAccount(sdkInstance);
            //log(`[👛Wallet]✅ userAddress: ${userAddress}`);
            if (account !== userAddress) {
                logError(`[👛Wallet]❌ 지갑 연결 실패: userAddress != account`);
                return;
            }
            setAddress(userAddress)   // 비동기 처리 됨
        } else {
            logError(`[👛Wallet] ❌❌❌❌❌  지갑 등록 확인`)
            // 0. SDK INIT - 새로 해야 됨 ✅✅✅
            await InitSDK();
            if (sdkInstance === null)
                return;
            const newAddress = await requestAccount(sdkInstance);
            if (!isValidAccount(newAddress)) {
                logError(`[👛Wallet]❌ 지갑 생성 실패 or 사용자가 거부함`);
                setConnectionStatus('failed');
                return;
            }
            setAddress(newAddress);
        }

        // walletProvider 얻기
        const walletProvider = sdkInstance.getWalletProvider()
        const walletType = walletProvider.getWalletType() as string;
        log(`[👛Wallet] walletType: ${walletType}`)

        // latest 블록 기준 잔액 조회
        const balance = await getBalance(sdkInstance, account);

        setSignature(signature)   // 비동기 처리 됨
        setBalance(balance)   // 비동기 처리 됨
        setIsConnected(true)  // 비동기 처리 됨
        setWalletType(walletType);

        setKaiaContextInven(sdkInstance)
        setKaiaContextUsers(sdkInstance)
        setBlueScreenStatus(null)

        setConnectionStatus('connected');
        log(`[👛Wallet] 🍺🍺🍺 walletType: ${walletType} 잔액: ${balance?.toFixed(4)} KLAY`)

    } catch (e) {
        const errMsg = e instanceof Error ? e.message : JSON.stringify(e)
        logError(`[👛Wallet] ❌ 지갑 연결 실패: ${errMsg}`)
        setConnectionStatus('failed')

        // ❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌
        //  여기서 실패하면 다시 시도하면 성공한다.  추후 확인 꼭 필요
        // ❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌
        dAppConnect();
    }
};*/
