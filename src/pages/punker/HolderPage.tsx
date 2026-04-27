// HolderPage.tsx
import { getDashboard } from '../../network/http/authApi';

type HolderPageProps = {
    address: string;
    token: string;
};

// ── Design tokens (matching HTML prototype) ──────────────────────────────────
const mcn = '#62e4d3';
const arena = '#ffb84d';
const exchange = '#6eb2ff';
const paper = '#eef5f7';
const dimText = 'rgba(255,255,255,0.72)';
const mutedText = 'rgba(255,255,255,0.48)';
const line = 'rgba(255,255,255,0.08)';

function shortAddr(addr: string) {
    if (!addr || addr.length < 10) return addr;
    return addr.slice(0, 6) + '...' + addr.slice(-4);
}

// ── Shared sub-components ────────────────────────────────────────────────────

type BadgeColor = 'yield' | 'nft' | 'special' | 'tier';

function Badge({ color, children }: { color: BadgeColor; children: React.ReactNode }) {
    const map: Record<BadgeColor, React.CSSProperties> = {
        yield: { background: 'rgba(98,228,211,0.12)', color: mcn, border: '1px solid rgba(98,228,211,0.2)' },
        nft: { background: 'rgba(98,228,211,0.12)', color: mcn, border: '1px solid rgba(98,228,211,0.2)' },
        special: { background: 'rgba(255,184,77,0.16)', color: arena, border: '1px solid rgba(255,184,77,0.28)' },
        tier: { background: 'rgba(110,178,255,0.12)', color: exchange, border: '1px solid rgba(110,178,255,0.2)' },
    };
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minHeight: 34, padding: '6px 14px', borderRadius: 999,
            fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
            ...map[color],
        }}>
            {children}
        </span>
    );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginBottom: 10, padding: '6px 12px', borderRadius: 999,
            border: '1px solid rgba(98,228,211,0.18)', background: 'rgba(98,228,211,0.08)',
            color: mcn, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
            <span style={{
                width: 8, height: 8, borderRadius: '50%', background: mcn,
                boxShadow: '0 0 12px rgba(98,228,211,0.8)', flexShrink: 0,
            }} />
            {children}
        </div>
    );
}

function OverviewItem({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ padding: '16px 18px', borderRadius: 18, border: `1px solid ${line}`, background: 'rgba(255,255,255,0.03)' }}>
            <span style={{ display: 'block', marginBottom: 6, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: mutedText }}>
                {label}
            </span>
            <span style={{ display: 'block', fontSize: 14, lineHeight: 1.6, color: paper }}>
                {value}
            </span>
        </div>
    );
}

// Glass card used for all three sections
function Board({ children }: { children: React.ReactNode }) {
    return (
        <section style={{
            padding: 28, borderRadius: 22,
            border: '1px solid rgba(98,228,211,0.18)',
            background: 'radial-gradient(circle at top left, rgba(98,228,211,0.12), transparent 38%), linear-gradient(135deg, rgba(7,17,24,0.96), rgba(13,25,37,0.92))',
            backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
            boxShadow: '0 26px 72px rgba(0,0,0,0.32)',
        }}>
            {children}
        </section>
    );
}

