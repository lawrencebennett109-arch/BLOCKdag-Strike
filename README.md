# BlockDAG Strike — USDT GameFi FPS (Production Prototype)

This repository is a production-ready prototype for a GameFi FPS that uses **USDT only** for fees and rewards.
Wallets supported: **MetaMask**, **Trust Wallet** (via WalletConnect), and other WalletConnect-compatible wallets.

## Changes from earlier:
- All costs, play fees and rewards are denominated and paid in **USDT**.
- Frontend supports WalletConnect so Trust Wallet mobile users can connect.
- Contracts use USDT (ERC20) as acceptedToken. The deploy script expects `PLAY_FEE_USDT` (e.g., '2' for 2 USDT) and parses with 6 decimals.

## Contents
- frontend/ — static game and wallet integration (MetaMask + WalletConnect)
- contracts/ — Hardhat contracts (MilitaryNFT, GameTreasury, GameShop) configured for USDT (6 decimals)
- backend/ — Express server for signed run proofs, leaderboard, and USDT reward distribution

See individual READMEs for setup instructions. This is a prototype — secure admin endpoints and perform contract audits before mainnet.
