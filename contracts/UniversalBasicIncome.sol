pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";

import { HumanityRegistry } from "./HumanityRegistry.sol";

/**
 * @title UniversalBasicIncome
 * @dev Dai that can be claimed by humans on the Human Registry.
 */
contract UniversalBasicIncome {
    using SafeMath for uint;

    HumanityRegistry public registry;
    IERC20 public dai;

    uint public constant MONTHLY_INCOME = 1e18; // 1 Dai
    uint public constant INCOME_PER_SECOND = MONTHLY_INCOME / 30 days;

    mapping (address => uint) public claimTimes;

    constructor(HumanityRegistry _registry, IERC20 _dai) public {
        registry = _registry;
        dai = _dai;
    }

    function claim() public {
        require(registry.isHuman(msg.sender), "UniversalBasicIncome::claim: You must be on the Humanity registry to claim income");

        uint income;
        uint time = block.timestamp;

        // If claiming for the first time, send 1 month of UBI
        if (claimTimes[msg.sender] == 0) {
            income = MONTHLY_INCOME;
        } else {
            income = time.sub(claimTimes[msg.sender]).mul(INCOME_PER_SECOND);
        }

        uint balance = dai.balanceOf(address(this));
        // If not enough Dai reserves, send the remaining balance
        uint actualIncome = balance < income ? balance : income;

        dai.transfer(msg.sender, actualIncome);
        claimTimes[msg.sender] = time;
    }

}