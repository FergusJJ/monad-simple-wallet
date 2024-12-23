import { useState, useEffect } from 'react';
import { useBalance, useReadContract, useReadContracts } from 'wagmi';
import deployedContracts from "~~/contracts/deployedContracts";
import { getTokenImage, getEthPrice, getTokenPrice } from '~~/utils/nad-custodial/getToken';
import { TokenList, TokenEntry } from "~~/components/TokenEntry";
import { usePriceCache } from '~~/utils/nad-custodial/priceCache';
import { useTokenMetadataCache } from '~~/utils/nad-custodial/tokenMetadataCache';
import { readContractMetadata } from '~~/utils/nad-custodial/readContractUtil';

export type TokenBalanceProps = {
    nadCustodialAddress: string;
    listHeight: number;
    clickable: boolean;
    handleClick: (tokenSelectData: TokenSelectData) => void;
}

export type TokenSelectData = {
    name: string;
    amount: number;
    address: string;
    decimals: number;
}

type uiToken = {
    name: string;
    image: string;
    amount: number;
    dollarValue: number;
    address: string;
    decimals: number;
}

const ETHEREUM_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"

const TokenBalance: React.FC<TokenBalanceProps> = ({ 
    nadCustodialAddress, 
    listHeight, 
    clickable, 
    handleClick
}) => {
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

    const { data: tokenBalances } = useReadContracts({
        contracts: getTokenBalanceCalls ?? [],
        query: {
            enabled: Boolean(tokenAddresses?.length),
        }
    });

    const { data: ethBalance } = useBalance({
        address: nadCustodialAddress as `0x${string}`,
    });

    useEffect(() => {
        const fetchTokenData = async () => {
            if (!tokenAddresses || !tokenBalances) return;
            const tokenData: uiToken[] = [];
            
            if (ethBalance && Number(ethBalance.value) > 0) {
                const ethPrice = await getCachedPrice(
                    ETHEREUM_ADDRESS,
                    getEthPrice
                );
                tokenData.push({
                    name: 'ETH',
                    image: getTokenImage(ETHEREUM_ADDRESS),
                    amount: Number(ethBalance.value) / 10 ** ethBalance.decimals,
                    dollarValue: (Number(ethBalance.value) / 10 ** ethBalance.decimals) * ethPrice,
                    address: ETHEREUM_ADDRESS,
                    decimals: 18,
                });
            }

            for (let i = 0; i < tokenAddresses.length; i++) {
                const { name, decimals } = await getCachedMetadata(tokenAddresses[i], readContractMetadata);
                const balance = tokenBalances[i];
                const address = tokenAddresses[i];
                
                if (balance?.status === "success" && decimals && name) {
                    const tokenPrice = await getCachedPrice(address, getTokenPrice);
                    tokenData.push({
                        name: name,
                        image: getTokenImage(address),
                        amount: Number(balance.result) / (10 ** (decimals as number)),
                        dollarValue: Number(balance.result) * tokenPrice,
                        address: tokenAddresses[i],
                        decimals: decimals,
                    });
                }
            }
            setTokens(tokenData);
        };

        fetchTokenData();
    }, [tokenAddresses, ethBalance, tokenBalances]);

    return (
        <TokenList height={listHeight}>
            {tokens.map((token, i) => (
                <TokenEntry
                    key={`${token.name}-${i}`}
                    name={token.name}
                    image={token.image}
                    amount={token.amount}
                    dollarValue={token.dollarValue}
                    index={i}
                    clickable={clickable}
                    OnClick={() => {
                        handleClick({
                            name: token.name,
                            amount: token.amount,
                            address: token.address,
                            decimals: token.decimals,
                        });
                    }}
                />
            ))}
        </TokenList>
    );
};

export { TokenBalance }