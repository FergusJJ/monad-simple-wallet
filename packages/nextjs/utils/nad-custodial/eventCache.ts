import { useState, useEffect } from "react";
import { fetchWalletEvents } from "./getEvent";
import { ActivityItem } from "./types";

type EventCache = {
    lastFetchedBlock: number;
    expiry: number;
    walletEvents: ActivityItem[];
};

const REFETCH_DURATION = 5 * 60 * 1000;
const CACHE_KEY = "wallet_activity_cache";

export const useEventCache = () => {
    const [eventCache, setEventCache] = useState<Record<string, EventCache>>(() => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return {};
            return JSON.parse(cached, (_, value) =>
                typeof value === "string" && value.includes("n") ? BigInt(value) : value
            );
        } catch (error) {
            console.error("Error parsing cache:", error);
            return {};
        }
    });

    useEffect(() => {
        try {
            const serialized = JSON.stringify(eventCache, (_, value) =>
                typeof value === "bigint" ? value.toString() : value
            );
            localStorage.setItem(CACHE_KEY, serialized);
        } catch (error) {
            console.error("Error serializing cache:", error);
        }
    }, [eventCache]);

    const getCachedEvents = async (address: string) => {
        const now = Date.now();
        const currentCache = eventCache[address];
        if (currentCache?.expiry > now) {
            console.log("using cached events");
            return currentCache.walletEvents;
        }
        console.log("fetching new events");

        const nextBlock = currentCache?.lastFetchedBlock ? BigInt(currentCache.lastFetchedBlock + 1) : BigInt(0);
        const { items, mostRecentBlock } = await fetchWalletEvents(address, nextBlock);
        const oldEvents = !!currentCache?.walletEvents ? currentCache.walletEvents : []
        console.log(`num old events: ${oldEvents.length}`);
        const newEvents = [...items, ...oldEvents].sort((a, b) =>
            Number(b.blockNumber - a.blockNumber)
        );

        setEventCache(prev => ({
            ...prev,
            [address]: {
                lastFetchedBlock: Number(mostRecentBlock),
                expiry: now + 10000,//REFETCH_DURATION,
                walletEvents: newEvents
            }
        }));

        return newEvents;
    };

    return { getCachedEvents };
}