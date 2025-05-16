const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Get the contract factories
  const CycleStreakToken = await ethers.getContractFactory("CycleStreakToken", {
    path: path.resolve(__dirname, "../CycleStreakToken.local.sol")
  });
  
  const DailyRewards = await ethers.getContractFactory("DailyRewards", {
    path: path.resolve(__dirname, "../DailyRewards.local.sol")
  });
  
  console.log("Deploying contracts...");
  
  // Deploy the CycleStreakToken
  const cycleStreakToken = await CycleStreakToken.deploy();
  await cycleStreakToken.deployed();
  console.log("CycleStreakToken deployed to:", cycleStreakToken.address);
  
  // Deploy the DailyRewards
  const dailyRewards = await DailyRewards.deploy(cycleStreakToken.address);
  await dailyRewards.deployed();
  console.log("DailyRewards deployed to:", dailyRewards.address);
  
  // Add the DailyRewards contract as a minter
  console.log("Adding DailyRewards as a minter for CycleStreakToken...");
  const tx = await cycleStreakToken.addMinter(dailyRewards.address);
  await tx.wait();
  console.log("DailyRewards added as a minter successfully");
  
  // Save the deployed addresses
  const deploymentData = {
    CycleStreakToken: cycleStreakToken.address,
    DailyRewards: dailyRewards.address,
    network: (await ethers.provider.getNetwork()).name
  };
  
  fs.writeFileSync(
    path.resolve(__dirname, "../deployed-addresses.json"),
    JSON.stringify(deploymentData, null, 2)
  );
  
  console.log("Deployment addresses saved to deployed-addresses.json");
  console.log("Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 