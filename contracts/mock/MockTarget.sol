pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;


// @title MockTarget sets a value to test governance.
contract MockTarget {

    uint public value;

    function setValue() public {
        value = 4;
    }

    function data() public view returns (bytes memory) {
        return abi.encodeWithSelector(this.setValue.selector);
    }

}