// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}

/// @notice One-time $CHARM faucet. Fund it by transferring CHARM to this contract.
/// Deploy args: token = 0xc00583c4c8e8eed451cb827809dfe7f011477350, amount = 50 * 10**decimals
contract CharmFaucet {
    IERC20 public immutable token;
    address public immutable owner;
    uint256 public immutable amount;

    mapping(address => bool) public claimed;

    event Claimed(address indexed user, uint256 amount);

    error AlreadyClaimed();
    error TransferFailed();
    error NotOwner();

    constructor(address _token, uint256 _amount) {
        token = IERC20(_token);
        amount = _amount;
        owner = msg.sender;
    }

    // Minimal gas: one cold SSTORE (bool) + one token transfer + one event.
    function claim() external {
        if (claimed[msg.sender]) revert AlreadyClaimed();
        claimed[msg.sender] = true;
        if (!token.transfer(msg.sender, amount)) revert TransferFailed();
        emit Claimed(msg.sender, amount);
    }

    function withdraw(uint256 _amount) external {
        if (msg.sender != owner) revert NotOwner();
        if (!token.transfer(owner, _amount)) revert TransferFailed();
    }
}
