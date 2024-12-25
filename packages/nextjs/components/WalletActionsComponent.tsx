import React, { useState, useEffect } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { BlockedTokenContainer } from "./BlockedToken";
import deployedContracts from "~~/contracts/deployedContracts";
import { notification } from "~~/utils/scaffold-eth";

type walletActionsComponentProps = {
    address: string;
}

export const WalletActionsComponent: React.FC<walletActionsComponentProps> = ({ address }) => {
    const [tokenAddress, setTokenAddress] = useState<string>("");
    const [txHash, setTxHash] = useState<string>();
    const [isSending, setIsSending] = useState<boolean>(false);
    const nadCustodialContract = deployedContracts[31337].NadCustodial;
    const { writeContractAsync } = useWriteContract();
    const { data: isPaused } = useReadContract({
        address: address as `0x${string}`,
        abi: nadCustodialContract.abi,
        functionName: "paused",
    });
    useWaitForTransactionReceipt({
        hash: txHash as `0x${string}`
    });

    useEffect(() => {
        if (txHash) {
            notification.success("Transaction successful!");
            setTokenAddress("");
            setTxHash(undefined);
            window.location.reload();
        }
    }, [txHash]);

    const handlePauseToggle = async () => {
        if (isSending) return;
        setIsSending(true);
        try {
            const hash = await writeContractAsync({
                address: address as `0x${string}`,
                abi: nadCustodialContract.abi,
                functionName: isPaused ? "unpause" : "pause",
            });
            setTxHash(hash);
            notification.info("Transaction Submitted");
        } catch (error) {
            console.error("Failed to toggle pause:", error);
            notification.error("Failed to toggle contract state");
        } finally {
            setIsSending(false);
        }
    };

    const handleRegisterToken = async () => {
        if (!tokenAddress || isSending) return;
        setIsSending(true);
        try {
            const hash = await writeContractAsync({
                address: address as `0x${string}`,
                abi: nadCustodialContract.abi,
                functionName: "registerToken",
                args: [tokenAddress],
            });
            setTxHash(hash);
            notification.info("Transaction Submitted");
        } catch (error) {
            console.error("Failed to register token:", error);
            notification.error("Failed to register token");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col w-full md:w-auto">
            <div className="space-y-2 p-2">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Contract Status</h2>
                    <button
                        className={`btn ${isPaused ? "btn-success" : "btn-error"}`}
                        onClick={handlePauseToggle}
                        disabled={isSending}
                    >
                        {isSending ?
                            "Processing..." :
                            isPaused ? "Unpause Contract" : "Pause Contract"
                        }
                    </button>
                </div>

                <h2 className="text-xl font-bold">Blocked Tokens</h2>
                <BlockedTokenContainer height={422} walletAddress={address} />

                <h2 className="text-xl font-bold">Register Token</h2>
                <div className="form-control">
                    <input
                        type="text"
                        placeholder="0x..."
                        className="input input-bordered w-full"
                        value={tokenAddress}
                        onChange={e => setTokenAddress(e.target.value)}
                    />
                </div>
                <button
                    className="btn btn-primary w-full"
                    onClick={handleRegisterToken}
                    disabled={!tokenAddress || isSending}
                >
                    {isSending ? "Processing..." : "Register Token"}
                </button>
            </div>
        </div>
    );
}