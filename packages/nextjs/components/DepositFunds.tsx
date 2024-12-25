import { useState, useEffect } from "react"
import { useWriteContract, useWaitForTransactionReceipt, useSendTransaction } from "wagmi";
import { parseEther } from "viem";
import deployedContracts from "~~/contracts/deployedContracts";
import { notification } from "~~/utils/scaffold-eth";

type depositProps = {
    address: string
}

export const DepositFunds: React.FC<depositProps> = ({ address }) => {
    const [walletAddress, setWalletAddress] = useState<string>(address);
    const [tokenAddress, setTokenAddress] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [isSending, setIsSending] = useState<boolean>(false);
    const nadCustodialContract = deployedContracts[11155420].NadCustodial;
    const { writeContractAsync } = useWriteContract();
    const { sendTransactionAsync } = useSendTransaction();
    const [txHash, setTxHash] = useState<string>();

    useWaitForTransactionReceipt({
        hash: txHash as `0x${string}`
    });

    useEffect(() => {
        if (txHash) {
            notification.success(`Successfully deposited ${amount} to ${walletAddress} \ntransaction hash: ${txHash}`);
            setAmount("");
            setWalletAddress("");
            setTokenAddress("");
            window.location.reload();
        }
    }, [txHash]);

    const depositFunds = async () => {
        if (!amount || parseFloat(amount) <= 0) return;
        setIsSending(true);
        
        try {
            const parsedAmount = parseEther(amount);
            
            if (!tokenAddress) {
                const hash = await sendTransactionAsync({
                    to: walletAddress,
                    value: parsedAmount,
                });
                setTxHash(hash);
            } else {
                const hash = await writeContractAsync({
                    abi: nadCustodialContract.abi,
                    address: walletAddress,
                    functionName: "receiveToken",
                    args: [tokenAddress, parsedAmount],
                });
                setTxHash(hash as `0x${string}`);
            }
        } catch (error) {
            console.error("Failed to deposit:", error);
            notification.error("Transaction failed");
        } finally {
            setIsSending(false);
        }
    };

    const handleClick = async () => {
        try {
            await depositFunds();
        } catch (error) {
            console.error("Failed to handle deposit:", error);
        }
    };

    return (
        <div className="flex flex-col space-y-4 p-4">
            <h2 className="text-xl font-bold">Deposit Funds</h2>
            <div className="flex flex-col space-y-4">
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Wallet Address</span>
                    </label>
                    <input
                        type="text"
                        placeholder="0x..."
                        className="input input-bordered w-full"
                        value={walletAddress}
                        onChange={e => setWalletAddress(e.target.value)}
                    />
                </div>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Token Contract Address (empty for ETH)</span>
                    </label>
                    <input
                        type="text"
                        placeholder="0x..."
                        className="input input-bordered w-full"
                        value={tokenAddress}
                        onChange={e => setTokenAddress(e.target.value)}
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
                        className={`input input-bordered w-full ${
                            parseFloat(amount) <= 0 ? "border-red-500" : "border-green-500"
                        }`}
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
                    {walletAddress === address ? "Deposit to your Wallet" : "Send to External Wallet"}
                </button>
            </div>
        </div>
    );
};