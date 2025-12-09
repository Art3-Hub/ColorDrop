import hre from "hardhat";
const { ethers } = hre;

async function main() {
  const contractAddress = "0x723D8583b56456A0343589114228281F37a3b290";
  const newVerifier = "0x499d377ef114cc1bf7798cecbb38412701400daf";

  console.log("🔄 Updating verifier address...\n");
  console.log("Contract:", contractAddress);
  console.log("New Verifier:", newVerifier);
  console.log("(This wallet is also the contract owner)\n");

  const [signer] = await ethers.getSigners();
  console.log("Executing from:", signer.address);

  const contract = await ethers.getContractAt("ColorDropPool", contractAddress);

  // Check current verifier
  const oldVerifier = await contract.verifier();
  console.log("\n📍 Current verifier:", oldVerifier);

  if (oldVerifier.toLowerCase() === newVerifier.toLowerCase()) {
    console.log("✅ Verifier is already set correctly!");
    return;
  }

  console.log("\n⏳ Sending transaction to update verifier...");
  const tx = await contract.setVerifier(newVerifier);
  console.log("Transaction hash:", tx.hash);

  console.log("⏳ Waiting for confirmation...");
  await tx.wait();

  console.log("\n✅ Verifier updated successfully!");

  // Verify the change
  const currentVerifier = await contract.verifier();
  console.log("🔍 New verifier:", currentVerifier);

  console.log("\n📝 Update your backend .env with:");
  console.log(`VERIFIER_PRIVATE_KEY=<private_key_of_${newVerifier}>`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
