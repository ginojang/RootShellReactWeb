// UnityProvider.tsx
import React, { createContext, useContext, useRef } from 'react'
import { log } from '../../utils/log';


export const UnityContext = createContext<{
    unityInstanceRef: React.MutableRefObject<any>;
    handshakeDone: React.MutableRefObject<boolean>;
    unityMessageQueueRef: React.MutableRefObject<string[]>;
}>({
    unityInstanceRef: { current: null },
    handshakeDone: { current: false },
    unityMessageQueueRef: { current: [] },
})

export const UnityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const unityInstanceRef = useRef<any>(null)
    const handshakeDone = useRef(false)
    const unityMessageQueueRef = useRef<string[]>([]);

    window.dictMessageCallbacks = {};

    // 🧠 메시지 수신 핸들러 등록 (최초 1회)
    if (typeof window !== 'undefined') {
        (window as any).onRecvUnityMessge = (msg: string) => {
            log(`  📨 Unity → React 메시지 수신: ${msg}`);
            unityMessageQueueRef.current.push(msg);
        };
    }

    return (
        <UnityContext.Provider value={{ unityInstanceRef, handshakeDone, unityMessageQueueRef }}>
            {children}
        </UnityContext.Provider>
    )
}

export const useUnity = () => useContext(UnityContext)