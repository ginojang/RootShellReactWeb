//src/services/O2JamInven.ts

import { log, logError } from '../utils/log';
import { sendApiJson } from '../utils/sendApi'
import DappPortalSDK from '@linenext/dapp-portal-sdk'
import { getAccount, isValidAccount, getBalance, /*MyTranscationToSend*/ } from '../services/KaiaWallet';

import { showLoadingSpinner } from '../components/ReactUICanvas'
import { sendUnityMessage } from '../services/BridgeProvides'
import { toast } from 'react-hot-toast';
import { getText } from '../i18n/index'



let cachedSdk: DappPortalSDK | null = null;

export const setKaiaContextInven = (sdk: DappPortalSDK | null) => {
    cachedSdk = sdk;
};

export const buyItem = async (mode: string, itemKey: string): Promise<string | null> => {

    if (cachedSdk === null)
        return null;

    if (!(mode === 'Stripe' || mode === 'Kaia' || mode === 'None'))
        return null;

    const account = await getAccount(cachedSdk)
    if (!account) {
        log(`[💳buyItem] ❌ account 불러오기 실패`)
        return null;
    }

    const payload = {
        pgType: (mode === 'Stripe') ? 'STRIPE' : (mode === 'Kaia') ? 'CRYPTO' : 'NONE',
        walletAddress: account,
        itemKey,
    }

    try {
        const result = await sendApiJson<typeof payload>('payment', 'create', payload)

        if (mode != 'None') {
            // ✅ Step 2: get payment provider
            const paymentProvider = cachedSdk.getPaymentProvider()
            if (!paymentProvider) {
                log(`[💳buyItem] ❌ paymentProvider 없음`)
                return null;
            }

            // ✅ Step 3: start payment
            const parsed = JSON.parse(result)
            const paymentId = parsed.paymentId

            // ✅ await 사용하지 말것 - 루트셀 1에서 폴링 하기 때문에. 유니티에게는 바로 결과 알려준다.
            // 바로 폴링하는 루틴으로 동작 시킨다.
            //log(`[💳buyItem] ❌❌❌❌❌❌❌  결제 시작 ❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌`)
            paymentProvider.startPayment(paymentId)
            PaymentPolling(paymentId, itemKey);
            //log(`[💳buyItem] ❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌ 결제 끝남`)
        }
        else {
            showLoadingSpinner({ loading: false })
            //TODO PaymentStatusConfirmed() 호출하는게 나을지도.
        }
        return result
    } catch (err) {
        log(`[💳buyItem] ❌ 실패: ${err}`)
        showLoadingSpinner({ loading: false })
        return null
    }
}


function PaymentPolling(paymentId: string, itemKey: string) {
    let tries = 0;
    let startedCount = 0;
    const maxTries = 60; // 60초까지만 시도

    const interval = setInterval(async () => {
        tries++;
        if (tries > maxTries) {
            clearInterval(interval);
            log(`[💳Polling] ⏹️ 타임아웃: ${paymentId}`);
            PaymentStatusCanceled(paymentId, itemKey);
            return;
        }

        try {
            const payload = { paymentId };
            const result = await sendApiJson<typeof payload>('payment', 'check', payload);

            // 문자열로 받은 걸 파싱
            const parsed = JSON.parse(result) as any;

            log(`Polling]  ${parsed.status}`)
            // 최악의 경우 Start가 5번 이상 찍히면 - CANCEL 하지 말고. 물레방아는 제거.

            if (parsed.status === 'STARTED') {
                startedCount++;
                if (startedCount >= 5) {
                    showLoadingSpinner({ loading: false })
                }
            }
            else if (parsed.status === 'CONFIRMED') {
                clearInterval(interval);
                PaymentStatusConfirmed(paymentId, parsed);
            }
            else if (parsed.status === 'REGISTERED_ON_PG') {
                PaymentStatusRegisteredOnPg(paymentId);
            }
            else if (parsed.status === 'CANCELED') {
                PaymentStatusCanceled(paymentId, itemKey);
            }

        } catch (err) {
            log(`[💳Polling] ❌ 오류: ${err}`);
        }

    }, 2000);
}

