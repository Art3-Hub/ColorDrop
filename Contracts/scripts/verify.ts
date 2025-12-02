import { run } from "hardhat";

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const treasuryAddress = process.env.TREASURY_ADDRESS;

  if (!contractAddress || !treasuryAddress) {
    console.error("❌ Error: CONTRACT_ADDRESS and TREASURY_ADDRESS must be set");
    console.log("\nUsage:");
    console.log("CONTRACT_ADDRESS=0x... TREASURY_ADDRESS=0x... npx hardhat run scripts/verify.ts --network alfajores");
    process.exit(1);
  }

  console.log("Verifying contract on CeloScan...");
  console.log("Contract Address:", contractAddress);
  console.log("Treasury Address:", treasuryAddress);

  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [treasuryAddress],
    });

    console.log("✅ Contract verified successfully!");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Contract is already verified!");
    } else {
      console.error("❌ Verification failed:", error.message);
      throw error;
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
