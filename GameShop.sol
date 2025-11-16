// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./MilitaryNFT.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameShop is Ownable {
    MilitaryNFT public nft;
    IERC20 public acceptedToken; // USDT token
    mapping(address=>uint256) public onchainCreditUSDTcents;

    event NFTRedeemed(address indexed user, uint256 tokenId, uint256 creditUSDTcents);
    event ItemPurchased(address indexed user, string itemId, uint256 priceUSDTcents);

    constructor(address _nft, address _acceptedToken){
        nft = MilitaryNFT(_nft);
        acceptedToken = IERC20(_acceptedToken);
    }

    function redeemNFT(uint256 tokenId) external {
        require(nft.ownerOf(tokenId) == msg.sender, "not owner");
        uint256 credit = nft.getShopCredit(tokenId);
        nft.transferFrom(msg.sender, address(this), tokenId);
        onchainCreditUSDTcents[msg.sender] += credit;
        emit NFTRedeemed(msg.sender, tokenId, credit);
    }

    function buyItemWithCredit(string calldata itemId, uint256 priceUSDTcents) external {
        require(onchainCreditUSDTcents[msg.sender] >= priceUSDTcents, "insufficient credit");
        onchainCreditUSDTcents[msg.sender] -= priceUSDTcents;
        emit ItemPurchased(msg.sender, itemId, priceUSDTcents);
    }

    function buyItemWithToken(string calldata itemId, uint256 priceTokenAmount) external {
        require(acceptedToken.transferFrom(msg.sender, address(this), priceTokenAmount), "transfer failed");
        emit ItemPurchased(msg.sender, itemId, priceTokenAmount);
    }
}