function PaymentStatusConfirmed(_paymentId: string, data: any) {
    showLoadingSpinner({ loading: false })
    sendUnityMessage('OnPaymentConfirmed', JSON.stringify(data));
}

function PaymentStatusRegisteredOnPg(_paymentId: string) {

    showLoadingSpinner({ loading: true, message: getText('t006')/*`We're currently registering your KAIA payment details.`*/ })
}

function PaymentStatusCanceled(paymentId: string, itemKey: string) {
    showLoadingSpinner({ loading: false })

    const payload = { paymentId, itemKey };
    sendUnityMessage('OnPaymentCanceled', JSON.stringify(payload));
}




///////////////////////////////////////////////////////////////////////////////////////////////
//
let cachedRate: number | null = null;
let lastFetchedTime = 0;

export const getPriceKaia = async (priceUSD: number): Promise<number> => {
    const now = Date.now();
    const elapsed = now - lastFetchedTime;

    if (cachedRate && elapsed < 2000) {
        // 2초 이내 캐시 환율 사용
        log(`[👛Wallet]♻️ 캐시 환율 사용 (${cachedRate})`);
        const price = priceUSD / cachedRate;
        return parseFloat(price.toFixed(6));
    }

    // 새 환율 호출
    const price = await getPriceKaiaReal(priceUSD);
    if (price !== Number.MAX_VALUE) {
        // 갱신 성공 시 캐시 저장
        cachedRate = priceUSD / price;
        lastFetchedTime = now;
    }

    return price;
};

const getPriceKaiaReal = async (priceUSD: number): Promise<number> => {
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=kaia&vs_currencies=usd');
        const data = await res.json();
        const rate = data?.kaia?.usd;

        log(`[👛Wallet]🚀🚀 KAIA/USD 환율 (${rate})`);

        if (!rate || rate <= 0) {
            throw new Error('Invalid KAIA/USD rate');
        }

        const priceInKaia = priceUSD / rate;
        return parseFloat(priceInKaia.toFixed(6)); // 소수점 6자리 제한
    } catch (err) {
        log(`[👛Wallet]❌ KAIA 환율 불러오기 실패: ${err}`);
        return Number.MAX_VALUE; // 실패 시 MaxValue 반환
    }
};

export const getKaiaInfo = async (isGetRate: boolean = true): Promise<{
    account: string;
    balance: number;
    rate: number;
} | null> => {
    if (cachedSdk === null) return null;

    const account = await getAccount(cachedSdk);
    if (!isValidAccount(account)) return null;

    const balance = await getBalance(cachedSdk, account);
    let rate = 0;
    if (isGetRate) {
        rate = await getPriceKaia(1); // KAIA to USD or 반대?
    };

    return {
        account,
        balance,
        rate,
    };
}
export const getKaiaWalletAddress = async (): Promise<string | null> => {

    if (cachedSdk === null) return null;
    const account = await getAccount(cachedSdk);
    if (!isValidAccount(account)) return null;

    return account;
}

//
////////////////////////////////////////////////////////////////////////////////////////////////////////

export const copyWalletAddress = async (): Promise<void> => {
    if (cachedSdk === null) return;

    const account = await getAccount(cachedSdk);
    if (!isValidAccount(account)) return;

    try {
        await navigator.clipboard.writeText(account);
        log(`[👛Wallet]✅ 지갑 주소 복사됨: ${account}`);

        toast.success(getText('t008')/*Wallet address copied to clipboard!*/);
        // 토스트 알림 같은 거 있으면 여기서 보여주기
        // toast.success("지갑 주소가 복사되었습니다!");
    } catch (err) {
        logError(`[👛Wallet]❌ 클립보드 복사 실패: ${err}`);
    }

}


export async function openHistory() {
    if (cachedSdk === null) return;
    const paymentProvider = cachedSdk.getPaymentProvider()

    try {
        await paymentProvider.openPaymentHistory();
        console.log("✅ 결제내역 페이지가 열렸습니다.");
    } catch (err) {
        console.error("❌ 결제내역 페이지 열기 실패:", err);
    }
}