function OverviewHeader({ eyebrow, title, desc, badge }: {
    eyebrow: string; title: string; desc: string; badge: React.ReactNode;
}) {
    return (
        <div style={{ paddingBottom: 24, marginBottom: 24, borderBottom: `1px solid ${line}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', marginBottom: 22 }}>
                <div>
                    <Eyebrow>{eyebrow}</Eyebrow>
                    <div style={{ fontSize: 24, fontWeight: 700, color: paper, marginBottom: 8 }}>{title}</div>
                    <div style={{ maxWidth: 720, fontSize: 14, lineHeight: 1.7, color: dimText }}>{desc}</div>
                </div>
                {badge}
            </div>
        </div>
    );
}

// ── Section: My Store Dashboard ───────────────────────────────────────────────
function StoreDashboard({ address }: { address: string }) {
    return (
        <Board>
            <OverviewHeader
                eyebrow="My Store Dashboard"
                title="매장 인벤토리"
                desc="보유한 NFT에 따라 활성화된 매장 카드만 보이며, 카드를 클릭하면 해당 매장의 맞춤형 미션 공지로 이동합니다."
                badge={<Badge color="yield">활성 매장 1개</Badge>}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
                <OverviewItem label="스캔된 지갑" value={shortAddr(address) || '0x7a3b...f29e'} />
                <OverviewItem label="총 보유 수량" value="3개 · 1종" />
                <OverviewItem label="선택 매장" value="남산타워 프로젝트" />
                <OverviewItem label="활성 상태" value="권위 게이지 Tier 3 · 56점" />
            </div>
        </Board>
    );
}

// ── Section: My Milestone ─────────────────────────────────────────────────────
function MyMilestone() {
    const pills = [
        { label: '기본 미션', value: '3회' },
        { label: '추가 미션', value: '0회' },
        { label: '자문 리포트', value: '해당 없음' },
        { label: '나머지 처리', value: '추가 없음' },
    ];
    return (
        <Board>
            <OverviewHeader
                eyebrow="My Milestone"
                title="마일스톤"
                desc="남산타워 프로젝트 기준 보유 수량에 따라 이번 달 수행해야 할 기본 미션, 추가 미션, 자문 리포트 요구량이 자동 계산됩니다."
                badge={<Badge color="special">1~4개 구간</Badge>}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, marginBottom: 24 }}>
                <OverviewItem label="적용 매장" value="남산타워 프로젝트" />
                <OverviewItem label="보유 수량" value="3개" />
                <OverviewItem label="현재 구간" value="1~4개 구간" />
                <OverviewItem label="이번 달 요구" value="기본 3회" />
                <OverviewItem label="다음 목표" value="5개까지 2개 남음" />
                <OverviewItem label="정산 상태" value="정상 정산 가능" />
            </div>

            {/* Progress bar */}
            <div style={{ display: 'grid', gap: 8, marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'rgba(255,255,255,0.62)' }}>
                    <span>VVIP까지 27개 남음</span>
                    <span>3/30</span>
                </div>
                <div style={{ position: 'relative', overflow: 'hidden', height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.08)' }}>
                    <div style={{
                        height: '100%', borderRadius: 'inherit', width: '10%',
                        background: 'linear-gradient(90deg, rgba(255,184,77,0.7), rgba(255,224,130,0.95))',
                        boxShadow: '0 0 24px rgba(255,184,77,0.28)',
                    }} />
                </div>
            </div>

            {/* Milestone pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
                {pills.map(({ label, value }) => (
                    <div key={label} style={{ padding: '14px 16px', borderRadius: 16, border: `1px solid ${line}`, background: 'rgba(255,255,255,0.03)' }}>
                        <span style={{ display: 'block', marginBottom: 6, fontSize: 11, color: mutedText, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            {label}
                        </span>
                        <span style={{ fontSize: 14, lineHeight: 1.6, color: paper, fontWeight: 600 }}>
                            {value}
                        </span>
                    </div>
                ))}
            </div>
        </Board>
    );
}

// ── Section: My Store Cards ───────────────────────────────────────────────────
function MyStoreCards() {
    const stats = [
        { label: '보유 수량', value: '3개' },
        { label: '적용 수익률', value: '30%' },
        { label: '현재 내 등급', value: 'Tier 3' },
        { label: '이번 달 요구', value: '기본 3회' },
    ];
    return (
        <Board>
            <OverviewHeader
                eyebrow="My Store Cards"
                title="매장 카드"
                desc="활성화된 매장 카드를 선택하면 해당 프로젝트 미션 공지와 제출 흐름으로 바로 이동합니다."
                badge={<Badge color="yield">카드 1개</Badge>}
            />

            {/* Store card grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 460px)', gap: 24, justifyContent: 'start' }}>
                <article style={{
                    padding: 28, borderRadius: 22, cursor: 'pointer',
                    position: 'relative', overflow: 'hidden',
                    border: `1px solid ${exchange}`,
                    background: 'radial-gradient(circle at top right, rgba(98,228,211,0.18), transparent 38%), linear-gradient(180deg, rgba(11,25,34,0.98), rgba(7,17,24,0.98))',
                    boxShadow: '0 26px 72px rgba(0,0,0,0.32)',
                }}>
                    {/* Top accent bar — namsan style */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
                        borderRadius: '22px 22px 0 0',
                        background: `linear-gradient(90deg, ${arena}, ${mcn})`,
                    }} />
                    {/* Gloss overlay */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05), transparent 34%)',
                        pointerEvents: 'none',
                    }} />

                    <div style={{ fontSize: 18, fontWeight: 700, color: paper, marginBottom: 4 }}>
                        남산타워 프로젝트
                    </div>
                    <div style={{ fontSize: 12, color: dimText, marginBottom: 16 }}>
                        현장 방문 인증과 숏폼 확산을 함께 운영하는 오프라인 캠페인
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
                        <Badge color="yield">활성 카드</Badge>
                        <Badge color="nft">보유 3개</Badge>
                        <Badge color="special">1~4개 구간</Badge>
                        <Badge color="tier">주간 USDT 정산</Badge>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
                        {stats.map(({ label, value }) => (
                            <div key={label} style={{ padding: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 16, textAlign: 'center' }}>
                                <div style={{ fontFamily: 'monospace', fontSize: 11, color: mutedText, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    {label}
                                </div>
                                <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: paper }}>
                                    {value}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginBottom: 14, fontSize: 12, lineHeight: 1.7, color: 'rgba(255,255,255,0.68)' }}>
                        기본 활동만 수행 · 현재 구간은 1개당 기본 파트너사 미션 1회가 필요합니다.
                    </div>

                    <button style={{
                        padding: '10px 24px', borderRadius: 16, border: 'none',
                        background: `linear-gradient(135deg, ${exchange}, #4a8aff)`,
                        color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(110,178,255,0.3)',
                    }}>
                        이 매장 미션 공지 보기
                    </button>

                    <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                        컨트랙트 0xNAM...001
                    </div>
                </article>
            </div>
        </Board>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HolderPage({ address }: HolderPageProps) {
    return (
        <main style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'transparent',
            color: paper,
            overflowY: 'auto',
            pointerEvents: 'none',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '24px 24px 40px',
        }}>
            <div style={{
                width: '100%', maxWidth: 1100,
                display: 'grid', gap: 20,
                pointerEvents: 'auto',
            }}>
                {/* Row 1: Dashboard + Milestone side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20, alignItems: 'stretch' }}>
                    <StoreDashboard address={address} />
                    <MyMilestone />
                </div>

                {/* Row 2: Store Cards full width */}
                <MyStoreCards />
            </div>
        </main>
    );
}
