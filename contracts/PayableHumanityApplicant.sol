pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import { IGovernance } from "./interface/IGovernance.sol";
import { IRegistry } from "./interface/IRegistry.sol";
import { IUniswapExchange } from "./interface/IUniswapExchange.sol";

import { HumanityApplicant } from "./HumanityApplicant.sol";

/**
 * @title PayableHumanityApplicant
 * @dev Convenient interface for applying to the Humanity registry using Ether.
 */
contract PayableHumanityApplicant is HumanityApplicant {

    IUniswapExchange public exchange;

    constructor(IGovernance _governance, IRegistry _registry, IERC20 _humanity, IUniswapExchange _exchange) public
        HumanityApplicant(_governance, _registry, _humanity)
    {
        exchange = _exchange;
    }

    function () external payable {}

    function applyWithEtherFor(address who) public payable returns (uint) {
        // Exchange Ether for Humanity tokens
        uint fee = governance.proposalFee();
        exchange.ethToTokenSwapOutput.value(msg.value)(fee, block.timestamp);

        // Apply to the registry
        uint proposalId = applyFor(who);

        // Refund any remaining balance
        msg.sender.send(address(this).balance);

        return proposalId;
    }

}
