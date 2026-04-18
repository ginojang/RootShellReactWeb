// src/utils/sendApi.ts

// ⚠️⚠️⚠️⚠️ [sendApi 규칙] cross-platform 안전성 확보를 위한 고정 반환 타입: string
//
// - object 반환 절대 금지! (React, RN, Unity, Core Native 모두에서 직접 호출 가능해야 함)
//
// - 사용 시 필요한 경우, 각 플랫폼에서 JSON.parse()로 해석하세요
// - 약간의 오버헤드는 통합을 위한 필연! 참자! 😤
//

export async function sendApi(
    route: string,
    api: string,
    bodyString: string
): Promise<string> {
    const base = import.meta.env.VITE_ROOT_SHELL_4_API_BASE_URL.replace(/\/$/, '')
    const url = `${base}/${route}/${api}`

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bodyString }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            return JSON.stringify({
                error: true,
                status: response.status,
                message: errorText || 'Unknown error',
            })
        }

        const result = await response.text()
        return result
    } catch (err: any) {
        return JSON.stringify({
            error: true,
            message: `[sendApi] ❌ 요청 실패: ${String(err)}`,
        })
    }
}


export async function sendApiJson<T>(
    route: string,
    api: string,
    payload: T
): Promise<string> {
    const base = import.meta.env.VITE_ROOT_SHELL_4_API_BASE_URL.replace(/\/$/, '')
    const url = `${base}/${route}/${api}`

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            const errText = await response.text()
            return JSON.stringify({
                error: true,
                status: response.status,
                message: errText || 'Unknown error',
            })
        }

        return await response.text()
    } catch (err: any) {
        return JSON.stringify({
            error: true,
            message: `[sendApiJson] ❌ 예외: ${String(err)}`,
        })
    }
}

export function isApiSuccess(raw: string | null): { ok: boolean, data?: any, error?: any } {
    if (!raw) return { ok: false }

    try {
        const parsed = JSON.parse(raw)

        if (parsed.success === true) {
            return { ok: true, data: parsed }
        }

        if (parsed.error === true || parsed.status >= 400) {
            return { ok: false, error: parsed }
        }

        return { ok: false, data: parsed }
    } catch (err) {
        console.warn(`[isApiSuccess] ❌ JSON 파싱 실패: ${err}`)
        return { ok: false }
    }
}