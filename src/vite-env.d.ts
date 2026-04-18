interface ImportMetaEnv {
    readonly VITE_APP_TYPE: string;
    readonly VITE_APP_VERSION: string;
    readonly VITE_APP_IS_DEBUG_CONSOL: string;
    readonly VITE_APP_VITE_FILTER_LOG_TEXT: string;
    readonly VITE_APP_IS_FAKE_LIFF: string;
    readonly VITE_APP_IS_DELETE_LOCAL_DATA_ON_START_LIFF: string;
    readonly VITE_APP_IS_TUTORIAL_SKIP: string;

    readonly VITE_ROOT_SHELL_4_API_BASE_URL: string;

    // KAIA
    readonly VITE_KAIA_CLIENT_ID: string;
    readonly VITE_KAIA_CLIENT_SECRET: string;       // 🔐 주의: 프론트에서는 절대 노출 되면 안됨.

    readonly VITE_KAIA_DAPP_ID: string;
    readonly VITE_KAIA_DAPP_NAME: string;

    readonly VITE_KAIA_CHAIN_ID: string;
    readonly VITE_KAIA_SIGNATURE_MESSAGE: string;

    // LIFF
    readonly VITE_LINE_LIFF_ID: string;

    readonly VITE_EXIT_URL: string;
    readonly VITE_LIFF_URL: string;
    readonly VITE_DAPP_URL: string;

    readonly VITE_APP_LOADING_UI_MIN_TIME: string;

    readonly VITE_PC_WIDTH: string;
    readonly VITE_PC_HEIGHT: string;

}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
