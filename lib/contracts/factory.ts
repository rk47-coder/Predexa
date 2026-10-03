import { decodeFunctionResult, encodeFunctionData, isAddress, parseUnits } from "viem";
import { getEthereumProvider } from "../wallet";

const erc20Abi = [
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
] as const;

export const predictionMarketFactoryAbi = [
  {
    type: "function",
    name: "createMarket",
    stateMutability: "nonpayable",
    inputs: [{ name: "params", type: "tuple", components: [
      { name: "question", type: "string" },
      { name: "category", type: "string" },
      { name: "description", type: "string" },
      { name: "resolutionSource", type: "string" },
      { name: "resolutionCriteria", type: "string" },
      { name: "tradingClosesAt", type: "uint64" },
      { name: "resolutionDeadline", type: "uint64" },
      { name: "initialLiquidity", type: "uint256" },
    ] }],
    outputs: [{ name: "marketAddress", type: "address" }],
  },
] as const;

type RpcProvider = NonNullable<ReturnType<typeof getEthereumProvider>>;

export type CreateMarketInput = {
  adminAddress: string;
  question: string;
  category: string;
  description: string;
  resolutionSource: string;
  resolutionCriteria: string;
  tradingClosesAt: Date;
  resolutionDeadline: Date;
  initialLiquidity: string;
};

export type CreateMarketResult = {
  approvalHash?: string;
  transactionHash: string;
};

const factoryAddress = process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS ?? "";
const collateralAddress = process.env.NEXT_PUBLIC_COLLATERAL_TOKEN_ADDRESS ?? "";
const expectedChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "84532");
const collateralDecimals = Number(process.env.NEXT_PUBLIC_COLLATERAL_DECIMALS ?? "6");

export function isOnchainDeploymentConfigured() {
  return isAddress(factoryAddress) && isAddress(collateralAddress);
}

function ensureDeploymentConfig() {
  if (!isOnchainDeploymentConfigured()) {
    throw new Error("On-chain deployment is not configured. Add the factory and USDC addresses to .env.local.");
  }
}

async function waitForConfirmation(provider: RpcProvider, hash: string) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const receipt = await provider.request({ method: "eth_getTransactionReceipt", params: [hash] }) as { status?: string } | null;
    if (receipt) {
      if (receipt.status === "0x0") throw new Error("The on-chain transaction reverted.");
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_500));
  }
  throw new Error("Transaction is still pending. Check the transaction in your wallet.");
}

export async function createMarketOnchain(input: CreateMarketInput): Promise<CreateMarketResult> {
  ensureDeploymentConfig();
  const provider = getEthereumProvider();
  if (!provider?.isMetaMask) throw new Error("MetaMask is required to create a market.");

  const chainIdHex = await provider.request({ method: "eth_chainId" }) as string;
  if (Number.parseInt(chainIdHex, 16) !== expectedChainId) {
    throw new Error(`Switch MetaMask to chain ID ${expectedChainId} before creating a market.`);
  }

  const liquidity = parseUnits(input.initialLiquidity, collateralDecimals);
  if (liquidity <= BigInt(0)) throw new Error("Initial liquidity must be greater than zero.");

  const allowanceData = encodeFunctionData({
    abi: erc20Abi,
    functionName: "allowance",
    args: [input.adminAddress as `0x${string}`, factoryAddress as `0x${string}`],
  });
  const allowanceResponse = await provider.request({ method: "eth_call", params: [{ to: collateralAddress, data: allowanceData }, "latest"] }) as `0x${string}`;
  const allowance = decodeFunctionResult({ abi: erc20Abi, functionName: "allowance", data: allowanceResponse });

  let approvalHash: string | undefined;
  if (allowance < liquidity) {
    const approvalData = encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [factoryAddress as `0x${string}`, liquidity],
    });
    approvalHash = await provider.request({ method: "eth_sendTransaction", params: [{ from: input.adminAddress, to: collateralAddress, data: approvalData }] }) as string;
    await waitForConfirmation(provider, approvalHash);
  }

  const data = encodeFunctionData({
    abi: predictionMarketFactoryAbi,
    functionName: "createMarket",
    args: [{
      question: input.question,
      category: input.category,
      description: input.description,
      resolutionSource: input.resolutionSource,
      resolutionCriteria: input.resolutionCriteria,
      tradingClosesAt: BigInt(Math.floor(input.tradingClosesAt.getTime() / 1_000)),
      resolutionDeadline: BigInt(Math.floor(input.resolutionDeadline.getTime() / 1_000)),
      initialLiquidity: liquidity,
    }],
  });
  const transactionHash = await provider.request({ method: "eth_sendTransaction", params: [{ from: input.adminAddress, to: factoryAddress, data }] }) as string;
  await waitForConfirmation(provider, transactionHash);
  return { approvalHash, transactionHash };
}
