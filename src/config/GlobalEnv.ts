// src/config/GlobalEnv.ts


// 브라우저 정보 추출 (구형 호환성 포함)
const ua = navigator.userAgent || (navigator as any).userAgentData?.ua || '';

// 브라우저 언어 소문자로 정리
export const browserLang = (navigator.language || 'en').toLowerCase();

// 모바일 여부 판별
export const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);

// OS 타입
export type CurrentOS = 'ios' | 'android' | 'etc';
export const currentOS: CurrentOS = (() => {
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Android/i.test(ua)) return 'android';

    // iPadOS 13+가 'Macintosh'로 위장하는 케이스 보완
    if (/\bMacintosh\b/.test(ua) && (navigator as any).maxTouchPoints > 1) return 'ios';
    return 'etc';

})();



// 지원 언어 타입
export type SupportedLang = 'korean' | 'japanese' | 'english';


export const setRestarted = (): void => {
    localStorage.setItem('isRestarted', 'true');
}

export const isRestarted = (): boolean => {
    const check = localStorage.getItem('isRestarted')
    if (check === 'true') {
        localStorage.setItem('isRestarted', 'false');
        return true;
    }
    return false;
}

// 🔎 인앱 브라우저 판별
const detectInApp = (): string => {
    if (/\bKAKAOTALK\b/i.test(ua)) return 'kakao';
    if (/\bTelegram\b/i.test(ua)) return 'telegram';
    if (/\bLine\/|LINE\b/i.test(ua)) return 'line';
    if (/\bInstagram\b/i.test(ua)) return 'instagram';
    if (/\bFBAN|FBAV\b/i.test(ua)) return 'facebook';

    // 외부 브라우저
    if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return 'chrome';
    if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'safari';
    if (/Firefox/i.test(ua)) return 'firefox';
    if (/Edg/i.test(ua)) return 'edge';

    return 'unknown';
};

// 🔎 WebGL2 지원 여부
const checkWebGL2Support = (): boolean => {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
    } catch {
        return false;
    }
};

// 🔎 iOS 메이저 버전 추출 (없으면 null)
// - iPhone/iPad/iPod
// - iPadOS 13+ (Macintosh + touch) 대응
const getIOSMajorVersion = (): number | null => {
    const isIOSUA =
        /iP(hone|od|ad)/i.test(ua) ||
        (/\bMacintosh\b/.test(ua) && (navigator as any).maxTouchPoints > 1);

    if (!isIOSUA) return null;

    const m = ua.match(/OS (\d+)[._]/i);
    return m && m[1] ? parseInt(m[1], 10) : null;
};

// 🔎 Android 메이저 버전 추출 (없으면 null)
const getAndroidMajorVersion = (): number | null => {
    if (/Android/i.test(ua)) {
        const m = ua.match(/Android\s+(\d+)/i);
        if (m && m[1]) {
            return parseInt(m[1], 10);
        }
    }
    return null;
};

//
// 전역 환경 정보
export const GlobalEnv = {
    isMobile,
    browserLang,
    isKorean: browserLang.startsWith('ko'),
    isJapanese: browserLang.startsWith('ja'),
    isEnglish: browserLang.startsWith('en'),
    userAgent: ua,
    launchedInApp: detectInApp(), // ✅ string: kakao, telegram, ...
    isSupportedWebGL2: checkWebGL2Support(), // ✅ 추가

    currentOS,
    iosMajorVersion: (currentOS === 'ios') ? getIOSMajorVersion() : null,
    androidMajorVersion: (currentOS === 'android') ? getAndroidMajorVersion() : null,
    currentOSVersion: (currentOS === 'ios')
        ? (getIOSMajorVersion() ?? 0)
        : (currentOS === 'android')
            ? (getAndroidMajorVersion() ?? 0)
            : 0,

};

// 내부 저장된 언어 설정
let savedLanguage: SupportedLang | undefined = undefined;

// ✅ 현재 언어 가져오기 (저장값 있으면 우선)
export const getLanguage = (): SupportedLang => {

    if (savedLanguage) return savedLanguage;

    if (GlobalEnv.isKorean) return 'korean';
    if (GlobalEnv.isJapanese) return 'japanese';
    return 'english';
};

// ✅ 초기화: localStorage에서 불러오기
export const InitGlobalEnv = (): void => {
    try {
        const lang = localStorage.getItem('user_language');
        if (lang === 'korean' || lang === 'japanese' || lang === 'english') {
            savedLanguage = lang;
            setDefaultFont();
        }
    } catch (err) {
        console.warn('[🌍GlobalEnv] ❌ 언어 설정 불러오기 실패:', err);
        savedLanguage = undefined;
    }
};

// ✅ 언어 저장하기
export const setLanguage = (lang: SupportedLang): void => {
    savedLanguage = lang;
    setDefaultFont();
    try {
        localStorage.setItem('user_language', lang);
    } catch (err) {
        console.warn('[🌍GlobalEnv] ❌ 언어 설정 저장 실패:', err);
    }
};


const setDefaultFont = (): void => {
    const styleId = 'global-font-style';

    // 기존 스타일 태그 있으면 삭제
    const oldStyle = document.getElementById(styleId);
    if (oldStyle) {
        oldStyle.remove();
    }

    // 새 스타일 태그 생성
    const style = document.createElement('style');
    style.id = styleId;

    const lang = getLanguage();

    const fontFamily = lang === 'japanese'
        ? "'Noto Sans JP', 'Pretendard Variable', Pretendard, sans-serif"
        : "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

    style.textContent = `
      html, body {
        font-family: ${fontFamily} !important;
      }
    `;

    document.head.appendChild(style);
};