import { erc20Abi, createPublicClient, http } from 'viem';
import { CachedMetadata } from './tokenMetadataCache';
import { optimismSepolia, foundry } from 'viem/chains';


const client = createPublicClient({
    chain: foundry,
    //chain: optimismSepolia,
    transport: http()
});

export const readContractMetadata = async (tokenAddress: string): Promise<CachedMetadata> => {
    console.log("fetching metadata: " + tokenAddress);
    try {
        const [name, decimals] = await Promise.all([
            client.readContract({
                abi: erc20Abi,
                address: tokenAddress as `0x${string}`,
                functionName: 'name'
            }),
            client.readContract({
                abi: erc20Abi,
                address: tokenAddress as `0x${string}`,
                functionName: 'decimals'
            })
        ]);
        console.log(name);
        console.log(decimals);
        return {
            name: name as string,
            decimals: decimals as number
        };
    } catch (error) {
        console.log(`failed to fetch metadata for ${tokenAddress}: ` + error);
        return {
            name: "UNK",
            decimals: 18
        }
    }
};