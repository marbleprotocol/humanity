pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import { IRegistry } from "./interface/IRegistry.sol";
import { IUniswapExchange } from "./interface/IUniswapExchange.sol";

import { IGovernance } from "./interface/IGovernance.sol";
import { PayableHumanityApplicant } from "./PayableHumanityApplicant.sol";

/**
 * @title TwitterHumanityApplicant
 * @dev Convenient interface for applying to the Humanity registry using Twitter as proof of identity.
 */
contract TwitterHumanityApplicant is PayableHumanityApplicant {

    event Apply(uint indexed proposalId, address indexed applicant, string username);

    constructor(
        IGovernance _governance,
        IRegistry _registry,
        IERC20 _humanity,
        IUniswapExchange _exchange
    ) public
        PayableHumanityApplicant(_governance, _registry, _humanity, _exchange) {}

    function applyWithTwitter(string memory username) public returns (uint) {
        return applyWithTwitterFor(msg.sender, username);
    }

    function applyWithTwitterFor(address who, string memory username) public returns (uint) {
        uint proposalId = applyFor(who);
        emit Apply(proposalId, who, username);
        return proposalId;
    }

    function applyWithTwitterUsingEther(string memory username) public payable returns (uint) {
        return applyWithTwitterUsingEtherFor(msg.sender, username);
    }

    function applyWithTwitterUsingEtherFor(address who, string memory username) public payable returns (uint) {
        uint proposalId = applyWithEtherFor(who);
        emit Apply(proposalId, who, username);
        return proposalId;
    }

}
