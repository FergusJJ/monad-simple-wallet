import React, { useEffect, useState } from "react";
import { TokenList } from "./TokenEntry";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import { notification } from "~~/utils/scaffold-eth";

type BlockedTokenContainerProps = {
    height: number;
    walletAddress: string;
}

type BlockedTokenProps = {
    name: string;
    address: string;
    OnClick: () => void;
}

type BlockedToken = {
    name: string;
    address: string;
}

const BlockedToken: React.FC<BlockedTokenProps> = ({
    name, OnClick
}) => {
    return (
        <div className="flex items-center justify-between p-4 hover:bg-secondary transition-colors cursor-pointer" onClick={OnClick}>
            <div className="flex items-center space-x-3">
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{name}</span>
                </div>
            </div>
        </div>
    )
}

export const BlockedTokenContainer: React.FC<BlockedTokenContainerProps> = ({ height, walletAddress }) => {
    const [blockedTokens, setBlockedTokens] = useState<BlockedToken[]>([]);
    const [tokenAddress, setTokenAddress] = useState<string>("");
    const [txHash, setTxHash] = useState<string>();
    const [isSending, setIsSending] = useState<boolean>(false);
    const nadCustodialContract = deployedContracts[11155420].NadCustodial;
    const { writeContractAsync } = useWriteContract();
    useWaitForTransactionReceipt({
        hash: txHash as `0x${string}`
    });

    useEffect(() => {
        if (txHash) {
            notification.success("Token status updated successfully!");
            setTokenAddress("");
            setTxHash(undefined);
            window.location.reload();
        }
    }, [txHash]);

    const { data: isBlocked } = useReadContract({
        address: walletAddress as `0x${string}`,
        abi: nadCustodialContract.abi,
        functionName: "isBlockedToken",
        args: tokenAddress ? [tokenAddress] : undefined,
    });

    useEffect(() => {
        setBlockedTokens([]);
        setTokenAddress("");
    }, [walletAddress]);

    const handleClick = async () => {
        if (!tokenAddress || isSending) return;
        setIsSending(true);

        try {
            const newBlockedStatus = !isBlocked;
            const hash = await writeContractAsync({
                address: walletAddress as `0x${string}`,
                abi: nadCustodialContract.abi,
                functionName: "setTokenBlocked",
                args: [tokenAddress, newBlockedStatus],
            });
            setTxHash(hash);
            notification.info("Transaction Submitted");

            if (newBlockedStatus) {
                setBlockedTokens(prev => [...prev, { name: tokenAddress, address: tokenAddress }]);
            } else {
                setBlockedTokens(prev => prev.filter(token => token.address !== tokenAddress));
            }
        } catch (error) {
            console.error("Failed to update token status:", error);
            notification.error("Failed to update token status");
        } finally {
            setIsSending(false);
        }
    };

    const tokenHandleClick = (address: string) => {
        setTokenAddress(address);
    };

    return (<>
        <TokenList height={height}>
            {blockedTokens.map((token, i) => (
                <BlockedToken
                    key={i}
                    name={token.name}
                    address={token.address}
                    OnClick={() => tokenHandleClick(token.address)}
                />
            ))}
        </TokenList>
        <div className="form-control">
            <label className="label">
                <span className="label-text">Token Address</span>
            </label>
            <input
                type="text"
                placeholder="0x..."
                className="input input-bordered w-full"
                value={tokenAddress}
                onChange={e => {
                    setTokenAddress(e.target.value);
                }}
            />
        </div>
        <button
            className="btn btn-primary w-full"
            onClick={handleClick}
            disabled={!tokenAddress || isSending}
        >
            {isSending ? "Processing..." : isBlocked ? "Unblock Token" : "Block Token"}
        </button>
    </>
    );
};