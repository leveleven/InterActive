// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract TokenVault is EIP712 {
    using ECDSA for bytes32;

    IERC20 public immutable token;
    address public owner;
    string private constant SIGNING_DOMAIN = "WithdrawAuthorization";
    string private constant SIGNATURE_VERSION = "1";

    bytes32 private constant WITHDRAW_TYPEHASH = keccak256(
        "Withdraw(address recipient,uint256 amount,uint256 nonce,uint256 deadline)"
    );

    mapping(address => uint256) public nonces;
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    event Withdraw(address indexed recipient, uint256 amount, uint256 nonce);

    constructor(address _token) EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION) {
        require(_token != address(0), "Invalid token address");
        token = IERC20(_token);
        owner = msg.sender;
    }

    /**
    * @notice withdrawal function, the user authorizes through signature and pays gas to call it
    * @param recipient: the recipient address (must be the signer himself)
    * @param amount: withdrawal amount
    * @param deadline: signature expiration timestamp
    * @param signature: EIP712 signature of the background signature
    */
    function withdrawTo(
        address recipient,
        uint256 amount,
        uint256 deadline,
        bytes calldata signature
    ) external {
        require(block.timestamp <= deadline, "Signature expired");

        uint256 nonce = nonces[recipient];

        bytes32 structHash = keccak256(
            abi.encode(WITHDRAW_TYPEHASH, recipient, amount, nonce, deadline)
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);

        require(signer == recipient, "Invalid signer");

        // Preventing replay attacks
        nonces[recipient] += 1;

        require(token.transfer(recipient, amount), "Transfer failed");

        emit Withdraw(recipient, amount, nonce);
    }

    /// @notice Query the current token balance of the contract
    function getBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /// @notice Changeable contract owner (optional feature)
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }

    /// @notice Transfer the contract amount to the specified address
    function transferToken(address recipient, uint256 amount) external onlyOwner {
        require(token.transfer(recipient, amount), "Transfer failed");
    }
}
