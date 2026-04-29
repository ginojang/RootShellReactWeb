// HolderPage.tsx
import { useState, useEffect } from 'react';
import {
    type DashboardStore,
    type MissionSubmission, type ExpLogEntry, getActivity,
    type UserReward, type SettlementRecord,
    getReward, claimReward as apiClaimReward, convertGp as apiConvertGp,
} from '../../network/http/authApi';

type HolderPageProps = {
    address: string;
    token: string;
    stores: DashboardStore[];
};

// ── Milestone helper ──────────────────────────────────────────────────────────
type MilestoneInfo = {
    band: string;
    basic: number;
    extra: number;
    nextAt: number | null;
};

function getMilestone(balance: number): MilestoneInfo {
    if (balance <= 0)  return { band: '미보유',      basic: 0,       extra: 0, nextAt: 1  };
    if (balance < 5)   return { band: '1~4개 구간',  basic: balance, extra: 0, nextAt: 5  };
    if (balance < 15)  return { band: '5~14개 구간', basic: balance, extra: 0, nextAt: 15 };
    if (balance < 20)  return { band: '15~19개 구간',basic: 1,       extra: 1, nextAt: 20 };
    return                    { band: '20개 이상',   basic: 2,       extra: 1, nextAt: null };
}

// ── Design tokens ────────────────────────────────────────────────────────────
const mcn      = '#62e4d3';
const arena    = '#ffb84d';
const exchange = '#6eb2ff';
const paper    = '#eef5f7';
const dimText  = 'rgba(255,255,255,0.72)';
const mutedText= 'rgba(255,255,255,0.48)';
const line     = 'rgba(255,255,255,0.08)';

function shortAddr(addr: string) {
    if (!addr || addr.length < 10) return addr;
    return addr.slice(0, 6) + '...' + addr.slice(-4);
}

// ── Shared primitives ────────────────────────────────────────────────────────

type BadgeColor = 'yield' | 'nft' | 'special' | 'tier';

function Badge({ color, children }: { color: BadgeColor; children: React.ReactNode }) {
    const map: Record<BadgeColor, React.CSSProperties> = {
        yield:   { background: 'rgba(98,228,211,0.12)',  color: mcn,      border: '1px solid rgba(98,228,211,0.2)' },
        nft:     { background: 'rgba(98,228,211,0.12)',  color: mcn,      border: '1px solid rgba(98,228,211,0.2)' },
        special: { background: 'rgba(255,184,77,0.16)',  color: arena,    border: '1px solid rgba(255,184,77,0.28)' },
        tier:    { background: 'rgba(110,178,255,0.12)', color: exchange, border: '1px solid rgba(110,178,255,0.2)' },
    };
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minHeight: 30, padding: '4px 12px', borderRadius: 999,
            fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
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
            marginBottom: 10, padding: '5px 12px', borderRadius: 999,
            border: '1px solid rgba(98,228,211,0.18)', background: 'rgba(98,228,211,0.08)',
            color: mcn, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
            <span style={{
                width: 7, height: 7, borderRadius: '50%', background: mcn,
                boxShadow: '0 0 10px rgba(98,228,211,0.7)', flexShrink: 0,
            }} />
            {children}
        </div>
    );
}

