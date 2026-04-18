import { log, logError } from '../utils/log';


export function initLineAdBanner() {
    try {
        const adInfo = {
            zoneId: 158, // ✅ 테스트용 Zone ID
            publisherId: 49, // ✅ 테스트용 Publisher ID
            eventId: 0,
        };

        const adParams = {
            line: {
                type: 'LMA', // Line Mini App
                liffId: import.meta.env.VITE_LINE_LIFF_ID, // .env에서 관리
                prototype: (window as any).liff,
            },
            wallet: {
                type: '',
                provider: null,
                components: '',
            },
        };

        const userInfo = {
            userId: '', // LMA/LWA면 빈 값
            displayName: '',
        };

        // DOM에 광고 영역이 없으면 추가
        if (!document.querySelector('.OpenADLineJsSDKBanner')) {
            const bannerDiv = document.createElement('div');
            bannerDiv.className = 'OpenADLineJsSDKBanner';
            bannerDiv.setAttribute('zoneId', adInfo.zoneId.toString());
            bannerDiv.setAttribute('publisherId', adInfo.publisherId.toString());
            document.body.appendChild(bannerDiv);
        }

        // SDK init
        if ((window as any).OpenADLineJsSDK?.banner?.init) {
            (window as any).OpenADLineJsSDK.banner.init({ adParams, adInfo, userInfo });
            log('[🌸LineAd]✅ 광고 배너 init 호출 완료');
        } else {
            logError('[🌸LineAd]❌ SDK 로드 안됨');
        }
    } catch (err) {
        logError(`[🌸LineAd]❌ 배너 init 에러  ${err}`);
    }
}

/*
export function testBanner() {
    log("[DEBUG] OpenADLineJsSDK =", (window as any).OpenADLineJsSDK);
    log("[DEBUG] LIFF Context =", (window as any).liff?.getContext?.());

    const bannerDiv = document.createElement('div');
    bannerDiv.className = 'OpenADLineJsSDKBanner';
    bannerDiv.setAttribute('zoneId', '158');
    bannerDiv.setAttribute('publisherId', '49');
    bannerDiv.style.border = '1px solid red';
    bannerDiv.style.width = '320px';
    bannerDiv.style.height = '50px';
    bannerDiv.style.background = '#eee';
    document.body.prepend(bannerDiv);

    if ((window as any).OpenADLineJsSDK?.banner?.init) {
        (window as any).OpenADLineJsSDK.banner.init({
            adParams: {
                line: {
                    type: 'LMA',
                    liffId: import.meta.env.VITE_LINE_LIFF_ID,
                    prototype: (window as any).liff,
                },
                wallet: { type: '', provider: null, components: '' }
            },
            adInfo: { zoneId: 158, publisherId: 49, eventId: 0 },
            userInfo: { userId: '', displayName: '' }
        });
        log('[DEBUG] init 호출됨');
    } else {
        logError('[DEBUG] SDK 로드 안됨');
    }
}
*/

export function testBanner(user: { userId: string, displayName: string }) {
    const sdk = (window as any).OpenADLineJsSDK;
    if (!sdk?.banner?.init) {
        logError("[🌸LineAdDebug] SDK가 아직 안 올라옴");
        return;
    }

    // fetch 후킹
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const [url, options] = args;
        if (typeof url === "string" && url.includes("openad.network")) {
            log(`[🌸LineAdDebug] 광고 요청: ${url}, 옵션: ${JSON.stringify(options)}`);
        }
        const res = await originalFetch(...args);
        if (typeof url === "string" && url.includes("openad.network")) {
            log(`[🌸LineAdDebug] 광고 응답 상태: ${res.status}`);
        }
        return res;
    };

    // 배너 DOM
    const bannerDiv = document.createElement('div');
    bannerDiv.className = 'OpenADLineJsSDKBanner';
    bannerDiv.setAttribute('zoneId', '158');
    bannerDiv.setAttribute('publisherId', '49');
    bannerDiv.style.border = '1px solid red';
    bannerDiv.style.width = '320px';
    bannerDiv.style.height = '50px';
    bannerDiv.style.background = '#eee';
    document.body.prepend(bannerDiv);

    // init 호출
    sdk.banner.init({
        adParams: {
            line: {
                type: 'LMA',
                liffId: import.meta.env.VITE_LINE_LIFF_ID,
                prototype: (window as any).liff,
            },
            wallet: { type: '', provider: null, components: '' }
        },
        adInfo: { zoneId: 158, publisherId: 49, eventId: 0 },
        userInfo: { userId: user.userId, displayName: user.displayName }
    });
}
