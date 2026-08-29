// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title CrownFi Collectible
/// @notice ERC-721 collection for a single CrownFi pageant and its registered delegates.
/// @dev The platform owner mints after payment confirmation. Each wallet may receive only
///      one token per candidate, even if an earlier token is later transferred away.
contract CrownFiCollectible is ERC721, Ownable2Step, Pausable {
    uint256 private constant MAX_METADATA_URI_LENGTH = 300;

    struct CandidateConfig {
        uint64 maxSupply;
        uint64 minted;
        string metadataURI;
    }

    error CandidateAlreadyExists(uint256 candidateId);
    error CandidateNotFound(uint256 candidateId);
    error InvalidMaxSupply();
    error InvalidMetadataURI();
    error MetadataFrozen(uint256 candidateId);
    error SupplyExhausted(uint256 candidateId);
    error AlreadyMinted(address wallet, uint256 candidateId);
    error OwnershipRenunciationDisabled();

    uint256 private _nextTokenId = 1;
    uint256 private _totalSupply;

    mapping(uint256 candidateId => CandidateConfig config) private _candidates;
    mapping(uint256 tokenId => uint256 candidateId) public tokenCandidate;
    mapping(address wallet => mapping(uint256 candidateId => bool minted)) public hasMinted;

    event CandidateAdded(uint256 indexed candidateId, uint64 maxSupply, string metadataURI);
    event CandidateMetadataUpdated(uint256 indexed candidateId, string metadataURI);
    event CollectibleMinted(address indexed to, uint256 indexed candidateId, uint256 indexed tokenId);

    constructor(address initialOwner) ERC721("CrownFi Collectible", "CROWN") Ownable(initialOwner) {}

    function addCandidate(uint256 candidateId, uint64 maxSupply, string calldata metadataURI) external onlyOwner {
        if (_candidates[candidateId].maxSupply != 0) revert CandidateAlreadyExists(candidateId);
        if (maxSupply == 0) revert InvalidMaxSupply();
        _validateMetadataURI(metadataURI);

        _candidates[candidateId] = CandidateConfig({
            maxSupply: maxSupply,
            minted: 0,
            metadataURI: metadataURI
        });

        emit CandidateAdded(candidateId, maxSupply, metadataURI);
    }

    /// @notice Metadata may be corrected only before the first token for the candidate is minted.
    function setCandidateMetadata(uint256 candidateId, string calldata metadataURI) external onlyOwner {
        CandidateConfig storage config = _candidate(candidateId);
        if (config.minted != 0) revert MetadataFrozen(candidateId);
        _validateMetadataURI(metadataURI);
        config.metadataURI = metadataURI;
        emit CandidateMetadataUpdated(candidateId, metadataURI);
    }

    /// @notice Platform-authorized mint used only after CrownFi confirms payment or entitlement.
    function adminMint(address to, uint256 candidateId) external onlyOwner whenNotPaused returns (uint256 tokenId) {
        CandidateConfig storage config = _candidate(candidateId);
        if (config.minted >= config.maxSupply) revert SupplyExhausted(candidateId);
        if (hasMinted[to][candidateId]) revert AlreadyMinted(to, candidateId);

        tokenId = _nextTokenId++;
        config.minted += 1;
        _totalSupply += 1;
        tokenCandidate[tokenId] = candidateId;
        hasMinted[to][candidateId] = true;

        _safeMint(to, tokenId);
        emit CollectibleMinted(to, candidateId, tokenId);
    }

    function candidate(uint256 candidateId) external view returns (CandidateConfig memory) {
        return _candidate(candidateId);
    }

    function remaining(uint256 candidateId) external view returns (uint64) {
        CandidateConfig storage config = _candidate(candidateId);
        return config.maxSupply - config.minted;
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _candidates[tokenCandidate[tokenId]].metadataURI;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function version() external pure returns (string memory) {
        return "1";
    }

    function renounceOwnership() public view override onlyOwner {
        revert OwnershipRenunciationDisabled();
    }

    function _candidate(uint256 candidateId) private view returns (CandidateConfig storage config) {
        config = _candidates[candidateId];
        if (config.maxSupply == 0) revert CandidateNotFound(candidateId);
    }

    function _validateMetadataURI(string calldata metadataURI) private pure {
        uint256 length = bytes(metadataURI).length;
        if (length == 0 || length > MAX_METADATA_URI_LENGTH) revert InvalidMetadataURI();
    }

    /// @dev Pausing blocks mints, burns, and transfers. This keeps emergency behavior aligned
    ///      with the former Soroban collectible contract.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        _requireNotPaused();
        return super._update(to, tokenId, auth);
    }
}
