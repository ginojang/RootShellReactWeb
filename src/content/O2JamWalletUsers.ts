
import DappPortalSDK from '@linenext/dapp-portal-sdk'
import { log } from '../utils/log';
import { sendApiJson, isApiSuccess } from '../utils/sendApi'
import { isValidAccount, getAccount, /*getBalance, MyTranscationToSend*/ } from '../services/KaiaWallet';
import { saveToLocalCryptoAsync, loadFromLocalCryptoAsync } from '../utils/localStorage';

let cachedSdk: DappPortalSDK | null = null;

export const setKaiaContextUsers = (sdk: DappPortalSDK | null) => {
    cachedSdk = sdk;
};


export const getWalletUserInfo = async (): Promise<string | null> => {
    if (cachedSdk === null) return null;

    const account = await getAccount(cachedSdk);
    if (!isValidAccount(account)) return null;

    const payload = {
        address: account,
    }

    try {
        const result = await sendApiJson<typeof payload>('users', 'check-wallet-user', payload)
        const { ok } = isApiSuccess(result)

        if (ok) {
            return result
        } else {
            log(`[getUserInfo] ❌ 실패 or 잘못된 응답`)
            return null
        }
    }
    catch (err) {
        log(`[getUserInfo] ❌ 실패: ${err}`)
        return null
    }

}


export const getWalletInvenInfo = async (): Promise<string | null> => {
    if (cachedSdk === null) return null;

    const account = await getAccount(cachedSdk);
    if (!isValidAccount(account)) return null;

    const payload = {
        address: account,
    }

    try {
        const result = await sendApiJson<typeof payload>('users', 'get-inven-info', payload)
        const { ok } = isApiSuccess(result)

        if (ok) {
            return result
        } else {
            log(`[getInvenInfo] ❌ 실패 or 잘못된 응답`)
            return null
        }
    }
    catch (err) {
        log(`[getInvenInfo] ❌ 실패: ${err}`)
        return null
    }
}

export const setCurrentStageID = async (worldKey: string, stageID: number): Promise<string | null> => {
    if (cachedSdk === null) return null;

    const account = await getAccount(cachedSdk);
    if (!isValidAccount(account)) return null;

    const payload = {
        address: account,
        world_key: worldKey,
        stage_id: stageID
    }

    try {
        const result = await sendApiJson<typeof payload>('users', 'set-current-stage-id', payload)
        const { ok } = isApiSuccess(result)

        if (ok) {
            return result
        } else {
            log(`[setCurrentStageID] ❌ 실패 or 잘못된 응답`)
            return null
        }
    }
    catch (err) {
        log(`[setCurrentStageID] ❌ 실패: ${err}`)
        return null
    }
}

export const addCoinsReward = async (amount: number): Promise<string | null> => {
    if (cachedSdk === null) return null;

    const account = await getAccount(cachedSdk);
    if (!isValidAccount(account)) return null;

    const payload = {
        address: account,
        amount: amount,
    }

    try {
        const result = await sendApiJson<typeof payload>('users', 'add-coins-reward', payload)
        const { ok, error } = isApiSuccess(result)

        if (ok) {
            log(`[addCoinsReward] ✅ 성공!`)
            return result;
        } else {
            log(`[addCoinsReward] ❌ 실패. 코드: ${error?.status}, 메시지: ${error?.message}`)
            return null;
        }
    }
    catch (err) {
        log(`[addCoinsReward] ❌ 실패: ${err}`)
        return null
    }
}

export const getStarCoinBuyed = async (): Promise<string | null> => {
    if (cachedSdk === null) return null;

    const account = await getAccount(cachedSdk);
    if (!isValidAccount(account)) return null;

    const payload = {
        address: account,
    }

    try {
        const result = await sendApiJson<typeof payload>('users', 'get-coins-buyed', payload)
        const { ok, error } = isApiSuccess(result)

        if (ok) {
            log(`[getStarCoinBuyed] ✅ 성공!`)
            return result;
        } else {
            log(`[getStarCoinBuyed] ❌ 실패. 코드: ${error?.status}, 메시지: ${error?.message}`)
            return null;
        }
    }
    catch (err) {
        log(`[getStarCoinBuyed] ❌ 실패: ${err}`)
        return null
    }
}

export const subtractWalletCoins = async (value: number): Promise<string | null> => {
    if (cachedSdk === null) return null;

    const account = await getAccount(cachedSdk);
    if (!isValidAccount(account)) return null;

    const payload = {
        address: account,
        value: value,
    }

    try {
        const result = await sendApiJson<typeof payload>('users', 'subtract-wallet-coins', payload)
        const { ok, error } = isApiSuccess(result)

        if (ok) {
            log(`[subtractWalletCoins] ✅ 성공!`)
            return result;
        } else {
            log(`[subtractWalletCoins] ❌ 실패. 코드: ${error?.status}, 메시지: ${error?.message}`)
            return null;
        }
    }
    catch (err) {
        log(`[subtractWalletCoins] ❌ 실패: ${err}`)
        return null
    }
}

