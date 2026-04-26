import type { WalletConnectResult } from './walletTypes';

export async function connectMetaMask(): Promise<WalletConnectResult> {
    if (!window.ethereum) {
        throw new Error('MetaMask가 설치되어 있지 않습니다.');
    }

    const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
    })) as string[];

    if (!accounts || accounts.length === 0) {
        throw new Error('지갑 주소를 가져오지 못했습니다.');
    }

    const chainId = (await window.ethereum.request({
        method: 'eth_chainId',
    })) as string;

    return {
        address: accounts[0],
        chainId,
    };
}