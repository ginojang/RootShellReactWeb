// App.tsx

import { DAppUnityWeb } from './appServices/dAppUnityWeb'
import { LineUnityWeb } from './appServices/lineUnityWeb'
import { PureUnityWebView } from './appServices/PureUnityWebView'
import { Toaster } from 'react-hot-toast'

import { log } from './utils/log'
import { InitGlobalEnv, getLanguage, GlobalEnv } from './config/GlobalEnv'

//import { TestOggPlayer } from './utils/testOggPlayer'

type AppType = 'dapp_unity_web' | 'line_unity_web' | 'pure_unity'
const APP_TYPE = (import.meta.env.VITE_APP_TYPE as AppType) ?? 'pure_unity'

function DynamicApp() {
  switch (APP_TYPE) {
    case 'dapp_unity_web':
      return (
        <DAppUnityWeb />
      )

    case 'line_unity_web':
      return (
        <LineUnityWeb />
      )

    case 'pure_unity':
    default:
      return <PureUnityWebView />
  }
}

export default function App() {
  InitGlobalEnv();

  log(`[🌍] 초기 언어: ${getLanguage()}`);
  log(`[🌍] 디바이스: ${GlobalEnv.isMobile ? '모바일' : 'PC'}`);
  log(`[🌍] 현재버전: ${import.meta.env.VITE_APP_VERSION}`);
  log(`[🌍] 운영체제: ${GlobalEnv.currentOS} ${GlobalEnv.currentOSVersion}`);
  log(`[🌍] 실행 된 앱: ${GlobalEnv.launchedInApp}`);
  log(`[🌍] WebGL 2.0 지원 여부: ${GlobalEnv.isSupportedWebGL2}`);


  return (
    <>
      {/*<TestOggPlayer />*/}
      {<Toaster />} { /*✅ 토스트 추가*/}
      {<DynamicApp />}
    </>
  )

}
