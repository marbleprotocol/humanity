pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;


contract MockHumanityRegistry {

    bool public result = true;

    function isHuman(address who) public view returns (bool) {
        return result;
    }

    function setResult(bool _result) public {
        result = _result;
    }

}