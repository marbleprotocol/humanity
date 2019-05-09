pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";

import { HumanityGovernance } from "../HumanityGovernance.sol";


contract MockHumanityGovernance is HumanityGovernance {
    using SafeMath for uint;

    uint public timestamp = block.timestamp;

    function setBlockTimestampIncrease(uint time) public {
        timestamp = timestamp.add(time);
    }

    function time() public view returns (uint) {
        return timestamp;
    }

}