export const spinKaiaWheel = async (): Promise<string | null> => {
    if (cachedSdk === null) return null;

    const account = await getAccount(cachedSdk);
    if (!isValidAccount(account)) return null;

    const payload = {
        address: account,
    }

    try {
        const result = await sendApiJson<typeof payload>('games', '/spin-kaia-wheel', payload)
        const { ok, error } = isApiSuccess(result)

        if (ok) {
            log(`[spinKaiaWheel] ✅ 성공!`)
            return result;
        } else {
            log(`[spinKaiaWheel] ❌ 실패. 코드: ${error?.status}, 메시지: ${error?.message}`)
            return null;
        }
    }
    catch (err) {
        log(`[spinKaiaWheel] ❌ 실패: ${err}`)
        return null
    }
}

//
// ✅ 전역 예약 키
const RESERVED_AMOUNT_KEY = 'k_8sd3l1'

// 📤 현재 보유량 조회
export const getStarCoinRewardLocal = async (key88: string): Promise<number> => {
    //const key88 = 'H@NaK!~3'
    const folder = 'data'
    const filename = '0A3CF'

    const json = await loadFromLocalCryptoAsync({ folder, filename, key8: key88 })

    if (json) {
        try {
            const parsed = JSON.parse(json)
            const amount = parsed?.[RESERVED_AMOUNT_KEY] ?? 0
            return typeof amount === 'number' ? amount : 0
        } catch (err) {
            console.warn(`[getStarCoinReward] ❌ JSON 파싱 실패: ${err}`)
            return 0
        }
    }

    // 📦 없으면 쓰레기 JSON 새로 생성
    const dummy = generateGarbageJsonWithAmount()
    await saveToLocalCryptoAsync({ folder, filename, data: dummy, key8: key88 })
    return 0
}

export const setStarCoinRewardLocal = async (key88: string, Amount: number): Promise<boolean> => {
    const folder = 'data'
    const filename = '0A3CF'

    const json = await loadFromLocalCryptoAsync({ folder, filename, key8: key88 })
    let obj: Record<string, any>

    if (json) {
        try {
            obj = JSON.parse(json)
        } catch (err) {
            console.warn(`[setStarCoinReward] ❌ JSON 파싱 실패: ${err}`)
            obj = generateGarbageJsonWithAmount()
        }
    } else {
        obj = generateGarbageJsonWithAmount()
    }

    // 🎯 키 찾아서 값 설정
    const entries = Object.entries(obj)
    const index = entries.findIndex(([key]) => key === RESERVED_AMOUNT_KEY)

    if (index >= 0) {
        entries[index][1] = Amount
    } else {
        entries.push([RESERVED_AMOUNT_KEY, Amount])
    }

    const updated = Object.fromEntries(entries)
    await saveToLocalCryptoAsync({ folder, filename, data: updated, key8: key88 })

    console.log(`[setStarCoinReward] ✅ 리워드 ${Amount}으로 설정 완료`)
    return true
}


// ➕ 리워드 추가
export const addStarCoinRewardLocal = async (key88: string, addMount: number): Promise<void> => {
    //const key88 = 'H@NaK!~3'
    const folder = 'data'
    const filename = '0A3CF'

    const json = await loadFromLocalCryptoAsync({ folder, filename, key8: key88 })
    let obj: Record<string, any>

    if (json) {
        try {
            obj = JSON.parse(json)
        } catch (err) {
            console.warn(`[addStarCoinReward] ❌ JSON 파싱 실패: ${err}`)
            obj = generateGarbageJsonWithAmount()
        }
    } else {
        obj = generateGarbageJsonWithAmount()
    }

    // 🎯 키 찾아서 값 증가
    const entries = Object.entries(obj)
    const index = entries.findIndex(([key]) => key === RESERVED_AMOUNT_KEY)

    if (index >= 0) {
        const currentAmount = typeof entries[index][1] === 'number' ? entries[index][1] : 0
        entries[index][1] = currentAmount + addMount
    } else {
        entries.push([RESERVED_AMOUNT_KEY, addMount])
    }

    const updated = Object.fromEntries(entries)
    await saveToLocalCryptoAsync({ folder, filename, data: updated, key8: key88 })

    console.log(`[addStarCoinReward] ✅ ${addMount} 만큼 추가 완료`)
}

// 🗑 쓰레기 JSON 생성
export function generateGarbageJsonWithAmount(): Record<string, any> {
    const obj: Record<string, any> = {}

    for (let i = 0; i < 200; i++) {
        let key: string
        do {
            key = `k_${Math.random().toString(36).slice(2, 8)}`
        } while (key === RESERVED_AMOUNT_KEY)

        const value = Math.random().toString(36).slice(2).repeat(2)
        obj[key] = value
    }

    const keys = Object.keys(obj)
    const idx = Math.floor(Math.random() * (keys.length + 1))
    const entries = Object.entries(obj)

    entries.splice(idx, 0, [RESERVED_AMOUNT_KEY, 0])

    return Object.fromEntries(entries)
}