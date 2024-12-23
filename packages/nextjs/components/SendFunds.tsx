import React, { useState, useEffect } from "react";
import { TokenBalance, TokenSelectData } from "./TokenBalance";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, parseUnits } from "viem";
import deployedContracts from "~~/contracts/deployedContracts";
import { notification } from "~~/utils/scaffold-eth";

type sendProps = {
    address: string;
};

const ETHEREUM_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"

export const SendFunds: React.FC<sendProps> = ({ address }) => {
    const [sendAddress, setSendAddress] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [selectedToken, setSelectedToken] = useState<TokenSelectData>();
    const [isSending, setIsSending] = useState<boolean>(false);
    const nadCustodialContract = deployedContracts[31337].NadCustodial;
    const { writeContractAsync } = useWriteContract();
    const [txHash, setTxHash] = useState<string>();

    useWaitForTransactionReceipt({ 
        hash: txHash as `0x${string}`
    });

    useEffect(() => {
        if (txHash) {
            notification.success(`Successfully ${sendAddress ? 'sent' : 'withdrew'} ${amount} ${selectedToken?.name}\ntransaction hash: ${txHash}`);
            setAmount("");
            setSendAddress("");
            setSelectedToken(undefined);
            window.location.reload();
        }
    }, [txHash]);

    const sendFunds = async () => {
        if (!selectedToken) return;
        setIsSending(true);
        try {
            const parsedAmount = selectedToken.address === ETHEREUM_ADDRESS ?
                parseEther(amount) :
                parseUnits(amount, selectedToken.decimals || 18);
            
            const [functionName, functionArgs] = sendAddress ?
                selectedToken.address === ETHEREUM_ADDRESS ?
                    ["send" as const, [sendAddress, parsedAmount] as const] :
                    ["sendToken" as const, [selectedToken.address, sendAddress, parsedAmount] as const]
                : selectedToken.address === ETHEREUM_ADDRESS ?
                    ["withdraw" as const, [parsedAmount] as const] :
                    ["withdrawToken" as const, [selectedToken.address, parsedAmount] as const];

            const hash = await writeContractAsync({
                abi: nadCustodialContract.abi,
                address: address,
                functionName: functionName,
                args: functionArgs,
            });

            setTxHash(hash as `0x${string}`);
        } catch (error) {
            console.error(error);
            notification.error("Transaction failed");
        } finally {
            setIsSending(false);
        }
    };

    const handleClick = async () => {
        try {
            await sendFunds();
        } catch (error) {
            console.error("Failed to send funds:", error);
        }
    };

    const handleSelectToken = (token: TokenSelectData) => {
        setSelectedToken(token);
    };

    return (
        <div className="flex flex-col h-screen space-y-4 p-4">
            <h2 className="text-xl font-bold">Send Funds</h2>

            <TokenBalance
                nadCustodialAddress={address}
                listHeight={422}
                clickable={true}
                handleClick={handleSelectToken}
            />

            {selectedToken && (
                <div className="flex flex-col space-y-4">
                    <div className="p-4 bg-secondary rounded-lg">
                        <span className="text-sm">{selectedToken.name} ({selectedToken.address})</span>
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Recipient Address (optional)</span>
                        </label>
                        <input
                            type="text"
                            placeholder="0x..."
                            className="input input-bordered w-full"
                            value={sendAddress}
                            onChange={e => setSendAddress(e.target.value)}
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Amount</span>
                        </label>
                        <input
                            type="number"
                            step="any"
                            min="0"
                            placeholder="0.0"
                            className={`input input-bordered w-full ${parseFloat(amount) > 0 && parseFloat(amount) > selectedToken.amount ? "border-red-500" : "border-green-500"}`}
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            style={{
                                WebkitAppearance: "none",
                                MozAppearance: "textfield"
                            }}
                        />
                    </div>

                    <button
                        className="btn btn-primary w-full"
                        onClick={handleClick}
                        disabled={!amount || parseFloat(amount) <= 0 || isSending}
                    >
                        {sendAddress ? "Send" : "Withdraw"}
                    </button>
                </div>
            )}
        </div>
    );
};