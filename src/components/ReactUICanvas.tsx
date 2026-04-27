// src/components/ReactUICanvas.tsx
import { useState, useEffect, useRef } from 'react'
import { LoadingSpinner } from './content/LoadingSpinner'
import { YesNoPopup } from './popups/YesNoPopup'
import { OkayPopup } from './popups/OkayPopup'
import { ListViewPopup } from './popups/ListViewPopup'
import { getLanguage } from '../config/GlobalEnv' // ✅ 언어 판별용
import { log, logError } from '../utils/log'
import { sendUnityMessage } from '../providers/unity/UnityMessageHandler'
import { LoadingText } from './content/LoadingText'
import { getUnityCanvasSize } from '../providers/unity/UnityCanvas';
import { GlobalEnv } from '../config/GlobalEnv'

/* ---------------------- 유니티에서 오는 메시지 처리함수 ---------------------- */
import type {
    UnityBodyJsonMessage,
} from '../providers/unity/UnityMessageHandler'


async function showLoadingText(isShow: boolean, startTime: number, immediatelyFinishOnClose: boolean) {
    showLoadingTextUI({
        isShow,
        startTime,
        immediatelyFinishOnClose
    });
}


export async function handleShowLoadingUI(payload: UnityBodyJsonMessage, id?: number) {

    try {
        const parsed = JSON.parse(payload.body_string);
        const { isShow, loadingID, startTime, immediatelyFinishOnClose } = parsed

        switch (loadingID) {
            case 'loading':
                showLoadingText(isShow, startTime, immediatelyFinishOnClose)
                break;
            case 'spinner':
                showLoadingSpinnerUI(isShow, startTime, immediatelyFinishOnClose);
                break;
        }

    } catch (e) {
        logError(`❌ ShowLoadingUI data JSON 파싱 실패: ${e}`);
    }

    if (id != null) {
        sendUnityMessage(id, 'OnShowLoadingUIAck', true);
    }

    //import.meta.env.VITE_APP_LOADING_UI_MIN_TIME
}


/* ---------------------- Popup 유틸 함수들 ---------------------- */

export const showWalletProfile = (pictureUrl: string | null, displayName: string) => {
};

export const showListViewPopup = (
    title: string,
    content: string[],
    align: 'left' | 'center' | 'right' | 'justify', // ✅ 이렇게!
    onOkay?: () => void) => {

    showOverlayPopup(
        <ListViewPopup
            title={title}
            content={content}
            align={align}
            onOkay={() => {
                showOverlayPopup(null); // ✅ 오버레이만 닫기
                if (onOkay) onOkay();
            }}
        />
    );
};

export const showYesNoPopup = (title: string, content: string, onYes?: () => void, onNo?: () => void) => {
    showOverlayPopup(
        <YesNoPopup
            title={title}
            content={content}
            onYes={() => {
                showOverlayPopup(null); // ✅ 오버레이만 닫기
                if (onYes) onYes();
            }}
            onNo={() => {
                showOverlayPopup(null);
                if (onNo) onNo();
            }}
        />
    );
};

export const showOkayPopup = (title: string, content: string, onOkay?: () => void) => {
    showOverlayPopup(
        <OkayPopup
            title={title}
            content={content}
            onOkay={() => {
                showOverlayPopup(null); // ✅ 오버레이만 닫기
                if (onOkay) onOkay();
            }}
        />
    );
};


/* ---------------------- 외부 제어 함수 ---------------------- */
let externalShowLoadingText: ((v: { isShow?: boolean; startTime?: number; immediatelyFinishOnClose?: boolean }) => void) | null = null;
export const showLoadingTextUI = (v: { isShow?: boolean; startTime?: number; immediatelyFinishOnClose?: boolean }) => {
    if (externalShowLoadingText) externalShowLoadingText(v);
};

let externalShowLoadingSpinnerUI: ((v: { isShow?: boolean; startTime?: number; immediatelyFinishOnClose?: boolean }) => void) | null = null;
export const showLoadingSpinnerUI = (isShow?: boolean, startTime?: number, immediatelyFinishOnClose?: boolean) => {
    if (externalShowLoadingSpinnerUI) externalShowLoadingSpinnerUI({ isShow, startTime, immediatelyFinishOnClose });
};


