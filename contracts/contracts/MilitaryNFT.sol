// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MilitaryNFT is ERC721URIStorage, Ownable {
    uint256 public nextId;
    mapping(uint256 => uint256) public shopCreditUSDTcents; // store shop credit in USDT cents (1 USDT = 100 cents)

    event Minted(address indexed to, uint256 tokenId, uint256 shopCreditCents);

    constructor() ERC721('BlockDAG Strike Military', 'BDS-MIL') {}

    function mint(address to, string memory tokenURI, uint256 shopCreditCents) external onlyOwner returns (uint256){
        uint256 id = ++nextId;
        _safeMint(to, id);
        _setTokenURI(id, tokenURI);
        shopCreditUSDTcents[id] = shopCreditCents;
        emit Minted(to, id, shopCreditCents);
        return id;
    }

    function burn(uint256 tokenId) external onlyOwner {
        _burn(tokenId);
    }

    function getShopCredit(uint256 tokenId) external view returns (uint256){
        return shopCreditUSDTcents[tokenId];
    }
}
