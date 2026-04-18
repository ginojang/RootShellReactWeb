// src/utils/jsonCrypto.ts

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export async function encrypt(data: Uint8Array, key8: string): Promise<Uint8Array> {
    const paddedKey = key8.padEnd(16, '0');
    const keyBytes = encoder.encode(paddedKey);
    const iv = new Uint8Array(16);

    const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-CBC' },
        false,
        ['encrypt']
    );

    const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-CBC', iv },
        cryptoKey,
        data
    );

    return new Uint8Array(encryptedBuffer);
}

export async function decrypt(data: Uint8Array, key8: string): Promise<Uint8Array> {
    const paddedKey = key8.padEnd(16, '0');
    const keyBytes = encoder.encode(paddedKey);
    const iv = new Uint8Array(16);

    const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-CBC' },
        false,
        ['decrypt']
    );

    const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-CBC', iv },
        cryptoKey,
        data
    );

    return new Uint8Array(decryptedBuffer);
}

export async function encodeJson(json: string, key8: string): Promise<string> {
    const data = encoder.encode(json);
    const encrypted = await encrypt(data, key8);
    return btoa(String.fromCharCode(...encrypted));
}

export async function decodeJson(base64: string, key8: string): Promise<string> {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const decrypted = await decrypt(bytes, key8);
    return decoder.decode(decrypted);
}
