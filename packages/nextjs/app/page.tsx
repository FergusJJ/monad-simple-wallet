"use client";
import type { NextPage } from "next";
import { useAccount, useReadContract, useBalance } from "wagmi";
import { useEffect, useState } from "react";
import { Address } from "~~/components/scaffold-eth";
import { ContractDeployer } from "~~/components/ContractDeployer";
import { TokenBalance } from "~~/components/TokenBalance";
type uiToken = {
  name: string,
  image: string,
  amount: number,
  dollarValue: number
}
/*
  Probably want to make <TokenBalance> 
  a modal that can be swapped out with other utilities
  of the wallet, like a send tab etc.

 */

const Home: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [deployedContractAddress, setDeployedContractAddress] = useState<string>("");
  const handleContractAddressChange = (address: string) => {
    setDeployedContractAddress(address);
  };

  useEffect(() => {
    if (!isConnected) {
      setDeployedContractAddress("");
    }
  }, [isConnected]);

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div>
          <Address address={connectedAddress}></Address>
        </div>
        <div>
          {deployedContractAddress}
        </div>
        <div className="flex flex-col flex-grow pt-5 w-full max-w-4xl px-4">
          {/*Maybe just ternary here to decide what to render */}
          <TokenBalance nadCustodialAddress={deployedContractAddress}/>
        </div>
        <ContractDeployer deployedContractAddress={deployedContractAddress} setDeployedContractAddress={handleContractAddressChange} />
      </div>
    </>
  );
};
export default Home;