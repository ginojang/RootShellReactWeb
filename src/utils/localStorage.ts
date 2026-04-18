
// src/utils/localStorage.ts

/* ----------------------------------------------------------------------------------
🌸 [RootShell 규칙 안내] 공통 유틸 함수 및 API 통신은 다음 규칙을 반드시 준수합니다.

📌 반환 타입 규칙
────────────────────────────────────────────
✅ 모든 유틸 함수 및 API 함수는 cross-platform 통합을 위해 다음과 같은 반환 규칙을 따릅니다:

1. ⚙️ 고정 반환 타입은 string 또는 string | null 만 허용
   - object 또는 throw 금지
   - 에러는 JSON string 형태로 표현 (예: '{"error":true,"message":"..."}')

2. 🧵 고빈도 함수(`saveToLocal`, `loadFromLocal`)는 최대한 경량화
   - 들여쓰기 없는 JSON.stringify(data)
   - log 출력 최소화 or DEV 조건 분기

3. 🧘 유틸 함수는 무조건 내부에서 stringify / parse 등 처리를 완료한 뒤 string만 리턴
   - 외부에서는 JSON.parse()를 선택적으로 수행

📌 용도별 반환 규칙
────────────────────────────────────────────
🔸 saveToLocal(...)              → void (성공/실패는 내부 로그만)
🔸 loadFromLocal(...)            → string | null
🔸 deleteAllLocalStorage(...)    → void
🔸 sendApi(...) / sendApiJson(...) → Promise<string> (항상 string 반환)

📌 기타 주의사항
────────────────────────────────────────────
- throw 절대 사용 금지 (에러도 string으로 반환)
- React, Unity, RN, Native 모든 환경에서 동일한 방식으로 호출 가능해야 함
- 약간의 string 오버헤드는 cross-platform 통합을 위한 필연입니다 😤

---------------------------------------------------------------------------------- */


import { logError, logSuccess } from './log';
import { encodeJson, decodeJson } from './jsonCrypto'


export type StoragePayload = {
  folder?: string;      // 저장 경로처럼 쓸 prefix
  filename: string;     // 저장 파일명
  data: any;            // 저장할 JSON 데이터
};

export type StoragePayloadCryptoAsync = {
  folder?: string;      // 저장 경로처럼 쓸 prefix
  filename: string;     // 저장 파일명
  data: any;            // 저장할 JSON 데이터
  key8: string;  // optional: 암호화 키 (기본값 사용 가능)
};


export function saveToLocal({ folder, filename, data }: StoragePayload): void {
  const fullName = folder ? `${folder}_${filename}` : filename
  const json = JSON.stringify(data)
  localStorage.setItem(fullName, json)
}

export function loadFromLocal({ folder, filename }: { folder?: string; filename: string }): string | null {
  const fullName = folder ? `${folder}_${filename}` : filename
  return localStorage.getItem(fullName)
}

//
export async function saveToLocalCryptoAsync({ folder, filename, data, key8 }: StoragePayloadCryptoAsync): Promise<void> {
  if (key8 === null)
    return;

  const fullName = folder ? `${folder}_${filename}` : filename
  const json = JSON.stringify(data)
  const encoded = await encodeJson(json, key8)
  localStorage.setItem(fullName, encoded)
}

export async function loadFromLocalCryptoAsync({ folder, filename, key8 }: { folder: string; filename: string; key8: string }): Promise<string | null> {
  if (key8 === null)
    return null;

  const fullName = folder ? `${folder}_${filename}` : filename
  const encoded = localStorage.getItem(fullName)
  if (!encoded) return null
  try {
    const json = await decodeJson(encoded, key8)
    return json
  } catch (err) {
    console.warn(`[loadFromLocalAsync] ❌ 복호화 실패: ${err}`)
    return null
  }
}

export function deleteAllLocalStorage(): void {
  try {
    localStorage.clear();
    logSuccess("모든 localStorage 삭제 완료");
  } catch (err) {
    logError(`전체 삭제 실패: ${err}`);
  }
}


