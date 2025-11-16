// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameTreasury is Ownable {

    IERC20 public acceptedToken; // USDT token (ERC20)
    uint256 public playFee; // in smallest token unit (USDT commonly has 6 decimals)

    event FeeCollected(address indexed payer, uint256 amount);
    event RewardDistributed(address indexed to, uint256 amount, string why);

    constructor(address _acceptedToken, uint256 _playFee){
        acceptedToken = IERC20(_acceptedToken);
        playFee = _playFee;
    }

    function setPlayFee(uint256 amt) external onlyOwner { playFee = amt; }

    function collectPlayFee(address payer) external {
        require(acceptedToken.transferFrom(payer, address(this), playFee), 'transfer failed');
        emit FeeCollected(payer, playFee);
    }

    /// @notice Distribute rewards in USDT. monthlyCap is token unit (e.g., 300 USDT = 300 * 10^6)
    function distributeRewards(address[] calldata winners, uint256[] calldata amounts, uint256 monthlyCap) external onlyOwner {
        require(winners.length == amounts.length, 'len mismatch');
        uint256 total=0;
        for(uint256 i=0;i<amounts.length;i++) total += amounts[i];
        require(total <= monthlyCap, 'exceeds monthly cap');
        for(uint256 i=0;i<winners.length;i++){
            require(acceptedToken.transfer(winners[i], amounts[i]), 'transfer failed');
            emit RewardDistributed(winners[i], amounts[i], 'monthly leaderboard');
        }
    }

    function withdraw(address to, uint256 amount) external onlyOwner {
        require(acceptedToken.transfer(to, amount), 'transfer failed');
    }
}
