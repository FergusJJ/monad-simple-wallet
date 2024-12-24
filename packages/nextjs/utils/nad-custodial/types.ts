export enum ActivityEvent {
    EthDeposit,
    EthWithdrawal,
    TokenDeposit,
    TokenWithdrawal,
    ContractPaused,
    ContractUnpaused,
    TokenBlocked,
    TokenUnblocked
}

export type ActivityItem = {
    event: ActivityEvent;
    blockNumber: bigint;
    transactionHash: string;
    timestamp?: bigint;
    data: {
        amount?: bigint;
        token?: string;
        isBlocked?: boolean;
        from?: string;
        to?: string;
    };
};
