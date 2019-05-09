pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;


contract IUniswapExchange {
    function ethToTokenSwapOutput(uint256 tokens_bought, uint256 timestamp) public payable returns (uint256);
}