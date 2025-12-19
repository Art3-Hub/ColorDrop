import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("🔄 Resetting activePoolId for affected user...\n");

  // Get admin account
  const [admin] = await ethers.getSigners();
  console.log("📍 Admin address:", admin.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(admin.address)), "CELO\n");

  // Proxy address
  const proxyAddress = process.env.PROXY_ADDRESS;
  if (!proxyAddress) {
    throw new Error("❌ PROXY_ADDRESS must be set in .env file");
  }

  // User address to reset - set via USER_TO_RESET environment variable
  const userToReset = process.env.USER_TO_RESET;
  if (!userToReset) {
    throw new Error("❌ Please set USER_TO_RESET environment variable: USER_TO_RESET=0xADDRESS npx hardhat run scripts/resetActivePoolId.ts --network celo");
  }

  console.log("📍 Proxy Address:", proxyAddress);
  console.log("📍 User to reset:", userToReset);

  // Get contract instance
  const ColorDropPool = await ethers.getContractFactory("ColorDropPool");
  const pool = ColorDropPool.attach(proxyAddress);

  // Check current state
  const activePoolIdBefore = await pool.activePoolId(userToReset);
  const userStatusBefore = await pool.getUserStatus(userToReset);

  console.log("\n📊 Before reset:");
  console.log("   activePoolId:", activePoolIdBefore.toString());
  console.log("   canJoin:", userStatusBefore.canJoin);
  console.log("   slotsUsed:", userStatusBefore.slotsUsed.toString());

  if (activePoolIdBefore === 0n) {
    console.log("\n✅ activePoolId is already 0 - no reset needed!");
    return;
  }

  // Reset activePoolId
  console.log("\n⏳ Calling resetActivePoolId...");
  const tx = await pool.resetActivePoolId(userToReset);
  console.log("📝 Transaction hash:", tx.hash);

  await tx.wait();
  console.log("✅ Transaction confirmed!");

  // Check new state
  const activePoolIdAfter = await pool.activePoolId(userToReset);
  const userStatusAfter = await pool.getUserStatus(userToReset);

  console.log("\n📊 After reset:");
  console.log("   activePoolId:", activePoolIdAfter.toString());
  console.log("   canJoin:", userStatusAfter.canJoin);
  console.log("   slotsUsed:", userStatusAfter.slotsUsed.toString());

  console.log("\n✨ Reset complete! User can now join a new slot.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Reset failed:", error);
    process.exit(1);
  });
