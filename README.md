# RootShell 1: ReactWeb


## 개요

- 플랫폼: **웹 브라우저 (Chrome, Safari 등)**
- 렌더링 구조: **React + Unity WebGL + Three.js + Pixi.js**
- 주요 특징:
  - ✅ **PWA** 설치 가능
  - ✅ **CDN 기반 Addressables** 로딩
  - ✅ **KAIA 지갑 연동** 지원
  - ✅ **SOMA 감정 AI** 연동


## 디렉터리 구조

rootshell-1-reactweb/
├── react-app/
│   ├── public/
│   │   └── UnityBuild/            # Unity WebGL 빌드 포함
│   ├── components/                # UI 구성 요소
│   ├── pages/                     # SPA 라우팅 페이지들
│   ├── bridge/                    # Unity ↔ React 메시지 통신 (import from common)
│   ├── emotion/                   # SOMA 감정 에이지언 연동
│   └── App.tsx                    # 앱 진입점
└── index.html                     # Unity Loader 포트 포함 HTML


## 시작 방법

1. 패턴시 설치:

cd rootshell-1-reactweb/react-app
npm install

2. 개발 서버 실행:

npm run dev

3. 접속:

http://localhost:5173


# Unity WebGL 빌드 포함

- `public/UnityBuild/` 경로에 Unity에서 Export한 WebGL 빌드를 복사하세요.
- Unity에서는 Addressables → CDN 방식 사용 권유.


## 🧠 SOMA 연동

- 감정 상태 연동은 `emotion/SomaLink.ts` 사용
- 예시:

import { sendEmotion } from '@/emotion/SomaLink';
sendEmotion({ state: "curious", level: 0.8 });


## 🔐 KAIA 지갑 연동

- `common/utils/kaiaHooks.ts` 사용
- 로그인 예시:

const { login, wallet } = useKaiaWallet();
await login();
console.log(wallet.address);


## 📦 배포

npm run build
# ./dist 포디 생성, CDN 또는 정적 호스팅에 업로드


## 📌 참고

| 항목     | 설명                               |
| ------ | -------------------------------- |
| CDN 사용 | 필수 (Unity Addressables 및 기타 리소스) |
| WebGL     | 성능 제한 존재, 모바일에서는 주의              |
| 유지보수   | 최상 (React + SPA 구조)              |
| 활용 사례  | 프로토타입, 홍보성 게임, 로비 기반 미니게임 등      |

