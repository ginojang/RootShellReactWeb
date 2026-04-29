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

const API_BASE_URL = 'http://192.168.0.28:3000/punker/api/1.0';

export async function requestNonce(address: string): Promise<NonceResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/nonce`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
    });

    if (!res.ok) {
        throw new Error('nonce 요청 실패');
    }

    return (await res.json()) as NonceResponse;
}

export async function verifyWallet(params: {
    address: string;
    message: string;
    signature: string;
}): Promise<VerifyResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    });

    if (!res.ok) {
        throw new Error('서명 검증 실패');
    }

    return (await res.json()) as VerifyResponse;
}


export async function getDashboard(address: string) {
    const res = await fetch(
        `http://localhost:3000/punker/api/1.0/dashboard?address=${encodeURIComponent(address)}`
    );

    if (!res.ok) {
        throw new Error(`Dashboard API failed: ${res.status}`);
    }

    return res.json();
}