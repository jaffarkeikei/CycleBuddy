// Test deployment script
const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting test deployment...");
  
  // Get the signers (accounts)
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Deploy token contract first
  console.log("Deploying CycleStreakToken...");
  const CycleStreakToken = await ethers.getContractFactory("CycleStreakToken");
  const cycleStreakToken = await CycleStreakToken.deploy();
  await cycleStreakToken.deployed();
  console.log("CycleStreakToken deployed to:", cycleStreakToken.address);
  
  // Deploy rewards contract
  console.log("Deploying DailyRewards...");
  const DailyRewards = await ethers.getContractFactory("DailyRewards");
  const dailyRewards = await DailyRewards.deploy(cycleStreakToken.address);
  await dailyRewards.deployed();
  console.log("DailyRewards deployed to:", dailyRewards.address);
  
  // Add rewards contract as a minter
  console.log("Adding DailyRewards as a minter...");
  const tx = await cycleStreakToken.addMinter(dailyRewards.address);
  await tx.wait();
  console.log("DailyRewards added as a minter");
  
  // Save deployment addresses
  const deployData = {
    CycleStreakToken: cycleStreakToken.address,
    DailyRewards: dailyRewards.address,
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(__dirname, "../test-addresses.json"),
    JSON.stringify(deployData, null, 2)
  );
  
  console.log("Deployment addresses saved!");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 