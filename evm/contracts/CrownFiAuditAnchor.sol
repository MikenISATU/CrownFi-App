// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @title CrownFi Audit Anchor
/// @notice Stores one immutable vote checkpoint per CrownFi round.
/// @dev Votes and Merkle proofs remain off-chain; only the compact result commitment is stored.
contract CrownFiAuditAnchor is Ownable2Step {
    struct Checkpoint {
        bytes32 merkleRoot;
        bytes32 tallyHash;
        uint64 publishedAt;
        uint64 totalVotes;
    }

    error InvalidCheckpoint();
    error CheckpointAlreadyPublished(bytes32 roundId);
    error CheckpointNotFound(bytes32 roundId);
    error OwnershipRenunciationDisabled();

    mapping(bytes32 roundId => Checkpoint checkpoint) private _checkpoints;

    event CheckpointPublished(
        bytes32 indexed roundId,
        bytes32 indexed merkleRoot,
        bytes32 indexed tallyHash,
        uint64 totalVotes,
        uint64 publishedAt
    );

    constructor(address initialOwner) Ownable(initialOwner) {
        if (initialOwner == address(0)) revert OwnableInvalidOwner(address(0));
    }

    function publish(bytes32 roundId, bytes32 merkleRoot, bytes32 tallyHash, uint64 totalVotes) external onlyOwner {
        if (roundId == bytes32(0) || merkleRoot == bytes32(0) || tallyHash == bytes32(0)) {
            revert InvalidCheckpoint();
        }
        if (_checkpoints[roundId].publishedAt != 0) revert CheckpointAlreadyPublished(roundId);

        uint64 publishedAt = uint64(block.timestamp);
        _checkpoints[roundId] = Checkpoint({
            merkleRoot: merkleRoot,
            tallyHash: tallyHash,
            publishedAt: publishedAt,
            totalVotes: totalVotes
        });

        emit CheckpointPublished(roundId, merkleRoot, tallyHash, totalVotes, publishedAt);
    }

    function getCheckpoint(bytes32 roundId) external view returns (Checkpoint memory checkpoint) {
        checkpoint = _checkpoints[roundId];
        if (checkpoint.publishedAt == 0) revert CheckpointNotFound(roundId);
    }

    function exists(bytes32 roundId) external view returns (bool) {
        return _checkpoints[roundId].publishedAt != 0;
    }

    /// @dev Prevents accidentally leaving the write-once anchor permanently unmanaged.
    function renounceOwnership() public view override onlyOwner {
        revert OwnershipRenunciationDisabled();
    }
}
