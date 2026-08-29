// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title CrownFi Ticket
/// @notice Organizer-minted event tickets with unique seats, controlled resale, and one-time redemption.
/// @dev Event and seat labels are stored as bytes32 keys; human-readable details live in token metadata.
contract CrownFiTicket is ERC721URIStorage, Ownable2Step, Pausable {
    struct TicketData {
        bytes32 eventKey;
        bytes32 seatKey;
        uint64 redeemedAt;
        uint8 tier;
        address redeemedBy;
    }

    uint256 public totalMinted;
    uint256 public maxSupply;
    bool public resaleOpen;

    mapping(uint256 tokenId => TicketData ticket) private _tickets;
    mapping(bytes32 occupancyKey => uint256 tokenId) private _seatTokens;
    mapping(address scanner => bool allowed) public scanners;

    error InvalidAddress();
    error InvalidTicketData();
    error MaxSupplyReached();
    error MaxSupplyBelowMinted();
    error ResaleClosed();
    error RedeemedTicket(uint256 tokenId);
    error TicketAlreadyRedeemed(uint256 tokenId);
    error SeatAlreadyAssigned(uint256 tokenId);
    error SeatAlreadyTaken(bytes32 eventKey, bytes32 seatKey);
    error UnauthorizedScanner(address caller);
    error OwnershipRenunciationDisabled();

    event TicketMinted(
        uint256 indexed tokenId,
        address indexed to,
        bytes32 indexed eventKey,
        bytes32 seatKey,
        uint8 tier,
        string metadataUri
    );
    event SeatAssigned(uint256 indexed tokenId, bytes32 indexed eventKey, bytes32 indexed seatKey);
    event TicketRedeemed(uint256 indexed tokenId, address indexed holder, address indexed scanner, uint64 redeemedAt);
    event ScannerUpdated(address indexed scanner, bool allowed);
    event ResaleStatusUpdated(bool open);
    event MaxSupplyUpdated(uint256 previousMaxSupply, uint256 newMaxSupply);

    constructor(address initialOwner, uint256 initialMaxSupply)
        ERC721("CrownFi Ticket", "CFTIX")
        Ownable(initialOwner)
    {
        if (initialOwner == address(0)) revert InvalidAddress();
        maxSupply = initialMaxSupply;
    }

    /// @notice Mints an event ticket. Use a zero seat key when the buyer will choose a seat later.
    function mint(
        address to,
        bytes32 eventKey,
        bytes32 seatKey,
        uint8 tier,
        string calldata metadataUri
    ) external onlyOwner returns (uint256 tokenId) {
        if (to == address(0)) revert InvalidAddress();
        if (eventKey == bytes32(0) || tier == 0 || bytes(metadataUri).length == 0) {
            revert InvalidTicketData();
        }
        if (maxSupply != 0 && totalMinted >= maxSupply) revert MaxSupplyReached();

        tokenId = ++totalMinted;
        _tickets[tokenId] = TicketData({
            eventKey: eventKey,
            seatKey: seatKey,
            redeemedAt: 0,
            tier: tier,
            redeemedBy: address(0)
        });

        if (seatKey != bytes32(0)) _reserveSeat(tokenId, eventKey, seatKey);

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataUri);
        emit TicketMinted(tokenId, to, eventKey, seatKey, tier, metadataUri);
    }

    /// @notice Permanently assigns an unassigned ticket to a unique seat for its event.
    function assignSeat(uint256 tokenId, bytes32 seatKey) external onlyOwner {
        ownerOf(tokenId);
        if (seatKey == bytes32(0)) revert InvalidTicketData();

        TicketData storage ticket = _tickets[tokenId];
        if (ticket.redeemedAt != 0) revert RedeemedTicket(tokenId);
        if (ticket.seatKey != bytes32(0)) revert SeatAlreadyAssigned(tokenId);

        _reserveSeat(tokenId, ticket.eventKey, seatKey);
        ticket.seatKey = seatKey;
        emit SeatAssigned(tokenId, ticket.eventKey, seatKey);
    }

    /// @notice Marks a ticket used. The owner may act as a scanner without separate registration.
    function redeem(uint256 tokenId) external {
        address holder = ownerOf(tokenId);
        if (msg.sender != owner() && !scanners[msg.sender]) revert UnauthorizedScanner(msg.sender);

        TicketData storage ticket = _tickets[tokenId];
        if (ticket.redeemedAt != 0) revert TicketAlreadyRedeemed(tokenId);

        uint64 redeemedAt = uint64(block.timestamp);
        ticket.redeemedAt = redeemedAt;
        ticket.redeemedBy = msg.sender;
        emit TicketRedeemed(tokenId, holder, msg.sender, redeemedAt);
    }

    function setScanner(address scanner, bool allowed) external onlyOwner {
        if (scanner == address(0)) revert InvalidAddress();
        scanners[scanner] = allowed;
        emit ScannerUpdated(scanner, allowed);
    }

    function setResaleOpen(bool open) external onlyOwner {
        resaleOpen = open;
        emit ResaleStatusUpdated(open);
    }

    /// @notice Zero means unlimited. A nonzero cap can never be set below the minted count.
    function setMaxSupply(uint256 newMaxSupply) external onlyOwner {
        if (newMaxSupply != 0 && newMaxSupply < totalMinted) revert MaxSupplyBelowMinted();
        uint256 previous = maxSupply;
        maxSupply = newMaxSupply;
        emit MaxSupplyUpdated(previous, newMaxSupply);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function getTicket(uint256 tokenId) external view returns (TicketData memory) {
        ownerOf(tokenId);
        return _tickets[tokenId];
    }

    function ticketForSeat(bytes32 eventKey, bytes32 seatKey) external view returns (uint256) {
        if (eventKey == bytes32(0) || seatKey == bytes32(0)) revert InvalidTicketData();
        return _seatTokens[_occupancyKey(eventKey, seatKey)];
    }

    function approve(address to, uint256 tokenId) public override(ERC721, IERC721) {
        if (!resaleOpen) revert ResaleClosed();
        super.approve(to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) public override(ERC721, IERC721) {
        if (!resaleOpen && approved) revert ResaleClosed();
        super.setApprovalForAll(operator, approved);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /// @dev Pausing blocks minting and transfers. Closed resale blocks transfers even when unpaused.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721)
        whenNotPaused
        returns (address from)
    {
        from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            if (!resaleOpen) revert ResaleClosed();
            if (_tickets[tokenId].redeemedAt != 0) revert RedeemedTicket(tokenId);
        }
        return super._update(to, tokenId, auth);
    }

    /// @dev Prevents accidentally abandoning ticket redemption and emergency controls.
    function renounceOwnership() public view override onlyOwner {
        revert OwnershipRenunciationDisabled();
    }

    function _reserveSeat(uint256 tokenId, bytes32 eventKey, bytes32 seatKey) private {
        bytes32 key = _occupancyKey(eventKey, seatKey);
        if (_seatTokens[key] != 0) revert SeatAlreadyTaken(eventKey, seatKey);
        _seatTokens[key] = tokenId;
    }

    function _occupancyKey(bytes32 eventKey, bytes32 seatKey) private pure returns (bytes32) {
        return keccak256(abi.encode(eventKey, seatKey));
    }
}
