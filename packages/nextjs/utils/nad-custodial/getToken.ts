const getTokenPrice = async (tokenAddress: string): Promise<number> => {
  try {
    //probably need to change this to get the tokens for connected network, not just ethereum
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${tokenAddress}&vs_currencies=usd`
    );
    const data = await response.json();
    return data[tokenAddress.toLowerCase()]?.usd || 0;
  } catch (error) {
    console.error('Error fetching token price:', error);
    return 0;
  }
};

const getEthPrice = async (_:string): Promise<number> => {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
    );
    const data = await response.json();
    return data.ethereum?.usd || 0;
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    return 0;
  }
};

//this only works for eth, need to find better way for testnet tokens
const getTokenImage = (tokenAddress: string): string => {
  if (!tokenAddress || tokenAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
    return 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png';
  }

  const sources = [
    `https://tokens.1inch.io/v1.1/${tokenAddress}.png`,
  ];

  return sources[0];
};

export { getTokenPrice, getEthPrice, getTokenImage };