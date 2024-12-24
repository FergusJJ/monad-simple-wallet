import { createPublicClient, http } from 'viem';
import { foundry, optimismSepolia } from 'viem/chains';
import deployedContracts from "~~/contracts/deployedContracts";
import { ActivityItem, ActivityEvent } from './types';

export const client = createPublicClient({
    //chain: foundry,
    chain: optimismSepolia,
    transport: http()
});


export async function fetchWalletEvents(
    address: string,
): Promise<ActivityItem[]> {
    try {
        const nadCustodialContract = deployedContracts[31337].NadCustodial;
        try {
            console.log(`getting events for address: ${address}`);
            const [
                ethDeposits,
                ethWithdrawals,
                tokenDeposits,
                tokenWithdrawals,
                contractPaused,
                contractUnpaused,
                tokenBlockStatusChanged
            ] = await Promise.all([
                client.getContractEvents({
                    address: address,
                    abi: nadCustodialContract.abi,
                    eventName: "EthDeposit",
                    //    fromBlock: fromBlock,
                    //    toBlock: toBlock,
                }),
                client.getContractEvents({
                    address: address,
                    abi: nadCustodialContract.abi,
                    eventName: "EthWithdrawal",
                    //    fromBlock: fromBlock,
                    //    toBlock: toBlock,
                }),
                client.getContractEvents({
                    address: address,
                    abi: nadCustodialContract.abi,
                    eventName: "TokenDeposit",
                    //    fromBlock: fromBlock,
                    //    toBlock: toBlock,
                }),
                client.getContractEvents({
                    address: address,
                    abi: nadCustodialContract.abi,
                    eventName: "TokenWithdrawal",
                    //    fromBlock: fromBlock,
                    //    toBlock: toBlock,
                }),
                client.getContractEvents({
                    address: address,
                    abi: nadCustodialContract.abi,
                    eventName: "ContractPaused",
                    //    fromBlock: fromBlock,
                    //    toBlock: toBlock,
                }),
                client.getContractEvents({
                    address: address,
                    abi: nadCustodialContract.abi,
                    eventName: "ContractUnpaused",
                    //    fromBlock: fromBlock,
                    //    toBlock: toBlock,
                }),
                client.getContractEvents({
                    address: address,
                    abi: nadCustodialContract.abi,
                    eventName: "TokenBlockStatusChanged",
                    //    fromBlock: fromBlock,
                    //    toBlock: toBlock,
                }),
            ]);

            console.log('Raw eth deposits response:', {
                length: ethDeposits.length,
                deposits: ethDeposits
            });

            const activities: ActivityItem[] = [];
            if (ethDeposits.length > 0) {
                activities.push(...ethDeposits.map(event => {
                    console.log('Processing event:', event);
                    return {
                        event: ActivityEvent.EthDeposit,
                        blockNumber: event.blockNumber,
                        transactionHash: event.transactionHash,
                        data: {
                            amount: event.args.amount as bigint,
                            from: event.args.sender as string,
                        }
                    };
                }));
            }

            console.log('Final activities:', activities);
            return activities;
        } catch (error) {
            console.error('Error in getContractEvents:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error fetching wallet events:', error);
        if (error instanceof Error) {
            console.error('Detailed error:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
        }
        throw error;
    }
}