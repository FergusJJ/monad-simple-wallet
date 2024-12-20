// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../contracts/NadCustodialFactory.sol";
import "../contracts/NadCustodial.sol";

contract NadCustodialFactoryTest is Test {
    NadCustodialFactory public factory;
    address public deployer = address(1);
    address public user1 = address(2);
    address public user2 = address(3);

    event ContractDeployed(address indexed user, address contractAddress);

    function setUp() public {
        vm.prank(deployer);
        factory = new NadCustodialFactory();
    }

    function testDeployNewContract() public {
        vm.startPrank(user1);

        address deployedAddress = factory.deployContract();

        assertNotEq(deployedAddress, address(0));
        assertEq(factory.userContracts(user1), deployedAddress);

        NadCustodial deployedContract = NadCustodial(payable(deployedAddress));
        assertEq(deployedContract.owner(), user1);

        vm.stopPrank();
    }

    function testDeployDuplicate() public {
        vm.startPrank(user1);

        factory.deployContract();
        vm.expectRevert(NadCustodialFactory.ContractAlreadyExists.selector);
        factory.deployContract();

        vm.stopPrank();
    }

    function testDeployMultipleUser() public {
        vm.prank(user1);
        address contract1 = factory.deployContract();

        vm.prank(user2);
        address contract2 = factory.deployContract();

        assertNotEq(contract1, contract2);
        assertEq(factory.userContracts(user1), contract1);
        assertEq(factory.userContracts(user2), contract2);
    }

    function testGetUserContract() public {
        vm.prank(user1);
        address deployedAddress = factory.deployContract();

        assertEq(factory.getUserContract(user1), deployedAddress);
    }

    function testGetUserContractRevertZeroAddress() public {
        vm.expectRevert(NadCustodialFactory.ZeroAddressNotAllowed.selector);
        factory.getUserContract(address(0));
    }

    function testUserNoDeploy() public view {
        assertEq(factory.userContracts(user1), address(0));
    }

    function testDeterministicDeployment() public {
        vm.prank(deployer);
        NadCustodialFactory factory1 = new NadCustodialFactory();

        vm.prank(deployer);
        NadCustodialFactory factory2 = new NadCustodialFactory();
        vm.startPrank(user1);
        address contract1 = factory1.deployContract();
        address contract2 = factory2.deployContract();
        vm.stopPrank();

        assertNotEq(contract1, contract2);
    }

    function testContractInitialState() public {
        vm.prank(user1);
        address deployedAddress = factory.deployContract();
        NadCustodial deployedContract = NadCustodial(payable(deployedAddress));
        assertEq(deployedContract.owner(), user1);
        assertTrue(!deployedContract.paused());
    }

    function testEventEmission() public {
        vm.startPrank(user1);
        vm.expectEmit(true, true, false, false);
        //don't know addr so just ignoring
        emit ContractDeployed(user1, address(0));
        factory.deployContract();
        vm.stopPrank();
    }
}
