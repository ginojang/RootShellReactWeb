// LandingPage.tsx

import { useState } from 'react';
import { connectMetaMask } from '../../core/punker/metaMask';
import { requestNonce, verifyWallet, getDashboard } from '../../network/http/authApi';


type LandingPageProps = {
    onSuccesed?: (data: {
        address: string;
        token: string;
    }) => void;
};


export default function LandingPage({ onSuccesed }: LandingPageProps) {
    const [address, setAddress] = useState<string>('');
    const [chainId, setChainId] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [authToken, setAuthToken] = useState<string>('');


    const handleConnect = async () => {
        setError('');

        try {
            const result = await connectMetaMask();
            setAddress(result.address);
            setChainId(result.chainId);

            console.warn('[Wallet] connected:', result);

            const nonceResult = await requestNonce(result.address);
            console.warn('[Auth] nonce result:', nonceResult);

            const signature = (await window.ethereum?.request({
                method: 'personal_sign',
                params: [nonceResult.data.message, result.address],
            })) as string;

            console.warn('[Auth] signature:', signature);

            const verifyResult = await verifyWallet({
                address: result.address,
                message: nonceResult.data.message,
                signature,
            });

            console.warn('[Auth] verify result:', verifyResult);

            setAuthToken(verifyResult.data.token);
            localStorage.setItem('punker_token', verifyResult.data.token);

            //
            const dashboardResult = await getDashboard(result.address);
            if (!dashboardResult.data.isHolder) {
                setError('NFT Holder 전용 서비스입니다.');
                return;
            }

            onSuccesed?.({
                address: result.address,
                token: verifyResult.data.token,
            });

        } catch (err) {
            const message =
                err instanceof Error ? err.message : '지갑 연결 중 오류가 발생했습니다.';
            setError(message);
        }
    };

    return (
        <main style={styles.page}>
            <section style={styles.panel}>
                <h1 style={styles.title}>PUNKER MCN</h1>
                <p style={styles.subtitle}>Wallet Holder Mission Platform</p>

                <button style={styles.button} onClick={handleConnect}>
                    Connect Wallet
                </button>

                {address && (
                    <div style={styles.infoBox}>
                        <div>Address: {address}</div>
                        {/*<div>Chain ID: {chainId}</div>*/}
                    </div>
                )}
                {authToken && (
                    <div style={styles.success}>
                        Wallet verified. Checking holder status...
                    </div>
                )}

                {error && <div style={styles.error}>{error}</div>}
            </section>
        </main>
    );
}

const styles: Record<string, React.CSSProperties> = {
    page: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',

        // 🔥 완전 투명
        background: 'transparent',

        display: 'flex',
        // width 기준 가운데
        justifyContent: 'center',

        // height 기준 하단
        alignItems: 'flex-end',

        paddingBottom: 40, // 🔥 바닥 여백

        color: 'white',
        pointerEvents: 'none', // 🔥 중요: 아래 Unity 클릭 가능
    },

    panel: {
        width: 420,
        padding: 24,
        borderRadius: 20,

        // 🔥 반투명 다이얼로그
        background: 'rgba(20, 24, 60, 0.75)',
        backdropFilter: 'blur(12px)',

        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.4)',

        textAlign: 'center',

        pointerEvents: 'auto', // 🔥 패널만 클릭 가능
    },

    title: {
        fontSize: 28,
        marginBottom: 6,
    },

    subtitle: {
        opacity: 0.7,
        marginBottom: 20,
        fontSize: 14,
    },

    button: {
        width: '100%',
        padding: '14px 16px',
        borderRadius: 12,
        border: 0,
        fontSize: 16,
        fontWeight: 700,
        cursor: 'pointer',
    },

    infoBox: {
        marginTop: 20,
        padding: 12,
        borderRadius: 10,
        background: 'rgba(0,0,0,0.3)',
        fontSize: 12,
        wordBreak: 'break-all',
        textAlign: 'left',
    },

    error: {
        marginTop: 16,
        color: '#ff8a8a',
        fontSize: 13,
    },

    success: {
        marginTop: 16,
        color: '#6effa2',
        fontSize: 13,
    },
};