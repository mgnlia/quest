// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title QuestSettlement
/// @notice Append-only settlement log for the Quest demo (Base Sepolia testnet).
///         Records that a quest's escrow was deposited and later released, with the
///         KRW amount and a hash of the governing document. No value is transferred:
///         amounts are plain data. Only the operator (the app's relayer) can write.
contract QuestSettlement {
    enum Status { None, Deposited, Released }

    struct Settlement {
        Status status;
        uint64 depositedAt;   // block timestamp of deposit()
        uint64 releasedAt;    // block timestamp of release()
        uint128 amountKrw;    // escrowed amount in KRW (whole won)
        bytes32 depositDoc;   // hash of the contract / escrow terms
        bytes32 releaseDoc;   // hash of the acceptance record
    }

    address public immutable operator;
    mapping(bytes32 => Settlement) public settlements;

    event Deposited(bytes32 indexed questId, uint256 amountKrw, bytes32 docHash);
    event Released(bytes32 indexed questId, uint256 amountKrw, bytes32 docHash);

    error NotOperator();
    error InvalidAmount();
    error WrongStatus(Status current);

    constructor(address operator_) {
        operator = operator_;
    }

    modifier onlyOperator() {
        if (msg.sender != operator) revert NotOperator();
        _;
    }

    /// @param questId  settlement key (ASCII quest id, right-padded to 32 bytes)
    /// @param amountKrw escrowed amount in KRW, must be > 0
    /// @param docHash  hash of the contract / escrow terms
    function deposit(bytes32 questId, uint128 amountKrw, bytes32 docHash) external onlyOperator {
        Settlement storage s = settlements[questId];
        if (s.status != Status.None) revert WrongStatus(s.status);
        if (amountKrw == 0) revert InvalidAmount();
        s.status = Status.Deposited;
        s.depositedAt = uint64(block.timestamp);
        s.amountKrw = amountKrw;
        s.depositDoc = docHash;
        emit Deposited(questId, amountKrw, docHash);
    }

    /// @param questId settlement key of a deposited quest
    /// @param docHash hash of the acceptance record
    function release(bytes32 questId, bytes32 docHash) external onlyOperator {
        Settlement storage s = settlements[questId];
        if (s.status != Status.Deposited) revert WrongStatus(s.status);
        s.status = Status.Released;
        s.releasedAt = uint64(block.timestamp);
        s.releaseDoc = docHash;
        emit Released(questId, s.amountKrw, docHash);
    }
}
