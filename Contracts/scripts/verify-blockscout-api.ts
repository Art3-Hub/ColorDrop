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
 * Verify contract on Blockscout using API
 * Blockscout API endpoint: /api/v2/smart-contracts/{address}/verification/via/flattened-code
 */

async function verifyContract(
  contractAddress: string,
  contractName: string,
  sourceCode: string,
  constructorArgs: string,
  blockscoutApiUrl: string
) {
  console.log(`\n🔍 Verifying ${contractName} at ${contractAddress}...`);

  const verificationData = {
    sourceCode: sourceCode,
    contractName: contractName,
    compilerVersion: "v0.8.22+commit.4fc1097e",
    optimization: true,
    optimizationRuns: 200,
    constructorArguments: constructorArgs,
    evmVersion: "default",
    libraries: {}
  };

  try {
    const response = await fetch(
      `${blockscoutApiUrl}/api/v2/smart-contracts/${contractAddress}/verification/via/flattened-code`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(verificationData),
      }
    );

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ ${contractName} verification submitted successfully!`);
      console.log(`   Status: ${result.status || "Pending"}`);
      console.log(`   Message: ${result.message || "Contract verification in progress"}`);
      return true;
    } else {
      console.log(`❌ ${contractName} verification failed`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${JSON.stringify(result, null, 2)}`);
      return false;
    }
  } catch (error: any) {
    console.log(`❌ ${contractName} verification error:`, error.message);
    return false;
  }
}

async function main() {
  // Network configuration
  const network = hre.network.name;
  let blockscoutApiUrl: string;
  let proxyAddress: string;
  let implementationAddress: string;

  if (network === "celo") {
    blockscoutApiUrl = "https://celo.blockscout.com";
    proxyAddress = process.env.PROXY_ADDRESS || "";
    implementationAddress = process.env.IMPLEMENTATION_ADDRESS || "";
  } else if (network === "sepolia") {
    blockscoutApiUrl = "https://celo-sepolia.blockscout.com";
    proxyAddress = process.env.SEPOLIA_PROXY_ADDRESS || "";
    implementationAddress = process.env.SEPOLIA_IMPLEMENTATION_ADDRESS || "";
  } else {
    throw new Error(`Unsupported network: ${network}`);
  }

  console.log("🔍 Blockscout API Contract Verification\n");
  console.log("Network:", network);
  console.log("Blockscout API URL:", blockscoutApiUrl);
  console.log("Proxy Address:", proxyAddress);
  console.log("Implementation Address:", implementationAddress);

  // Get constructor arguments
  const admin = process.env.ADMIN_ADDRESS;
  const upgrader = process.env.UPGRADER_ADDRESS;
  const treasury1 = process.env.TREASURY_ADDRESS_1;
  const treasury2 = process.env.TREASURY_ADDRESS_2;
  const verifier = process.env.VERIFIER_ADDRESS;

  if (!admin || !upgrader || !treasury1 || !treasury2 || !verifier) {
    throw new Error("Missing environment variables");
  }

  console.log("\n📋 Constructor Arguments:");
  console.log("  Admin:", admin);
  console.log("  Upgrader:", upgrader);
  console.log("  Treasury 1:", treasury1);
  console.log("  Treasury 2:", treasury2);
  console.log("  Verifier:", verifier);

  // Encode constructor arguments (remove 0x prefix for Blockscout)
  const abiCoder = new ethers.AbiCoder();
  const constructorArgs = abiCoder.encode(
    ["address", "address", "address", "address", "address"],
    [admin, upgrader, treasury1, treasury2, verifier]
  ).slice(2); // Remove 0x prefix

  console.log("\n🔧 Constructor Args (ABI-encoded):");
  console.log("  ", constructorArgs);

  // Read flattened contract source
  const flattenedPath = path.join(__dirname, "../flattened.sol");

  if (!fs.existsSync(flattenedPath)) {
    console.log("\n❌ flattened.sol not found. Generating...");

    try {
      const { execSync } = await import("child_process");
      execSync(`npx hardhat flatten contracts/ColorDropPool.sol > ${flattenedPath}`, {
        cwd: path.join(__dirname, ".."),
        stdio: "inherit"
      });
      console.log("✅ Flattened contract generated");
    } catch (error) {
      throw new Error("Could not generate flattened contract. Run: npm run flatten");
    }
  }

  const sourceCode = fs.readFileSync(flattenedPath, "utf8");
  console.log("\n📄 Flattened source code loaded");
  console.log(`   Size: ${sourceCode.length} characters`);

  // Verify Implementation contract
  console.log("\n" + "=".repeat(60));
  console.log("VERIFYING IMPLEMENTATION CONTRACT");
  console.log("=".repeat(60));

  const implementationSuccess = await verifyContract(
    implementationAddress,
    "ColorDropPool",
    sourceCode,
    constructorArgs,
    blockscoutApiUrl
  );

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("VERIFICATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`Implementation: ${implementationSuccess ? "✅ SUCCESS" : "❌ FAILED"}`);
  console.log("\n🔗 Contract Links:");
  console.log(`   Proxy: ${blockscoutApiUrl}/address/${proxyAddress}`);
  console.log(`   Implementation: ${blockscoutApiUrl}/address/${implementationAddress}`);
  console.log("\n⚠️  Note: Proxy contracts are automatically detected by Blockscout");
  console.log("   once the implementation is verified.\n");

  if (!implementationSuccess) {
    console.log("❌ Verification failed. You may need to verify manually:");
    console.log(`   ${blockscoutApiUrl}/address/${implementationAddress}?tab=contract_code`);
    console.log("\nManual verification details:");
    console.log("  - Compiler: v0.8.22+commit.4fc1097e");
    console.log("  - Optimization: Yes (200 runs)");
    console.log("  - Constructor args:", constructorArgs);
    process.exit(1);
  }

  console.log("✅ All verifications completed successfully!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
