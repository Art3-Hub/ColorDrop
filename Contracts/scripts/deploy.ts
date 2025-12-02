import { ethers } from "hardhat";

async function main() {
  console.log("Starting ColorDropPool deployment to Celo...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "CELO");

  // Treasury address (update this with your actual treasury address)
  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
  console.log("Treasury address:", treasuryAddress);

  // Deploy ColorDropPool
  console.log("\nDeploying ColorDropPool...");
  const ColorDropPool = await ethers.getContractFactory("ColorDropPool");
  const colorDropPool = await ColorDropPool.deploy(treasuryAddress);

  await colorDropPool.waitForDeployment();

  const contractAddress = await colorDropPool.getAddress();
  console.log("✅ ColorDropPool deployed to:", contractAddress);

  // Wait for a few block confirmations before verification
  console.log("\nWaiting for block confirmations...");
  await colorDropPool.deploymentTransaction()?.wait(5);

  console.log("\n📋 Deployment Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Contract Address:", contractAddress);
  console.log("Treasury Address:", treasuryAddress);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log("\n🔍 To verify the contract, run:");
  console.log(
    `npx hardhat verify --network ${
      (await ethers.provider.getNetwork()).name
    } ${contractAddress} ${treasuryAddress}`
  );

  // Return deployment info
  return {
    contractAddress,
    treasuryAddress,
    deployer: deployer.address,
  };
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
