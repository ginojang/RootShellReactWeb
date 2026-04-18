
import { showWalletProfile/*, showLoadingSpinner*/ } from '../components/ReactUICanvas'
import { sendUnityMessage } from '../providers/unity/UnityMessageHandler'
import { log, logError } from '../utils/log'
import { globalLiffUserInfo } from '../providers/LiffProvider'

import type {
    UnityBodyJsonMessage,
    //UnitySimpleMessage,
    //UnityDataMessage,
    //UnityWriteJsonMessage,
    //UnityReadJsonMessage,
    //UnitySendTransactionMessage,
} from '../providers/unity/UnityMessageHandler'


export function showLiffProfileModal(popupId: string) {
    const { userId, displayName, pictureUrl } = globalLiffUserInfo;
    if (userId === null) {
        if (popupId === 'liffFirstProfile') {
            // no popup
            log(`❌ liffFirstProfile : ❌ No Liff Data >> 팝업 안뜸`)
        }
        else
            showWalletProfile(null, '')
    }
    else {
        if (popupId === 'liffFirstProfile') {
            // 예외처리 더한다. change 버튼 비활성화
        }
        showWalletProfile(pictureUrl, (displayName === null) ? '' : displayName)
    }
}



export async function handleShowPopup(payload: UnityBodyJsonMessage, id?: number) {
    let popupId = 'unknown';

    try {
        const parsed = JSON.parse(payload.body_string);
        popupId = parsed?.id ?? 'unknown';

        if (popupId === 'liffFirstProfile' || popupId === 'Profile') {
            showLiffProfileModal(popupId);
        }

    } catch (e) {
        logError(`❌ ShowPopup data JSON 파싱 실패: ${e}`);
    }

    if (id != null) {
        sendUnityMessage(id, 'OnShowPopupAck', true);
    }
}