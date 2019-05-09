pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import { ERC20 } from "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";


/**
 * @title Humanity
 * @dev ERC20 token that can be used to vote on applications to the Humanity registry.
 */
contract Humanity is ERC20 {

    string public constant name = "Humanity";
    string public constant symbol = "HUM";
    uint8 public constant decimals = 18;
    string public version = "1.0.0";

    uint public constant INITIAL_SUPPLY = 25000000e18; // 25 million
    uint public constant FINAL_SUPPLY = 100000000e18; // 100 million

    address public registry;

    constructor(address _registry) public {
        registry = _registry;
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    function mint(address account, uint256 value) public {
        require(msg.sender == registry, "Humanity::mint: Only the registry can mint new tokens");
        require(totalSupply().add(value) <= FINAL_SUPPLY, "Humanity::mint: Exceeds final supply");

        _mint(account, value);
    }

}
