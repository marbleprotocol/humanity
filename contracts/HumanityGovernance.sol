pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import { Governance } from "./Governance.sol";

/**
 * @title HumanityGovernance
 * @dev Plutocratic voting system that uses Humanity token for voting and proposal fees.
 */
contract HumanityGovernance is Governance {

    constructor(IERC20 humanity, uint proposalFee) public
        Governance(humanity, proposalFee) {}

}