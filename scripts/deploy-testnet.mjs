import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, createWalletClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rpcUrl = process.env.RPC_URL;
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

if (!rpcUrl || !privateKey) {
  throw new Error("Set RPC_URL and DEPLOYER_PRIVATE_KEY in your local .env before deploying.");
}

const account = privateKeyToAccount(privateKey);
const admin = process.env.ADMIN_WALLET || account.address;
const publicClient = createPublicClient({ chain: baseSepolia, transport: http(rpcUrl) });
const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http(rpcUrl) });

function artifact(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

const mockUsdc = artifact("artifacts/contracts/MockUSDC.sol/MockUSDC.json");
const factory = artifact("artifacts/contracts/PredictionMarketFactory.sol/PredictionMarketFactory.json");

console.log(`Deployer: ${account.address}`);
console.log(`Factory owner: ${admin}`);
console.log("Deploying MockUSDC…");

const usdcHash = await walletClient.deployContract({
  abi: mockUsdc.abi,
  bytecode: mockUsdc.bytecode,
  args: [admin],
});
const usdcReceipt = await publicClient.waitForTransactionReceipt({ hash: usdcHash });
const usdcAddress = usdcReceipt.contractAddress;
if (!usdcAddress) throw new Error("MockUSDC deployment did not return a contract address.");
console.log(`MockUSDC: ${usdcAddress}`);

console.log("Deploying PredictionMarketFactory…");
const factoryHash = await walletClient.deployContract({
  abi: factory.abi,
  bytecode: factory.bytecode,
  args: [admin, usdcAddress],
});
const factoryReceipt = await publicClient.waitForTransactionReceipt({ hash: factoryHash });
const factoryAddress = factoryReceipt.contractAddress;
if (!factoryAddress) throw new Error("Factory deployment did not return a contract address.");
console.log(`PredictionMarketFactory: ${factoryAddress}`);

console.log("\nAdd these values to .env.local, then restart Next.js:");
console.log(`NEXT_PUBLIC_CHAIN_ID=84532`);
console.log(`NEXT_PUBLIC_MARKET_FACTORY_ADDRESS=${factoryAddress}`);
console.log(`NEXT_PUBLIC_COLLATERAL_TOKEN_ADDRESS=${usdcAddress}`);
console.log(`NEXT_PUBLIC_COLLATERAL_DECIMALS=6`);
console.log(`\nBaseScan: https://sepolia.basescan.org/address/${factoryAddress}`);
