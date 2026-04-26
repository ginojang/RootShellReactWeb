// HolderPage.tsx
import { useEffect, useState } from 'react';
import { getDashboard } from '../../network/http/authApi';

type HolderPageProps = {
    address: string;
    token: string;
};

type Store = {
    storeId: string;
    storeName: string;
    contractAddress: string;
    balance: string;
    tier?: string;
    rewardRate?: number;
};

export default function HolderPage({ address, token }: HolderPageProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isHolder, setIsHolder] = useState(false);
    const [stores, setStores] = useState<Store[]>([]);

    useEffect(() => {
        load();
    }, [address]);

    const load = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await getDashboard(address);

            if (!res.ok) {
                throw new Error('API 응답 오류');
            }

            setIsHolder(res.data.isHolder);
            setStores(res.data.stores || []);
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : '데이터 로드 실패';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main style={styles.page}>
            <section style={styles.panel}>
                <h2>Holder Info</h2>

                <div style={styles.row}>
                    <strong>Address:</strong>
                    <div style={styles.addr}>{address}</div>
                </div>

                {loading && <div>Loading...</div>}

                {!loading && (
                    <>
                        <div style={styles.row}>
                            <strong>Holder:</strong>
                            <span style={{ color: isHolder ? '#6effa2' : '#ff8a8a' }}>
                                {isHolder ? 'YES' : 'NO'}
                            </span>
                        </div>

                        {isHolder && stores.length > 0 && (
                            <div style={styles.storeList}>
                                <h4>Stores</h4>

                                {stores.map((s) => (
                                    <div key={s.storeId} style={styles.storeItem}>
                                        <div style={styles.storeName}>
                                            {s.storeName}
                                        </div>
                                        <div style={styles.small}>
                                            Balance: {s.balance}
                                        </div>
                                        {s.tier && (
                                            <div style={styles.small}>
                                                Tier: {s.tier}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {!isHolder && (
                            <div style={styles.error}>
                                NFT Holder 전용 서비스입니다.
                            </div>
                        )}
                    </>
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

        background: 'transparent',

        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',

        paddingBottom: 40,
        color: 'white',

        pointerEvents: 'none',
    },

    panel: {
        width: 420,
        padding: 24,
        borderRadius: 20,

        background: 'rgba(20, 24, 60, 0.75)',
        backdropFilter: 'blur(12px)',

        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.4)',

        pointerEvents: 'auto',
    },

    row: {
        marginTop: 12,
        fontSize: 14,
    },

    addr: {
        fontSize: 12,
        wordBreak: 'break-all',
        opacity: 0.8,
    },

    storeList: {
        marginTop: 16,
    },

    storeItem: {
        padding: 10,
        marginTop: 8,
        borderRadius: 10,
        background: 'rgba(0,0,0,0.25)',
    },

    storeName: {
        fontWeight: 700,
    },

    small: {
        fontSize: 12,
        opacity: 0.8,
    },

    error: {
        marginTop: 12,
        color: '#ff8a8a',
        fontSize: 13,
    },
};