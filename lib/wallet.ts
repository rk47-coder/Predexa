export type EthereumProvider = {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: "accountsChanged", listener: (accounts: string[]) => void) => void;
  removeListener?: (event: "accountsChanged", listener: (accounts: string[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function getEthereumProvider() {
  if (typeof window === "undefined") return undefined;
  return window.ethereum;
}

export async function connectMetaMask() {
  const provider = getEthereumProvider();

  if (!provider?.isMetaMask) {
    throw new Error("MetaMask was not found. Install the extension, then try again.");
  }

  // The user starts this from the site's wallet modal. Ask MetaMask to show its
  // account-permission chooser, then read only the account they selected there.
  await provider.request({
    method: "wallet_requestPermissions",
    params: [{ eth_accounts: {} }],
  });

  const accounts = await provider.request({ method: "eth_accounts" }) as string[];
  const account = accounts[0];

  if (!account) throw new Error("No MetaMask account was selected.");
  return account.toLowerCase();
}

export async function getWalletBalance(address: string) {
  const provider = getEthereumProvider();
  if (!provider) return "—";

  const balance = await provider.request({
    method: "eth_getBalance",
    params: [address, "latest"],
  }) as string;

  const wei = BigInt(balance);
  const ether = BigInt(10) ** BigInt(18);
  const whole = wei / ether;
  const fraction = (wei % ether).toString().padStart(18, "0").slice(0, 4).replace(/0+$/, "");
  return `${whole.toString()}${fraction ? `.${fraction}` : ""} ETH`;
}

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function isAdminWallet(address: string) {
  const adminAddress = process.env.NEXT_PUBLIC_ADMIN_WALLET?.trim().toLowerCase();
  return Boolean(adminAddress && address === adminAddress);
}

export function isNormalUserWallet(address: string) {
  const normalUserAddress = process.env.NEXT_PUBLIC_NORMAL_USER_WALLET?.trim().toLowerCase();
  return Boolean(normalUserAddress && address === normalUserAddress);
}

const WALLET_SESSION_KEY = "predexa_connected_wallet";

export function saveConnectedWallet(address: string) {
  if (typeof window !== "undefined") sessionStorage.setItem(WALLET_SESSION_KEY, address);
}

export function getConnectedWallet() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(WALLET_SESSION_KEY)?.toLowerCase() ?? "";
}

export function clearConnectedWallet() {
  if (typeof window !== "undefined") sessionStorage.removeItem(WALLET_SESSION_KEY);
}
