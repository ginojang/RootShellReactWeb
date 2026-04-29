const API_BASE = import.meta.env.VITE_PUNKER_API_BASE_URL;

export type NonceResponse = {
    ok: boolean;
    data: {
        nonce: string;
        message: string;
    };
};

export type VerifyResponse = {
    ok: boolean;
    data: {
        address: string;
        verified: boolean;
        token: string;
    };
};

export type DashboardMission = {
    missionId: number;
    missionKey: string;
    title: string;
    description: string | null;
    status: string;
};

export type DashboardStore = {
    storeId: string;
    storeName: string;
    contractAddress: string;
    balance: string;
    tier: string;
    rewardRate: number;
    missions: DashboardMission[];
};

export type DashboardResponse = {
    ok: boolean;
    data: {
        isHolder: boolean;
        stores: DashboardStore[];
    };
};

async function apiFetch<T>(path: string, init?: RequestInit, withAuth = false): Promise<T> {
    const headers: Record<string, string> = {
        ...(init?.headers as Record<string, string>),
    };
    if (withAuth) {
        const token = localStorage.getItem('punker_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
    const body = await res.json() as { ok: boolean; message?: string } & T;
    if (!res.ok) {
        throw new Error(body.message ?? `API 오류 (${res.status})`);
    }
    return body;
}

export function requestNonce(address: string): Promise<NonceResponse> {
    return apiFetch<NonceResponse>('/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
    });
}

export function verifyWallet(params: {
    address: string;
    message: string;
    signature: string;
}): Promise<VerifyResponse> {
    return apiFetch<VerifyResponse>('/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
}

export function getDashboard(address: string): Promise<DashboardResponse> {
    return apiFetch<DashboardResponse>(`/dashboard?address=${encodeURIComponent(address)}`, undefined, true);
}

export type MissionSubmission = {
    submissionId: number;
    missionId: number;
    title: string;
    storeName: string;
    status: 'approved' | 'pending' | 'rejected';
    rejectReason: string | null;
    expReward: number | null;
    submittedAt: string;
};

export type ExpLogEntry = {
    expId: number;
    expCode: string;
    name: string;
    amount: number;
    category: string;
    earnedAt: string;
};

export type ActivityResponse = {
    ok: boolean;
    data: {
        submissions: MissionSubmission[];
        expLog: ExpLogEntry[];
    };
};

export function getActivity(): Promise<ActivityResponse> {
    return apiFetch<ActivityResponse>('/activity', undefined, true);
}

export type UserReward = {
    rewardId: number;
    name: string;
    category: string;
    status: 'ready' | 'review' | 'claimed';
    source: string;
    gpAmount: number | null;
    convertibleToNft: boolean;
};

export type SettlementRecord = {
    settlementId: number;
    label: string;
    storeName: string;
    period: string;
    amount: string;
    currency: 'USDT' | 'GP';
    status: 'completed' | 'pending';
};

export type RewardResponse = {
    ok: boolean;
    data: {
        gpBalance: number;
        supporterCredits: number;
        rewards: UserReward[];
        settlements: SettlementRecord[];
    };
};

export type ClaimResponse = {
    ok: boolean;
    data: { rewardId: number; newGpBalance: number };
};

export type ConvertGpResponse = {
    ok: boolean;
    data: { previousGp: number; convertedAmount: number; unit: string; newGpBalance: number };
};

export function getReward(): Promise<RewardResponse> {
    return apiFetch<RewardResponse>('/reward', undefined, true);
}

export function claimReward(rewardId: number): Promise<ClaimResponse> {
    return apiFetch<ClaimResponse>(`/reward/claim/${rewardId}`, { method: 'POST' }, true);
}

export function convertGp(mode: 'pvt' | 'prepaid'): Promise<ConvertGpResponse> {
    return apiFetch<ConvertGpResponse>('/reward/gp-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
    }, true);
}