import { useState, useEffect } from 'react';
import { useBalance, useReadContract, useReadContracts } from 'wagmi';
import { erc20Abi } from 'viem';
import deployedContracts from "~~/contracts/deployedContracts";
import { getTokenImage, getEthPrice, getTokenPrice } from '~~/utils/nad-custodial/getToken';
import { TokenList, TokenEntry } from "~~/components/TokenEntry";
import { Integer } from 'type-fest';
type TokenBalanceProps = {
    nadCustodialAddress: string
}
type uiToken = {
    name: string,
    image: string,
    amount: number,
    dollarValue: number
}
export const TokenBalance: React.FC<TokenBalanceProps> = ({ nadCustodialAddress }) => {
    const [tokens, setTokens] = useState<uiToken[]>([]);
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

    const getDecimalsCalls = tokenAddresses ? tokenAddresses.map(tokenAddress => ({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "decimals",
    })) : undefined;

    const getNameCalls = tokenAddresses ? tokenAddresses.map(tokenAddress => ({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "name",
    })) : undefined;



    const { data: tokenBalances, error: tokenBalancesError } = useReadContracts({
        contracts: getTokenBalanceCalls ?? [],
        query: {
            enabled: Boolean(tokenAddresses?.length),
        }
    });

    const { data: tokenDecimals, error: tokenDecimalsError } = useReadContracts({
        contracts: getDecimalsCalls ?? [],
        query: {
            enabled: Boolean(tokenAddresses?.length),
        }
    });

    const { data: tokenNames, error: tokenNamesError } = useReadContracts({
        contracts: getNameCalls ?? [],
        query: {
            enabled: Boolean(tokenAddresses?.length),
        }
    });

    useEffect(() => {
        if (tokenBalancesError) {
            console.error("Token balances error: ", tokenBalancesError);
        }
        if (tokenDecimalsError) {
            console.error("Token decimals error: ", tokenDecimalsError);
        }
        if (tokenNamesError) {
            console.error("Token names error: ", tokenNamesError);

        }
    }, [tokenBalancesError, tokenDecimalsError, tokenNamesError]);

    const { data: ethBalance } = useBalance({
        address: nadCustodialAddress as `0x${string}`,
    });

    useEffect(() => {
        const fetchTokenData = async () => {
            if (!tokenAddresses || !tokenBalances || !tokenNames || !tokenDecimals) return;
            const tokenData: uiToken[] = [];

            // ETH Balance processing
            if (ethBalance && Number(ethBalance.value) > 0) {
                const ethPrice = await getEthPrice();
                tokenData.push({
                    name: 'ETH',
                    image: getTokenImage("0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"),
                    amount: Number(ethBalance.value) / 10 ** ethBalance.decimals,
                    dollarValue: (Number(ethBalance.value) / 10 ** ethBalance.decimals) * ethPrice
                });
            }

            //rpobably want some defautl image
            for (let i = 0; i < tokenAddresses.length; i++) {
                const balance = tokenBalances[i];
                const tokenName = tokenNames[i];
                const decimals = tokenDecimals[i];
                const address = tokenAddresses[i];
                console.log(
                    `balance${balance}\ntokenName${tokenName}\ndecimals${decimals}\naddress${address}\n`
                )
                if (balance && balance.status === "success" && decimals && decimals.status === "success" && tokenName && tokenName.status === "success") {
                    const tokenPrice = await getTokenPrice(address);
                    tokenData.push({
                        name: tokenName.result as string,
                        image: getTokenImage(address),
                        amount: Number(balance.result) / 10 ** (decimals.result as number),
                        dollarValue: Number(balance.result) * tokenPrice
                    });
                }
            }
            setTokens(tokenData);
        };

        fetchTokenData();
    }, [tokenAddresses, ethBalance, tokenBalances, tokenNames, tokenDecimals]);
    console.log(
        `tokenNames:${tokenNames}\ndecimals:${tokenDecimals}\ntokenBalances:${tokenBalances}`
    )
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