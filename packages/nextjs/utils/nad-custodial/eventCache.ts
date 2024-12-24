import { useState, useEffect } from "react";
import { fetchWalletEvents, client } from "./getEvent";
import { ActivityItem } from "./types";

type EventCache = {
    lastBlockFetched: bigint;
    expiry: number;
    walletEvents: ActivityItem[];
};

const REFETCH_DURATION = 5 * 60 * 1000;
const CACHE_KEY = "wallet_activity_cache";
const MAX_RETRIES = 10;
let currentFetchPromise: Promise<ActivityItem[]> | null = null;

export const useEventCache = () => {
    const [eventCache, setEventCache] = useState<Record<string, EventCache>>(() => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return {};

            const parsed = JSON.parse(cached, (key, value) => {
                if (key === "lastBlockFetched" || key === "blockNumber" || key === "amount" || key === "timestamp") {
                    return BigInt(value);
                }
                return value;
            });
            return parsed;
        } catch (error) {
            console.error("Error parsing cache:", error);
            return {};
        }
    });

    useEffect(() => {
        try {
            const serialized = JSON.stringify(eventCache, (_, value) => {
                if (typeof value === "bigint") {
                    return value.toString();
                }
                return value;
            });
            localStorage.setItem(CACHE_KEY, serialized);
        } catch (error) {
            console.error("Error serializing cache:", error);
        }
    }, [eventCache]);

    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const fetchWithRetry = async (operation: () => Promise<any>) => {
        let lastError;
        for (let i = 0; i < MAX_RETRIES; i++) {
            try {
                return await operation();
            } catch (error: any) {
                lastError = error;
                if (!error?.message?.includes("status of 429") &&
                    !error?.message?.includes("status of 503")) {
                    throw error;
                }
                if (i === MAX_RETRIES - 1) {
                    console.error("max retries hit");
                    throw error;
                }
                const delay = Math.min(
                    1000 * Math.pow(2, i) + Math.random() * 1000,
                    30000
                );
                console.log(`Attempt ${i + 1} failed, retrying in ${delay}ms`);
                await wait(delay);
            }
        }
        throw lastError;
    };

    const getCachedEvents = async (address: string, force: boolean = false) => {
        const now = Date.now();
        const currentCache = eventCache[address];

        if (currentCache?.expiry > now && !force) {
            console.log("using cached events");
            return currentCache.walletEvents;
        }

        if (currentFetchPromise) {
            console.log("fetch already in progress");
            return currentFetchPromise;
        }

        console.log("fetching logs");
        try {
            currentFetchPromise = (async () => {
                const toBlock = await fetchWithRetry(() => client.getBlockNumber());
                const fromBlock = (!currentCache || force || currentCache.expiry <= now)
                    ? undefined
                    : currentCache.lastBlockFetched;

                const events = await fetchWithRetry(() =>
                    fetchWalletEvents(
                        address,
                    )
                );

                const newEvents = fromBlock
                    ? [...events, ...(currentCache?.walletEvents || [])]
                    : events;

                setEventCache(prev => ({
                    ...prev,
                    [address]: {
                        lastBlockFetched: toBlock,
                        expiry: now + REFETCH_DURATION,
                        walletEvents: newEvents
                    }
                }));

                return newEvents;
            })();

            const result = await currentFetchPromise;
            return result;
        } finally {
            currentFetchPromise = null;
        }
    };
    return { getCachedEvents };
}