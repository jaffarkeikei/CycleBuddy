// Simple deployment script for local hardhat network
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment...");
  
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
  
  // Save deployment addresses
  const deployData = {
    CycleStreakToken: cycleStreakToken.address,
    DailyRewards: dailyRewards.address,
    network: "localhost"
  };
  
  fs.writeFileSync(
    path.join(__dirname, "../deployed-addresses.json"),
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