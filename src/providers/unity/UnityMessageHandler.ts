import { log, logError, logWarn } from '../../utils/log'
import { setLanguage } from '../../config/GlobalEnv'

import {
  handlePingPong,
  handleWriteJson,
  handleReadJson,
  handleSendTransaction,
  handleReqKaiaInfo,
  handleCopyWalletAddress,
  handleGetInvenInfo,
  handleGetStarCoinReward,
  handelAddStarCoinReward,
  handleGetStarCoinBuyed,
  handleSetCurrentStageID,
  handleGetCurrentStageID,
  handleSpinKaiaWheel,
  handleAddFriends,
  handleSubtractCoin,
} from '../../content/O2JamMain'

import {
  handleShowPopup,
} from '../../content/O2JamPopup'

import {
  handleShowLoadingUI,
} from '../../components/ReactUICanvas'

import {
  handleLoadAudioClip,
  handleExecuteAudioAction,

} from '../../media/audio/AudioManager'


const encoder = new TextEncoder();
const decoder = new TextDecoder();


function xorDecryptBase64(encoded: string, key: string): string {
  const dataBytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
  const keyBytes = encoder.encode(key);
  const result = dataBytes.map((b, i) => b ^ keyBytes[i % keyBytes.length]);
  return decoder.decode(result);
}


// ==================================
// 🔹 메시지 타입 정의 (enum 대신 const + type)
// ==================================
export const UnityMessageTypes = {
  PingPong: 'pingPong',
  ReadJson: 'readJson',
  WriteJson: 'writeJson',
  SendTransaction: 'sendTransaction',
  ReqKaiaInfo: 'reqKaiaInfo',
  copyWalletAddress: 'copyWalletAddress',
  getInvenInfo: 'getInvenInfo',
  getStarCoinReward: 'getStarCoinReward',
  addStarCoinReward: 'addStarCoinReward',   // 위험한 함수
  getStarCoinBuyed: 'getStarCoinBuyed',
  setCurrentStageID: 'setCurrentStageID',   // 위험한 함수
  getCurrentStageID: 'getCurrentStageID',
  spinKaiaWheel: 'spinKaiaWheel',
  showPopup: 'showPopup',
  addFriends: 'addFriends',
  changeLanguage: 'changeLanguage',
  subtractCoin: 'subtractCoin',// 위험한 함수
  showLoadingUI: 'showLoadingUI',

  loadAudioClip: 'loadAudioClip',
  executeAudioAction: "executeAudioAction",
} as const;

export type UnityMessageType = typeof UnityMessageTypes[keyof typeof UnityMessageTypes];

// ==================================
// 🔹 메시지 타입별 구조 정의
// ==================================
type UnityJsonMessageBase = {
  id: number;
  type: UnityMessageType;
};

export type UnitySimpleMessage = UnityJsonMessageBase & {
};
export type UnityDataMessage = UnityJsonMessageBase & {
  data: string;
};
export type UnityWriteJsonMessage = UnityJsonMessageBase & {
  file: string;
  data: any;
};

export type UnityReadJsonMessage = UnityJsonMessageBase & {
  file: string;
};

export type UnityBodyJsonMessage = UnityJsonMessageBase & {
  body_string: string;
};

export type UnitySendTransactionMessage = UnityJsonMessageBase & {
  mode: string;
  key: string;
};


// ==================================
// 🔹 Unity 응답 메시지 전송 유틸
// ==================================
export function sendUnityMessageDirect(type: string, data?: any) {
  sendUnityMessage(-1, type, true, data);
}

export function sendUnityMessage(id: number, type: string, result: boolean, data?: any) {
  if (window.unityInstance) {
    setTimeout(() => {
      window.unityInstance?.SendMessage(
        'RootShellBridge',
        'RecvMessgeFromRootShell',
        JSON.stringify({
          id,
          type,
          result,
          data: data ?? undefined,
        })
      );
    }, 100);
  }
}

// ==================================
// 🔹 핸들러 등록부
// ==================================
type UnityMessageHandler = (payload: any, id?: number) => void;

export const unityMessageHandlers: Record<string, UnityMessageHandler> = {
  [UnityMessageTypes.PingPong]: handlePingPong,
  [UnityMessageTypes.WriteJson]: handleWriteJson,
  [UnityMessageTypes.ReadJson]: handleReadJson,
  [UnityMessageTypes.SendTransaction]: handleSendTransaction,
  [UnityMessageTypes.ReqKaiaInfo]: handleReqKaiaInfo,
  [UnityMessageTypes.copyWalletAddress]: handleCopyWalletAddress,
  [UnityMessageTypes.getInvenInfo]: handleGetInvenInfo,
  [UnityMessageTypes.getStarCoinReward]: handleGetStarCoinReward,
  [UnityMessageTypes.addStarCoinReward]: handelAddStarCoinReward,
  [UnityMessageTypes.getStarCoinBuyed]: handleGetStarCoinBuyed,
  [UnityMessageTypes.setCurrentStageID]: handleSetCurrentStageID,
  [UnityMessageTypes.getCurrentStageID]: handleGetCurrentStageID,
  [UnityMessageTypes.spinKaiaWheel]: handleSpinKaiaWheel,
  [UnityMessageTypes.showPopup]: handleShowPopup,
  [UnityMessageTypes.addFriends]: handleAddFriends,
  [UnityMessageTypes.changeLanguage]: handleChangeLanguage,
  [UnityMessageTypes.subtractCoin]: handleSubtractCoin,
  [UnityMessageTypes.showLoadingUI]: handleShowLoadingUI,

  [UnityMessageTypes.loadAudioClip]: handleLoadAudioClip,
  [UnityMessageTypes.executeAudioAction]: handleExecuteAudioAction,
};

// ==================================
// 🔹 메시지 수신 핸들러
// ==================================
const handledMessageIds = new Set<number>();

export async function handleUnityMessage(raw: string) {
  try {
    // 여기에 XOR 복호화
    const decrypted = xorDecryptBase64(raw, '34!@#A-Tension@RootLink_');
    //const decrypted = raw;

    const msg = JSON.parse(decrypted);
    const { type, id, ...rest } = msg;

    if (handledMessageIds.has(id)) {
      logWarn(`⚠️ 중복 메시지 ID: ${id} → 무시`);
      return;
    }

    handledMessageIds.add(id);
    setTimeout(() => handledMessageIds.delete(id), 60_000); // 1분 후 자동 제거

    let payload: any = { ...rest };
    if (typeof payload.data === 'string') {
      try {
        payload.data = JSON.parse(payload.data);
        log(`data 문자열 → 객체 파싱 성공`);
      } catch {
        logWarn(`data 필드 JSON 파싱 실패`);
      }
    }

    const handler = unityMessageHandlers[type];
    if (handler) {
      handler(payload, id);
    } else {
      logWarn(`❌ 정의되지 않은 메시지 타입: ${type}`);
    }
  } catch (e) {
    logError(`handleUnityMessage 오류: ${e}`);
  }
}


//
export async function handleChangeLanguage(payload: UnityBodyJsonMessage, id?: number) {
  const language = payload.body_string;
  if (language === 'korean' || language === 'japanese' || language === 'english')
    setLanguage(language)

  if (id != null) sendUnityMessage(id, 'OnShowPopupAck', true);

}