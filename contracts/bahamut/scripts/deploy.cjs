const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
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
  
  // Verify if we're on a network that supports verification
  const networkName = hre.network.name;
  if (networkName !== "localhost" && networkName !== "hardhat") {
    console.log("Waiting for block confirmations...");
    
    // Wait for 6 block confirmations
    await cycleStreakToken.deploymentTransaction().wait(6);
    await dailyRewards.deploymentTransaction().wait(6);
    
    // Verify contracts
    console.log("Verifying CycleStreakToken...");
    try {
      await hre.run("verify:verify", {
        address: await cycleStreakToken.getAddress(),
        constructorArguments: [deployer.address],
        contract: "contracts/bahamut/CycleStreakToken.sol:CycleStreakToken"
      });
    } catch (error) {
      console.error("Error verifying CycleStreakToken:", error);
    }
    
    console.log("Verifying DailyRewards...");
    try {
      await hre.run("verify:verify", {
        address: await dailyRewards.getAddress(),
        constructorArguments: [await cycleStreakToken.getAddress()],
        contract: "contracts/bahamut/DailyRewards.sol:DailyRewards"
      });
    } catch (error) {
      console.error("Error verifying DailyRewards:", error);
    }
  }
  
  // Save the contract addresses to a file
  const fs = require("fs");
  const contractAddresses = {
    CycleStreakToken: await cycleStreakToken.getAddress(),
    DailyRewards: await dailyRewards.getAddress(),
    network: networkName
  };
  
  fs.writeFileSync(
    "./contracts/bahamut/deployed-addresses.json",
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