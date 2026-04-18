// src/media/audio/AudioRegistry.ts
import { log, logError } from '../../utils/log'


type AudioHandle = string;

interface AudioClipEntry {
    handle: AudioHandle;
    url: string;
    audio: HTMLAudioElement;
    duration: number;
}

// ✅ audioRegistry 읽기 전용 getter
export function getAllAudioClips(): ReadonlyMap<AudioHandle, AudioClipEntry> {
    return audioRegistry;
}

const audioRegistry = new Map<AudioHandle, AudioClipEntry>();

let nextId = 1;


export async function LoadAudioClip(fileName: string): Promise<{ handle: string, duration: number } | null> {
    try {
        const url = `https://ninja.o2jam.com/audio/game/${fileName}.ogg`;
        //const url = `https://ninja.o2jam.com/audio/sample3.m4a`;
        //log(`LoadAudioClip url: ${url}`)

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const audio = new Audio(objectUrl);

        audio.load(); // ✅ iOS에서 메타데이터 트리거 확률 ↑

        await new Promise((resolve) => {
            audio.addEventListener('loadedmetadata', () => resolve(true), { once: true });
        });

        const handle = `audio_${nextId++}`;
        const durationMs = Math.round(audio.duration * 1000); // ✅ 정수 밀리초 변환
        //const durationMs = 30000; // 30초

        audioRegistry.set(handle, {
            handle,
            url: objectUrl,
            audio,
            duration: durationMs,
        });

        return { handle, duration: durationMs };
    } catch (err) {
        logError(`[AudioRegistry] ❌ 실패: ${err}`);
        return null;
    }
}

export function getAudioClip(handle: string): AudioClipEntry | undefined {
    return audioRegistry.get(handle);
}

export function ReleaseAudioClip(handle: string) {
    const entry = audioRegistry.get(handle);
    if (entry) {
        entry.audio.pause();
        URL.revokeObjectURL(entry.url);
        audioRegistry.delete(handle);
        log(`[AudioRegistry] 🧹 클립 해제 완료: ${handle}`);
    }
}



export async function PlayAudioClip(handle: string, isLoop?: string) {
    const entry = getAudioClip(handle);
    if (!entry) {
        logError(`[AudioRegistry] ❌ Play 실패: 핸들 ${handle} 없음`);
        return null;
    }

    const { audio } = entry;
    audio.currentTime = 0;
    audio.loop = isLoop === 'true'; // ✅ string → boolean 변환
    audio.muted = false;

    // ✅ iOS 대응: AudioContext 강제 resume 시도
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
        try {
            const ctx = new AudioContext();
            await ctx.resume();
            log(`[AudioRegistry] ✅ AudioContext resumed`);
        } catch (err) {
            log(`[AudioRegistry] ⚠️ AudioContext resume 실패: ${err}`);
        }
    }

    try {
        await audio.play();
        return { handle, playing: true };
    } catch (err) {
        logError(`[AudioRegistry] ❌ Play 실패: ${err}`);
        return null;
    }
}


export async function StopAudioClip(handle: string) {
    const entry = getAudioClip(handle);
    if (!entry) {
        log(`[AudioRegistry] ❌ Stop 실패: 핸들 ${handle} 없음`);
        return null;
    }

    const { audio } = entry;
    audio.pause();
    audio.currentTime = 0;

    return { handle, stopped: true };
}

export async function PauseAudioClip(handle: string) {
    const entry = getAudioClip(handle);
    if (!entry) {
        log(`[AudioRegistry] ❌ Pause 실패: 핸들 ${handle} 없음`);
        return null;
    }

    entry.audio.pause();
    return { handle, paused: true };
}

export async function UnPauseAudioClip(handle: string) {
    const entry = getAudioClip(handle);
    if (!entry) {
        log(`[AudioRegistry] ❌ UnPause 실패: 핸들 ${handle} 없음`);
        return null;
    }

    try {
        await entry.audio.play();
        return { handle, resumed: true };
    } catch (err) {
        logError(`[AudioRegistry] ❌ Resume 실패: ${err}`);
        return null;
    }
}

export async function MuteAudioClip(handle: string, isMute: boolean) {
    const entry = getAudioClip(handle);
    if (!entry) {
        log(`[AudioRegistry] ❌ Mute 실패: 핸들 ${handle} 없음`);
        return null;
    }

    entry.audio.muted = isMute;
    return { handle, muted: isMute };
}