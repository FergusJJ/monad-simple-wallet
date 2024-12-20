//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../contracts/NadCustodial.sol";
import "./DeployHelpers.s.sol";

contract DeployYourContract is ScaffoldETHDeploy {
  // use `deployer` from `ScaffoldETHDeploy`
  function run() external ScaffoldEthDeployerRunner {
    NadCustodial yourContract = new NadCustodial();
    console.logString(
      string.concat(
        "YourContract deployed at: ", vm.toString(address(yourContract))
      )
    );
  }
}