import React from 'react';

interface TokenEntryProps {
  name: string;
  image: string;
  amount: number;
  dollarValue: number;
  index: number
}

const TokenEntry: React.FC<TokenEntryProps> = ({
  name,
  image,
  amount,
  dollarValue,
  index,
}) => {
  const totalValue = (amount * dollarValue).toFixed(2);

  return (
    <div className="flex items-center justify-between p-4 hover:bg-secondary transition-colors" key={index}>
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full overflow-hidden">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{name}</span>
          <span className="text-xs opacity-60">${dollarValue.toFixed(6)}</span>
        </div>
      </div>

      <div className="flex flex-col items-end">
        <span className="text-sm font-medium">{amount.toLocaleString()}</span>
        <span className="text-xs opacity-60">${totalValue}</span>
      </div>
    </div>
  );
};

interface TokenListProps {
  children: React.ReactNode;
}

const TokenList: React.FC<TokenListProps> = ({ children }) => {
  return (
    <div className="flex flex-col w-full md:w-auto border border-secondary rounded-xl">
      <div className="flex flex-col w-full h-[644px] overflow-y-auto no-scrollbar">
        <div className="space-y-2 p-2">
          {children}
        </div>
      </div>
    </div>
  );
};

export { TokenEntry, TokenList };