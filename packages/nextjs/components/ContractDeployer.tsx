import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";
import deployedContracts from "~~/contracts/deployedContracts";

type ContractDeployerProps = {
    deployedContractAddress: string,
    setDeployedContractAddress: (address: string) => void;
};

export const ContractDeployer: React.FC<ContractDeployerProps> = ({
    deployedContractAddress,
    setDeployedContractAddress
}) => {
    const { address: userAddress } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const [isDeploying, setIsDeploying] = useState(false);
    const factoryContract = deployedContracts[31337].NadCustodialFactory;
    const { data: existingContract, refetch: refetchContract } = useReadContract({
        abi: factoryContract.abi,
        address: factoryContract.address,
        functionName: "getUserContract",
        args: userAddress ? [userAddress] : undefined,
    });

    useEffect(() => {
        if (existingContract && existingContract !== "0x0000000000000000000000000000000000000000") {
            setDeployedContractAddress(existingContract as string);
        }
    }, [existingContract, setDeployedContractAddress]);

    const handleDeploy = async () => {
        setIsDeploying(true);
        try {
            const hash = await writeContractAsync({
                abi: factoryContract.abi,
                address: factoryContract.address,
                functionName: "deployContract",
                args: [],
            });

            notification.success("Contract deployment initiated");
            notification.info(`Transaction sent: ${hash}`);

            const pollInterval = setInterval(async () => {
                const result = await refetchContract();
                if (result.data && result.data !== "0x0000000000000000000000000000000000000000") {
                    clearInterval(pollInterval);
                    setDeployedContractAddress(result.data as string);
                    notification.success("Contract deployment completed!");
                }
            }, 2000); 

            setTimeout(() => {
                clearInterval(pollInterval);
                if (isDeploying) {
                    setIsDeploying(false);
                    notification.error("Deployment timeout - please refresh the page");
                }
            }, 120000);

        } catch (error) {
            console.error("Deployment error:", error);
            notification.error(
                "Failed to deploy contract: " +
                (error instanceof Error ? error.message : "Unknown error")
            );
            setIsDeploying(false);
        }
    };

    if (!userAddress) {
        return (
            <div className="flex justify-center">
                <div className="alert alert-warning py-3 px-4 mx-auto max-w-sm text-sm rounded-lg">
                    Please connect your wallet to deploy a contract
                </div>
            </div>
        );
    }

    if (existingContract && existingContract !== "0x0000000000000000000000000000000000000000") {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex-1 py-3">
                    <h3 className="font-bold">NadCustodialWallet Exists</h3>
                    <p>Your NadCustodialWallet is at: {deployedContractAddress}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <button
                className={`btn btn-primary ${isDeploying ? "loading" : ""}`}
                onClick={handleDeploy}
                disabled={isDeploying}
            >
                {isDeploying ? "Deploying..." : "Deploy NadCustodial Contract"}
            </button>
        </div>
    );
};