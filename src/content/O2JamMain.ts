
// src/content/O2JamMain.ts

import { buyItem, getKaiaInfo, copyWalletAddress } from './O2JamPayment'

import { showLoadingSpinner, showOkayPopup } from '../components/ReactUICanvas'
import { sendUnityMessage } from '../providers/unity/UnityMessageHandler'
import { log, logError } from '../utils/log'
import { getLanguage, setLanguage, setRestarted } from '../config/GlobalEnv'
import { inviteFriends } from '../providers/LiffProvider'
import { toast } from 'react-hot-toast';

import type {
    UnitySimpleMessage,
    UnityDataMessage,
    UnityWriteJsonMessage,
    UnityReadJsonMessage,
    UnitySendTransactionMessage,
    UnityBodyJsonMessage,
} from '../providers/unity/UnityMessageHandler'

import {
    saveToLocalCryptoAsync,
    loadFromLocalCryptoAsync,
    deleteAllLocalStorage,
} from '../utils/localStorage';

import {
    getWalletUserInfo,
    getWalletInvenInfo,
    getStarCoinRewardLocal,
    addStarCoinRewardLocal, // 로컬 저장
    setStarCoinRewardLocal,
    addCoinsReward,         // 백앤드 저장
    getStarCoinBuyed,
    setCurrentStageID,
    spinKaiaWheel,
    subtractWalletCoins,
} from './O2JamWalletUsers'
import { getText } from '../i18n'


let o2jamUUID: string | null = null
export function getO2JamUUID(): string | null {
    return o2jamUUID
}

let o2jamSecretKey: string | null = null
export function getO2JamSecretKey(): string | null {
    return o2jamSecretKey
}

let currentStageID: number = 1
let currentWorldKey: string = 'world.number1'
let kaiaRewardCount: number = Number.MAX_VALUE;


interface O2JamMainLoopOptions {
    isFirstLoop: boolean
    onStartUnity: (uuid: string) => void
}

type O2JamUser = {
    current_used_uuid: string
    secretKey8: string
    coins_buyed: number
    coins_reward: number
    is_new_created: boolean
    current_world_key: string
    current_stage_id: number
    count_reward_kaia: number

}

export async function O2JamMainLoop({ isFirstLoop, onStartUnity }: O2JamMainLoopOptions) {

    if (isFirstLoop) {

        const result = await getWalletUserInfo();
        log(`[🧠MainLoop 111  ---] getWalletUserInfo result: ${result}`);
        //
        if (result) {
            try {
                const parsed = JSON.parse(result);

                if (parsed.success) {
                    const uuid = parsed.user?.current_used_uuid ?? 'unknown';
                    const ret = await InitO2Jam(parsed.user);
                    if (ret === true) {
                        onStartUnity(uuid);      // 💥 여기서 uuid 전달
                        return;                 // 💥 성공의 리턴..
                    }
                } else {
                    log(`[🧠MainLoop] 기존 유저 or 실패 → Unity 미실행`);
                }

            } catch (e) {
                log(`[🧠MainLoop] ❌ JSON 파싱 실패: ${e}`);
            }
        }
    }
}

async function InitO2Jam(user: O2JamUser): Promise<boolean> {
    try {
        log(`[🎮InitO2Jam] 유저 UUID: ${user.current_used_uuid}`);
        //log(`[🎮InitO2Jam] 비밀 키: ${user.secretKey8}`);
        log(`[🎮InitO2Jam] 구매 코인: ${user.coins_buyed}`);
        log(`[🎮InitO2Jam] 보상 코인: ${user.coins_reward}`);
        log(`[🎮InitO2Jam] 카이아 리워드 회수: ${user.count_reward_kaia}`);
        log(`[🎮InitO2Jam] 신규 유저 여부: ${user.is_new_created}`);

        // TODO: 유저 상태를 전역 상태에 저장하거나, Unity에 전달할 준비
        o2jamUUID = user.current_used_uuid;
        o2jamSecretKey = user.secretKey8;
        currentStageID = user.current_stage_id;
        currentWorldKey = user.current_world_key;
        kaiaRewardCount = user.count_reward_kaia;

        if (import.meta.env.VITE_APP_IS_TUTORIAL_SKIP === 'true') {
            if (currentStageID === 1)
                currentStageID = 2;
        }

        if (currentStageID === 1 && kaiaRewardCount > 0)
            currentStageID = 2;


        return await setStarCoinRewardLocal(o2jamSecretKey, Number(user.coins_reward))

    } catch (err) {
        log(`[🎮InitO2Jam] ❌ 초기화 실패: ${err}`);
        return false;
    }
}