let externalShowLoadingSpinner: ((v: { loading?: boolean; message?: string }) => void) | null = null;
let externalShowPopup: ((ui: React.ReactNode | null) => void) | null = null;
let externalShowOverlayPopup: ((ui: React.ReactNode | null) => void) | null = null;

export const showLoadingSpinner = (v: { loading?: boolean; message?: string }) => {
    if (externalShowLoadingSpinner) externalShowLoadingSpinner(v);
};
export const showPopup = (ui: React.ReactNode | null) => {
    if (externalShowPopup) externalShowPopup(ui);
};
export const showOverlayPopup = (ui: React.ReactNode | null) => {
    if (externalShowOverlayPopup) externalShowOverlayPopup(ui);
};

/* ---------------------- ReactUICanvas 컴포넌트 ---------------------- */

export function ReactUICanvas() {
    const { width, height } = getUnityCanvasSize();

    log(`✅✅  Screen Size>  Width:[${width}]   Height:[${height}]`)


    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [basePopup, setBasePopup] = useState<React.ReactNode | null>(null);
    const [overlayPopup, setOverlayPopup] = useState<React.ReactNode | null>(null);
    const [loadingTextVisible, setLoadingTextVisible] = useState(false);
    const [loadingTextProps, setLoadingTextProps] = useState<any>({});

    // ✅ 언어별 폰트 선택
    const lang = getLanguage();
    const fontFamily = lang === "japanese"
        ? "'Noto Sans JP', 'Pretendard Variable', Pretendard, sans-serif"
        : "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";


    useEffect(() => {
        externalShowLoadingSpinner = ({ loading, message }) => {
            if (loading !== undefined) {
                setIsLoading(loading);
                if (!loading) setMessage("");
            }
            if (message !== undefined) {
                setMessage(message);
            }
        };
        return () => {
            externalShowLoadingSpinner = null;
        };
    }, []);

    useEffect(() => {
        externalShowPopup = (ui) => setBasePopup(ui);
        externalShowOverlayPopup = (ui) => setOverlayPopup(ui);
        return () => {
            externalShowPopup = null;
            externalShowOverlayPopup = null;
        };
    }, []);

    useEffect(() => {
        externalShowLoadingText = ({ isShow, startTime, immediatelyFinishOnClose }) => {
            const minTime = parseInt(import.meta.env.VITE_APP_LOADING_UI_MIN_TIME ?? "0", 10);

            if (isShow !== undefined) {
                if (isShow) {
                    // 표시 준비
                    setLoadingTextProps({ startTime, immediatelyFinishOnClose });

                    // startTime이 0보다 크면 일정 시간 뒤에 표시
                    if ((startTime ?? 0) > 0) {
                        const delay = Date.now() - (startTime ?? 0);
                        if (delay < 0) {
                            // 아직 표시 시간 안 됨 → 나중에 표시
                            setTimeout(() => setLoadingTextVisible(true), Math.abs(delay));
                        } else {
                            setLoadingTextVisible(true);
                        }
                    } else {
                        setLoadingTextVisible(true);
                    }
                } else {
                    // 닫기 로직
                    if (!loadingTextVisible) {
                        // 아직 표시 전이면 아무것도 안 함
                        return;
                    }

                    if (immediatelyFinishOnClose) {
                        setLoadingTextVisible(false);
                        return;
                    }

                    // 표시 후 최소 유지 시간 계산
                    const shownDuration = Date.now() - (startTime ?? 0);
                    if (shownDuration < minTime) {
                        const remain = minTime - shownDuration;
                        setTimeout(() => setLoadingTextVisible(false), remain);
                    } else {
                        setLoadingTextVisible(false);
                    }
                }
            }
        };

        return () => {
            externalShowLoadingText = null;
        };
    }, [loadingTextVisible]);

    const [spinnerVisible, setSpinnerVisible] = useState(false);
    const [spinnerStartAt, setSpinnerStartAt] = useState(0);
    const spinnerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        externalShowLoadingSpinnerUI = ({ isShow, startTime, immediatelyFinishOnClose }) => {
            const minTime = parseInt(import.meta.env.VITE_APP_LOADING_UI_MIN_TIME ?? "0", 10);

            // 기존 타이머 클리어
            if (spinnerTimerRef.current) {
                clearTimeout(spinnerTimerRef.current);
                spinnerTimerRef.current = null;
            }

            if (isShow) {
                setSpinnerStartAt(Date.now());

                if ((startTime ?? 0) > 0) {
                    spinnerTimerRef.current = setTimeout(() => {
                        setSpinnerVisible(true);
                    }, startTime);
                } else {
                    setSpinnerVisible(true);
                }
            } else {
                // 지연 타이머 도중 닫기 → 그냥 안 띄우고 종료
                if (!spinnerVisible && spinnerTimerRef.current) {
                    clearTimeout(spinnerTimerRef.current);
                    spinnerTimerRef.current = null;
                    return;
                }

                if (immediatelyFinishOnClose) {
                    setSpinnerVisible(false);
                    return;
                }

                // 최소 표시 시간 보장
                const shownDuration = Date.now() - spinnerStartAt;
                if (shownDuration < minTime) {
                    spinnerTimerRef.current = setTimeout(() => {
                        setSpinnerVisible(false);
                    }, minTime - shownDuration);
                } else {
                    setSpinnerVisible(false);
                }
            }
        };

        return () => {
            externalShowLoadingSpinnerUI = null;
            if (spinnerTimerRef.current) {
                clearTimeout(spinnerTimerRef.current);
            }
        };
    }, [spinnerVisible]);

    const unityWidth = Number(import.meta.env.VITE_PC_WIDTH);  // Unity 해상도 가로
    const unityHeight = Number(import.meta.env.VITE_PC_HEIGHT);  // Unity 해상도 세로

    return (
        <div
            style={
                GlobalEnv.isMobile ?
                    {
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: width, // ✅ UnityCanvas와 동일한 폭
                        height: height, // ✅ UnityCanvas와 동일한 높이
                        pointerEvents: 'none',
                        fontFamily: fontFamily,
                        zIndex: 1000, // 🔼 Unity Canvas보다 높게
                    } :
                    {
                        // 💻 데스크톱 → absolute 중앙 배치 모드
                        position: 'fixed',
                        //top: `calc(50% - ${unityHeight / 2}px)`,   // 브라우저 중앙에서 Unity 높이 절반 위로
                        top: 0,
                        left: `calc(50% - ${unityWidth / 2}px)`,   // 브라우저 중앙에서 Unity 폭 절반 왼쪽으로
                        width: unityWidth,
                        height: unityHeight,
                        pointerEvents: 'none',
                        fontFamily: fontFamily,
                        zIndex: 1000, // 🔼 Unity Canvas보다 높게

                    }}
        >
            {/* 🔵 LoadingText */}
            {
                loadingTextVisible && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0, left: 0, width: '100%', height: '100%',
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            pointerEvents: 'auto',
                            zIndex: 1001,
                        }}
                    >
                        <LoadingText {...loadingTextProps} />
                    </div>
                )
            }

            {/* 🌀 스피너 */}
            {
                spinnerVisible && (
                    <LoadingSpinner visible={true} />
                )
            }

            {/* 🌀 로딩 */}
            {
                isLoading && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0, left: 0, width: '100%', height: '100%',
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'auto',
                        }}
                    >
                        <div style={{ textAlign: 'center', color: 'white' }}>
                            <LoadingSpinner visible={true} message={message} />
                        </div>
                    </div>
                )
            }

            {/* 🎨 기본 UI (예: WalletProfile) */}
            {
                basePopup && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0, left: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            zIndex: 1001,
                            pointerEvents: 'auto',
                        }}
                    >
                        <div style={{
                            flexShrink: 0,                 // 늘어나거나 줄어들지 않게
                            width: '80vw',                 // 원하는 가로 크기
                            aspectRatio: '16 / 9',          // 원본 비율
                            backgroundImage: 'url(/assets/wallet_bg.png)',
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                        }}>
                            {basePopup}
                        </div>
                    </div>
                )
            }

            {/* ✅ Yes/No 등 오버레이 팝업 */}
            {
                overlayPopup && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1002,
                            pointerEvents: 'auto',
                            backgroundColor: 'rgba(0,0,0,0.4)',
                        }}
                    >
                        {overlayPopup}
                    </div>
                )
            }
        </ div >
    );
}
