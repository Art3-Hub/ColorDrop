import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("🔄 Upgrading ColorDropPool...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📍 Upgrading from:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "CELO\n");

  // Proxy address from environment variable
  const proxyAddress = process.env.PROXY_ADDRESS;

  if (!proxyAddress) {
    throw new Error("❌ PROXY_ADDRESS must be set in .env file");
  }

  console.log("📍 Proxy Address:", proxyAddress);
  console.log("📍 Old Implementation:", await upgrades.erc1967.getImplementationAddress(proxyAddress));

  // Deploy new implementation
  const ColorDropPoolV2 = await ethers.getContractFactory("ColorDropPool");

  console.log("\n⏳ Deploying new implementation...");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, ColorDropPoolV2);

  await upgraded.waitForDeployment();

  console.log("\n✅ Upgrade successful!");
  console.log("📍 Proxy Address (unchanged):", proxyAddress);
  console.log("📍 New Implementation:", await upgrades.erc1967.getImplementationAddress(proxyAddress));

  // Verify upgrade
  console.log("\n🔍 Verifying upgrade...");
  const version = await upgraded.version();
  const currentPoolId = await upgraded.currentPoolId();
  const treasury1 = await upgraded.treasury1();
  const treasury2 = await upgraded.treasury2();

  console.log("✓ Contract Version:", version);
  console.log("✓ Current Pool ID:", currentPoolId.toString(), "(state preserved)");
  console.log("✓ Treasury 1:", treasury1);
  console.log("✓ Treasury 2:", treasury2);

  console.log("\n✨ Upgrade complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Upgrade failed:", error);
    process.exit(1);
  });
