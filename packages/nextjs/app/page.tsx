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
import { WalletActivity } from "~~/components/WalletActivity";
import { fetchWalletEventsTest } from "~~/utils/nad-custodial/getEvent";

const Home: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [deployedContractAddress, setDeployedContractAddress] = useState<string>("");
  const [activePage, setActivePage] = useState<string>("home");

  const handleContractAddressChange = (address: string) => {
    setDeployedContractAddress(address);
  };

  const handleActivePageChange = (page: string) => {
    setActivePage(page);
  };

  const handleCopyAddress = async () => {
    if (deployedContractAddress) {
      await navigator.clipboard.writeText(deployedContractAddress);
    }
  };

  useEffect(() => {
    if (!isConnected) {
      setDeployedContractAddress("");
    }
  }, [isConnected]);

  const testGetEvents = async () => {
    const numBlocks = BigInt(30 * 60 * Math.floor(Math.random() * 2)+1)
    const events = await fetchWalletEventsTest(deployedContractAddress, numBlocks);
    console.log(events);
  };

  const renderActivePage = () => {
    switch (activePage) {
      case "send":
        return <SendFunds address={deployedContractAddress} />
      case "deposit":
        return <DepositFunds address={deployedContractAddress} />
      case "actions":
        return <WalletActionsComponent address={deployedContractAddress} />
      case "activity":
        return <WalletActivity address={deployedContractAddress} connectedAccount={connectedAddress === undefined ? "" : connectedAddress} />
      default:
        return <TokenBalance nadCustodialAddress={deployedContractAddress} listHeight={844} clickable={false} handleClick={() => { }} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow flex flex-col overflow-auto">
        <div className="flex items-center flex-col flex-grow pt-10">
          {deployedContractAddress && deployedContractAddress !== "0x0000000000000000000000000000000000000000" && (
            <div
              className="flex items-center gap-2 mb-4 bg-base-200 rounded-lg p-2 cursor-pointer hover:bg-base-300 transition-colors"
              onClick={handleCopyAddress}
            >
              <span className="text-sm font-medium">Your Wallet:</span>
              <Address address={deployedContractAddress} />
            </div>
          )}
          <div className="flex flex-col w-full max-w-4xl px-4 pb-20">
            {renderActivePage()}
          </div>

          {deployedContractAddress !== "" && deployedContractAddress !== "0x0000000000000000000000000000000000000000" ? (
            <></>
          ) : (
            <ContractDeployer
              deployedContractAddress={deployedContractAddress}
              setDeployedContractAddress={handleContractAddressChange}
            />
          )}

        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-base-100 ">
        <div className="max-w-4xl mx-auto">
          {deployedContractAddress !== "" && deployedContractAddress !== "0x0000000000000000000000000000000000000000" ? (
            <ActionSelector activePage={activePage} setPage={handleActivePageChange} />
          ) : (<></>)}
        </div>
      </div>
    </div>
  );
};
export default Home;