// src/appServices/PureUnityWebView.tsx

import { UnityProvider } from '../providers/unity/UnityProvider'
import { UnityWrapper } from '../providers/unity/UnityWrapper'
import { getLanguage, GlobalEnv } from '../config/GlobalEnv';

export function PureUnityWebView() {
    return (
        <UnityProvider>
            <UnityWrapper
                startMode={'pure'}
                userUUID={'userUUID'}
                language={getLanguage()}
                isMobile={(GlobalEnv.isMobile === true) ? 'true' : 'false'}
            />
        </UnityProvider>
    )
}