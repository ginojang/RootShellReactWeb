// src/content/GameMainLoop.ts

import { log } from '../utils/log'
import { sendUnityMessage } from '../providers/unity/UnityMessageHandler'
import { setLanguage } from '../config/GlobalEnv'


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


import { getText } from '../i18n'



interface GameMainLoopOptions {
    isFirstLoop: boolean
    onStartUnity: (uuid: string) => void
}

let gameUUID: string | null = null
export function getGameUUID(): string | null {
    return gameUUID
}

export async function GameMainLoop({ isFirstLoop, onStartUnity }: GameMainLoopOptions) {
    if (!isFirstLoop) return

    // 1. UUID 하드코딩 생성
    const uuid = crypto.randomUUID()
    gameUUID = uuid
    log(`[🎮GameMainLoop] UUID 생성: ${uuid}`)

    // 2. 초기화
    await InitGame()

    // 3. Unity 시작
    onStartUnity(uuid)
}

// 유니티 생성전 초기화 부분
async function InitGame(): Promise<void> {
    log(`[🎮InitGame] 초기화`)
}



export function handlePingPong(_payload: UnitySimpleMessage, id?: number) {
    log(`pingPong 요청 수신`)
    if (id != null) sendUnityMessage(id, 'OnPingPongAck', true)
}

export async function handleWriteJson(payload: UnityWriteJsonMessage, id?: number) {
    //log(`writeJson 요청 수신 - ID: ${id}`)
    const uuid = getGameUUID() ?? 'userdata'
    await saveToLocalCryptoAsync({ folder: uuid, filename: payload.file, data: payload.data, key8: '0@#KSNA!' })
    if (id != null) sendUnityMessage(id, 'OnJsonWriteAck', true)
}

export async function handleReadJson(payload: UnityReadJsonMessage, id?: number) {
    //log(`readJson 요청 수신 - ID: ${id}`)
    const uuid = getGameUUID() ?? 'userdata'
    const result = await loadFromLocalCryptoAsync({ folder: uuid, filename: payload.file, key8: '0@#KSNA!' })
    const ok = result != null
    if (id != null) sendUnityMessage(id, 'OnJsonReadAck', ok, ok ? result : 'error')
}

export async function handleChangeLanguage(payload: UnityBodyJsonMessage, id?: number) {
    const language = payload.body_string;
    if (language === 'korean' || language === 'japanese' || language === 'english')
        setLanguage(language)

    if (id != null) sendUnityMessage(id, 'OnShowPopupAck', true);

}