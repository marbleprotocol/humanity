pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;


contract IGovernance {
    function proposeWithFeeRecipient(address feeRecipient, address target, bytes memory data) public returns (uint);
    function proposalFee() public view returns (uint);
}