function OverviewItem({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ padding: '14px 16px', borderRadius: 16, border: `1px solid ${line}`, background: 'rgba(255,255,255,0.03)' }}>
            <span style={{ display: 'block', marginBottom: 5, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: mutedText }}>
                {label}
            </span>
            <span style={{ display: 'block', fontSize: 13, lineHeight: 1.6, color: paper }}>
                {value}
            </span>
        </div>
    );
}

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
    eyebrow: string; title: string; desc: string; badge?: React.ReactNode;
}) {
    return (
        <div style={{ paddingBottom: 22, marginBottom: 22, borderBottom: `1px solid ${line}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                    <Eyebrow>{eyebrow}</Eyebrow>
                    <div style={{ fontSize: 22, fontWeight: 700, color: paper, marginBottom: 6 }}>{title}</div>
                    <div style={{ maxWidth: 680, fontSize: 13, lineHeight: 1.7, color: dimText }}>{desc}</div>
                </div>
                {badge}
            </div>
        </div>
    );
}

// ── Profile Header ────────────────────────────────────────────────────────────
function ProfileHeader({ address, stores, onDisconnect }: { address: string; stores: DashboardStore[]; onDisconnect?: () => void }) {
    const totalNft  = stores.reduce((s, st) => s + parseInt(st.balance || '0'), 0);
    const storeCount = stores.length;
    const milestone  = getMilestone(totalNft);

    const stats = [
        { label: '자산', value: '27' },
        { label: '신뢰', value: '10' },
        { label: '활동', value: '12' },
        { label: '현실 보너스', value: '7' },
    ];
    const tags: { label: string; color: BadgeColor }[] = [
        { label: `Authority NFT ${totalNft}개`, color: 'nft' },
        { label: `RWA NFT ${storeCount}종 확인`, color: 'yield' },
        { label: milestone.band, color: 'special' },
        { label: 'SNS 팔로워 3,200', color: 'tier' },
    ];
    return (
        <div style={{
            padding: '20px 24px', borderRadius: 20, marginBottom: 16,
            background: 'radial-gradient(circle at top right, rgba(98,228,211,0.10), transparent 38%), linear-gradient(135deg, rgba(7,17,24,0.96), rgba(13,25,37,0.92))',
            border: '1px solid rgba(98,228,211,0.16)',
            backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.28)',
        }}>
            {/* Top row: address + authority + disconnect */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: mcn, boxShadow: '0 0 8px rgba(98,228,211,0.7)', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: mcn, fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                            {shortAddr(address)}
                        </span>
                    </div>
                    <div style={{ fontSize: 12, color: dimText }}>
                        프로젝트 홀더 · 권위 게이지 Tier 3 · 홀더 인증 완료
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    {/* Authority score */}
                    <div style={{
                        padding: '8px 14px', borderRadius: 12,
                        background: 'rgba(98,228,211,0.08)', border: '1px solid rgba(98,228,211,0.18)',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 10, color: mcn, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Authority</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: paper }}>Tier 3 · 56점</div>
                    </div>
                    <button
                        onClick={onDisconnect}
                        style={{
                            padding: '8px 16px', borderRadius: 10, border: `1px solid ${line}`,
                            background: 'rgba(255,255,255,0.04)', color: dimText,
                            fontSize: 12, cursor: 'pointer',
                        }}
                    >
                        연결 해제
                    </button>
                </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                {stats.map(({ label, value }) => (
                    <div key={label} style={{
                        flex: 1, padding: '10px 12px', borderRadius: 12, textAlign: 'center',
                        border: `1px solid ${line}`, background: 'rgba(255,255,255,0.03)',
                    }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: paper, lineHeight: 1 }}>{value}</div>
                        <div style={{ fontSize: 10, color: mutedText, marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Tags row */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {tags.map(({ label, color }) => (
                    <Badge key={label} color={color}>{label}</Badge>
                ))}
            </div>
        </div>
    );
}

// ── Tab navigation ────────────────────────────────────────────────────────────
type TabKey = 'project' | 'activity' | 'reward' | 'ops';

const TABS: { key: TabKey; label: string; badge?: string }[] = [
    { key: 'project',  label: '프로젝트 영역', badge: '1' },
    { key: 'activity', label: '내 활동 영역',  badge: '1' },
    { key: 'reward',   label: '보상' },
    { key: 'ops',      label: '운영 영역',     badge: '1' },
];

function TabNav({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
    return (
        <div style={{
            display: 'flex', gap: 4, marginBottom: 16,
            padding: '6px', borderRadius: 16,
            background: 'rgba(7,17,24,0.7)', border: `1px solid ${line}`,
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        }}>
            {TABS.map(tab => {
                const isActive = tab.key === active;
                return (
                    <button
                        key={tab.key}
                        onClick={() => onChange(tab.key)}
                        style={{
                            flex: 1, padding: '10px 8px', borderRadius: 10, border: 'none',
                            background: isActive ? 'rgba(98,228,211,0.12)' : 'transparent',
                            color: isActive ? mcn : dimText,
                            fontSize: 13, fontWeight: isActive ? 600 : 400,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            boxShadow: isActive ? `inset 0 0 0 1px rgba(98,228,211,0.22)` : 'none',
                        }}
                    >
                        {tab.label}
                        {tab.badge && (
                            <span style={{
                                minWidth: 18, height: 18, borderRadius: 999,
                                background: isActive ? mcn : 'rgba(255,255,255,0.1)',
                                color: isActive ? '#0a1520' : dimText,
                                fontSize: 10, fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: '0 5px',
                            }}>
                                {tab.badge}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}


// ── Activity tab — status helpers ────────────────────────────────────────────
type TrafficLight = 'approved' | 'pending' | 'rejected';

const LIGHT_META: Record<TrafficLight, { label: string; color: string; bg: string; border: string }> = {
    approved: { label: '승인',    color: '#4ade80', bg: 'rgba(74,222,128,0.10)',   border: 'rgba(74,222,128,0.22)'   },
    pending:  { label: '검수 중', color: '#facc15', bg: 'rgba(250,204,21,0.10)',   border: 'rgba(250,204,21,0.22)'   },
    rejected: { label: '반려',    color: '#f87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.22)'  },
};

const CATEGORY_COLOR: Record<string, { color: string; bg: string; border: string }> = {
    MCN:   { color: mcn,      bg: 'rgba(98,228,211,0.10)',  border: 'rgba(98,228,211,0.20)'  },
    아레나: { color: arena,    bg: 'rgba(255,184,77,0.10)',  border: 'rgba(255,184,77,0.20)'  },
    NFT:   { color: exchange,  bg: 'rgba(110,178,255,0.10)', border: 'rgba(110,178,255,0.20)' },
};

// ── Activity: Monthly summary card ────────────────────────────────────────────
function ActivitySummary({ submissions, monthlyTarget }: {
    submissions: MissionSubmission[];
    monthlyTarget: number;
}) {
    const now        = new Date();
    const thisMonth  = submissions.filter(s => {
        const d = new Date(s.submittedAt);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const green   = thisMonth.filter(s => s.status === 'approved').length;
    const yellow  = thisMonth.filter(s => s.status === 'pending').length;
    const red     = thisMonth.filter(s => s.status === 'rejected').length;
    const expTotal = thisMonth.reduce((s, m) => s + (m.expReward ?? 0), 0);
    const pct     = monthlyTarget > 0 ? Math.min(Math.round((green / monthlyTarget) * 100), 100) : 0;

    const lights = [
        { label: '초록 (승인)',  count: green,  color: '#4ade80', bg: 'rgba(74,222,128,0.10)',   border: 'rgba(74,222,128,0.22)'  },
        { label: '노랑 (검수중)', count: yellow, color: '#facc15', bg: 'rgba(250,204,21,0.10)',   border: 'rgba(250,204,21,0.22)'  },
        { label: '빨강 (반려)',  count: red,    color: '#f87171', bg: 'rgba(248,113,113,0.10)',  border: 'rgba(248,113,113,0.22)' },
    ];

    return (
        <Board>
            <OverviewHeader
                eyebrow="MCN Mission Activity"
                title="이번 달 미션 현황"
                desc="NFT 보유량에 따라 매월 자동 계산된 목표 횟수입니다. AI 신호등 초록불 통과분만 EXP로 적립됩니다."
                badge={<Badge color="special">기본 {monthlyTarget}회 목표</Badge>}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 22 }}>
                {[
                    { label: '이번 달 목표', value: `${monthlyTarget}회` },
                    { label: '제출 완료',    value: `${thisMonth.length}회` },
                    { label: '승인 완료',    value: `${green}회` },
                    { label: '획득 EXP',     value: `+${expTotal}` },
                ].map(({ label, value }) => (
                    <OverviewItem key={label} label={label} value={value} />
                ))}
            </div>

            <div style={{ display: 'grid', gap: 7, marginBottom: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: mutedText }}>
                    <span>이번 달 승인 진행률</span>
                    <span>{green} / {monthlyTarget} ({pct}%)</span>
                </div>
                <div style={{ position: 'relative', height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', width: `${pct}%`, borderRadius: 'inherit',
                        background: 'linear-gradient(90deg, #4ade80, #86efac)',
                        boxShadow: '0 0 16px rgba(74,222,128,0.25)',
                        transition: 'width 0.4s ease',
                    }} />
                </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {lights.map(({ label, count, color, bg, border }) => (
                    <div key={label} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 16px', borderRadius: 999,
                        background: bg, border: `1px solid ${border}`,
                    }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
                        <span style={{ fontSize: 12, color, fontWeight: 600 }}>{label}</span>
                        <span style={{ fontSize: 13, color, fontWeight: 700, minWidth: 18, textAlign: 'center' }}>{count}</span>
                    </div>
                ))}
            </div>
        </Board>
    );
}

// ── Activity: Mission history list ────────────────────────────────────────────
function MissionHistory({ submissions }: { submissions: MissionSubmission[] }) {
    return (
        <Board>
            <OverviewHeader
                eyebrow="Mission History"
                title="미션 제출 내역"
                desc="제출된 미션은 AI 신호등이 자동 검수합니다. 초록불만 EXP 및 보상 적립 대상입니다."
                badge={<Badge color="yield">총 {submissions.length}건</Badge>}
            />

            {submissions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: mutedText, fontSize: 14 }}>
                    제출 내역이 없습니다.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                    {submissions.map(m => {
                        const meta = LIGHT_META[m.status] ?? LIGHT_META['pending'];
                        return (
                            <div key={m.submissionId} style={{
                                display: 'grid', gridTemplateColumns: '1fr auto',
                                alignItems: 'center', gap: 16,
                                padding: '16px 18px', borderRadius: 16,
                                border: `1px solid ${meta.border}`,
                                background: meta.bg,
                            }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{
                                            width: 9, height: 9, borderRadius: '50%', background: meta.color,
                                            boxShadow: `0 0 7px ${meta.color}`, flexShrink: 0,
                                        }} />
                                        <span style={{ fontSize: 14, fontWeight: 600, color: paper }}>{m.title}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 17, flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 12, color: mutedText }}>{m.storeName}</span>
                                        <span style={{ fontSize: 11, color: mutedText, opacity: 0.7 }}>·</span>
                                        <span style={{ fontSize: 12, color: mutedText }}>{m.submittedAt}</span>
                                        {m.rejectReason && (
                                            <>
                                                <span style={{ fontSize: 11, color: mutedText, opacity: 0.7 }}>·</span>
                                                <span style={{ fontSize: 12, color: '#f87171' }}>{m.rejectReason}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                    {m.expReward !== null && (
                                        <span style={{
                                            fontSize: 12, fontWeight: 700, color: mcn,
                                            padding: '3px 10px', borderRadius: 999,
                                            background: 'rgba(98,228,211,0.10)', border: '1px solid rgba(98,228,211,0.20)',
                                        }}>
                                            +{m.expReward} EXP
                                        </span>
                                    )}
                                    <span style={{
                                        fontSize: 12, fontWeight: 600, color: meta.color,
                                        padding: '4px 12px', borderRadius: 999,
                                        background: 'rgba(0,0,0,0.2)', border: `1px solid ${meta.border}`,
                                    }}>
                                        {meta.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Board>
    );
}

// ── Activity: EXP history ─────────────────────────────────────────────────────
function ExpHistory({ expLog }: { expLog: ExpLogEntry[] }) {
    const total = expLog.reduce((s, e) => s + e.amount, 0);
    return (
        <Board>
            <OverviewHeader
                eyebrow="Authority EXP Log"
                title="EXP 적립 내역"
                desc="모든 활동에서 발생한 Authority EXP 항목입니다. MCN 미션 초록불 통과 시 EXP-12가 적립됩니다."
                badge={<Badge color="tier">누적 +{total} EXP</Badge>}
            />

            {expLog.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: mutedText, fontSize: 14 }}>
                    EXP 내역이 없습니다.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                    {expLog.map(e => {
                        const cat = CATEGORY_COLOR[e.category] ?? CATEGORY_COLOR['MCN'];
                        return (
                            <div key={e.expId} style={{
                                display: 'grid', gridTemplateColumns: 'auto 1fr auto auto',
                                alignItems: 'center', gap: 14,
                                padding: '13px 16px', borderRadius: 14,
                                border: `1px solid ${line}`, background: 'rgba(255,255,255,0.025)',
                            }}>
                                <span style={{
                                    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                                    padding: '3px 9px', borderRadius: 999,
                                    background: cat.bg, color: cat.color, border: `1px solid ${cat.border}`,
                                    flexShrink: 0,
                                }}>
                                    {e.category}
                                </span>
                                <div>
                                    <div style={{ fontSize: 13, color: paper, fontWeight: 500 }}>{e.name}</div>
                                    <div style={{ fontSize: 11, color: mutedText, marginTop: 1 }}>{e.expCode}</div>
                                </div>
                                <span style={{ fontSize: 11, color: mutedText, flexShrink: 0 }}>{e.earnedAt}</span>
                                <span style={{ fontSize: 14, fontWeight: 700, color: mcn, flexShrink: 0, minWidth: 50, textAlign: 'right' }}>
                                    +{e.amount}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </Board>
    );
}

// ── Section: My Store Dashboard ───────────────────────────────────────────────
function StoreDashboard({ address, stores }: { address: string; stores: DashboardStore[] }) {
    const totalNft   = stores.reduce((s, st) => s + parseInt(st.balance || '0'), 0);
    const firstStore = stores[0];
    return (
        <Board>
            <OverviewHeader
                eyebrow="My Store Dashboard"
                title="매장 인벤토리"
                desc="보유한 NFT에 따라 활성화된 매장 카드만 보이며, 카드를 클릭하면 해당 매장의 맞춤형 미션 공지로 이동합니다."
                badge={<Badge color="yield">활성 매장 {stores.length}개</Badge>}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                <OverviewItem label="스캔된 지갑"  value={shortAddr(address)} />
                <OverviewItem label="총 보유 수량" value={`${totalNft}개 · ${stores.length}종`} />
                <OverviewItem label="선택 매장"    value={firstStore?.storeName ?? '–'} />
                <OverviewItem label="활성 상태"    value={firstStore ? `${firstStore.tier} · 수익률 ${firstStore.rewardRate}%` : '–'} />
            </div>
        </Board>
    );
}

// ── Section: My Milestone ─────────────────────────────────────────────────────
function MyMilestone({ stores }: { stores: DashboardStore[] }) {
    const firstStore = stores[0];
    const balance    = parseInt(firstStore?.balance || '0');
    const ms         = getMilestone(balance);
    const VVIP_TARGET = 30;
    const pct         = Math.min(Math.round((balance / VVIP_TARGET) * 100), 100);

    const pills = [
        { label: '기본 미션',   value: ms.basic > 0  ? `${ms.basic}회`  : '–' },
        { label: '추가 미션',   value: ms.extra > 0  ? `${ms.extra}회`  : '없음' },
        { label: '자문 리포트', value: balance >= 20 ? '1회' : '해당 없음' },
        { label: '나머지 처리', value: ms.extra > 0  ? '압축 적용'      : '추가 없음' },
    ];

    const nextNote = ms.nextAt
        ? `다음 구간까지 ${ms.nextAt - balance}개 남음`
        : 'VVIP 최고 구간';

    return (
        <Board>
            <OverviewHeader
                eyebrow="My Milestone"
                title="마일스톤"
                desc="보유 NFT 수량에 따라 이번 달 수행해야 할 기본 미션, 추가 미션, 자문 리포트 요구량이 자동 계산됩니다."
                badge={<Badge color="special">{ms.band}</Badge>}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 22 }}>
                <OverviewItem label="적용 매장"    value={firstStore?.storeName ?? '–'} />
                <OverviewItem label="보유 수량"    value={`${balance}개`} />
                <OverviewItem label="현재 구간"    value={ms.band} />
                <OverviewItem label="이번 달 요구" value={`기본 ${ms.basic}회${ms.extra > 0 ? ` · 추가 ${ms.extra}회` : ''}`} />
                <OverviewItem label="다음 목표"    value={nextNote} />
                <OverviewItem label="정산 상태"    value={balance > 0 ? '정상 정산 가능' : '미보유'} />
            </div>

            {/* Progress bar */}
            <div style={{ display: 'grid', gap: 7, marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: mutedText }}>
                    <span>VVIP까지 {Math.max(VVIP_TARGET - balance, 0)}개 남음</span>
                    <span>{balance} / {VVIP_TARGET}</span>
                </div>
                <div style={{ position: 'relative', height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', width: `${pct}%`, borderRadius: 'inherit',
                        background: 'linear-gradient(90deg, rgba(255,184,77,0.7), rgba(255,224,130,0.95))',
                        boxShadow: '0 0 20px rgba(255,184,77,0.25)',
                    }} />
                </div>
            </div>

            {/* Milestone pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
                {pills.map(({ label, value }) => (
                    <div key={label} style={{ padding: '12px 14px', borderRadius: 14, border: `1px solid ${line}`, background: 'rgba(255,255,255,0.03)' }}>
                        <span style={{ display: 'block', marginBottom: 5, fontSize: 10, color: mutedText, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            {label}
                        </span>
                        <span style={{ fontSize: 13, lineHeight: 1.5, color: paper, fontWeight: 600 }}>
                            {value}
                        </span>
                    </div>
                ))}
            </div>
        </Board>
    );
}

// ── Section: Store Mission Panel ─────────────────────────────────────────────
const MISSION_STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
    open:    { label: '진행 중',  color: mcn,       bg: 'rgba(98,228,211,0.10)',  border: 'rgba(98,228,211,0.22)'  },
    closed:  { label: '마감',    color: mutedText,  bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.10)' },
    pending: { label: '검토 중', color: '#facc15',  bg: 'rgba(250,204,21,0.10)', border: 'rgba(250,204,21,0.22)'  },
};

function StoreMissionPanel({ store, onBack }: { store: DashboardStore; onBack: () => void }) {
    const balance = parseInt(store.balance || '0');
    const ms = getMilestone(balance);

    return (
        <div style={{ display: 'grid', gap: 16 }}>
            {/* Header bar */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 20px', borderRadius: 16,
                background: 'rgba(7,17,24,0.8)', border: `1px solid ${line}`,
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            }}>
                <button
                    onClick={onBack}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 10,
                        border: `1px solid ${line}`, background: 'rgba(255,255,255,0.05)',
                        color: dimText, fontSize: 12, cursor: 'pointer', flexShrink: 0,
                    }}
                >
                    ← 뒤로
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: paper }}>{store.storeName}</div>
                    <div style={{ fontSize: 12, color: dimText, marginTop: 2 }}>
                        보유 {balance}개 · {ms.band} · 수익률 {store.rewardRate}%
                    </div>
                </div>
                <Badge color="yield">미션 {store.missions.length}개</Badge>
            </div>

            {/* Mission list */}
            {store.missions.length === 0 ? (
                <Board>
                    <div style={{ textAlign: 'center', padding: '40px 0', color: mutedText, fontSize: 14 }}>
                        현재 활성 미션이 없습니다.
                    </div>
                </Board>
            ) : (
                <Board>
                    <OverviewHeader
                        eyebrow="Active Missions"
                        title="활성 미션 목록"
                        desc="이번 달 수행 가능한 미션입니다. 미션을 완료한 후 제출하면 AI 신호등 검수를 거쳐 EXP와 GP가 적립됩니다."
                        badge={<Badge color="nft">기본 {ms.basic}회 목표</Badge>}
                    />
                    <div style={{ display: 'grid', gap: 12 }}>
                        {store.missions.map(m => {
                            const meta = MISSION_STATUS_META[m.status] ?? MISSION_STATUS_META['open'];
                            return (
                                <div key={m.missionId} style={{
                                    padding: '20px 22px', borderRadius: 18,
                                    border: `1px solid ${meta.border}`,
                                    background: meta.bg,
                                    display: 'grid', gap: 14,
                                }}>
                                    {/* Mission header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                <span style={{
                                                    fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
                                                    padding: '2px 8px', borderRadius: 999,
                                                    background: 'rgba(255,255,255,0.06)', color: mutedText,
                                                    border: `1px solid ${line}`, flexShrink: 0,
                                                }}>
                                                    {m.missionKey}
                                                </span>
                                                <span style={{
                                                    fontSize: 11, fontWeight: 600, color: meta.color,
                                                    padding: '2px 9px', borderRadius: 999,
                                                    background: 'rgba(0,0,0,0.25)', border: `1px solid ${meta.border}`,
                                                    flexShrink: 0,
                                                }}>
                                                    {meta.label}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 15, fontWeight: 600, color: paper, marginBottom: 4 }}>
                                                {m.title}
                                            </div>
                                            {m.description && (
                                                <div style={{ fontSize: 13, color: dimText, lineHeight: 1.6 }}>
                                                    {m.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Submit button */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button
                                            disabled={m.status !== 'open'}
                                            style={{
                                                padding: '10px 22px', borderRadius: 12, border: 'none',
                                                background: m.status === 'open'
                                                    ? `linear-gradient(135deg, ${mcn}, #4ecfbf)`
                                                    : 'rgba(255,255,255,0.06)',
                                                color: m.status === 'open' ? '#0a1520' : mutedText,
                                                fontSize: 13, fontWeight: 700,
                                                cursor: m.status === 'open' ? 'pointer' : 'default',
                                                boxShadow: m.status === 'open' ? '0 4px 16px rgba(98,228,211,0.25)' : 'none',
                                            }}
                                        >
                                            {m.status === 'open' ? '미션 제출' : '제출 불가'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Board>
            )}
        </div>
    );
}

