"use client";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { Address } from "~~/components/scaffold-eth";
import { ContractDeployer } from "~~/components/ContractDeployer";
import { TokenBalance } from "~~/components/TokenBalance";
import { ActionSelector } from "~~/components/ActionSelection";
import { SendFunds } from "~~/components/SendFunds";
import { DepositFunds } from "~~/components/DepositFunds";
import { WalletActionsComponent } from "~~/components/WalletActionsComponent";

const Home: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [deployedContractAddress, setDeployedContractAddress] = useState<string>("");
  const [activePage, setActivePage] = useState<string>("home");
  const handleContractAddressChange = (address: string) => {
    setDeployedContractAddress(address);
  };
  const handleActivePageChange = (page: string) => {
    setActivePage(page);
    console.log(page);
  };

  useEffect(() => {
    if (!isConnected) {
      setDeployedContractAddress("");
    }
  }, [isConnected]);

  const renderActivePage = () => {
    switch (activePage) {
      case "home":
        return <TokenBalance nadCustodialAddress={deployedContractAddress} />;
      case "send":
        return <SendFunds />
      case "deposit":
        return <DepositFunds />
      case "actions":
        return <WalletActionsComponent />
      default:
        return <TokenBalance nadCustodialAddress={deployedContractAddress} />;
    }
  };

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div>
          <Address address={connectedAddress}></Address>
        </div>
        <div className="flex flex-row">
          <p className="">{deployedContractAddress}
          </p>
        </div>
        <div className="flex flex-col flex-grow pt-5 w-full max-w-4xl px-4">
          {renderActivePage()}
        </div>
        {
          deployedContractAddress !== "" && "0x0000000000000000000000000000000000000000" ? <ActionSelector activePage={activePage} setPage={handleActivePageChange} /> :
            <ContractDeployer deployedContractAddress={deployedContractAddress} setDeployedContractAddress={handleContractAddressChange} />
        }
      </div>
    </>
  );
};
export default Home;