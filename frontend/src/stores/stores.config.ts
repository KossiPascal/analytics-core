import { createJSONStorage } from "zustand/middleware";
import CryptoJS from 'crypto-js';

const SECRET = import.meta.env.VITE_APP_SECRET || 'default_secret';
export const RETRY_MILLIS = 5000;


export function encrypt(data: any): string {
    return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET).toString();
}

export function decrypt<T>(cipher: string): T | null {
    try {
        const bytes = CryptoJS.AES.decrypt(cipher, SECRET);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return (decrypted ? JSON.parse(decrypted) : null) as T;
    } catch {
        return null;
    }
}




// --- Custom Storage with encryption ---
export const encryptedStorage = createJSONStorage(() => ({
    getItem: (name: string) => {
        try {
            const encrypted = localStorage.getItem(name);
            if (!encrypted) return null;
            const bytes = CryptoJS.AES.decrypt(encrypted, SECRET);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            return decrypted ? JSON.parse(decrypted) : null;
        } catch (err) {
            console.warn(`⚠️ EncryptedStorage getItem failed for ${name}`, err);
            return null;
        }
    },

    setItem: (name: string, value: any) => {
        try {
            const encrypted = encrypt(value);
            localStorage.setItem(name, encrypted);
        } catch (err) {
            console.error(`❌ EncryptedStorage setItem failed for ${name}`, err);
        }
    },

    removeItem: (name: string) => {
        try {
            localStorage.removeItem(name);
        } catch (err) {
            console.error(`❌ EncryptedStorage removeItem failed for ${name}`, err);
        }
    },
}));


class NetworkManager {
    private online = navigator.onLine;
    private listeners = new Set<(v: boolean) => void>();

    constructor() {
        window.addEventListener('online', this.update);
        window.addEventListener('offline', this.update);
    }

    private update = () => {
        this.online = navigator.onLine;
        this.listeners.forEach(cb => cb(this.online));
    };

    isOnline() {
        return this.online;
    }

    subscribe(cb: (v: boolean) => void) {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
    }
}

export const networkManager = new NetworkManager();




interface OnlineOrOfflineProp<T> {
    online: () => Promise<T>;
    offline: () => Promise<T>;
}
export async function onlineOrOffline<T>({ online, offline }: OnlineOrOfflineProp<T>): Promise<T> {
    if (networkManager.isOnline()) {
        try {
            return await online();
        } catch (e) {
            // fallback offline si API down
            return offline();
        }
    }
    return offline();
}

