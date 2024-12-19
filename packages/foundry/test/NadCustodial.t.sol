// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../contracts/NadCustodial.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }
}

contract NadCustodialTest is Test {
    NadCustodial public nadCustodial;
    MockERC20 public mockToken;

    address public owner = address(1);
    address public user = address(2);
    address public user2 = address(3);

    function setUp() public {
        vm.prank(owner);
        nadCustodial = new NadCustodial();
        mockToken = new MockERC20("MockToken", "MOCK", 1_000_000);

        vm.deal(owner, 100 ether);
        vm.deal(user, 100 ether);
        vm.deal(user2, 100 ether);
    }

    //Function tests

    // receive
    function testReceiveEth() public {
        vm.prank(user);
        (bool success, ) = address(nadCustodial).call{value: 1 ether}("");
        assertTrue(success);
        assertEq(address(nadCustodial).balance, 1 ether);
    }

    function testReceiveZeroEth() public {
        vm.prank(user);
        (bool success, ) = address(nadCustodial).call{value: 0 ether}("");
        assertTrue(!success);
        assertEq(address(nadCustodial).balance, 0 ether);
    }

    function testReceiveEthSameUser() public {
        vm.startPrank(user);
        (bool success, ) = address(nadCustodial).call{value: 1 ether}("");
        assertTrue(success);
        assertEq(address(nadCustodial).balance, 1 ether);

        (bool success2, ) = address(nadCustodial).call{value: 1 ether}("");
        assertTrue(success2);
        assertEq(address(nadCustodial).balance, 2 ether);
        vm.stopPrank();
    }

    function testReceiveEthDifferentUser() public {
        vm.prank(user);
        (bool success, ) = address(nadCustodial).call{value: 1 ether}("");
        assertTrue(success);
        assertEq(address(nadCustodial).balance, 1 ether);

        vm.prank(user2);
        (bool success2, ) = address(nadCustodial).call{value: 2 ether}("");
        assertTrue(success2);
        assertEq(address(nadCustodial).balance, 3 ether);
    }

    function testReceiveEthPaused() public {
        vm.prank(owner);
        nadCustodial.pause();

        vm.prank(user);
        (bool success, ) = address(nadCustodial).call{value: 1 ether}("");
        assertTrue(!success);
        assertEq(address(nadCustodial).balance, 0 ether);
    }

    function testReceiveEthUnpaused() public {
        vm.startPrank(owner);
        nadCustodial.pause();
        nadCustodial.unpause();
        vm.stopPrank();

        vm.prank(user);
        (bool success, ) = address(nadCustodial).call{value: 1 ether}("");
        assertTrue(success);
        assertEq(address(nadCustodial).balance, 1 ether);
    }

    function testReceiveEthEmitEvent() public {
        vm.prank(user);
        vm.expectEmit(true, false, false, true);
        emit NadCustodial.EthDeposit(address(user), 1 ether);
        (bool success, ) = address(nadCustodial).call{value: 1 ether}("");
        assertTrue(success);
    }

    function testPauseEmitEvent() public {
        vm.prank(owner);
        vm.expectEmit();
        emit NadCustodial.ContractPaused(address(owner));
        nadCustodial.pause();
    }

    function testUnpauseEmitEvent() public {
        vm.prank(owner);
        nadCustodial.pause();

        vm.prank(owner);
        vm.expectEmit();
        emit NadCustodial.ContractUnpaused(address(owner));
        nadCustodial.unpause();
    }

    function testPauseState() public {
        vm.prank(owner);
        nadCustodial.pause();
        assertTrue(nadCustodial.paused());

        vm.prank(owner);
        nadCustodial.unpause();
        assertFalse(nadCustodial.paused());
    }
}
