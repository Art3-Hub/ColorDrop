import hre from "hardhat";
const { ethers, upgrades } = hre;

async function main() {
  console.log("🚀 Deploying ColorDropPool (Upgradeable)...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying from:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "CELO\n");

  // Role addresses from environment variables
  const admin = process.env.ADMIN_ADDRESS; // Primary owner
  const upgrader = process.env.UPGRADER_ADDRESS; // Can deploy and upgrade
  const treasury1 = process.env.TREASURY_ADDRESS_1; // Primary treasury (gets remainder)
  const treasury2 = process.env.TREASURY_ADDRESS_2;
  const treasury3 = process.env.TREASURY_ADDRESS_3;

  if (!admin || !upgrader || !treasury1 || !treasury2 || !treasury3) {
    throw new Error("❌ ADMIN_ADDRESS, UPGRADER_ADDRESS, TREASURY_ADDRESS_1, TREASURY_ADDRESS_2, and TREASURY_ADDRESS_3 must be set in .env file");
  }

  console.log("👑 Admin (Primary Owner):", admin);
  console.log("🔧 Upgrader (Deploy/Upgrade):", upgrader);
  console.log("🏦 Treasury 1 (Primary):", treasury1);
  console.log("🏦 Treasury 2:", treasury2);
  console.log("🏦 Treasury 3:", treasury3);
  console.log("💸 Each treasury receives: 0.25 CELO per pool (3-way split)\n");

  // Deploy upgradeable contract
  const ColorDropPool = await ethers.getContractFactory("ColorDropPool");

  console.log("⏳ Deploying proxy contract...");
  const colorDropPool = await upgrades.deployProxy(
    ColorDropPool,
    [admin, upgrader, treasury1, treasury2, treasury3],
    {
      initializer: "initialize",
      kind: "uups" // Can be 'transparent' or 'uups'
    }
  );

  await colorDropPool.waitForDeployment();
  const proxyAddress = await colorDropPool.getAddress();

  console.log("\n✅ ColorDropPool deployed successfully!");
  console.log("📍 Proxy Address:", proxyAddress);
  console.log("📍 Implementation Address:", await upgrades.erc1967.getImplementationAddress(proxyAddress));
  console.log("📍 Admin Address:", await upgrades.erc1967.getAdminAddress(proxyAddress));

  // Verify contract configuration
  console.log("\n🔍 Verifying configuration...");
  const entryFee = await colorDropPool.ENTRY_FEE();
  const poolSize = await colorDropPool.POOL_SIZE();
  const prize1st = await colorDropPool.PRIZE_1ST();
  const prize2nd = await colorDropPool.PRIZE_2ND();
  const prize3rd = await colorDropPool.PRIZE_3RD();
  const systemFee = await colorDropPool.SYSTEM_FEE();
  const currentPoolId = await colorDropPool.currentPoolId();
  const version = await colorDropPool.version();

  console.log("✓ Entry Fee:", ethers.formatEther(entryFee), "CELO");
  console.log("✓ Pool Size:", poolSize.toString(), "players");
  console.log("✓ 1st Prize:", ethers.formatEther(prize1st), "CELO");
  console.log("✓ 2nd Prize:", ethers.formatEther(prize2nd), "CELO");
  console.log("✓ 3rd Prize:", ethers.formatEther(prize3rd), "CELO");
  console.log("✓ System Fee:", ethers.formatEther(systemFee), "CELO (split 3 ways)");
  console.log("✓ Current Pool ID:", currentPoolId.toString());
  console.log("✓ Contract Version:", version);

  console.log("\n📝 Save these addresses to your .env file:");
  console.log(`PROXY_ADDRESS=${proxyAddress}`);
  console.log(`IMPLEMENTATION_ADDRESS=${await upgrades.erc1967.getImplementationAddress(proxyAddress)}`);

  console.log("\n🎮 To verify on CeloScan, run:");
  console.log(`npx hardhat verify --network celo ${proxyAddress}`);

  console.log("\n✨ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
