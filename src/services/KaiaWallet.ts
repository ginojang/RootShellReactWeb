// services/KaiaWallet.ts

import DappPortalSDK from '@linenext/dapp-portal-sdk'
import { log, logError } from '../utils/log';

export const toPeb = (amount: string | number): string => {
    const [intPart, decPart = ''] = amount.toString().split('.');
    const decimals = (decPart + '0'.repeat(18)).slice(0, 18); // 18자리 고정
    return BigInt(intPart + decimals).toString();
};

export const fromPeb = (peb: string): string => {
    return (BigInt(peb) / 10n ** 18n).toString()
}

export const isValidAccount = (account: string | null | undefined): boolean => {
    if (!account) return false;
    if (typeof account !== 'string') return false;
    if (!account.startsWith('0x')) return false;
    if (account.length !== 42) return false;
    const hexPart = account.slice(2);
    return /^[0-9a-fA-F]{40}$/.test(hexPart);
};


// 1. 계정 조회
export const getAccount = async (sdk: DappPortalSDK): Promise<string> => {
    const walletProvider = sdk.getWalletProvider()
    const accounts = await walletProvider.request({ method: 'kaia_accounts' }) as string[];
    return accounts[0];
};

// 2. 지갑 연결 요청
export const requestAccount = async (sdk: DappPortalSDK): Promise<string> => {
    const walletProvider = sdk.getWalletProvider()
    const addresses = await walletProvider.request({ method: 'kaia_requestAccounts' }) as string[];
    return addresses[0];
};

// 3. 메시지 서명 요청
export const connectAndSign = async (sdk: DappPortalSDK, msg: string): Promise<[string, string]> => {
    const walletProvider = sdk.getWalletProvider()
    const [account, signature] = await walletProvider.request({
        method: 'kaia_connectAndSign',
        params: [msg]
    }) as [string, string];
    return [account, signature];
};


// 4. 잔액 조회
export const getBalance = async (
    sdk: DappPortalSDK,
    addressToUse: string
): Promise<number> => {

    const walletProvider = sdk.getWalletProvider()
    const balanceHex = await walletProvider.request({
        method: 'kaia_getBalance',
        params: [addressToUse, "latest"]
    }) as string

    return parseInt(balanceHex, 16) / 1e18
};


/**
 * KAIA 트랜잭션 전송: 사용자 지갑 → 서버 지갑
 * @param from 사용자 지갑 주소 (선택)
 * @param to 서버 지갑 주소
 * @param amount 전송할 KAIA 수량 (단위: peb)
 */
export const buildMyTranscationToSend = async (
    sdk: DappPortalSDK,
    from: string,
    to: string,
    amount: string
): Promise<string | null> => {
    try {

        if (sdk == null)
            return null;

        const valueInPeb = toPeb(amount); // 안전하게 변환
        log(`[👛KaiaTransaction] 📝 트랜잭션 준비 중: ${from} → ${to}, ${valueInPeb} peb`);

        const provider = sdk.getWalletProvider();
        const tx = {
            type: 'VALUE_TRANSFER',
            from,
            to,
            value: valueInPeb,
            gas: '300000',
            chainId: "1001"
        };

        const rawTransaction = await provider.request({
            method: 'kaia_sendTransaction',
            params: [tx],
        }) as string;

        if (!rawTransaction || typeof rawTransaction !== 'string') {
            logError('[👛KaiaTransaction] ❌ 트랜잭션 서명 실패');
            return null;
        }


        // TODO - 백앤드 루트셀 4에게도 전송
        /*
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rawTransaction }),
        });

        const result = await res.json();

        if (!result.success) {
            logError(`[👛KaiaTransaction] ❌ 전송 실패: ${result.error}`);
            return null;
        }*/

        //log(`[👛KaiaTransaction] ✅ 전송 완료 TX: ${result.txHash}`);
        //return result.txHash;

        log(`[👛KaiaTransaction] ✅ 전송 완료 TX`);
        return "tx";

    } catch (err) {
        logError(`[👛KaiaTransaction] ❌ 오류 발생: ${(err as Error).message}`);
        return null;
    }
};


export const MyTranscationToSend = async (
    sdk: DappPortalSDK,
    addressToUse: string,
    amount: string
): Promise<number> => {

    await buildMyTranscationToSend(sdk,
        addressToUse,
        "0x858d0cf77dc2d4bc21166d24454602646d1d8803",
        amount);

    return -1;
}



/////////////////////////////////////////////////////////////////////////////////

export type WalletInfo = {
    address: string
    balance: string  // 단위: peb (기본 단위)
}

export const getKaiaWalletInfo2 = async (sdk: DappPortalSDK): Promise<WalletInfo | null> => {

    try {
        const provider = sdk.getWalletProvider()

        const address: string = await provider.request({
            method: 'kaia_requestAccounts',
        }) as string

        const balance: string = await provider.request({
            method: 'kaia_getBalance',
            params: [address],
        }) as string

        log(`[🌸RootShell]📦 지갑 주소: ${address}`)
        log(`[🌸RootShell]💰 지갑 잔액: ${balance}`)

        return { address, balance }
    } catch (err: any) {
        log(`[🌸RootShell]❌ 지갑 정보 조회 실패: ${err.message}`)
        return null
    }
}

export const createKaiaWallet2 = async (
    sdk: DappPortalSDK,
    signature: string,
): Promise<string | null> => {

    try {
        log(`[🌸RootShell]🧬 KAIA 지갑 생성 요청 시작: ${signature}`)

        const walletProvider = sdk.getWalletProvider()

        const address = await walletProvider.request({
            method: 'kaia_connectAndSign',
            params: [signature],
        })

        if (!address || typeof address !== 'string') {
            log(`[🌸RootShell]❌ 지갑 생성 실패 - address 결과가 유효하지 않음`)
            return null
        }

        log(`[🌸RootShell]✅ KAIA 지갑 생성 성공! address: ${address}`)
        return address
    } catch (err: any) {
        log(`[🌸RootShell]❌ 지갑 생성 중 오류: ${err.message}`)
        return null
    }
}
