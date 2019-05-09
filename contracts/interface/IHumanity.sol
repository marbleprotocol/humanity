pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;


contract IHumanity {
    function mint(address account, uint256 value) public;
    function totalSupply() public view returns (uint256);
}