pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Snapshot.sol";

contract SimpleToken is ERC20, ERC20Snapshot {
    string public SYMBOL = "STN";
    string public NAME = "STN";
    uint8 public DECIMALS = 18;
    uint256 public INITIAL_SUPPLY = 1000000000000000000000000;

    constructor() ERC20(NAME, SYMBOL) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Snapshot) {}

    function snapshot() public returns (uint256) {
        return _snapshot();
    }
}
