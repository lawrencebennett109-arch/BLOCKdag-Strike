
require('@nomiclabs/hardhat-ethers');
module.exports = {
  solidity: '0.8.19',
  networks: {
    blockdag: {
      url: process.env.BLOCKDAG_RPC_URL || 'https://rpc.blockdag.example',
      chainId: process.env.BLOCKDAG_CHAINID ? Number(process.env.BLOCKDAG_CHAINID) : 1337,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  }
};
