import { useState, useEffect } from "react";

type CachedPrice = {
    price: number;
    expiry: number;
};

type PriceCache = {
    [tokenAddress: string]: CachedPrice;
};

const CACHE_DURATION = 5 * 60 * 1000;
const CACHE_KEY = "token_price_cache";

export const usePriceCache = () => {
    const [priceCache, setPriceCache] = useState<PriceCache>(() => {
        const cached = localStorage.getItem(CACHE_KEY);
        return cached ? JSON.parse(cached) : {};
    });
    useEffect(() => {
        localStorage.setItem(CACHE_KEY, JSON.stringify(priceCache));
    }, [priceCache]);

    const getCachedPrice = async (tokenAddress: string, fetchPrice: (_: string) => Promise<number>) => {
        const now = Date.now();
        const cached = priceCache[tokenAddress];
        if (cached && cached.expiry > now) {
            console.log("using cached price: " + tokenAddress);
            return cached.price;
        }
        console.log("fetching price: " + tokenAddress);
        const price = await fetchPrice(tokenAddress);
        setPriceCache(old => {
            const newCache = {
                ...old,
                [tokenAddress]: {
                    price,
                    expiry: now + CACHE_DURATION
                }
            };
            return newCache;
        });

        return price;
    };

    return { getCachedPrice };
};