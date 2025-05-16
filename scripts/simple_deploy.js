// simple_deploy.js - Simplified deployment script
const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  console.log("Deploying CycleStreakToken...");
  const CycleStreakToken = await ethers.getContractFactory("CycleStreakToken");
  const token = await CycleStreakToken.deploy();
  await token.deployed();
  console.log("CycleStreakToken deployed to:", token.address);
  
  console.log("Deploying DailyRewards...");
  const DailyRewards = await ethers.getContractFactory("DailyRewards");
  const rewards = await DailyRewards.deploy(token.address);
  await rewards.deployed();
  console.log("DailyRewards deployed to:", rewards.address);
  
  // Add the rewards contract as a minter
  console.log("Setting up DailyRewards as a token minter...");
  await token.addMinter(rewards.address);
  console.log("DailyRewards added as a minter");
  
  // Save deployment addresses
  const deployment = {
    CycleStreakToken: token.address,
    DailyRewards: rewards.address,
    deployer: deployer.address,
    network: network.name,
    timestamp: new Date().toISOString()
  };
  
  const deploymentFile = path.join(__dirname, "../deployment-addresses.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
  console.log("Deployment addresses saved to:", deploymentFile);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 