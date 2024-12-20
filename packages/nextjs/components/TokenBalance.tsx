import { useState, useEffect } from 'react';
import { useBalance, useReadContract } from 'wagmi';
import deployedContracts from "~~/contracts/deployedContracts";
import { getTokenImage, getEthPrice, getTokenPrice } from '~~/utils/nad-custodial/getToken';
import { TokenList, TokenEntry } from "~~/components/TokenEntry";

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

    const tokenBalances = tokenAddresses?.map(tokenAddress =>
        useReadContract({
            abi: nadCustodialContract.abi,
            address: nadCustodialAddress as `0x${string}`,
            functionName: "getTokenBalance",
            args: [tokenAddress],
        })
    );

    const { data: ethBalance } = useBalance({
        address: nadCustodialAddress as `0x${string}`,
    });

    useEffect(() => {
        const fetchTokenData = async () => {
            if (!tokenAddresses || !tokenBalances) return;

            const tokenData: uiToken[] = [];

            if (ethBalance && Number(ethBalance.value) > 0) {
                const ethPrice = await getEthPrice();
                for (let i = 0; i < 20; i ++){

                tokenData.push({
                    name: 'ETH',
                    image: getTokenImage("0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"),
                    amount: Number(ethBalance.value) / 10 ** ethBalance.decimals,
                    dollarValue: (Number(ethBalance.value) / 10 ** ethBalance.decimals) * ethPrice
                });
                }
            }

            for (let i = 0; i < tokenAddresses.length; i++) {
                const balance = tokenBalances[i]?.data;
                const address = tokenAddresses[i];
                if (balance && Number(balance) > 0) {
                    const tokenPrice = await getTokenPrice(address);
                    tokenData.push({
                        name: 'Unknown',
                        image: getTokenImage(address),
                        amount: Number(balance),
                        dollarValue: Number(balance) * tokenPrice
                    });
                }
            }

            setTokens(tokenData);
        };

        fetchTokenData();
    }, [tokenAddresses, ethBalance]);

    console.log(ethBalance);
    return (
        <TokenList>
            {tokens.map((token, i) => (
                <TokenEntry
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