pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Faucet
 * @dev Mine Humanity tokens into Uniswap.
 */
contract Faucet {
    using SafeMath for uint;

    uint public constant BLOCK_REWARD = 1e18;
    uint public START_BLOCK = block.number;
    uint public END_BLOCK = block.number + 5000000;

    IERC20 public humanity;
    address public auction;

    uint public lastMined = block.number;

    constructor(IERC20 _humanity, address _auction) public {
        humanity = _humanity;
        auction = _auction;
    }

    function mine() public {
        uint rewardBlock = block.number < END_BLOCK ? block.number : END_BLOCK;
        uint reward = rewardBlock.sub(lastMined).mul(BLOCK_REWARD);
        humanity.transfer(auction, reward);
        lastMined = block.number;
    }

}