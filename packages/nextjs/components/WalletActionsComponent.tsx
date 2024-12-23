type walletActionsComponentProps = {
    address: string;
}


//page to list blocked tokens/option to unblock/block them
//and allow pause/unpause of wallet
export const WalletActionsComponent: React.FC<walletActionsComponentProps> = ({ address }) => {
    return (

        <div className="flex flex-col w-full md:w-auto">
            <div className="flex flex-col w-full h-[644px] overflow-y-auto no-scrollbar">
                <div className="space-y-2 p-2">actions</div>
            </div>
        </div>
    )
}