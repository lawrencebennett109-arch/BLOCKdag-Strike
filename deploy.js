// scripts/deploy.js
const hre = require('hardhat');
async function main(){
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with", deployer.address);
  const AcceptedToken = process.env.ACCEPTED_TOKEN || '0x0000000000000000000000000000000000000000';
  // PLAY_FEE is given in USDT (e.g., '2' means 2 USDT). USDT commonly has 6 decimals.
  const playFeeUSDT = process.env.PLAY_FEE_USDT || '2';
  const playFee = ethers.utils.parseUnits(playFeeUSDT, 6);

  const MilitaryNFT = await ethers.getContractFactory('MilitaryNFT');
  const nft = await MilitaryNFT.deploy();
  await nft.deployed();
  console.log('MilitaryNFT deployed to', nft.address);

  const GameTreasury = await ethers.getContractFactory('GameTreasury');
  const treasury = await GameTreasury.deploy(AcceptedToken, playFee);
  await treasury.deployed();
  console.log('GameTreasury deployed to', treasury.address);

  const GameShop = await ethers.getContractFactory('GameShop');
  const shop = await GameShop.deploy(nft.address, AcceptedToken);
  await shop.deployed();
  console.log('GameShop deployed to', shop.address);
}
main().catch(e=>{ console.error(e); process.exit(1); });
