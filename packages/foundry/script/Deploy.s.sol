// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import {NadCustodial} from "../contracts/NadCustodial.sol";

contract DeployScript is Script {
    error DeploymentFailed();

    function run() external returns (address deploymentAddress) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        try this.deploy() returns (address addr) {
            deploymentAddress = addr;
            console.log("Deployed custodial wallet: ", deploymentAddress);
        } catch Error(string memory reason) {
            console.log("Deployment failed with reason: ", reason);
            revert DeploymentFailed();
        } catch {
            console.log("Deployment failed with unknown reason");
            revert DeploymentFailed();
        }

        vm.stopBroadcast();
        return deploymentAddress;
    }

    function deploy() external returns (address) {
        NadCustodial nadCustodial = new NadCustodial();
        if (address(nadCustodial) == address(0)) revert DeploymentFailed();

        require(nadCustodial.owner() == msg.sender, "Owner not set correctly");

        return address(nadCustodial);
    }
}
