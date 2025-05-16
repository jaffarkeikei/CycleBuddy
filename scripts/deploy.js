// Deployment script for CycleStreak token and DailyRewards contracts
const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment process...");

  // Get the contract factories
  const CycleStreakToken = await ethers.getContractFactory("CycleStreakToken");
  const DailyRewards = await ethers.getContractFactory("DailyRewards");

  // Deploy CycleStreakToken
  console.log("Deploying CycleStreakToken...");
  const cycleStreakToken = await CycleStreakToken.deploy();
  await cycleStreakToken.deployed();
  console.log("CycleStreakToken deployed to:", cycleStreakToken.address);

  // Deploy DailyRewards with the token address
  console.log("Deploying DailyRewards...");
  const dailyRewards = await DailyRewards.deploy(cycleStreakToken.address);
  await dailyRewards.deployed();
  console.log("DailyRewards deployed to:", dailyRewards.address);

  // Add the DailyRewards contract as a minter
  console.log("Setting up DailyRewards as a token minter...");
  const addMinterTx = await cycleStreakToken.addMinter(dailyRewards.address);
  await addMinterTx.wait();
  console.log("DailyRewards added as a minter");

  // Save deployment addresses to a file
  const deploymentData = {
    network: network.name,
    chainId: network.config.chainId,
    contracts: {
      CycleStreakToken: cycleStreakToken.address,
      DailyRewards: dailyRewards.address
    },
    timestamp: new Date().toISOString()
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const filePath = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(deploymentData, null, 2));
  console.log(`Deployment data saved to ${filePath}`);

  console.log("Deployment completed successfully!");
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 