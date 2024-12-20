//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../contracts/NadCustodialFactory.sol";
import "./DeployHelpers.s.sol";

contract DeployYourContract is ScaffoldETHDeploy {
    // use `deployer` from `ScaffoldETHDeploy`
    function run() external ScaffoldEthDeployerRunner {
        NadCustodialFactory nadCustodialFactory = new NadCustodialFactory();
        console.logString(
            string.concat(
                "YourContract deployed at: ",
                vm.toString(address(nadCustodialFactory))
            )
        );
        NadCustodial yourContract = new NadCustodial(msg.sender); // Deploy a test instance
        console.log(
            "Test NadCustodial deployed at: ",
            vm.toString(address(yourContract))
        );
    }
}
