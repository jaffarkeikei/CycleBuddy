// Simple script to generate a random Ethereum wallet
const { ethers } = require("ethers");

function generateWallet() {
  // Create a random wallet
  const wallet = ethers.Wallet.createRandom();
  
  console.log("Generated a new wallet:");
  console.log("---------------------");
  console.log(`Address:      ${wallet.address}`);
  console.log(`Private Key:  ${wallet.privateKey}`);
  console.log(`Without 0x:   ${wallet.privateKey.substring(2)}`);
  console.log("---------------------");
  console.log("IMPORTANT: Save this private key securely and never share it!");
}

generateWallet(); 