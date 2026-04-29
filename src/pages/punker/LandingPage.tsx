// LandingPage.tsx
import { useState } from 'react';
import { connectMetaMask } from '../../core/punker/metaMask';
import { requestNonce, verifyWallet, getDashboard, type DashboardStore, type UserProfile } from '../../network/http/authApi';

type LandingPageProps = {
    onSuccesed?: (data: { address: string; token: string; stores: DashboardStore[]; profile: UserProfile }) => void;
};

type Step = 'idle' | 'connecting' | 'signing' | 'verifying' | 'checking';

// ── Design tokens ────────────────────────────────────────────────────────────
const mcn = '#62e4d3';
const paper = '#eef5f7';
const dimText = 'rgba(255,255,255,0.72)';
const mutedText = 'rgba(255,255,255,0.48)';
const line = 'rgba(255,255,255,0.08)';

const STEPS: { key: Step; label: string }[] = [
    { key: 'connecting', label: '지갑 연결' },
    { key: 'signing',    label: '서명 요청' },
    { key: 'verifying',  label: '서명 검증' },
    { key: 'checking',   label: '홀더 확인' },
];

function shortAddr(addr: string) {
    if (!addr || addr.length < 10) return addr;
    return addr.slice(0, 6) + '...' + addr.slice(-4);
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LandingPage({ onSuccesed }: LandingPageProps) {
    const [step, setStep]       = useState<Step>('idle');
    const [address, setAddress] = useState<string>('');
    const [error, setError]     = useState<string>('');

    const handleConnect = async () => {
        setError('');
        try {
            setStep('connecting');
            const result = await connectMetaMask();

            const expectedChain = import.meta.env.VITE_PUNKER_CHAIN_ID;
            if (result.chainId.toLowerCase() !== expectedChain.toLowerCase()) {
                throw new Error(`BSC 테스트넷(${expectedChain})에 연결해주세요. 현재 체인: ${result.chainId}`);
            }

            setAddress(result.address);

            const nonceResult = await requestNonce(result.address);

            setStep('signing');
            const signature = (await window.ethereum?.request({
                method: 'personal_sign',
                params: [nonceResult.data.message, result.address],
            })) as string;

            setStep('verifying');
            const verifyResult = await verifyWallet({
                address: result.address,
                message: nonceResult.data.message,
                signature,
            });

            localStorage.setItem('punker_token', verifyResult.data.token);

            setStep('checking');
            const dashboardResult = await getDashboard(result.address);
            if (!dashboardResult.data.isHolder) {
                setError('NFT Holder 전용 서비스입니다.');
                setStep('idle');
                return;
            }

            onSuccesed?.({ address: result.address, token: verifyResult.data.token, stores: dashboardResult.data.stores, profile: dashboardResult.data.profile });
        } catch (err) {
            const message = err instanceof Error ? err.message : '지갑 연결 중 오류가 발생했습니다.';
            setError(message);
            setStep('idle');
        }
    };

    const isLoading    = step !== 'idle';
    const activeIdx    = STEPS.findIndex(s => s.key === step);

    return (
        <main style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'transparent',
            display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
            paddingBottom: 48,
            color: paper, pointerEvents: 'none',
        }}>
            <div style={{ width: 440, pointerEvents: 'auto' }}>
                <div style={{
                    padding: '32px 28px', borderRadius: 24,
                    background: 'radial-gradient(circle at top left, rgba(98,228,211,0.10), transparent 40%), linear-gradient(135deg, rgba(7,17,24,0.96), rgba(13,25,37,0.94))',
                    backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
                    border: '1px solid rgba(98,228,211,0.18)',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
                }}>
                    {/* Accent bar */}
                    <div style={{
                        width: 36, height: 4, borderRadius: 999, marginBottom: 24,
                        background: `linear-gradient(90deg, ${mcn}, rgba(98,228,211,0.3))`,
                    }} />

                    {/* Brand */}
                    <div style={{ marginBottom: isLoading ? 24 : 28 }}>
                        <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: mcn, marginBottom: 8 }}>
                            MCN Marketing Platform
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 800, color: paper, lineHeight: 1.1, marginBottom: 8 }}>
                            PUNKER
                        </div>
                        <div style={{ fontSize: 13, color: dimText, lineHeight: 1.6 }}>
                            NFT 홀더 전용 미션 플랫폼입니다.<br />
                            MetaMask 지갑을 연결해 서비스를 시작하세요.
                        </div>
                    </div>

                    {/* Step progress */}
                    {isLoading && (
                        <div style={{ marginBottom: 20, display: 'grid', gap: 8 }}>
                            {STEPS.map((s, i) => {
                                const done   = i < activeIdx;
                                const active = i === activeIdx;
                                return (
                                    <div key={s.key} style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        opacity: done || active ? 1 : 0.35,
                                    }}>
                                        <div style={{
                                            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 11, fontWeight: 700,
                                            background: done
                                                ? mcn
                                                : active
                                                    ? 'rgba(98,228,211,0.15)'
                                                    : 'rgba(255,255,255,0.05)',
                                            border: active ? `1.5px solid ${mcn}` : 'none',
                                            color: done ? '#0a1520' : active ? mcn : mutedText,
                                            boxShadow: active ? '0 0 10px rgba(98,228,211,0.35)' : 'none',
                                        }}>
                                            {done ? '✓' : i + 1}
                                        </div>
                                        <span style={{ fontSize: 13, color: active ? paper : dimText }}>
                                            {s.label}
                                            {active && <span style={{ marginLeft: 6, color: mcn }}>…</span>}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Connected address pill */}
                    {address && (
                        <div style={{
                            marginBottom: 14, padding: '7px 14px', borderRadius: 999,
                            background: 'rgba(255,255,255,0.04)', border: `1px solid ${line}`,
                            fontSize: 12, color: mcn, letterSpacing: '0.04em',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: mcn, flexShrink: 0 }} />
                            {shortAddr(address)}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div style={{
                            marginBottom: 14, padding: '10px 14px', borderRadius: 12,
                            background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.2)',
                            fontSize: 13, color: '#ff8a8a', lineHeight: 1.5,
                        }}>
                            {error}
                        </div>
                    )}

                    {/* CTA */}
                    <button
                        onClick={handleConnect}
                        disabled={isLoading}
                        style={{
                            width: '100%', padding: '14px 16px',
                            borderRadius: 14, border: 'none',
                            background: isLoading
                                ? 'rgba(98,228,211,0.08)'
                                : `linear-gradient(135deg, ${mcn}, #4ecfbf)`,
                            color: isLoading ? mcn : '#0a1520',
                            fontSize: 15, fontWeight: 700,
                            cursor: isLoading ? 'default' : 'pointer',
                            boxShadow: isLoading ? 'none' : '0 4px 20px rgba(98,228,211,0.25)',
                            letterSpacing: '0.02em',
                        }}
                    >
                        {isLoading ? '처리 중...' : error ? '다시 시도' : 'Connect Wallet'}
                    </button>

                    <div style={{ marginTop: 14, fontSize: 11, color: mutedText, textAlign: 'center', lineHeight: 1.6 }}>
                        NFT Holder만 입장 가능합니다 · MetaMask 필요
                    </div>
                </div>
            </div>
        </main>
    );
}
