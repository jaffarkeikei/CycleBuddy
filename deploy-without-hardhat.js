// Simple deployment script without Hardhat
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load contract ABIs from the Hardhat artifacts
const CycleStreakTokenArtifact = require('./artifacts/contracts/CycleStreakToken.sol/CycleStreakToken.json');
const DailyRewardsArtifact = require('./artifacts/contracts/DailyRewards.sol/DailyRewards.json');

// Hardhat's first default account private key
const PRIVATE_KEY = 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

async function main() {
  console.log('Starting deployment...');
  
  // Connect to local network
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log('Deploying with account:', wallet.address);
  
  // Get balance
  const balance = await wallet.getBalance();
  console.log('Account balance:', ethers.utils.formatEther(balance));
  
  // Deploy CycleStreakToken
  console.log('Deploying CycleStreakToken...');
  const CycleStreakTokenFactory = new ethers.ContractFactory(
    CycleStreakTokenArtifact.abi,
    CycleStreakTokenArtifact.bytecode,
    wallet
  );
  const cycleStreakToken = await CycleStreakTokenFactory.deploy();
  await cycleStreakToken.deployed();
  console.log('CycleStreakToken deployed to:', cycleStreakToken.address);
  
  // Deploy DailyRewards with token address
  console.log('Deploying DailyRewards...');
  const DailyRewardsFactory = new ethers.ContractFactory(
    DailyRewardsArtifact.abi,
    DailyRewardsArtifact.bytecode,
    wallet
  );
  const dailyRewards = await DailyRewardsFactory.deploy(cycleStreakToken.address);
  await dailyRewards.deployed();
  console.log('DailyRewards deployed to:', dailyRewards.address);
  
  // Add DailyRewards as a minter
  console.log('Adding DailyRewards as a minter...');
  const addMinterTx = await cycleStreakToken.addMinter(dailyRewards.address);
  await addMinterTx.wait();
  console.log('DailyRewards added as a minter');
  
  // Save deployment info
  const deployData = {
    network: 'localhost',
    deployer: wallet.address,
    contracts: {
      CycleStreakToken: cycleStreakToken.address,
      DailyRewards: dailyRewards.address
    },
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'deployment-info.json'),
    JSON.stringify(deployData, null, 2)
  );
  
  console.log('Deployment complete! Addresses saved to deployment-info.json');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Deployment failed:', error);
    process.exit(1);
  }); 