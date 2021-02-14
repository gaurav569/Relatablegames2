/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require('@nomiclabs/hardhat-waffle');
require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');



module.exports = {
  solidity: {
    version:"0.7.0",
    // gas:700000,
    // gasMultiplier:1,
    // gasPrice:8000000000,
    settings:{
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  defaultNetwork: "hardhat",

  networks:{
   
    matictest: {
      url: "https://rpc-mumbai.maticvigil.com/",
      accounts: {
        mnemonic: process.env.MNEMONIC,
        initialIndex:0,
      }
    }
  }
   
};
 