pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";

import { IGovernance } from "./interface/IGovernance.sol";
import { IRegistry } from "./interface/IRegistry.sol";


/**
 * @title HumanityApplicant
 * @dev Convenient interface for applying to the Humanity registry.
 */
contract HumanityApplicant {
    using SafeMath for uint;

    IGovernance public governance;
    IRegistry public registry;
    IERC20 public humanity;

    constructor(IGovernance _governance, IRegistry _registry, IERC20 _humanity) public {
        governance = _governance;
        registry = _registry;
        humanity = _humanity;
        humanity.approve(address(governance), uint(-1));
    }

    function applyFor(address who) public returns (uint) {
        uint fee = governance.proposalFee();
        uint balance = humanity.balanceOf(address(this));
        if (fee > balance) {
            require(humanity.transferFrom(msg.sender, address(this), fee.sub(balance)), "HumanityApplicant::applyFor: Transfer failed");
        }
        bytes memory data = abi.encodeWithSelector(registry.add.selector, who);
        return governance.proposeWithFeeRecipient(msg.sender, address(registry), data);
    }

}
