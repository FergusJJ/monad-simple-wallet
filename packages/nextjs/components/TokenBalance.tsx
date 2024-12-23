import { useState, useEffect } from 'react';
import { useBalance, useReadContract, useReadContracts } from 'wagmi';
import deployedContracts from "~~/contracts/deployedContracts";
import { getTokenImage, getEthPrice, getTokenPrice } from '~~/utils/nad-custodial/getToken';
import { TokenList, TokenEntry } from "~~/components/TokenEntry";
import { usePriceCache } from '~~/utils/nad-custodial/priceCache';
import { useTokenMetadataCache } from '~~/utils/nad-custodial/tokenMetadataCache';
import { readContractMetadata } from '~~/utils/nad-custodial/readContractUtil';

export type TokenBalanceProps = {
    nadCustodialAddress: string
}

type uiToken = {
    name: string,
    image: string,
    amount: number,
    dollarValue: number
}

const TokenBalance: React.FC<TokenBalanceProps> = ({ nadCustodialAddress }) => {
    const [tokens, setTokens] = useState<uiToken[]>([]);
    const { getCachedPrice } = usePriceCache();
    const { getCachedMetadata } = useTokenMetadataCache();
    const nadCustodialContract = deployedContracts[31337].NadCustodial;
    const { data: tokenAddresses } = useReadContract({
        abi: nadCustodialContract.abi,
        address: nadCustodialAddress as `0x${string}`,
        functionName: "getTokens",
    });

    const getTokenBalanceCalls = tokenAddresses ? tokenAddresses.map(tokenAddress => ({
        abi: nadCustodialContract.abi,
        address: nadCustodialAddress as `0x${string}`,
        functionName: "getTokenBalance",
        args: [tokenAddress],
    })) : undefined;


    const { data: tokenBalances, error: tokenBalancesError } = useReadContracts({
        contracts: getTokenBalanceCalls ?? [],
        query: {
            enabled: Boolean(tokenAddresses?.length),
        }
    });
    useEffect(() => {
        console.log("error getting token balance: " + tokenBalancesError);
    }, [tokenBalancesError]);

    const { data: ethBalance } = useBalance({
        address: nadCustodialAddress as `0x${string}`,
    });

    useEffect(() => {
        const fetchTokenData = async () => {
            if (!tokenAddresses || !tokenBalances) return;
            const tokenData: uiToken[] = [];
            if (ethBalance && Number(ethBalance.value) > 0) {
                const ethPrice = await getCachedPrice(
                    "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                    getEthPrice
                );
                tokenData.push({
                    name: 'ETH',
                    image: getTokenImage("0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"),
                    amount: Number(ethBalance.value) / 10 ** ethBalance.decimals,
                    dollarValue: (Number(ethBalance.value) / 10 ** ethBalance.decimals) * ethPrice
                });
            }

            //rpobably want some defautl image
            for (let i = 0; i < tokenAddresses.length; i++) {
                const { name, decimals } = await getCachedMetadata(tokenAddresses[i], readContractMetadata)
                const balance = tokenBalances[i];
                const address = tokenAddresses[i];
                if (balance && balance?.status === "success"
                    && decimals && name) {
                    const tokenPrice = await getCachedPrice(address, getTokenPrice);
                    tokenData.push({
                        name: name,
                        image: getTokenImage(address),
                        amount: Number(balance.result) / (10 ** (decimals as number)),
                        dollarValue: Number(balance.result) * tokenPrice
                    });
                }
            }
            setTokens(tokenData);
        };

        fetchTokenData();
    }, [tokenAddresses, ethBalance, tokenBalances]);
    return (
        <TokenList>
            {tokens.map((token, i) => (
                <TokenEntry
                    key={`${token.name}-${i}`}
                    name={token.name}
                    image={token.image}
                    amount={token.amount}
                    dollarValue={token.dollarValue}
                    index={i}
                />
            ))}
        </TokenList>
    )
};

export { TokenBalance }
