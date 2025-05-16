const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  
  // Deploy CycleStreakToken
  const CycleStreakToken = await ethers.getContractFactory("CycleStreakToken");
  const cycleStreakToken = await CycleStreakToken.deploy(deployer.address);
  await cycleStreakToken.waitForDeployment();
  
  console.log("CycleStreakToken deployed to:", await cycleStreakToken.getAddress());
  
  // Deploy DailyRewards
  const DailyRewards = await ethers.getContractFactory("DailyRewards");
  const dailyRewards = await DailyRewards.deploy(await cycleStreakToken.getAddress());
  await dailyRewards.waitForDeployment();
  
  console.log("DailyRewards deployed to:", await dailyRewards.getAddress());
  
  // Add rewards contract as a minter for the token
  console.log("Adding rewards contract as a minter...");
  const addMinterTx = await cycleStreakToken.addMinter(await dailyRewards.getAddress());
  await addMinterTx.wait();
  console.log("Rewards contract added as a minter.");
  
  // Save the contract addresses to a file
  const contractAddresses = {
    CycleStreakToken: await cycleStreakToken.getAddress(),
    DailyRewards: await dailyRewards.getAddress(),
    network: "localhost"
  };
  
  // Ensure directory exists
  const dirPath = path.resolve("./contracts/bahamut");
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  fs.writeFileSync(
    path.resolve("./contracts/bahamut/deployed-addresses.json"),
    JSON.stringify(contractAddresses, null, 2)
  );
  
  console.log("Contract addresses saved to deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 