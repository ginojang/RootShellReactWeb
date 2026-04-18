// src/media/audio/AudioManager.ts

import { sendUnityMessage } from '../../providers/unity/UnityMessageHandler'
import { log, logError } from '../../utils/log'
import {
    LoadAudioClip,
    PlayAudioClip,
    StopAudioClip,
    PauseAudioClip,
    UnPauseAudioClip,
    MuteAudioClip,
} from './AudioRegistry';


/* ---------------------- 유니티에서 오는 메시지 처리함수 ---------------------- */
import type {
    UnityBodyJsonMessage,
} from '../../providers/unity/UnityMessageHandler'


export async function handleLoadAudioClip(payload: UnityBodyJsonMessage, id?: number) {

    try {
        const parsed = JSON.parse(payload.body_string);
        const { fileName } = parsed

        const result = await LoadAudioClip(fileName)
        log(`handleLoadAudioClip>  ${result?.handle}  ${result?.duration}`)

        const ok = result != null
        if (id != null) sendUnityMessage(id, 'OnLoadAudioClipAck', ok, ok ? JSON.stringify(result) : 'error')

    } catch (e) {
        logError(`❌ ShowLoadingUI data JSON 파싱 실패: ${e}`);
    }
}


export async function handleExecuteAudioAction(payload: UnityBodyJsonMessage, id?: number) {

    try {
        const parsed = JSON.parse(payload.body_string);
        const { clip, action, isLoop, mute } = parsed

        //log(`handleExecuteAudioAction>  ${clip}  ${action} ${isLoop}`)
        let result = null;
        switch (action) {
            case "play":
                result = await PlayAudioClip(clip, isLoop);
                break;

            case "stop":
                result = await StopAudioClip(clip);
                break;

            case "pause":
                result = await PauseAudioClip(clip);
                break;

            case "unpause":
                result = await UnPauseAudioClip(clip);
                break;
            case "set_mute":
                result = await MuteAudioClip(clip, (mute === 'true') ? true : false);
                break;
        }

        const ok = result != null
        if (id != null) sendUnityMessage(id, 'OnLoadAudioClipAck', ok, ok ? JSON.stringify(result) : 'error')

    } catch (e) {
        logError(`❌ ShowLoadingUI data JSON 파싱 실패: ${e}`);
    }
}