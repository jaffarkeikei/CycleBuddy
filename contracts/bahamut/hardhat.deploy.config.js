require("@nomicfoundation/hardhat-toolbox");

// Use default private key for localhost testing
const defaultPrivateKey = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

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
      // This is a Hardhat default private key for testing
      accounts: [defaultPrivateKey]
    },
    bahamut: {
      url: "https://testnet.rpc.bahamut.io",
      accounts: [PRIVATE_KEY],
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
  }
}; 