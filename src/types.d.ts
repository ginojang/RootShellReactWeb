export {};   // 💡 이게 핵심이야!!

declare global {
  interface Window {
    unityInstance?: {
      SendMessage: (gameObject: string, methodName: string, parameter: string) => void;
    };
    dictMessageCallbacks?: Record<number, any>;
  }
}