export async function RestartWallet(): Promise<void> {

    logError(`[RestartWallet] ❗ 지갑 어드레스 재시작 !!!!!!`);

    try {
        // ✅ 현재 언어 저장
        const currentLang = getLanguage();
        log(`[RestartWallet] 📝 저장된 언어: ${currentLang}`);

        deleteAllLocalStorage();

        // ✅ 언어 다시 저장
        setLanguage(currentLang);
        setRestarted();

        window.location.reload(); // 완전 리셋하고 싶을 때

    } catch (err) {
        logError(`[RestartWallet] ❌ 오류 발생: ${(err as Error).message}`);
    }
}

export async function ExitTo(): Promise<void> {
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



export function handlePingPong(_payload: UnitySimpleMessage, id?: number) {
    log(`pingPong 요청 수신`)
    if (id != null) sendUnityMessage(id, 'OnPingPongAck', true)
}

export async function handleSetCurrentStageID(payload: UnityDataMessage, id?: number) {
    currentStageID = Number(payload.data)
    //currentWorldKey
    const result = await setCurrentStageID(currentWorldKey, currentStageID)
    const ok = result != null
    if (id != null) sendUnityMessage(id, 'OnJsonSetCurrentStageIDAck', ok, ok ? result : 'error')
}

export async function handleGetCurrentStageID(_payload: UnitySimpleMessage, id?: number) {
    const payload = {
        worldKey: currentWorldKey,
        stageID: currentStageID
    }
    if (id != null) sendUnityMessage(id, 'OnJsonGetCurrentStageIDAck', true, JSON.stringify(payload))
}

export async function handleWriteJson(payload: UnityWriteJsonMessage, id?: number) {
    //log(`writeJson 요청 수신 - ID: ${id}`)
    const uuid = getO2JamUUID() ?? 'userdata'
    await saveToLocalCryptoAsync({ folder: uuid, filename: payload.file, data: payload.data, key8: '0@#KSNA!' })
    if (id != null) sendUnityMessage(id, 'OnJsonWriteAck', true)
}

export async function handleReadJson(payload: UnityReadJsonMessage, id?: number) {
    //log(`readJson 요청 수신 - ID: ${id}`)
    const uuid = getO2JamUUID() ?? 'userdata'
    const result = await loadFromLocalCryptoAsync({ folder: uuid, filename: payload.file, key8: '0@#KSNA!' })
    const ok = result != null
    if (id != null) sendUnityMessage(id, 'OnJsonReadAck', ok, ok ? result : 'error')
}

export async function handleSendTransaction(payload: UnitySendTransactionMessage, id?: number) {
    showLoadingSpinner({ loading: true, message: getText('t022') })  // "결제 정보를 최종 확인 중입니다..."

    const result = await buyItem(payload.mode, payload.key)
    const ok = result != null
    if (id != null) sendUnityMessage(id, 'OnJsonTransactionAck', ok, ok ? result : 'error')
}

// stringify 없애자
export async function handleReqKaiaInfo(_payload: UnitySimpleMessage, id?: number) {
    const result = await getKaiaInfo()
    const ok = result != null
    if (id != null) sendUnityMessage(id, 'OnJsonKaiaInfoAck', ok, ok ? JSON.stringify(result) : 'error')
}

export async function handleCopyWalletAddress(_payload: UnitySimpleMessage, id?: number) {
    await copyWalletAddress()
    if (id != null) sendUnityMessage(id, 'OnJsonCopyWalletAddressAck', true, 'nodata')
}

// stringify 없애자
export async function handleGetInvenInfo(_payload: UnitySimpleMessage, id?: number) {
    const result = await getWalletInvenInfo()
    const ok = result != null
    if (id != null) sendUnityMessage(id, 'OnJsonInvenInfoAck', ok, ok ? JSON.stringify(result) : 'error')
}

export async function handleGetStarCoinReward(_payload: UnitySimpleMessage, id?: number) {
    if (o2jamSecretKey === null) {
        if (id != null) sendUnityMessage(id, 'OnJsonGetStarCoinRewardAck', false, 'error')
        return;
    }
    const amount = await getStarCoinRewardLocal(o2jamSecretKey)
    const payload = {
        uuid: getO2JamUUID(),
        Amount: amount
    }
    if (id != null) sendUnityMessage(id, 'OnJsonGetStarCoinRewardAck', true, JSON.stringify(payload))
}

export async function handelAddStarCoinReward(payload: UnityDataMessage, id?: number) {
    if (o2jamSecretKey === null) {
        if (id != null) sendUnityMessage(id, 'OnJsonAddStarCoinRewardAck', false, 'error')
        return;
    }
    await addStarCoinRewardLocal(o2jamSecretKey, Number(payload.data))

    // TODO. 지금은 백앤드 DB에 바로 적용한다. 추후에 검증 루틴 
    await addCoinsReward(Number(payload.data))

    if (id != null) sendUnityMessage(id, 'OnJsonAddStarCoinRewardAck', true, 'nodata')
}

export async function handleGetStarCoinBuyed(_payload: UnitySimpleMessage, id?: number) {
    const result = await getStarCoinBuyed()
    const ok = result != null
    if (id != null) sendUnityMessage(id, 'OnJsonGetStarCoinBuyedAck', ok, ok ? result : 'error')
}

export async function handleSpinKaiaWheel(_payload: UnitySimpleMessage, id?: number) {
    if (kaiaRewardCount === 0) {
        // await  사용하지 말것
        spinKaiaWheel()
        kaiaRewardCount = 1;
        if (id != null) sendUnityMessage(id, 'OnJsonSpinKaiaWheelAck', true, 'nodata')
    }
    else {
        if (id != null) sendUnityMessage(id, 'OnJsonSpinKaiaWheelAck', false, 'nodata')
    }
}

export async function handleAddFriends(_payload: UnitySimpleMessage, id?: number) {

    if (import.meta.env.VITE_APP_TYPE === "dapp_unity_web") {

        await navigator.clipboard.writeText(import.meta.env.VITE_DAPP_URL);
        toast.success(`'${import.meta.env.VITE_DAPP_URL}' \n ${getText('t023')}`);

    }
    else if (import.meta.env.VITE_APP_TYPE === "line_unity_web") {
        const status = await inviteFriends()

        showOkayPopup(
            getText('t014'),
            (status === 'success') ? getText('t016') : ((status === 'cancelled') ? getText('t017') : getText('t018')),
            () => {
            },
        )
    }

    if (id != null) sendUnityMessage(id, 'OnJsonAddFrinedAck', true, 'nodata')
}


export async function handleSubtractCoin(payload: UnityBodyJsonMessage, id?: number) {

    const value = JSON.parse(payload.body_string) as number

    const result = await subtractWalletCoins(value);
    if (result) {
        try {
            const parsed = JSON.parse(result);
            if (parsed != null && parsed.success) {
                // ✅ result를 문자열로 변환
                const resultStr = typeof parsed.result === 'string'
                    ? parsed.result
                    : JSON.stringify(parsed.result);

                if (id != null) sendUnityMessage(id, 'OnJsonSubtractCoinAck', true, resultStr)
                return;
            }
        } catch (e) {
            log(`[handleSubtractCoin] ❌ JSON 파싱 실패: ${e}`);
        }
    }


    if (id != null) sendUnityMessage(id, 'OnJsonSubtractCoinAck', false, 'nodata')
}