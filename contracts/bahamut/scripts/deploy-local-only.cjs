const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  
  // Compile the local contracts first
  console.log("Compiling local contracts...");
  // Read the contract source code
  const tokenSource = fs.readFileSync(path.resolve("./CycleStreakToken.local.sol"), "utf8");
  const rewardsSource = fs.readFileSync(path.resolve("./DailyRewards.local.sol"), "utf8");
  
  // Deploy CycleStreakToken
  console.log("Deploying CycleStreakToken...");
  const tokenFactory = await ethers.ContractFactory.fromSolidity(tokenSource, deployer);
  const cycleStreakToken = await tokenFactory.deploy();
  await cycleStreakToken.deployed();
  console.log("CycleStreakToken deployed to:", cycleStreakToken.address);
  
  // Deploy DailyRewards using the CycleStreakToken address
  console.log("Deploying DailyRewards...");
  const rewardsFactory = await ethers.ContractFactory.fromSolidity(rewardsSource, deployer);
  const dailyRewards = await rewardsFactory.deploy(cycleStreakToken.address);
  await dailyRewards.deployed();
  console.log("DailyRewards deployed to:", dailyRewards.address);
  
  // Add DailyRewards as a minter
  console.log("Adding DailyRewards as a minter...");
  const tx = await cycleStreakToken.addMinter(dailyRewards.address);
  await tx.wait();
  console.log("DailyRewards added as a minter");
  
  // Save the deployed addresses
  const deployedAddresses = {
    CycleStreakToken: cycleStreakToken.address,
    DailyRewards: dailyRewards.address,
    network: "localhost"
  };
  
  fs.writeFileSync(
    path.resolve("./deployed-addresses.json"),
    JSON.stringify(deployedAddresses, null, 2)
  );
  
  console.log("Deployment addresses saved to deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 