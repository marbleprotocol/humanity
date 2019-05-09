pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import { ERC20 } from "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";


contract MockERC20 is ERC20 {

    function mint(address account, uint value) public {
        _mint(account, value);
    }

}