// ── Section: My Store Cards ───────────────────────────────────────────────────
function MyStoreCards({ stores, onSelectStore }: { stores: DashboardStore[]; onSelectStore: (storeId: string) => void }) {
    return (
        <Board>
            <OverviewHeader
                eyebrow="My Store Cards"
                title="매장 카드"
                desc="활성화된 매장 카드를 선택하면 해당 프로젝트 미션 공지와 제출 흐름으로 바로 이동합니다."
                badge={<Badge color="yield">카드 {stores.length}개</Badge>}
            />
            <div style={{ display: 'grid', gap: 24 }}>
                {stores.map(store => {
                    const balance = parseInt(store.balance || '0');
                    const ms      = getMilestone(balance);
                    const cardStats = [
                        { label: '보유 수량',    value: `${balance}개` },
                        { label: '적용 수익률',  value: `${store.rewardRate}%` },
                        { label: '현재 등급',    value: store.tier },
                        { label: '이번 달 요구', value: `기본 ${ms.basic}회` },
                    ];
                    return (
                        <article key={store.storeId} style={{
                            padding: 28, borderRadius: 22, cursor: 'pointer',
                            position: 'relative', overflow: 'hidden',
                            border: `1px solid ${exchange}`,
                            background: 'radial-gradient(circle at top right, rgba(98,228,211,0.18), transparent 38%), linear-gradient(180deg, rgba(11,25,34,0.98), rgba(7,17,24,0.98))',
                            boxShadow: '0 26px 72px rgba(0,0,0,0.32)',
                        }}>
                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, height: 4, borderRadius: '22px 22px 0 0',
                                background: `linear-gradient(90deg, ${arena}, ${mcn})`,
                            }} />
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.04), transparent 34%)',
                                pointerEvents: 'none',
                            }} />

                            <div style={{ fontSize: 17, fontWeight: 700, color: paper, marginBottom: 4 }}>{store.storeName}</div>
                            <div style={{ fontSize: 12, color: dimText, marginBottom: 16 }}>
                                {store.missions.length > 0
                                    ? `활성 미션 ${store.missions.length}개 · ${store.missions[0].title}`
                                    : '현재 활성 미션 없음'}
                            </div>

                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
                                <Badge color="yield">활성 카드</Badge>
                                <Badge color="nft">보유 {balance}개</Badge>
                                <Badge color="special">{ms.band}</Badge>
                                <Badge color="tier">주간 USDT 정산</Badge>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
                                {cardStats.map(({ label, value }) => (
                                    <div key={label} style={{ padding: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 14, textAlign: 'center' }}>
                                        <div style={{ fontFamily: 'monospace', fontSize: 10, color: mutedText, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                                            {label}
                                        </div>
                                        <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: paper }}>
                                            {value}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {store.missions.length > 0 && (
                                <div style={{ marginBottom: 14, display: 'grid', gap: 6 }}>
                                    {store.missions.map(m => (
                                        <div key={m.missionId} style={{
                                            padding: '8px 12px', borderRadius: 10,
                                            background: 'rgba(255,255,255,0.04)', border: `1px solid ${line}`,
                                            fontSize: 12, color: dimText,
                                        }}>
                                            {m.title}
                                            {m.description && <span style={{ marginLeft: 8, color: mutedText }}>{m.description}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={() => onSelectStore(store.storeId)}
                                style={{
                                    padding: '10px 22px', borderRadius: 14, border: 'none',
                                    background: `linear-gradient(135deg, ${exchange}, #4a8aff)`,
                                    color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                                    boxShadow: '0 4px 16px rgba(110,178,255,0.28)',
                                }}
                            >
                                이 매장 미션 보기
                            </button>

                            <div style={{ marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                                컨트랙트 {store.contractAddress.slice(0, 6)}...{store.contractAddress.slice(-4)}
                            </div>
                        </article>
                    );
                })}
            </div>
        </Board>
    );
}

// ── Reward tab ────────────────────────────────────────────────────────────────
type ConversionState = 'idle' | 'REQ' | 'LOCK' | 'DED' | 'DONE';

// ── Reward: Summary overview ──────────────────────────────────────────────────
function RewardSummary({ gpBalance, supporterCredits, rewards }: {
    gpBalance: number; supporterCredits: number; rewards: UserReward[];
}) {
    const claimReady = rewards.filter(r => r.status === 'ready').length;
    const claimReview = rewards.filter(r => r.status === 'review').length;
    return (
        <Board>
            <OverviewHeader
                eyebrow="Reward Overview"
                title="보상 현황"
                desc="미션 수행·아레나 배틀·NFT 스테이킹에서 발생한 모든 보상이 집계됩니다. GP는 PVT 또는 선불포인트로 환전할 수 있습니다."
                badge={<Badge color="special">미수령 {claimReady}건</Badge>}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
                <OverviewItem label="보유 GP"        value={gpBalance.toLocaleString()} />
                <OverviewItem label="서포터 크레딧"  value={supporterCredits.toLocaleString()} />
                <OverviewItem label="클레임 가능"    value={`${claimReady}건`} />
                <OverviewItem label="운영자 검토 중" value={`${claimReview}건`} />
            </div>
        </Board>
    );
}

// ── Reward: Pending claims list ───────────────────────────────────────────────
const CLAIM_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
    ready:   { label: '클레임 가능', color: '#4ade80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.22)'  },
    review:  { label: '검토 중',    color: '#facc15', bg: 'rgba(250,204,21,0.08)',   border: 'rgba(250,204,21,0.22)'  },
    claimed: { label: '수령 완료',  color: mutedText,  bg: 'rgba(255,255,255,0.04)', border: line                     },
};

function PendingClaims({ rewards, onClaim }: {
    rewards: UserReward[];
    onClaim: (rewardId: number, gpAmount: number | null) => void;
}) {
    const [claiming, setClaiming] = useState<number | null>(null);

    const handleClaim = async (reward: UserReward) => {
        if (claiming !== null) return;
        setClaiming(reward.rewardId);
        try {
            await apiClaimReward(reward.rewardId);
            onClaim(reward.rewardId, reward.gpAmount);
        } catch (err) {
            console.error('[claim]', err);
        } finally {
            setClaiming(null);
        }
    };

    return (
        <Board>
            <OverviewHeader
                eyebrow="Pending Claims"
                title="미수령 보상"
                desc="클레임 가능 상태인 보상을 수령하세요. NFT 변환 가능 아이템은 별도 민팅 절차가 필요합니다."
                badge={<Badge color="yield">총 {rewards.length}건</Badge>}
            />
            {rewards.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: mutedText, fontSize: 14 }}>
                    보상 내역이 없습니다.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                    {rewards.map(item => {
                        const meta = CLAIM_META[item.status] ?? CLAIM_META['review'];
                        const isClaiming = claiming === item.rewardId;
                        return (
                            <div key={item.rewardId} style={{
                                display: 'grid', gridTemplateColumns: '1fr auto',
                                alignItems: 'center', gap: 14,
                                padding: '16px 18px', borderRadius: 16,
                                border: `1px solid ${meta.border}`, background: meta.bg,
                            }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                                        <span style={{
                                            fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                                            padding: '2px 8px', borderRadius: 999,
                                            background: 'rgba(255,255,255,0.06)', color: mutedText, border: `1px solid ${line}`,
                                        }}>
                                            {item.category}
                                        </span>
                                        {item.convertibleToNft && (
                                            <span style={{
                                                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                                                background: 'rgba(110,178,255,0.12)', color: exchange,
                                                border: '1px solid rgba(110,178,255,0.22)',
                                            }}>NFT 변환 가능</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: paper, marginBottom: 3 }}>
                                        {item.name}
                                        {item.gpAmount !== null && (
                                            <span style={{ marginLeft: 8, fontSize: 13, color: arena, fontWeight: 700 }}>
                                                +{item.gpAmount.toLocaleString()} GP
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 12, color: mutedText }}>{item.source}</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                    <span style={{
                                        fontSize: 12, fontWeight: 600, color: meta.color,
                                        padding: '4px 12px', borderRadius: 999,
                                        background: 'rgba(0,0,0,0.25)', border: `1px solid ${meta.border}`,
                                    }}>
                                        {isClaiming ? '처리 중...' : meta.label}
                                    </span>
                                    {item.status === 'ready' && (
                                        <button
                                            onClick={() => handleClaim(item)}
                                            disabled={isClaiming}
                                            style={{
                                                padding: '7px 16px', borderRadius: 10, border: 'none',
                                                background: isClaiming ? 'rgba(98,228,211,0.08)' : `linear-gradient(135deg, ${mcn}, #4ecfbf)`,
                                                color: isClaiming ? mcn : '#0a1520',
                                                fontSize: 12, fontWeight: 700, cursor: isClaiming ? 'default' : 'pointer',
                                                boxShadow: isClaiming ? 'none' : '0 3px 12px rgba(98,228,211,0.25)',
                                            }}
                                        >
                                            수령
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Board>
    );
}

// ── Reward: GP conversion ─────────────────────────────────────────────────────
const CONVERSION_STEPS: ConversionState[] = ['REQ', 'LOCK', 'DED', 'DONE'];
const CONVERSION_LABELS: Record<ConversionState, string> = {
    idle: '', REQ: '요청 접수', LOCK: '잠금 처리', DED: '차감 완료', DONE: '환전 완료',
};

function GpConversion({ gpBalance, onConverted }: {
    gpBalance: number;
    onConverted: (newBalance: number) => void;
}) {
    const [state, setState] = useState<ConversionState>('idle');
    const [mode, setMode]   = useState<'pvt' | 'prepaid'>('pvt');
    const activeIdx = state === 'idle' ? -1 : CONVERSION_STEPS.indexOf(state);

    const pvtAmount     = (gpBalance * 10).toLocaleString();
    const prepaidAmount = (gpBalance * 8).toLocaleString();

    const handleConvert = async () => {
        if (state !== 'idle' || gpBalance <= 0) return;
        setState('REQ');
        try {
            setTimeout(() => setState('LOCK'), 600);
            setTimeout(() => setState('DED'),  1200);
            const result = await apiConvertGp(mode);
            setTimeout(() => {
                setState('DONE');
                onConverted(result.data.newGpBalance);
            }, 1800);
        } catch (err) {
            console.error('[gp-convert]', err);
            setState('idle');
        }
    };

    return (
        <Board>
            <OverviewHeader
                eyebrow="GP Conversion"
                title="GP 환전"
                desc="보유 GP를 PVT 코인 또는 선불포인트로 환전합니다. 환전은 REQ → LOCK → DED → DONE 4단계로 처리됩니다."
                badge={<Badge color="special">{gpBalance.toLocaleString()} GP</Badge>}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {(['pvt', 'prepaid'] as const).map(m => {
                    const isActive = mode === m;
                    return (
                        <button key={m} onClick={() => setMode(m)} style={{
                            padding: '14px 16px', borderRadius: 14, border: 'none', cursor: 'pointer',
                            background: isActive ? 'rgba(255,184,77,0.12)' : 'rgba(255,255,255,0.03)',
                            boxShadow: isActive ? 'inset 0 0 0 1px rgba(255,184,77,0.32)' : `inset 0 0 0 1px ${line}`,
                            textAlign: 'left',
                        }}>
                            <div style={{ fontSize: 11, color: isActive ? arena : mutedText, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>
                                {m === 'pvt' ? 'PVT 코인' : '선불포인트'}
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: isActive ? paper : dimText }}>
                                {m === 'pvt' ? `${pvtAmount} PVT` : `${prepaidAmount} P`}
                            </div>
                            <div style={{ fontSize: 11, color: mutedText, marginTop: 2 }}>
                                {m === 'pvt' ? '1 GP = 10 PVT' : '1 GP = 8 선불포인트'}
                            </div>
                        </button>
                    );
                })}
            </div>

            {state !== 'idle' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 20 }}>
                    {CONVERSION_STEPS.map((step, i) => {
                        const done = i < activeIdx; const active = i === activeIdx;
                        return (
                            <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < CONVERSION_STEPS.length - 1 ? 1 : 'none' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, fontWeight: 700,
                                        background: done ? mcn : active ? 'rgba(98,228,211,0.15)' : 'rgba(255,255,255,0.05)',
                                        border: active ? `1.5px solid ${mcn}` : 'none',
                                        color: done ? '#0a1520' : active ? mcn : mutedText,
                                        boxShadow: active ? '0 0 12px rgba(98,228,211,0.4)' : 'none',
                                    }}>
                                        {done ? '✓' : i + 1}
                                    </div>
                                    <span style={{ fontSize: 10, color: active ? mcn : mutedText, whiteSpace: 'nowrap' }}>
                                        {CONVERSION_LABELS[step]}
                                    </span>
                                </div>
                                {i < CONVERSION_STEPS.length - 1 && (
                                    <div style={{ flex: 1, height: 2, margin: '0 4px', marginBottom: 14, borderRadius: 999, background: done ? mcn : 'rgba(255,255,255,0.08)' }} />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <button
                onClick={handleConvert}
                disabled={state !== 'idle' || gpBalance <= 0}
                style={{
                    width: '100%', padding: '13px 16px', borderRadius: 13, border: 'none',
                    background: state === 'DONE' ? 'rgba(74,222,128,0.12)'
                        : state !== 'idle' ? 'rgba(255,184,77,0.08)'
                        : gpBalance <= 0 ? 'rgba(255,255,255,0.05)'
                        : `linear-gradient(135deg, ${arena}, #ffaa00)`,
                    color: state === 'DONE' ? '#4ade80' : state !== 'idle' ? arena : gpBalance <= 0 ? mutedText : '#0a1520',
                    fontSize: 14, fontWeight: 700, cursor: (state !== 'idle' || gpBalance <= 0) ? 'default' : 'pointer',
                    boxShadow: state !== 'idle' || gpBalance <= 0 ? 'none' : '0 4px 18px rgba(255,184,77,0.28)',
                    letterSpacing: '0.02em',
                }}
            >
                {state === 'idle'
                    ? gpBalance > 0 ? `${gpBalance.toLocaleString()} GP 환전하기` : 'GP 잔액 없음'
                    : state === 'DONE' ? '환전 완료' : '처리 중...'}
            </button>
        </Board>
    );
}

// ── Reward: Settlement history ────────────────────────────────────────────────
function SettlementHistory({ settlements }: { settlements: SettlementRecord[] }) {
    return (
        <Board>
            <OverviewHeader
                eyebrow="Settlement History"
                title="정산 내역"
                desc="MCN 미션 및 아레나 배틀 보상의 정산 이력입니다. USDT는 주간 정산 기준으로 지급됩니다."
                badge={<Badge color="tier">주간 USDT 정산</Badge>}
            />
            {settlements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: mutedText, fontSize: 14 }}>
                    정산 내역이 없습니다.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                    {settlements.map(r => {
                        const isPending   = r.status === 'pending';
                        const isUsdt      = r.currency === 'USDT';
                        const amountColor = isPending ? mutedText : isUsdt ? '#4ade80' : arena;
                        return (
                            <div key={r.settlementId} style={{
                                display: 'grid', gridTemplateColumns: '1fr auto auto',
                                alignItems: 'center', gap: 16,
                                padding: '14px 16px', borderRadius: 14,
                                border: `1px solid ${isPending ? 'rgba(250,204,21,0.18)' : line}`,
                                background: isPending ? 'rgba(250,204,21,0.05)' : 'rgba(255,255,255,0.025)',
                            }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: isPending ? dimText : paper, marginBottom: 3 }}>
                                        {r.label}
                                    </div>
                                    <div style={{ fontSize: 11, color: mutedText }}>
                                        {r.storeName} · {r.period}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: amountColor }}>
                                        {isPending ? '정산 대기' : `${r.amount} ${r.currency}`}
                                    </div>
                                    <div style={{ fontSize: 10, color: mutedText, marginTop: 2 }}>{r.currency}</div>
                                </div>
                                <span style={{
                                    fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999,
                                    background: isPending ? 'rgba(250,204,21,0.10)' : 'rgba(74,222,128,0.10)',
                                    color: isPending ? '#facc15' : '#4ade80',
                                    border: `1px solid ${isPending ? 'rgba(250,204,21,0.22)' : 'rgba(74,222,128,0.22)'}`,
                                    whiteSpace: 'nowrap',
                                }}>
                                    {isPending ? '대기' : '완료'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </Board>
    );
}

// ── Ops tab — types & mock data ───────────────────────────────────────────────
type RiskLevel = 'MONITOR' | 'WARNING' | 'HOLD' | 'FREEZE';

const RISK_META: Record<RiskLevel, { color: string; bg: string; border: string; desc: string }> = {
    MONITOR: { color: '#4ade80', bg: 'rgba(74,222,128,0.08)',   border: 'rgba(74,222,128,0.22)',  desc: '정상 범위 · 모니터링 중' },
    WARNING: { color: '#facc15', bg: 'rgba(250,204,21,0.08)',   border: 'rgba(250,204,21,0.22)',  desc: '경고 · 활동 패턴 검토 중' },
    HOLD:    { color: arena,     bg: 'rgba(255,184,77,0.08)',   border: 'rgba(255,184,77,0.22)',  desc: '보류 · 운영자 확인 필요' },
    FREEZE:  { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.22)', desc: '계정 동결' },
};

type GpLedgerEntry = {
    id: string;
    label: string;
    source: string;
    date: string;
    delta: number;
};

const GP_LEDGER: GpLedgerEntry[] = [
    { id: 'gp-001', label: 'MCN 미션 보상', source: '남산타워 숏폼 #2',         date: '2026-04-28', delta: +16000 },
    { id: 'gp-002', label: 'MCN 미션 보상', source: '남산타워 숏폼 #1',         date: '2026-04-27', delta: +16000 },
    { id: 'gp-003', label: '아레나 서포터 보상', source: '배틀 APS-240424',      date: '2026-04-24', delta: +8000  },
    { id: 'gp-004', label: 'GP → PVT 환전',  source: '환전 REQ-0421',           date: '2026-04-21', delta: -50000 },
    { id: 'gp-005', label: 'MCN 미션 보상',  source: '을지로 갈비 리뷰',         date: '2026-04-15', delta: +24000 },
];

const AUTHORITY_TIERS_OPS = [
    { name: 'Wanderer',   range: [1,19],   color: mutedText },
    { name: 'Punk',       range: [20,39],  color: mcn       },
    { name: 'Résistance', range: [40,59],  color: arena     },
    { name: 'Vanguard',   range: [60,79],  color: exchange  },
    { name: 'Cypherpunk', range: [80,100], color: '#c084fc' },
];

const WRITEBACK_PAYLOAD = {
    authorityCandidateExp: 16,
    settlementStatus: 'review',
    walletLinkedRecordReady: false,
    previewOnly: true,
};

// ── Ops: Account risk panel ───────────────────────────────────────────────────
function AccountRiskPanel() {
    const riskScore: number = 12;
    const level: RiskLevel  = 'MONITOR';
    const meta = RISK_META[level];

    const abuseChecks = [
        { label: 'Daily Cap',         status: true,  note: '일일 EXP 상한 정상' },
        { label: 'TX Hash Dedupe',    status: true,  note: '중복 트랜잭션 없음' },
        { label: 'Referral Cap',      status: true,  note: '레퍼럴 상한 정상' },
        { label: '조기 해지 패널티',  status: true,  note: '해지 이력 없음' },
    ];

    const thresholds: { range: string; level: RiskLevel; }[] = [
        { range: '0 ~ 39',  level: 'MONITOR' },
        { range: '40 ~ 64', level: 'WARNING' },
        { range: '65 ~ 79', level: 'HOLD'    },
        { range: '80+',     level: 'FREEZE'  },
    ];

    return (
        <Board>
            <OverviewHeader
                eyebrow="Account Risk"
                title="계정 리스크 등급"
                desc="어뷰징 방지 규칙 기반으로 실시간 리스크 점수가 산출됩니다. FREEZE 상태에서는 모든 정산이 중단됩니다."
                badge={
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '8px 16px', borderRadius: 12,
                        background: meta.bg, border: `1px solid ${meta.border}`,
                    }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, boxShadow: `0 0 8px ${meta.color}` }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: meta.color }}>{level}</span>
                    </span>
                }
            />

            {/* Score + desc */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 22 }}>
                <div style={{
                    width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: meta.bg, border: `2px solid ${meta.border}`,
                    boxShadow: `0 0 20px ${meta.bg}`,
                }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: meta.color, lineHeight: 1 }}>{riskScore}</span>
                    <span style={{ fontSize: 9, color: meta.color, opacity: 0.8, marginTop: 2, letterSpacing: '0.06em' }}>SCORE</span>
                </div>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: meta.color, marginBottom: 4 }}>{meta.desc}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {thresholds.map(({ range, level: lv }) => {
                            const m = RISK_META[lv];
                            const isCurrent = lv === level;
                            return (
                                <span key={lv} style={{
                                    fontSize: 11, padding: '3px 10px', borderRadius: 999,
                                    background: isCurrent ? m.bg : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${isCurrent ? m.border : line}`,
                                    color: isCurrent ? m.color : mutedText,
                                    fontWeight: isCurrent ? 700 : 400,
                                }}>
                                    {range} {lv}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Abuse prevention checks */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                {abuseChecks.map(({ label, status, note }) => (
                    <div key={label} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', borderRadius: 14,
                        border: `1px solid ${status ? 'rgba(74,222,128,0.18)' : 'rgba(248,113,113,0.18)'}`,
                        background: status ? 'rgba(74,222,128,0.05)' : 'rgba(248,113,113,0.05)',
                    }}>
                        <span style={{
                            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700,
                            background: status ? '#4ade80' : '#f87171',
                            color: '#0a1520',
                        }}>
                            {status ? '✓' : '✕'}
                        </span>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: paper }}>{label}</div>
                            <div style={{ fontSize: 11, color: mutedText }}>{note}</div>
                        </div>
                    </div>
                ))}
            </div>
        </Board>
    );
}

// ── Ops: Authority gauge panel ────────────────────────────────────────────────
function AuthorityGaugePanel() {
    const level     = 34;
    const totalExp  = 1820;
    const tierIdx   = 1;                          // Punk (0-indexed)
    const tier      = AUTHORITY_TIERS_OPS[tierIdx];
    const nextTier  = AUTHORITY_TIERS_OPS[tierIdx + 1];
    const [lo, hi]  = tier.range;
    const expToNext = nextTier ? nextTier.range[0] - level : 0;
    const pct       = Math.round(((level - lo) / (hi - lo + 1)) * 100);

    const perks = ['배틀룸 우선 노출', '수수료 감면'];

    const recentExp = [
        { code: 'EXP-04', name: 'Tori / 무기 / Oculla 구매', amount: 80,  category: 'NFT' },
        { code: 'EXP-11', name: 'Arena Support',              amount: 24,  category: '아레나' },
        { code: 'EXP-12', name: 'MCN 추가 미션 (숏폼 #2)',   amount: 12,  category: 'MCN' },
        { code: 'EXP-12', name: 'MCN 추가 미션 (숏폼 #1)',   amount: 12,  category: 'MCN' },
        { code: 'EXP-09', name: 'Arena Battle Play',          amount: 12,  category: '아레나' },
    ];

    return (
        <Board>
            <OverviewHeader
                eyebrow="Authority Gauge"
                title="PUNKVISM 권위 게이지"
                desc="17개 EXP 항목이 합산되어 레벨과 티어를 결정합니다. 티어 업시 새로운 퍽(perk)이 활성화됩니다."
                badge={<Badge color="tier">Lv.{level} · {tier.name}</Badge>}
            />

            {/* Tier progress */}
            <div style={{ marginBottom: 22 }}>
                {/* Tier track */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
                    {AUTHORITY_TIERS_OPS.map((t, i) => {
                        const isCurrent = i === tierIdx;
                        const isPast    = i < tierIdx;
                        return (
                            <div key={t.name} style={{ flex: 1, textAlign: 'center' }}>
                                <div style={{
                                    height: 6, borderRadius: 999, marginBottom: 5,
                                    background: isPast
                                        ? t.color
                                        : isCurrent
                                            ? `linear-gradient(90deg, ${t.color}, rgba(255,255,255,0.15))`
                                            : 'rgba(255,255,255,0.07)',
                                    boxShadow: isCurrent ? `0 0 10px ${t.color}60` : 'none',
                                }} />
                                <div style={{ fontSize: 9, color: isCurrent ? t.color : mutedText, fontWeight: isCurrent ? 700 : 400 }}>
                                    {t.name}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Level bar within current tier */}
                <div style={{ display: 'grid', gap: 5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: mutedText }}>
                        <span>현재 티어 내 진행률 (Lv.{lo} ~ {hi})</span>
                        <span>Lv.{level} · {pct}%</span>
                    </div>
                    <div style={{ position: 'relative', height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', width: `${pct}%`, borderRadius: 'inherit',
                            background: `linear-gradient(90deg, ${tier.color}, ${tier.color}cc)`,
                            boxShadow: `0 0 14px ${tier.color}50`,
                        }} />
                    </div>
                    {nextTier && (
                        <div style={{ fontSize: 11, color: mutedText, textAlign: 'right' }}>
                            다음 티어 {nextTier.name}까지 {expToNext} 레벨 · 총 EXP {totalExp.toLocaleString()}
                        </div>
                    )}
                </div>
            </div>

            {/* Perks + recent EXP */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20 }}>
                {/* Perks */}
                <div>
                    <div style={{ fontSize: 11, color: mutedText, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>현재 퍽</div>
                    <div style={{ display: 'grid', gap: 6 }}>
                        {perks.map(p => (
                            <div key={p} style={{
                                display: 'flex', alignItems: 'center', gap: 7,
                                padding: '7px 12px', borderRadius: 10,
                                background: 'rgba(98,228,211,0.07)', border: '1px solid rgba(98,228,211,0.15)',
                                whiteSpace: 'nowrap',
                            }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: mcn, flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: mcn }}>{p}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent EXP */}
                <div>
                    <div style={{ fontSize: 11, color: mutedText, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>최근 EXP 항목</div>
                    <div style={{ display: 'grid', gap: 5 }}>
                        {recentExp.map((e, i) => (
                            <div key={i} style={{
                                display: 'grid', gridTemplateColumns: 'auto 1fr auto',
                                alignItems: 'center', gap: 10,
                                padding: '8px 12px', borderRadius: 10,
                                border: `1px solid ${line}`, background: 'rgba(255,255,255,0.02)',
                            }}>
                                <span style={{ fontSize: 10, color: mutedText, fontFamily: 'monospace' }}>{e.code}</span>
                                <span style={{ fontSize: 12, color: dimText }}>{e.name}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: mcn }}>+{e.amount}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Board>
    );
}

// ── Ops: GP ledger panel ──────────────────────────────────────────────────────
function GpLedgerPanel() {
    let running = 240_000;
    const rows = GP_LEDGER.map(e => {
        const balance = running;
        running = running - e.delta;
        return { ...e, balance };
    });

    return (
        <Board>
            <OverviewHeader
                eyebrow="GP Ledger"
                title="GP 원장"
                desc="GP 잔액 변동 내역입니다. 미션 보상·아레나 배틀·환전이 순서대로 기록됩니다."
                badge={<Badge color="special">잔액 {(240_000).toLocaleString()} GP</Badge>}
            />

            {/* Header row */}
            <div style={{
                display: 'grid', gridTemplateColumns: '1fr auto auto auto',
                gap: 12, padding: '8px 14px',
                fontSize: 10, color: mutedText, letterSpacing: '0.07em', textTransform: 'uppercase',
                borderBottom: `1px solid ${line}`, marginBottom: 8,
            }}>
                <span>항목</span>
                <span style={{ textAlign: 'right', minWidth: 60 }}>변동</span>
                <span style={{ textAlign: 'right', minWidth: 70 }}>잔액</span>
                <span style={{ textAlign: 'right', minWidth: 70 }}>날짜</span>
            </div>

            <div style={{ display: 'grid', gap: 4 }}>
                {rows.map((e) => {
                    const isPos = e.delta > 0;
                    return (
                        <div key={e.id} style={{
                            display: 'grid', gridTemplateColumns: '1fr auto auto auto',
                            alignItems: 'center', gap: 12,
                            padding: '11px 14px', borderRadius: 12,
                            border: `1px solid ${line}`, background: 'rgba(255,255,255,0.02)',
                        }}>
                            <div>
                                <div style={{ fontSize: 13, color: paper, fontWeight: 500 }}>{e.label}</div>
                                <div style={{ fontSize: 11, color: mutedText }}>{e.source}</div>
                            </div>
                            <span style={{
                                fontSize: 13, fontWeight: 700, textAlign: 'right', minWidth: 60,
                                color: isPos ? '#4ade80' : '#f87171',
                            }}>
                                {isPos ? '+' : ''}{e.delta.toLocaleString()}
                            </span>
                            <span style={{ fontSize: 12, color: dimText, textAlign: 'right', minWidth: 70, fontFamily: 'monospace' }}>
                                {e.balance.toLocaleString()}
                            </span>
                            <span style={{ fontSize: 11, color: mutedText, textAlign: 'right', minWidth: 70 }}>{e.date}</span>
                        </div>
                    );
                })}
            </div>
        </Board>
    );
}

// ── Ops: Writeback preview panel ──────────────────────────────────────────────
function WritebackPreviewPanel() {
    const [expanded, setExpanded] = useState(false);

    const policyRules = [
        { title: 'Authority 후보 점수', note: 'EXP는 전투력과 완전히 분리됩니다. 서포터 증폭·정책 검토 후 최종 반영.' },
        { title: '서포터 분배 미리보기', note: 'GDD v2.2 워터폴: 승리 인플루언서 10% / 승리 서포터 75% / 하드비용 10% / PVT 소각 3% / 바이백 2%' },
        { title: '운영 콘솔 핸드오프', note: '반영 패킷이 운영자 검토 대기열에 등록됩니다. 실제 API 호출은 프로덕션 환경에서만 실행됩니다.' },
    ];

    return (
        <Board>
            <OverviewHeader
                eyebrow="Writeback Preview"
                title="Authority 반영 미리보기"
                desc="운영 콘솔로 전달될 Authority 페이로드와 정책 규칙입니다. previewOnly: true 상태에서는 외부 API 호출이 발생하지 않습니다."
                badge={<Badge color="yield">preview only</Badge>}
            />

            {/* Policy rules */}
            <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
                {policyRules.map(({ title, note }) => (
                    <div key={title} style={{
                        padding: '12px 16px', borderRadius: 14,
                        border: `1px solid ${line}`, background: 'rgba(255,255,255,0.025)',
                    }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: paper, marginBottom: 4 }}>{title}</div>
                        <div style={{ fontSize: 12, color: dimText, lineHeight: 1.6 }}>{note}</div>
                    </div>
                ))}
            </div>

            {/* JSON payload toggle */}
            <button
                onClick={() => setExpanded(v => !v)}
                style={{
                    width: '100%', padding: '10px 14px', borderRadius: 12,
                    border: `1px solid ${line}`, background: 'rgba(255,255,255,0.03)',
                    color: dimText, fontSize: 12, cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: expanded ? 10 : 0,
                }}
            >
                <span style={{ fontFamily: 'monospace', color: mcn }}>authorityPayload</span>
                <span style={{ fontSize: 10, color: mutedText }}>{expanded ? '▲ 접기' : '▼ 펼치기'}</span>
            </button>

            {expanded && (
                <pre style={{
                    margin: 0, padding: '14px 16px', borderRadius: 12,
                    background: 'rgba(0,0,0,0.35)', border: `1px solid ${line}`,
                    fontSize: 12, lineHeight: 1.7, color: '#a5f3fc',
                    fontFamily: 'monospace', overflowX: 'auto',
                }}>
                    {JSON.stringify(WRITEBACK_PAYLOAD, null, 2)}
                </pre>
            )}

            {/* Ops route */}
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: mutedText }}>운영 경로</span>
                <span style={{
                    fontSize: 11, fontFamily: 'monospace', color: exchange,
                    padding: '3px 10px', borderRadius: 999,
                    background: 'rgba(110,178,255,0.08)', border: '1px solid rgba(110,178,255,0.18)',
                }}>
                    /ops/arena/writeback-preview
                </span>
            </div>
        </Board>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HolderPage({ address, stores }: HolderPageProps) {
    const [activeTab, setActiveTab] = useState<TabKey>('project');
    const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

    const [submissions, setSubmissions] = useState<MissionSubmission[]>([]);
    const [expLog, setExpLog]           = useState<ExpLogEntry[]>([]);
    const [activityLoading, setActivityLoading] = useState(false);
    const [activityFetched, setActivityFetched] = useState(false);

    const [gpBalance, setGpBalance]           = useState(0);
    const [supporterCredits, setSupporterCredits] = useState(0);
    const [rewards, setRewards]               = useState<UserReward[]>([]);
    const [settlements, setSettlements]       = useState<SettlementRecord[]>([]);
    const [rewardLoading, setRewardLoading]   = useState(false);
    const [rewardFetched, setRewardFetched]   = useState(false);

    const handleTabChange = (tab: TabKey) => {
        setSelectedStoreId(null);
        setActiveTab(tab);
    };

    useEffect(() => {
        if (activeTab !== 'activity' || activityFetched) return;
        setActivityLoading(true);
        getActivity()
            .then(res => {
                setSubmissions(res.data.submissions);
                setExpLog(res.data.expLog);
                setActivityFetched(true);
            })
            .catch(err => console.error('[activity fetch]', err))
            .finally(() => setActivityLoading(false));
    }, [activeTab, activityFetched]);

    useEffect(() => {
        if (activeTab !== 'reward' || rewardFetched) return;
        setRewardLoading(true);
        getReward()
            .then(res => {
                setGpBalance(res.data.gpBalance);
                setSupporterCredits(res.data.supporterCredits);
                setRewards(res.data.rewards);
                setSettlements(res.data.settlements);
                setRewardFetched(true);
            })
            .catch(err => console.error('[reward fetch]', err))
            .finally(() => setRewardLoading(false));
    }, [activeTab, rewardFetched]);

    const handleClaim = (rewardId: number, gpAmount: number | null) => {
        setRewards(prev => prev.map(r => r.rewardId === rewardId ? { ...r, status: 'claimed' as const } : r));
        if (gpAmount) setGpBalance(prev => prev + gpAmount);
    };

    const totalNft      = stores.reduce((s, st) => s + parseInt(st.balance || '0'), 0);
    const monthlyTarget = getMilestone(totalNft).basic;

    const selectedStore = selectedStoreId ? stores.find(s => s.storeId === selectedStoreId) : null;

    return (
        <main style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'transparent', color: paper,
            overflowY: 'auto', pointerEvents: 'none',
            display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
            padding: '20px 24px 40px',
        }}>
            <div style={{ width: '100%', maxWidth: 1100, display: 'grid', gap: 0, pointerEvents: 'auto' }}>
                {/* Profile header */}
                <ProfileHeader address={address} stores={stores} />

                {/* Tab navigation */}
                <TabNav active={activeTab} onChange={handleTabChange} />

                {/* Tab content */}
                {activeTab === 'project' && (
                    selectedStore ? (
                        <StoreMissionPanel
                            store={selectedStore}
                            onBack={() => setSelectedStoreId(null)}
                        />
                    ) : (
                        <div style={{ display: 'grid', gap: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, alignItems: 'start' }}>
                                <StoreDashboard address={address} stores={stores} />
                                <MyMilestone stores={stores} />
                            </div>
                            <MyStoreCards stores={stores} onSelectStore={setSelectedStoreId} />
                        </div>
                    )
                )}
                {activeTab === 'activity' && (
                    activityLoading ? (
                        <div style={{
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            padding: '80px 0', color: mutedText, fontSize: 14,
                        }}>
                            활동 데이터 로딩 중...
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: 16 }}>
                            <ActivitySummary submissions={submissions} monthlyTarget={monthlyTarget} />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, alignItems: 'start' }}>
                                <MissionHistory submissions={submissions} />
                                <ExpHistory expLog={expLog} />
                            </div>
                        </div>
                    )
                )}
                {activeTab === 'reward' && (
                    rewardLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 0', color: mutedText, fontSize: 14 }}>
                            보상 데이터 로딩 중...
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: 16 }}>
                            <RewardSummary gpBalance={gpBalance} supporterCredits={supporterCredits} rewards={rewards} />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, alignItems: 'start' }}>
                                <div style={{ display: 'grid', gap: 16 }}>
                                    <PendingClaims rewards={rewards} onClaim={handleClaim} />
                                    <GpConversion gpBalance={gpBalance} onConverted={setGpBalance} />
                                </div>
                                <SettlementHistory settlements={settlements} />
                            </div>
                        </div>
                    )
                )}
                {activeTab === 'ops' && (
                    <div style={{ display: 'grid', gap: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, alignItems: 'start' }}>
                            <AccountRiskPanel />
                            <AuthorityGaugePanel />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, alignItems: 'start' }}>
                            <GpLedgerPanel />
                            <WritebackPreviewPanel />
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
