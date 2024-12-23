import { useEffect, useState } from "react";

export type CachedMetadata = {
    name: string;
    decimals: number;
}

type TokenMetadataCache = {
    [tokenMetadata: string]: CachedMetadata;
}

const CACHE_KEY = "token_metadata_cache";

export const useTokenMetadataCache = () => {
    const [tokenMetadataCache, setTokenMetadataCache] = useState<TokenMetadataCache>(() => {
        const cached = localStorage.getItem(CACHE_KEY);
        return cached ? JSON.parse(cached) : {};
    });
    useEffect(() => {
        localStorage.setItem(CACHE_KEY, JSON.stringify(tokenMetadataCache));
    }, [tokenMetadataCache]);

    const getCachedMetadata = async (tokenAddress: string, getMetadata: (_: string) => Promise<CachedMetadata>) => {
        const cached = tokenMetadataCache[tokenAddress];
        if (cached) {
            console.log("using cached metadata: " + cached.name);
            return cached;
        }
        const metadata = await getMetadata(tokenAddress);
        setTokenMetadataCache(old => {
            const newCache = {
                ...old, 
                [tokenAddress]: metadata
            };
            return newCache;
            
        });
        return metadata;
    };

    return { getCachedMetadata };
};

