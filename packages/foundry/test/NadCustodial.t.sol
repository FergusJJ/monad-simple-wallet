// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../contracts/NadCustodial.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {
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
    TestERC20 public testToken;

    address public owner = address(1);
    address public user = address(2);
    address public user2 = address(3);

    function setUp() public {
        vm.prank(owner);
        nadCustodial = new NadCustodial(owner);
        testToken = new TestERC20("TestToken", "TEST", 1_000_000);

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
        vm.expectRevert(NadCustodial.AmountZero.selector);
        address(nadCustodial).call{value: 0 ether}("");
    }

    function testReceiveEthEmitEvent() public {
        vm.prank(user);
        vm.expectEmit(true, false, false, true);
        emit NadCustodial.EthDeposit(address(user), 1 ether);
        (bool success, ) = address(nadCustodial).call{value: 1 ether}("");
        assertTrue(success);
    }

    function testWithdraw() public {
        vm.prank(user);
        (bool success, ) = address(nadCustodial).call{value: 2 ether}("");
        assertTrue(success);

        vm.prank(owner);
        nadCustodial.withdraw(1 ether);
        assertEq(address(nadCustodial).balance, 1 ether);
        assertEq(owner.balance, 101 ether);
    }

    function testWithdrawZeroAmount() public {
        vm.prank(owner);
        vm.expectRevert(NadCustodial.AmountZero.selector);
        nadCustodial.withdraw(0);
    }

    function testWithdrawInsufficientBalance() public {
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                NadCustodial.InsufficientBalance.selector,
                1 ether,
                0
            )
        );
        nadCustodial.withdraw(1 ether);
    }

    function testWithdrawEmitsEvent() public {
        vm.prank(user);
        (bool success, ) = address(nadCustodial).call{value: 1 ether}("");
        assertTrue(success);

        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit NadCustodial.EthWithdrawal(owner, 1 ether);
        nadCustodial.withdraw(1 ether);
    }

    function testSend() public {
        vm.prank(user);
        (bool success, ) = address(nadCustodial).call{value: 2 ether}("");
        assertTrue(success);

        uint256 user2Balance = user2.balance;
        vm.prank(owner);
        nadCustodial.send(user2, 1 ether);
        assertEq(address(nadCustodial).balance, 1 ether);
        assertEq(user2.balance, user2Balance + 1 ether);
    }

    function testSendZeroAmount() public {
        vm.prank(owner);
        vm.expectRevert(NadCustodial.AmountZero.selector);
        nadCustodial.send(user2, 0);
    }

    function testSendInvalidRecipient() public {
        vm.prank(owner);
        vm.expectRevert(NadCustodial.InvalidRecipient.selector);
        nadCustodial.send(address(0), 1 ether);
    }

    function testSendInsufficientBalance() public {
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                NadCustodial.InsufficientBalance.selector,
                1 ether,
                0
            )
        );
        nadCustodial.send(user2, 1 ether);
    }

    function testSendEmitsEvent() public {
        vm.prank(user);
        (bool success, ) = address(nadCustodial).call{value: 1 ether}("");
        assertTrue(success);

        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit NadCustodial.EthWithdrawal(user2, 1 ether);
        nadCustodial.send(user2, 1 ether);
    }

    function testReceiveToken() public {
        testToken.transfer(owner, 100);
        vm.prank(owner);
        testToken.approve(address(nadCustodial), 100);

        vm.prank(owner);
        nadCustodial.receiveToken(address(testToken), 100);
        assertEq(nadCustodial.getTokenBalance(address(testToken)), 100);
        assertEq(testToken.balanceOf(address(nadCustodial)), 100);
    }

    function testReceiveTokenZeroAmount() public {
        vm.prank(owner);
        vm.expectRevert(NadCustodial.AmountZero.selector);
        nadCustodial.receiveToken(address(testToken), 0);
    }

    function testReceiveBlockedToken() public {
        vm.prank(owner);
        nadCustodial.setTokenBlocked(address(testToken), true);

        vm.prank(owner);
        vm.expectRevert(NadCustodial.BlockedToken.selector);
        nadCustodial.receiveToken(address(testToken), 100);
    }

    function testReceiveTokenEmitsEvent() public {
        testToken.transfer(owner, 100);
        vm.prank(owner);
        testToken.approve(address(nadCustodial), 100);

        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit NadCustodial.TokenDeposit(owner, address(testToken), 100);
        nadCustodial.receiveToken(address(testToken), 100);
    }

    function testReceiveTokenTwice() public {
        testToken.transfer(owner, 100);
        vm.startPrank(owner);
        testToken.approve(address(nadCustodial), 100);
        nadCustodial.receiveToken(address(testToken), 50);

        nadCustodial.receiveToken(address(testToken), 50);
        vm.stopPrank();

        address[] memory tokens = nadCustodial.getTokens();
        assertEq(tokens.length, 1);
        assertEq(tokens[0], address(testToken));
        assertEq(nadCustodial.getTokenBalance(address(testToken)), 100);
    }

    function testWithdrawToken() public {
        testToken.transfer(owner, 500);
        vm.startPrank(owner);
        testToken.approve(address(nadCustodial), 500);
        nadCustodial.receiveToken(address(testToken), 500);
        vm.stopPrank();

        vm.prank(owner);
        nadCustodial.withdrawToken(address(testToken), 200);
        assertEq(nadCustodial.getTokenBalance(address(testToken)), 300);
        assertEq(testToken.balanceOf(address(nadCustodial)), 300);
        assertEq(testToken.balanceOf(owner), 200);
    }

    function testWithdrawTokenZeroAmount() public {
        vm.prank(owner);
        vm.expectRevert(NadCustodial.AmountZero.selector);
        nadCustodial.withdrawToken(address(testToken), 0);
    }

    function testWithdrawTokenInsufficientBalance() public {
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                NadCustodial.InsufficientBalance.selector,
                100,
                0
            )
        );
        nadCustodial.withdrawToken(address(testToken), 100);
    }

    function testWithdrawTokenEmitsEvent() public {
        testToken.transfer(owner, 500);
        vm.startPrank(owner);
        testToken.approve(address(nadCustodial), 500);
        nadCustodial.receiveToken(address(testToken), 500);
        vm.stopPrank();

        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit NadCustodial.TokenWithdrawal(owner, address(testToken), 200);
        nadCustodial.withdrawToken(address(testToken), 200);
    }

    function testSendToken() public {
        testToken.transfer(owner, 500);
        vm.startPrank(owner);
        testToken.approve(address(nadCustodial), 500);
        nadCustodial.receiveToken(address(testToken), 500);
        vm.stopPrank();

        vm.prank(owner);
        nadCustodial.sendToken(user2, address(testToken), 200);
        assertEq(nadCustodial.getTokenBalance(address(testToken)), 300);
        assertEq(testToken.balanceOf(address(nadCustodial)), 300);
        assertEq(testToken.balanceOf(user2), 200);
    }

    function testSendTokenZeroAmount() public {
        vm.prank(owner);
        vm.expectRevert(NadCustodial.AmountZero.selector);
        nadCustodial.sendToken(user2, address(testToken), 0);
    }

    function testSendTokenInvalidRecipient() public {
        vm.prank(owner);
        vm.expectRevert(NadCustodial.InvalidRecipient.selector);
        nadCustodial.sendToken(address(0), address(testToken), 100);
    }

    function testSendTokenInsufficientBalance() public {
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                NadCustodial.InsufficientBalance.selector,
                100,
                0
            )
        );
        nadCustodial.sendToken(user2, address(testToken), 100);
    }

    function testSendTokenEmitsEvent() public {
        testToken.transfer(owner, 500);
        vm.startPrank(owner);
        testToken.approve(address(nadCustodial), 500);
        nadCustodial.receiveToken(address(testToken), 500);
        vm.stopPrank();

        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit NadCustodial.TokenWithdrawal(user2, address(testToken), 200);
        nadCustodial.sendToken(user2, address(testToken), 200);
    }

    function testRegisterNewToken() public {
        testToken.transfer(address(nadCustodial), 100);
        nadCustodial.registerToken(address(testToken));

        address[] memory tokens = nadCustodial.getTokens();
        assertEq(tokens.length, 1);
        assertEq(tokens[0], address(testToken));
        assertEq(nadCustodial.getTokenBalance(address(testToken)), 100);
    }

    function testRegisterBlockedToken() public {
        vm.prank(owner);
        nadCustodial.setTokenBlocked(address(testToken), true);

        vm.expectRevert(NadCustodial.BlockedToken.selector);
        nadCustodial.registerToken(address(testToken));
    }

    function testUpdateExistingTokenBalance() public {
        testToken.transfer(address(nadCustodial), 100);
        nadCustodial.registerToken(address(testToken));

        testToken.transfer(address(nadCustodial), 50);
        nadCustodial.registerToken(address(testToken));
        assertEq(nadCustodial.getTokenBalance(address(testToken)), 150);
        address[] memory tokens = nadCustodial.getTokens();
        assertEq(tokens.length, 1);
        assertEq(tokens[0], address(testToken));
    }

    function testSetTokenBlocked() public {
        vm.prank(owner);
        nadCustodial.setTokenBlocked(address(testToken), true);
        assertTrue(nadCustodial.isBlockedToken(address(testToken)));

        vm.prank(owner);
        nadCustodial.setTokenBlocked(address(testToken), false);
        assertFalse(nadCustodial.isBlockedToken(address(testToken)));
    }

    function testSetTokenBlockedEmitsEvent() public {
        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit NadCustodial.TokenBlockStatusChanged(address(testToken), true);
        nadCustodial.setTokenBlocked(address(testToken), true);
    }

    function testBlockTokenAfterDeposit() public {
        testToken.transfer(owner, 100);
        vm.startPrank(owner);
        testToken.approve(address(nadCustodial), 100);
        nadCustodial.receiveToken(address(testToken), 100);

        nadCustodial.setTokenBlocked(address(testToken), true);
        vm.stopPrank();

        testToken.transfer(owner, 100);
        vm.startPrank(owner);
        testToken.approve(address(nadCustodial), 100);
        vm.expectRevert(NadCustodial.BlockedToken.selector);
        nadCustodial.receiveToken(address(testToken), 100);
        vm.stopPrank();

        assertEq(nadCustodial.getTokenBalance(address(testToken)), 100);
    }

    function testGetTokenBalance() public {
        testToken.transfer(owner, 1000);
        vm.startPrank(owner);
        testToken.approve(address(nadCustodial), 500);
        nadCustodial.receiveToken(address(testToken), 500);
        vm.stopPrank();

        assertEq(nadCustodial.getTokenBalance(address(testToken)), 500);
    }

    function testGetTokens() public {
        testToken.transfer(owner, 1000);
        vm.startPrank(owner);
        testToken.approve(address(nadCustodial), 500);
        nadCustodial.receiveToken(address(testToken), 500);
        testToken.approve(address(nadCustodial), 500);
        nadCustodial.receiveToken(address(testToken), 500);
        vm.stopPrank();

        address[] memory tokens = nadCustodial.getTokens();
        assertEq(tokens.length, 1);
        assertEq(tokens[0], address(testToken));
    }

    function testTokenBalanceUnderflow() public {
        testToken.transfer(owner, 100);
        vm.startPrank(owner);
        testToken.approve(address(nadCustodial), 100);
        nadCustodial.receiveToken(address(testToken), 100);

        vm.expectRevert(
            abi.encodeWithSelector(
                NadCustodial.InsufficientBalance.selector,
                101,
                100
            )
        );
        nadCustodial.sendToken(user2, address(testToken), 101);
        vm.stopPrank();
    }
}
