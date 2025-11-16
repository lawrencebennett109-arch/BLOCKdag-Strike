const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('USDT flow', function(){
  let nft, treasury, shop, token, owner, addr1;

  beforeEach(async ()=>{
    [owner, addr1] = await ethers.getSigners();
    const ERC20Mock = await ethers.getContractFactory('ERC20Mock');
    token = await ERC20Mock.deploy('USDTMock','USDT', owner.address, ethers.utils.parseUnits('10000',6));
    await token.deployed();

    const MilitaryNFT = await ethers.getContractFactory('MilitaryNFT');
    nft = await MilitaryNFT.deploy();
    await nft.deployed();

    const GameTreasury = await ethers.getContractFactory('GameTreasury');
    treasury = await GameTreasury.deploy(token.address, ethers.utils.parseUnits('2',6));
    await treasury.deployed();

    const GameShop = await ethers.getContractFactory('GameShop');
    shop = await GameShop.deploy(nft.address, token.address);
    await shop.deployed();
  });

  it('collects USDT play fee after approval', async ()=>{
    await token.transfer(addr1.address, ethers.utils.parseUnits('10',6));
    await token.connect(addr1).approve(treasury.address, ethers.utils.parseUnits('2',6));
    await treasury.connect(owner).collectPlayFee(addr1.address);
    const bal = await token.balanceOf(treasury.address);
    expect(bal).to.equal(ethers.utils.parseUnits('2',6));
  });

  it('redeems NFT for shop credit in USDT cents', async ()=>{
    await nft.connect(owner).mint(addr1.address, 'ipfs://test', 100); // $1.00 = 100 cents
    await nft.connect(addr1).approve(shop.address, 1);
    await shop.connect(addr1).redeemNFT(1);
    const credit = await shop.onchainCreditUSDTcents(addr1.address);
    expect(credit).to.equal(100);
  });
});
