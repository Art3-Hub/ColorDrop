import hre from "hardhat";
const { ethers, upgrades } = hre;

async function main() {
  console.log("🚀 Deploying ColorDropPool (Upgradeable)...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying from:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "CELO\n");

  // Treasury and verifier addresses from environment variables
  const treasury1 = process.env.TREASURY_ADDRESS_1;
  const treasury2 = process.env.TREASURY_ADDRESS_2;
  const verifier = process.env.VERIFIER_ADDRESS;

  if (!treasury1 || !treasury2 || !verifier) {
    throw new Error("❌ TREASURY_ADDRESS_1, TREASURY_ADDRESS_2, and VERIFIER_ADDRESS must be set in .env file");
  }

  console.log("🏦 Treasury 1:", treasury1);
  console.log("🏦 Treasury 2:", treasury2);
  console.log("🔐 Verifier:", verifier);
  console.log("💸 Each treasury receives: 0.1 CELO per pool (50/50 split)\n");

  // Deploy upgradeable contract
  const ColorDropPool = await ethers.getContractFactory("ColorDropPool");

  console.log("⏳ Deploying proxy contract...");
  const colorDropPool = await upgrades.deployProxy(
    ColorDropPool,
    [treasury1, treasury2, verifier],
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
  console.log("✓ System Fee:", ethers.formatEther(systemFee), "CELO (split 50/50)");
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
