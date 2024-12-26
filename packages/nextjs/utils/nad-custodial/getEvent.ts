import { createPublicClient, http } from 'viem';
import { foundry, optimismSepolia } from 'viem/chains';
import deployedContracts from "~~/contracts/deployedContracts";
import { ActivityItem, ActivityEvent } from './types';

export const client = createPublicClient({
    //chain: foundry,
    chain: optimismSepolia,
    transport: http()
});

type fetchWalletRet = {
    items: ActivityItem[];
    mostRecentBlock: bigint;
}

export async function fetchWalletEvents(
    address: string,
    fromBlock: bigint
): Promise<fetchWalletRet> {
    try {
        const toBlock = await client.getBlockNumber();
        const fromBlock = toBlock - BigInt(60 * 30);
        const nadCustodialContract = deployedContracts[11155420].NadCustodial;
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
                fromBlock: fromBlock,
                toBlock: toBlock,
            }),
            client.getContractEvents({
                address: address,
                abi: nadCustodialContract.abi,
                eventName: "EthWithdrawal",
                fromBlock: fromBlock,
                toBlock: toBlock,
            }),
            client.getContractEvents({
                address: address,
                abi: nadCustodialContract.abi,
                eventName: "TokenDeposit",
                fromBlock: fromBlock,
                toBlock: toBlock,
            }),
            client.getContractEvents({
                address: address,
                abi: nadCustodialContract.abi,
                eventName: "TokenWithdrawal",
                fromBlock: fromBlock,
                toBlock: toBlock,
            }),
            client.getContractEvents({
                address: address,
                abi: nadCustodialContract.abi,
                eventName: "ContractPaused",
                fromBlock: fromBlock,
                toBlock: toBlock,
            }),
            client.getContractEvents({
                address: address,
                abi: nadCustodialContract.abi,
                eventName: "ContractUnpaused",
                fromBlock: fromBlock,
                toBlock: toBlock,
            }),
            client.getContractEvents({
                address: address,
                abi: nadCustodialContract.abi,
                eventName: "TokenBlockStatusChanged",
                toBlock: toBlock,
                fromBlock: fromBlock,
            }),
        ]);

        console.log('Raw eth deposits response:', {
            length: ethDeposits.length,
            deposits: ethDeposits
        });

        const activities: ActivityItem[] = [];
        activities.push(...ethDeposits.map(event => {
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
        activities.push(...ethWithdrawals.map(event => {
            return {
                event: ActivityEvent.EthWithdrawal,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                data: {
                    amount: event.args.amount as bigint,
                    recipient: event.args.recipient as string,
                }
            };
        }));
        activities.push(...tokenDeposits.map(event => {
            return {
                event: ActivityEvent.TokenDeposit,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                data: {
                    amount: event.args.amount as bigint,
                    token: event.args.token as string,
                    from: event.args.sender as string
                }
            }
        }));
        activities.push(...tokenWithdrawals.map(event => {
            return {
                event: ActivityEvent.TokenWithdrawal,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                data: {
                    amount: event.args.amount as bigint,
                    token: event.args.token as string,
                    recipient: event.args.recipient as string,
                }
            }
        }));
        activities.push(...contractPaused.map(event => {
            return {
                event: ActivityEvent.ContractPaused,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                data: {}
            }
        }));
        activities.push(...contractUnpaused.map(event => {
            return {
                event: ActivityEvent.ContractUnpaused,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                data: {}
            }
        }));
        activities.push(...tokenBlockStatusChanged.map(event => {
            return {
                event: event.args.isBlocked ? ActivityEvent.TokenBlocked : ActivityEvent.TokenUnblocked,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                data: {
                    token: event.args.token,
                    isBlocked: event.args.isBlocked
                }
            };
        }));
        console.log("activities\n------");
        console.log(activities);
        return {
            items: activities, mostRecentBlock: toBlock
        };
    } catch (error) {
        console.error('Error fetching wallet events:', error);
        if (error instanceof Error) {
            console.error("Detailed error:", {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
        }
        throw error;
    }
}

export async function fetchWalletEventsTest(address: string, numBlocks: bigint) {
    //30 blocks / min
    const toBlock = await client.getBlockNumber(); // 21713963
    const fromBlock = toBlock - numBlocks; //BigInt(30 * 60); //should get past hour
    const nadCustodialContract = deployedContracts[11155420].NadCustodial;
    //console.log(`in test: getting events for address: ${address}`);
    console.log(`block range: ${fromBlock}->${toBlock}`);
    if (fromBlock > toBlock) {
        console.log("bad block range");
        return [];
    };
    try {
        const contractCall = { address: address, abi: nadCustodialContract.abi, eventName: "EthDeposit" as "EthDeposit", fromBlock: fromBlock, toBlock: toBlock };
        //console.log(`getting event: ${JSON.stringify(contractCall, ((k, v) => {
        //    if (typeof v === "bigint") {
        //        return Number(v);
        //    }
        //    return v;
        //}))}`);
        const [ethDeposits] = await Promise.all([
            client.getContractEvents(contractCall)]);
        return ethDeposits;
    } catch (error) {
        console.log("start catch:");
        console.log("failed to get contract events");
        console.log(error);
        console.log("end catch");
    }
}
