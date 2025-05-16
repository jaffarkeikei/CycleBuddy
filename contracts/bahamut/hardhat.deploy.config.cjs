require("@nomicfoundation/hardhat-toolbox");

// Use the generated private key
const PRIVATE_KEY = "89a2c39ddf9b8cb186af7b6f60cd1d7b65d1fd5e7e41a46666fd88769c058e61";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: [`0x${PRIVATE_KEY}`]
    },
    bahamut: {
      url: "https://testnet.rpc.bahamut.io",
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 38,  // Bahamut Testnet chain ID
      gasPrice: 20000000000  // 20 gwei
    }
  },
  paths: {
    sources: ".",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  },
  // Specify which files to compile
  sourcesPath: [
    "./CycleStreakToken.local.sol",
    "./DailyRewards.local.sol"
  ]
}; 