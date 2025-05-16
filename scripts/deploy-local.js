const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  
  // Deploy CycleStreakToken
  const CycleStreakToken = await ethers.getContractFactory("CycleStreakToken");
  const cycleStreakToken = await CycleStreakToken.deploy();
  await cycleStreakToken.deployed();
  
  console.log("CycleStreakToken deployed to:", cycleStreakToken.address);
  
  // Deploy DailyRewards
  const DailyRewards = await ethers.getContractFactory("DailyRewards");
  const dailyRewards = await DailyRewards.deploy(cycleStreakToken.address);
  await dailyRewards.deployed();
  
  console.log("DailyRewards deployed to:", dailyRewards.address);
  
  // Add rewards contract as a minter for the token
  console.log("Adding rewards contract as a minter...");
  const addMinterTx = await cycleStreakToken.addMinter(dailyRewards.address);
  await addMinterTx.wait();
  console.log("Rewards contract added as a minter.");
  
  // Save the contract addresses to a file
  const contractAddresses = {
    CycleStreakToken: cycleStreakToken.address,
    DailyRewards: dailyRewards.address,
    network: "localhost"
  };
  
  fs.writeFileSync(
    path.join(__dirname, "../deployed-addresses.json"),
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