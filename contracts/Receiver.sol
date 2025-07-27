// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract Receiver {
    IERC20 public immutable token;
    address public owner;
    uint256 public constant FIXED_AMOUNT = 100 * 10**18; // 假设是 18 位精度的 ERC20 代币

    event Received(address indexed from, uint256 amount);

    constructor(address _token) {
        require(_token != address(0), "Invalid token address");
        token = IERC20(_token);
        owner = msg.sender;
    }

    // 用户调用此函数向合约发送固定数量的代币
    function deposit() external {
        require(
            token.transferFrom(msg.sender, address(this), FIXED_AMOUNT),
            "Token transfer failed"
        );
        emit Received(msg.sender, FIXED_AMOUNT);
    }

    // 查看合约中代币余额
    function getBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    // 仅管理员可提取合约中代币
    function withdraw() external {
        require(msg.sender == owner, "Not authorized");
        uint256 balance = token.balanceOf(address(this));
        require(token.transferFrom(address(this), owner, balance), "Withdraw failed");
    }
}