// services/BridgeProvides.ts

import { sendUnityMessageDirect } from "../providers/unity/UnityMessageHandler"



export function sendUnityMessage(type: string, data?: any) {
    sendUnityMessageDirect(type, data);
}
