import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
// import "@openzeppelin/hardhat-upgrades"; // Temporarily disabled due to Hardhat 3.0 compatibility
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Celo Mainnet
    celo: {
      type: "http" as const,
      url: process.env.CELO_RPC_URL || "https://forno.celo.org",
      chainId: 42220,
    },
    // Celo Sepolia Testnet
    sepolia: {
      type: "http" as const,
      url: process.env.SEPOLIA_RPC_URL || "https://sepolia-forno.celo-testnet.org",
      chainId: 84532,
    },
    // Local development
    localhost: {
      type: "http" as const,
      url: "http://127.0.0.1:8545",
    },
  },
  etherscan: {
    apiKey: {
      // Celo uses CeloScan
      celo: process.env.CELOSCAN_API_KEY || "",
      sepolia: process.env.CELOSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io",
        },
      },
      {
        network: "sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.celoscan.io/api",
          browserURL: "https://sepolia.celoscan.io",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
  },
};

export default config;
