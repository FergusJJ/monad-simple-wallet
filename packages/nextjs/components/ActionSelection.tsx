import { Send, Download, Wallet, Home } from 'lucide-react';

type ActionSelectorProps = {
    activePage: string,
    setPage: (page: string) => void;
}

export const ActionSelector: React.FC<ActionSelectorProps> = ({ activePage, setPage }) => {
    return (
        <div className="flex flex-row flex-grow w-full max-w-4xl px-4 divide-x divide-gray-500/20">
            <button
                onClick={() => setPage("home")}
                className="flex-1 p-4 hover:bg-secondary transition-colors flex items-center justify-center"
            >
                <Home className={activePage === "home" ? "text-purple-500 w-6 h-6" : "text-gray-500 w-6 h-6"} />
            </button>
            <button
                onClick={() => setPage("send")}
                className="flex-1 p-4 hover:bg-secondary transition-colors flex items-center justify-center"
            >
                <Send className={activePage === "send" ? "text-purple-500 w-6 h-6" : "text-gray-500 w-6 h-6"} />
            </button>
            <button
                onClick={() => setPage("deposit")}
                className="flex-1 p-4 hover:bg-secondary transition-colors flex items-center justify-center"
            >
                <Download className={activePage === "deposit" ? "text-purple-500 w-6 h-6" : "text-gray-500 w-6 h-6"} />
            </button>
            <button
                onClick={() => setPage("actions")}
                className="flex-1 p-4 hover:bg-secondary transition-colors flex items-center justify-center"
            >
                <Wallet className={activePage === "actions" ? "text-purple-500 w-6 h-6" : "text-gray-500 w-6 h-6"} />
            </button>
        </div>
    );
}