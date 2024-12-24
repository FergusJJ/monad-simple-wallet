import React, { useState, useEffect } from "react";
import { formatEther } from "viem";
import { useEventCache } from "~~/utils/nad-custodial/eventCache";
import { fetchWalletEvents } from "~~/utils/nad-custodial/getEvent";
import { ActivityEvent, ActivityItem } from "~~/utils/nad-custodial/types";
import { ArrowUpCircle, ArrowDownCircle, Lock, Unlock, Pause, Play } from "lucide-react";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

type activityEventProps = {
    activity: ActivityItem;
    address: string;
    connectedAccount: string;
}

type walletActivityProps = {
    address: string;
    connectedAccount: string;
};

const ActivityElement: React.FC<activityEventProps> = ({ activity, connectedAccount }) => {
    const getIcon = () => {
        switch (activity.event) {
            case ActivityEvent.EthDeposit:
            case ActivityEvent.TokenDeposit:
                return <ArrowUpCircle className="w-8 h-8 text-green-500" />;
            case ActivityEvent.EthWithdrawal:
            case ActivityEvent.TokenWithdrawal:
                return <ArrowDownCircle className="w-8 h-8 text-red-500" />;
            case ActivityEvent.ContractPaused:
                return <Pause className="w-8 h-8 text-yellow-500" />;
            case ActivityEvent.ContractUnpaused:
                return <Play className="w-8 h-8 text-green-500" />;
            case ActivityEvent.TokenBlocked:
                return <Lock className="w-8 h-8 text-red-500" />;
            case ActivityEvent.TokenUnblocked:
                return <Unlock className="w-8 h-8 text-green-500" />;
        }
    }

    const getActivityElem = () => {
        const eventName = ActivityEvent[activity.event];
        const amount = activity.data.amount ? formatEther(activity.data.amount) : undefined;
        const token = activity.data.token;
        const date = activity.timestamp
            ? new Date(Number(activity.timestamp) * 1000).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric"
            })
            : "";
        console.log("connected account: " + connectedAccount);
        console.log(`${activity.event}: ${activity.data.to} ${!!activity.data.to}`);
        switch (activity.event) {
            case ActivityEvent.EthDeposit:
                return {
                    primary: <span className="text-green-500">+{amount} ETH</span>,
                    secondary: <span>from {activity.data.from}</span>
                };
            case ActivityEvent.EthWithdrawal:
                return {
                    primary: <span className="text-red-500">-{amount} ETH</span>,
                    secondary: <span>to {activity.data.to === undefined ? connectedAccount : activity.data.to}</span>
                };
            case ActivityEvent.TokenDeposit:
                return {
                    primary: <span className="text-green-500">+{amount} {token}</span>,
                    secondary: <span>from {activity.data.from}</span>
                };
            case ActivityEvent.TokenWithdrawal:
                return {
                    primary: <span className="text-red-500">-{amount} {token}</span>,
                    secondary: <span>to {activity.data.to === undefined ? connectedAccount : activity.data.to} </span>
                };
            case ActivityEvent.ContractPaused:
            case ActivityEvent.ContractUnpaused:
                return {
                    primary: <span>{eventName}</span>,
                    secondary: <span>{date}</span>
                };
            case ActivityEvent.TokenBlocked:
                return {
                    primary: <span className="text-red-500">{token}</span>,
                    secondary: <span>Blocked</span>
                };
            case ActivityEvent.TokenUnblocked:
                return {
                    primary: <span className="text-green-500">{token}</span>,
                    secondary: <span>Unblocked</span>
                };
        }
    }

    const { primary, secondary } = getActivityElem()

    return (
        <div className="flex items-center justify-between p-4 hover:bg-secondary transition-colors">
            <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                    {getIcon()}
                </div>
                <span className="font-medium">{ActivityEvent[activity.event]}</span>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-sm font-medium">{primary}</span>
                <span className="text-xs text-gray-500">{secondary}</span>
            </div>
        </div>
    );
}

export const WalletActivity: React.FC<walletActivityProps> = ({ address, connectedAccount }) => {
    const [loading, setLoading] = useState(true);
    const { getCachedEvents } = useEventCache();
    const [events, setEvents] = useState<ActivityItem[]>([]);
    useEffect(() => {
        console.log("in useEffect, getActivities");
        const getActivities = async () => {
            const events = await getCachedEvents(address);
            setEvents(events);
            setLoading(false);
        }
        getActivities();
    }, [address]);

    if (loading) {
        return <div className="p-4 text-center">Loading activities...</div>;
    }

    if (events.length === 0) {
        return <div className="p-4 text-center">No activities found</div>;
    }

    return (
        <div className="flex flex-col divide-y">
            {events.map((activity, index) => (
                <ActivityElement
                    key={`${activity.transactionHash}-${index}`}
                    activity={activity}
                    address={address}
                    connectedAccount={connectedAccount}
                />
            ))}
        </div>
    );
};