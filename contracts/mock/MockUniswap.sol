pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import { IUniswapExchange } from "../interface/IUniswapExchange.sol";


// @title MockUniswap exchanges Ether for Humanity to test PayableHumanityApplicant.
contract MockUniswap is IUniswapExchange {

    IERC20 public humanity;

    constructor(IERC20 _humanity) public {
        humanity = _humanity;
    }

    function ethToTokenSwapOutput(uint256 tokens_bought, uint256 timestamp) public payable returns (uint256) {
        uint balance = humanity.balanceOf(address(this));
        humanity.transfer(msg.sender, balance);

        // Use a 1-to-1 exchange rate and refund the rest
        if (msg.value > tokens_bought) {
            msg.sender.transfer(msg.value - tokens_bought);
        }

        return balance;
    }

}