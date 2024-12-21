import { useState } from "react";

type CachedPrice = {
    price: number;
    expiry: number;
};

type PriceCache = {
    [tokenAddress: string]: CachedPrice;
};

const CACHE_DURATION = 5 * 60 * 1000;

export const usePriceCache = () => {
    const [priceCache, setPriceCache] = useState<PriceCache>({});
    const getCachedPrice = async (tokenAddress: string, fetchPrice: (_tokenAddress: string) => Promise<number>) => {
        const now = Date.now();
        const cached = priceCache[tokenAddress]
        if (cached && cached.expiry > now) {
            return cached.price;
        }
        const price = await fetchPrice(tokenAddress);
        setPriceCache(old => ({
            ...old,
            [tokenAddress]: {
                price: price,
                expiry: now + CACHE_DURATION
            }
        }));
        return price;
    };
    return { getCachedPrice };

}