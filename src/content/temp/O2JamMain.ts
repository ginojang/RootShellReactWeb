
// src/content/O2JamMain.ts
import { showLoadingSpinner, showOkayPopup } from '../../components/ReactUICanvas'
import { sendUnityMessage } from '../../providers/unity/UnityMessageHandler'
import { log, logError } from '../../utils/log'
import { getLanguage, setLanguage, setRestarted } from '../../config/GlobalEnv'
import { toast } from 'react-hot-toast';

import type {
    UnitySimpleMessage,
    UnityDataMessage,
    UnityWriteJsonMessage,
    UnityReadJsonMessage,
    UnitySendTransactionMessage,
    UnityBodyJsonMessage,
} from '../../providers/unity/UnityMessageHandler'

import {
    saveToLocalCryptoAsync,
    loadFromLocalCryptoAsync,
    deleteAllLocalStorage,
} from '../../utils/localStorage';


import { getText } from '../../i18n'


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

        /*
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
        }*/
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


        //return await setStarCoinRewardLocal(o2jamSecretKey, Number(user.coins_reward))
        return true;

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





export async function handleSetCurrentStageID(payload: UnityDataMessage, id?: number) {
    currentStageID = Number(payload.data)
    //currentWorldKey
    //const result = await setCurrentStageID(currentWorldKey, currentStageID)
    //const ok = result != null
    //if (id != null) sendUnityMessage(id, 'OnJsonSetCurrentStageIDAck', ok, ok ? result : 'error')
}

export async function handleGetCurrentStageID(_payload: UnitySimpleMessage, id?: number) {
    const payload = {
        worldKey: currentWorldKey,
        stageID: currentStageID
    }
    if (id != null) sendUnityMessage(id, 'OnJsonGetCurrentStageIDAck', true, JSON.stringify(payload))
}

export async function handleSendTransaction(payload: UnitySendTransactionMessage, id?: number) {
    showLoadingSpinner({ loading: true, message: getText('t022') })  // "결제 정보를 최종 확인 중입니다..."

}

// stringify 없애자
export async function handleReqKaiaInfo(_payload: UnitySimpleMessage, id?: number) {
    //if (id != null) sendUnityMessage(id, 'OnJsonKaiaInfoAck', ok, ok ? JSON.stringify(result) : 'error')
}

export async function handleCopyWalletAddress(_payload: UnitySimpleMessage, id?: number) {

    //if (id != null) sendUnityMessage(id, 'OnJsonCopyWalletAddressAck', true, 'nodata')
}

// stringify 없애자
export async function handleGetInvenInfo(_payload: UnitySimpleMessage, id?: number) {
    //const result = await getWalletInvenInfo()
    //const ok = result != null
    //if (id != null) sendUnityMessage(id, 'OnJsonInvenInfoAck', ok, ok ? JSON.stringify(result) : 'error')
}

export async function handleGetStarCoinReward(_payload: UnitySimpleMessage, id?: number) {

}

export async function handelAddStarCoinReward(payload: UnityDataMessage, id?: number) {

}

export async function handleGetStarCoinBuyed(_payload: UnitySimpleMessage, id?: number) {
}

export async function handleSpinKaiaWheel(_payload: UnitySimpleMessage, id?: number) {
}

export async function handleAddFriends(_payload: UnitySimpleMessage, id?: number) {
}


export async function handleSubtractCoin(payload: UnityBodyJsonMessage, id?: number) {

}