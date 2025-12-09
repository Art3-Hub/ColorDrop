import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const { ethers } = hre;

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Verify contract on Blockscout
 *
 * Blockscout supports automatic verification through their API
 * This script prepares and submits the contract for verification
 */

async function main() {
  // Contract addresses
  const PROXY_ADDRESS = process.env.PROXY_ADDRESS || "0x39E653277AFa663B9b00C777c608B6E998cCBb22";
  const IMPLEMENTATION_ADDRESS = process.env.IMPLEMENTATION_ADDRESS || "0x1eDf8c2290d4a14FDd80c5522AaE2F8d13F6BA43";

  // Network configuration
  const network = hre.network.name;
  let blockscoutUrl: string;

  if (network === "celo") {
    blockscoutUrl = "https://celo.blockscout.com";
  } else if (network === "sepolia") {
    blockscoutUrl = "https://celo-sepolia.blockscout.com";
  } else {
    throw new Error(`Unsupported network: ${network}`);
  }

  console.log("🔍 Blockscout Contract Verification\n");
  console.log("Network:", network);
  console.log("Blockscout URL:", blockscoutUrl);
  console.log("Proxy Address:", PROXY_ADDRESS);
  console.log("Implementation Address:", IMPLEMENTATION_ADDRESS);
  console.log("");

  // Read contract source code
  const contractPath = path.join(__dirname, "../contracts/ColorDropPool.sol");
  const contractSource = fs.readFileSync(contractPath, "utf8");

  // Get compiler version
  const compilerVersion = "v0.8.22+commit.4fc1097e";

  // Get constructor arguments
  const treasury1 = process.env.TREASURY_ADDRESS_1;
  const treasury2 = process.env.TREASURY_ADDRESS_2;
  const verifier = process.env.VERIFIER_ADDRESS;

  if (!treasury1 || !treasury2 || !verifier) {
    throw new Error("Missing environment variables: TREASURY_ADDRESS_1, TREASURY_ADDRESS_2, or VERIFIER_ADDRESS");
  }

  console.log("📋 Constructor Arguments:");
  console.log("  Treasury 1:", treasury1);
  console.log("  Treasury 2:", treasury2);
  console.log("  Verifier:", verifier);
  console.log("");

  // Encode constructor arguments
  const abiCoder = new ethers.AbiCoder();
  const constructorArgs = abiCoder.encode(
    ["address", "address", "address"],
    [treasury1, treasury2, verifier]
  );

  console.log("🔧 Verification Details:");
  console.log("  Contract Name: ColorDropPool");
  console.log("  Compiler Version:", compilerVersion);
  console.log("  Optimization: Enabled (200 runs)");
  console.log("  Constructor Args (encoded):", constructorArgs);
  console.log("");

  // Instructions for manual verification
  console.log("📝 Manual Verification Instructions:\n");
  console.log("Since Blockscout doesn't have a direct API for verification,");
  console.log("please verify manually through the web interface:\n");

  console.log("1. Go to Blockscout:");
  console.log(`   ${blockscoutUrl}/address/${IMPLEMENTATION_ADDRESS}\n`);

  console.log("2. Click 'Code' tab → 'Verify & Publish'\n");

  console.log("3. Enter the following details:");
  console.log("   - Contract Address:", IMPLEMENTATION_ADDRESS);
  console.log("   - Contract Name: ColorDropPool");
  console.log("   - Compiler: v0.8.22+commit.4fc1097e");
  console.log("   - Optimization: Yes");
  console.log("   - Runs: 200");
  console.log("   - EVM Version: default");
  console.log("");

  console.log("4. Paste the flattened contract source code:");
  console.log("   Run: npx hardhat flatten contracts/ColorDropPool.sol > flattened.sol");
  console.log("");

  console.log("5. Constructor Arguments (ABI-encoded):");
  console.log(`   ${constructorArgs.slice(2)}`); // Remove 0x prefix
  console.log("");

  console.log("6. Click 'Verify and Publish'\n");

  console.log("🔗 Quick Links:");
  console.log(`   Proxy: ${blockscoutUrl}/address/${PROXY_ADDRESS}`);
  console.log(`   Implementation: ${blockscoutUrl}/address/${IMPLEMENTATION_ADDRESS}`);
  console.log("");

  // Create flattened contract
  console.log("📄 Creating flattened contract for verification...");

  try {
    const { execSync } = await import("child_process");
    const flattenedPath = path.join(__dirname, "../flattened.sol");

    execSync(`npx hardhat flatten contracts/ColorDropPool.sol > ${flattenedPath}`, {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit"
    });

    console.log(`✅ Flattened contract created: ${flattenedPath}`);
    console.log("   You can now copy this file for manual verification\n");
  } catch (error) {
    console.log("⚠️  Could not create flattened contract automatically");
    console.log("   Run manually: npx hardhat flatten contracts/ColorDropPool.sol > flattened.sol\n");
  }

  // Alternative: Use Hardhat verify plugin with Blockscout
  console.log("🚀 Alternative: Try Hardhat Verify (may work with Blockscout):\n");
  console.log(`   npx hardhat verify --network ${network} ${IMPLEMENTATION_ADDRESS} "${treasury1}" "${treasury2}" "${verifier}"`);
  console.log("");

  console.log("✨ Verification guide complete!");
  console.log("");
  console.log("⚠️  Note: Proxy contracts are automatically recognized by Blockscout");
  console.log("   You only need to verify the implementation contract.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
